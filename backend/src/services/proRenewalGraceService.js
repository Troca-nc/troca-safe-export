'use strict';

const GRACE_DAYS = 7;
const REMINDER_DAYS = 3;

async function startRenewalGrace(withTransaction, providerSubId) {
  if (!providerSubId) return null;
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE subscriptions
          SET status = 'past_due',
              payment_status = 'failed',
              payment_status_updated_at = NOW(),
              grace_started_at = NOW(),
              grace_ends_at = GREATEST(current_period_end, NOW()) + INTERVAL '${GRACE_DAYS} days',
              grace_reminder_sent_at = NULL,
              suspended_at = NULL,
              updated_at = NOW()
        WHERE provider_sub_id = $1
          AND status IN ('active', 'past_due')
          AND payment_status = 'succeeded'
      RETURNING user_id, grace_started_at, grace_ends_at`,
      [providerSubId],
    );
    const grace = result.rows[0];
    if (!grace) return null;

    await client.query(
      `UPDATE users
          SET is_pro = TRUE,
              pro_plan = 'pro',
              pro_expires_at = GREATEST(COALESCE(pro_expires_at, grace.grace_ends_at), grace.grace_ends_at),
              updated_at = NOW()
         FROM (SELECT $1::int AS user_id, $2::timestamptz AS grace_ends_at) grace
        WHERE users.id = grace.user_id`,
      [grace.user_id, grace.grace_ends_at],
    );
    return grace;
  });
}

async function processRenewalGraceDeadlines({ query, sendMail, baseUrl }) {
  const suspended = await query(
    `WITH due AS (
       UPDATE subscriptions
          SET suspended_at = NOW(), updated_at = NOW()
        WHERE status = 'past_due'
          AND grace_ends_at <= NOW()
          AND suspended_at IS NULL
      RETURNING user_id, grace_ends_at
     )
     UPDATE users u
        SET is_pro = FALSE,
            pro_expires_at = due.grace_ends_at,
            updated_at = NOW()
       FROM due
      WHERE u.id = due.user_id
    RETURNING u.id`,
  );

  const reminders = await query(
    `SELECT s.id AS subscription_id, u.email, u.prenom, s.grace_ends_at
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
      WHERE s.status = 'past_due'
        AND s.suspended_at IS NULL
        AND s.grace_ends_at > NOW()
        AND s.grace_started_at <= NOW() - INTERVAL '${REMINDER_DAYS} days'
        AND s.grace_reminder_sent_at IS NULL
      ORDER BY s.id`,
  );

  let reminded = 0;
  for (const row of reminders.rows) {
    try {
      await sendMail({
        to: row.email,
        subject: '[Kalico] Votre abonnement Pro sera suspendu dans 4 jours',
        html: `<p>Bonjour ${row.prenom || ''},</p>
               <p>Le renouvellement de votre abonnement Kalico Pro est toujours en échec.</p>
               <p>Mettez à jour votre moyen de paiement avant le ${new Date(row.grace_ends_at).toLocaleDateString('fr-FR')} pour conserver vos outils Pro.</p>
               <p><a href="${baseUrl}/parametres">Mettre à jour mon paiement</a></p>`,
      });
      const marked = await query(
        `UPDATE subscriptions
            SET grace_reminder_sent_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND grace_reminder_sent_at IS NULL AND suspended_at IS NULL`,
        [row.subscription_id],
      );
      if (marked.rowCount > 0) reminded += 1;
    } catch {}
  }

  return { suspended: suspended.rowCount, reminded };
}

module.exports = { GRACE_DAYS, REMINDER_DAYS, startRenewalGrace, processRenewalGraceDeadlines };
