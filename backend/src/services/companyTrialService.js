'use strict';

const { withTransaction } = require('../config/database');

function trialError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function startCompanyTrial(userId, transactionFn = withTransaction) {
  return transactionFn(async (client) => {
    const identity = await client.query(
      `SELECT c.id, c.ridet_verified_at, c.trial_started_at, c.trial_ends_at,
              u.is_pro, u.pro_expires_at
         FROM company_members cm
         JOIN companies c ON c.id = cm.company_id
         JOIN users u ON u.id = cm.user_id
        WHERE cm.user_id = $1
        FOR UPDATE OF c, u`,
      [userId],
    );
    const company = identity.rows[0];
    if (!company?.ridet_verified_at) {
      throw trialError(403, "Faites valider votre justificatif RIDET avant d'activer l'essai Pro.");
    }
    if (company.trial_started_at) {
      throw trialError(409, "L'essai Pro a déjà été utilisé par cette entreprise.");
    }
    if (company.is_pro && company.pro_expires_at && new Date(company.pro_expires_at).getTime() > Date.now()) {
      throw trialError(409, 'Un droit Pro est déjà actif sur ce compte.');
    }

    const activated = await client.query(
      `UPDATE companies
          SET trial_started_at = NOW(),
              trial_ends_at = NOW() + INTERVAL '30 days',
              updated_at = NOW()
        WHERE id = $1
          AND trial_started_at IS NULL
      RETURNING trial_started_at, trial_ends_at`,
      [company.id],
    );
    if (!activated.rows[0]) {
      throw trialError(409, "L'essai Pro a déjà été utilisé par cette entreprise.");
    }

    await client.query(
      `UPDATE users
          SET is_pro = TRUE,
              pro_plan = 'pro',
              pro_since = COALESCE(pro_since, $2),
              pro_expires_at = $3,
              updated_at = NOW()
        WHERE id = $1`,
      [userId, activated.rows[0].trial_started_at, activated.rows[0].trial_ends_at],
    );

    return activated.rows[0];
  });
}

module.exports = { startCompanyTrial };
