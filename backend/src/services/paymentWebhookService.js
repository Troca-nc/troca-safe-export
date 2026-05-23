'use strict';

async function setSubscriptionPaymentStatus(query, providerSubId, paymentStatus) {
  if (!providerSubId) return;
  await query(
    `UPDATE subscriptions
     SET payment_status = $2,
         payment_status_updated_at = NOW(),
         updated_at = NOW()
     WHERE provider_sub_id = $1`,
    [providerSubId, paymentStatus]
  );
}

async function processStripeWebhookEvent({
  event,
  stripe,
  query,
  withTransaction,
  sendMail,
  getWebPlan,
  markPaymentSucceeded,
  formatXpfEur,
  XPF_PER_EUR,
  baseUrl,
}) {
  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const paymentRef = intent.id;
    const { rows: paymentRows } = await query(
      `SELECT id, metadata, type FROM payments WHERE provider_ref = $1 LIMIT 1`,
      [paymentRef]
    );
    if (paymentRows[0]) {
      await query(
        `UPDATE payments SET status = 'failed', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'`,
        [paymentRows[0].id]
      );
      if (paymentRows[0].type === 'subscription') {
        await setSubscriptionPaymentStatus(
          query,
          paymentRows[0].metadata?.provider_sub_id || intent.subscription || intent.metadata?.provider_sub_id || null,
          'failed'
        );
      }
    }
    return;
  }

  if (event.type === 'charge.failed') {
    const charge = event.data.object;
    const paymentRef = charge.payment_intent || charge.id;
    const { rows: paymentRows } = await query(
      `SELECT id, metadata, type FROM payments WHERE provider_ref = $1 LIMIT 1`,
      [paymentRef]
    );
    if (paymentRows[0]) {
      await query(
        `UPDATE payments SET status = 'failed', updated_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'succeeded')`,
        [paymentRows[0].id]
      );
      if (paymentRows[0].type === 'subscription') {
        await setSubscriptionPaymentStatus(
          query,
          paymentRows[0].metadata?.provider_sub_id || charge.subscription || charge.metadata?.provider_sub_id || null,
          'failed'
        );
      }
    }
    return;
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    const paymentRef = charge.payment_intent || charge.id;
    const { rows: paymentRows } = await query(
      `SELECT id, user_id, metadata, status FROM payments WHERE provider_ref = $1 LIMIT 1`,
      [paymentRef]
    );
    const payment = paymentRows[0];
    if (!payment) return;

    await query(
      `UPDATE payments SET status = 'refunded', updated_at = NOW()
       WHERE id = $1`,
      [payment.id]
    );

    const meta = payment.metadata ?? {};
    await upsertBillingDocument(query, {
      userId: payment.user_id,
      provider: 'stripe',
      providerRef: paymentRef,
      documentType: 'refund',
      status: 'refunded',
      amountEurCents: charge.amount_refunded ?? null,
      amountXpf: Number(payment.metadata?.amount_xpf ?? 0) || null,
      currency: charge.currency?.toUpperCase?.() ?? 'EUR',
      payload: charge,
    }).catch(() => {});

    if (meta.payment_type === 'boost' && meta.annonce_id) {
      await query(
        `UPDATE annonces
         SET is_boosted = FALSE, boost_type = NULL, boost_expires_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [Number(meta.annonce_id)]
      );
      await query(
        `DELETE FROM annonce_boosts WHERE payment_id = $1`,
        [payment.id]
      ).catch(() => {});
    }
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const paymentRef = intent.id;
    const { rows: paymentRows } = await query(
      `SELECT id, user_id, type, metadata, status
       FROM payments
       WHERE provider_ref = $1
       LIMIT 1`,
      [paymentRef]
    );

    const payment = paymentRows[0];
    if (!payment) return;

    if (payment.status !== 'succeeded') {
      await query(
        `UPDATE payments
         SET status = 'succeeded', updated_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'failed')`,
        [payment.id]
      );
    }

    const meta = payment.metadata ?? intent.metadata ?? {};
    await upsertBillingDocument(query, {
      userId: payment.user_id,
      provider: 'stripe',
      providerRef: paymentRef,
      documentType: payment.type === 'subscription' ? 'invoice' : 'receipt',
      status: 'succeeded',
      amountEurCents: intent.amount_received ?? intent.amount ?? null,
      amountXpf: Number(meta.amount_xpf ?? payment.metadata?.amount_xpf ?? 0) || null,
      currency: intent.currency?.toUpperCase?.() ?? 'EUR',
      payload: intent,
    }).catch(() => {});

    if (meta.payment_type === 'boost' && meta.annonce_id) {
      const annonceId = Number(meta.annonce_id);
      const boostType = meta.boost_type;
      const duration = Number(meta.duration ?? 0);
      if (annonceId && boostType && duration) {
        const expiresAt = new Date(Date.now() + duration * 86400_000);
        await query(
          `UPDATE annonces
           SET is_boosted = TRUE, boost_type = $1, boost_expires_at = $2, updated_at = NOW()
           WHERE id = $3`,
          [boostType, expiresAt, annonceId]
        );

        await query(
          `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [annonceId, boostType, expiresAt, payment.id]
        ).catch(() => {});
      }
    }

    if (meta.payment_type === 'subscription' && meta.plan_id && payment.user_id) {
      const planId = meta.plan_id;
      const billingPeriod = meta.billing_period || 'monthly';
      const stripeSubId = meta.provider_sub_id || null;
      if (stripeSubId) {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        const periodStart = new Date(stripeSub.current_period_start * 1000);
        const periodEnd = new Date(stripeSub.current_period_end * 1000);
        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO subscriptions
               (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
                current_period_start, current_period_end, cancel_at_period_end,
                payment_status, payment_status_updated_at)
             VALUES ($1, $2, $3, 'stripe', $4, 'stripe', $5, $6, $7, FALSE, 'succeeded', NOW())
             ON CONFLICT (provider_sub_id)
             DO UPDATE SET
               status = EXCLUDED.status,
               current_period_start = EXCLUDED.current_period_start,
               current_period_end = EXCLUDED.current_period_end,
               payment_provider = EXCLUDED.payment_provider,
               payment_status = 'succeeded',
               payment_status_updated_at = NOW(),
               updated_at = NOW()`,
            [payment.user_id, planId, billingPeriod, stripeSubId, stripeSub.status, periodStart, periodEnd]
          );
          await client.query(
            `UPDATE users SET is_pro = TRUE, pro_plan = $2, pro_expires_at = $3, updated_at = NOW() WHERE id = $1`,
            [payment.user_id, planId, periodEnd]
          );
        });
      }
    }

    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentType = session.metadata?.payment_type;
    const userId = Number(session.metadata?.user_id ?? 0);

    const { rows: paymentRows } = await query(
      `SELECT id, user_id, type, metadata, status
       FROM payments
       WHERE provider_ref = $1
       LIMIT 1`,
      [session.id]
    );
    const payment = paymentRows[0];
    if (!payment || payment.user_id !== userId) return;

    if (payment.metadata?.payment_type && payment.metadata.payment_type !== paymentType) {
      return;
    }

    await markPaymentSucceeded(session.id);

    if (paymentType === 'boost') {
      const annonceId = Number(session.metadata?.annonce_id ?? 0);
      const boostType = session.metadata?.boost_type;
      const duration = Number(session.metadata?.duration ?? 0);
      if (annonceId && boostType && duration) {
        const expiresAt = new Date(Date.now() + duration * 86400_000);
        await query(
          `UPDATE annonces SET is_boosted = TRUE, boost_type = $1, boost_expires_at = $2, updated_at = NOW() WHERE id = $3`,
          [boostType, expiresAt, annonceId]
        );
        const { rows: pmtRows } = await query(`SELECT id FROM payments WHERE provider_ref = $1 LIMIT 1`, [session.id]);
        if (pmtRows[0]) {
          await query(
            `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_id)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [annonceId, boostType, expiresAt, pmtRows[0].id]
          ).catch(() => {});
        }
      }
    }

    if (paymentType === 'subscription') {
      const planId = session.metadata?.plan_id;
      const billingPeriod = session.metadata?.billing_period;
      const subId = session.subscription;

      if (userId && planId && subId) {
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const periodStart = new Date(stripeSub.current_period_start * 1000);
        const periodEnd = new Date(stripeSub.current_period_end * 1000);

        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO subscriptions
               (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
                current_period_start, current_period_end, cancel_at_period_end,
                payment_status, payment_status_updated_at)
             VALUES ($1, $2, $3, 'stripe', $4, 'stripe', $5, $6, $7, FALSE, 'succeeded', NOW())
             ON CONFLICT (provider_sub_id)
             DO UPDATE SET
               status = EXCLUDED.status,
               current_period_start = EXCLUDED.current_period_start,
               current_period_end = EXCLUDED.current_period_end,
               payment_provider = EXCLUDED.payment_provider,
               payment_status = 'succeeded',
               payment_status_updated_at = NOW(),
               updated_at = NOW()`,
            [userId, planId, billingPeriod, subId, stripeSub.status, periodStart, periodEnd]
          );

          await client.query(
            `UPDATE users SET is_pro = TRUE, pro_plan = $2, pro_expires_at = $3, updated_at = NOW() WHERE id = $1`,
            [userId, planId, periodEnd]
          );
          await client.query(
            `UPDATE payments SET metadata = metadata || $2::jsonb, updated_at = NOW() WHERE provider_ref = $1`,
            [session.id, JSON.stringify({ provider_sub_id: subId })]
          );
        });

        const { rows: userRows } = await query('SELECT email, prenom FROM users WHERE id = $1', [userId]);
        if (userRows[0]) {
            const planLabel = 'Pro';
          const periodLabel = billingPeriod === 'yearly' ? 'annuel' : 'mensuel';
          const amountXpf = getWebPlan(planId, billingPeriod)?.amount_xpf ?? 0;
          await sendMail({
            to: userRows[0].email,
            subject: `[Troca] Votre abonnement ${planLabel} est activé !`,
            html: `<p>Bonjour ${userRows[0].prenom},</p>
                   <p>Votre abonnement <strong>Troca ${planLabel} ${periodLabel}</strong> est maintenant actif.</p>
                   <p>Montant : <strong>${formatXpfEur(amountXpf)}</strong></p>
                   <p>Prochain renouvellement : ${periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   <p>Gérez votre abonnement depuis <a href="${baseUrl}/parametres">vos paramètres</a>.</p>`,
          }).catch(() => {});
        }
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const subId = sub.id;
    const periodStart = new Date(sub.current_period_start * 1000);
    const periodEnd = new Date(sub.current_period_end * 1000);

    await query(
      `UPDATE subscriptions
       SET status = $2, current_period_start = $3, current_period_end = $4,
           cancel_at_period_end = $5,
           payment_status = CASE WHEN $2 = 'active' THEN 'succeeded' ELSE payment_status END,
           payment_status_updated_at = CASE WHEN $2 = 'active' THEN NOW() ELSE payment_status_updated_at END,
           updated_at = NOW()
       WHERE provider_sub_id = $1`,
      [subId, sub.status, periodStart, periodEnd, sub.cancel_at_period_end]
    );

    if (sub.status === 'active') {
      await query(
        `UPDATE users SET is_pro = TRUE, pro_expires_at = $2, updated_at = NOW()
         WHERE id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $1 LIMIT 1)`,
        [subId, periodEnd]
      );
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subId = event.data.object.id;
    const { rows } = await query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
       WHERE provider_sub_id = $1 RETURNING user_id`,
      [subId]
    );
    if (rows[0]) {
      await query(
        `UPDATE users SET is_pro = FALSE, pro_plan = NULL, pro_expires_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [rows[0].user_id]
      );
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const inv = event.data.object;
    const subId = inv.subscription;
    if (subId && inv.billing_reason === 'subscription_cycle') {
      const stripeSub = await stripe.subscriptions.retrieve(subId);
      const periodEnd = new Date(stripeSub.current_period_end * 1000);
      await query(
        `UPDATE subscriptions
         SET current_period_end = $2,
             payment_status = 'succeeded',
             payment_status_updated_at = NOW(),
             updated_at = NOW()
         WHERE provider_sub_id = $1`,
        [subId, periodEnd]
      );
      await query(
        `UPDATE users SET pro_expires_at = $2, updated_at = NOW()
         WHERE id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $1 LIMIT 1)`,
        [subId, periodEnd]
      );
      const { rows: userRows } = await query(
        `SELECT u.id, u.email, u.prenom FROM users u
         JOIN subscriptions s ON s.user_id = u.id
         WHERE s.provider_sub_id = $1 LIMIT 1`,
        [subId]
      );
      if (userRows[0]) {
        const amountEur = (inv.amount_paid / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const amountXpf = Math.round((inv.amount_paid / 100) * XPF_PER_EUR).toLocaleString('fr-FR');
        await upsertBillingDocument(query, {
          userId: userRows[0].id,
          provider: 'stripe',
          providerRef: inv.id,
          documentType: 'invoice',
          status: 'succeeded',
          amountEurCents: inv.amount_paid,
          amountXpf: Math.round((inv.amount_paid / 100) * XPF_PER_EUR),
          currency: inv.currency?.toUpperCase?.() ?? 'EUR',
          pdfUrl: inv.invoice_pdf ?? null,
          hostedUrl: inv.hosted_invoice_url ?? null,
          payload: inv,
        }).catch(() => {});
        await sendMail({
          to: userRows[0].email,
          subject: '[Troca] Renouvellement de votre abonnement Pro confirmé',
          html: `<p>Bonjour ${userRows[0].prenom},</p>
                 <p>Votre abonnement Troca Pro a été renouvelé avec succès.</p>
                 <p>Montant débité : <strong>${amountXpf} XPF (${amountEur} €)</strong></p>
                 <p>Prochain renouvellement : ${periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <p><a href="${baseUrl}/parametres#factures">Télécharger la facture</a></p>`,
        }).catch(() => {});
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const subId = event.data.object.subscription;
    if (subId) {
      const inv = event.data.object;
      await query(
        `UPDATE subscriptions
         SET status = 'past_due',
             payment_status = 'failed',
             payment_status_updated_at = NOW(),
             updated_at = NOW()
         WHERE provider_sub_id = $1`,
        [subId]
      );
      const { rows } = await query(
        `SELECT u.id, u.email, u.prenom FROM users u
         JOIN subscriptions s ON s.user_id = u.id
         WHERE s.provider_sub_id = $1 LIMIT 1`,
        [subId]
      );
      if (rows[0]) {
        await upsertBillingDocument(query, {
          userId: rows[0].id,
          provider: 'stripe',
          providerRef: inv.id,
          documentType: 'invoice',
          status: 'failed',
          amountEurCents: inv.amount_due ?? null,
          amountXpf: Math.round(((inv.amount_due ?? 0) / 100) * XPF_PER_EUR) || null,
          currency: inv.currency?.toUpperCase?.() ?? 'EUR',
          pdfUrl: inv.invoice_pdf ?? null,
          hostedUrl: inv.hosted_invoice_url ?? null,
          payload: inv,
        }).catch(() => {});
        await sendMail({
          to: rows[0].email,
          subject: '[Troca] Échec du renouvellement de votre abonnement',
          html: `<p>Bonjour ${rows[0].prenom},</p>
                 <p>Le renouvellement de votre abonnement Troca Pro a échoué.</p>
                 <p>Veuillez mettre à jour votre moyen de paiement depuis <a href="${baseUrl}/parametres">vos paramètres</a> pour ne pas perdre vos avantages Pro.</p>`,
        }).catch(() => {});
      }
    }
  }
}

function payplugAmountToXpf(amountCents, xpfPerEur) {
  const cents = Number(amountCents ?? 0);
  const rate = Number(xpfPerEur ?? 0);
  if (!cents || !rate) return 0;
  return Math.round((cents / 100) * rate);
}

async function upsertBillingDocument(query, {
  userId,
  provider,
  providerRef,
  documentType,
  status,
  amountEurCents = null,
  amountXpf = null,
  currency = 'EUR',
  pdfUrl = null,
  hostedUrl = null,
  payload = {},
}) {
  if (!userId || !provider || !providerRef || !documentType) return;
  await query(
    `INSERT INTO billing_documents
       (user_id, provider, provider_ref, document_type, status, amount_eur_cents, amount_xpf,
        currency, pdf_url, hosted_url, payload, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
     ON CONFLICT (provider, provider_ref, document_type)
     DO UPDATE SET
       status = EXCLUDED.status,
       amount_eur_cents = EXCLUDED.amount_eur_cents,
       amount_xpf = EXCLUDED.amount_xpf,
       currency = EXCLUDED.currency,
       pdf_url = EXCLUDED.pdf_url,
       hosted_url = EXCLUDED.hosted_url,
       payload = EXCLUDED.payload,
       updated_at = NOW()`,
    [
      userId,
      provider,
      providerRef,
      documentType,
      status,
      amountEurCents,
      amountXpf,
      currency,
      pdfUrl,
      hostedUrl,
      JSON.stringify(payload ?? {}),
    ]
  );
}

async function processPayplugWebhook({
  resourceId,
  resourceType,
  payplug,
  query,
  withTransaction,
  sendMail,
  baseUrl,
}) {
  const resource = await payplug.verifyIPN(resourceId, resourceType);

  if (resourceType === 'payment' && resource.is_paid) {
    const meta = resource.metadata ?? {};
    const { rows: paymentRows } = await query(
      `SELECT id, user_id, status, metadata, amount_xpf
       FROM payments
       WHERE provider_ref = $1
       LIMIT 1`,
      [resourceId]
    );
    const payment = paymentRows[0];
    if (!payment) return resource;

    const expectedAmountXpf = Number(payment.amount_xpf ?? meta.amount_xpf ?? 0);
    const providerAmountXpf = payplugAmountToXpf(resource.amount, payplug.XPF_PER_EUR);
    if (expectedAmountXpf && providerAmountXpf && expectedAmountXpf !== providerAmountXpf) {
      return resource;
    }

    await query(
      `UPDATE payments SET status = 'succeeded', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [payment.id]
    );

    await upsertBillingDocument(query, {
      userId: payment.user_id,
      provider: 'payplug',
      providerRef: resourceId,
      documentType: meta.payment_type === 'subscription' ? 'invoice' : 'receipt',
      status: 'succeeded',
      amountXpf: expectedAmountXpf || providerAmountXpf || Number(payment.amount_xpf ?? 0) || null,
      payload: resource,
    }).catch(() => {});

    if (meta.payment_type === 'boost' && meta.annonce_id) {
      const annonceId = Number(meta.annonce_id);
      const boostType = meta.boost_type;
      const duration = Number(meta.duration ?? 7);
      const expiresAt = new Date(Date.now() + duration * 86400_000);

      await query(
        `UPDATE annonces SET is_boosted = TRUE, boost_type = $1, boost_expires_at = $2, updated_at = NOW()
         WHERE id = $3`,
        [boostType, expiresAt, annonceId]
      );

      await query(
        `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_id, payment_provider)
         VALUES ($1, $2, $3, $4, 'payplug') ON CONFLICT DO NOTHING`,
        [annonceId, boostType, expiresAt, payment.id]
      ).catch(() => {});
    }
  }

  if (resourceType === 'refund' || resource?.object === 'refund') {
    const paymentId = resource.payment_id || resourceId;
    const { rows: paymentRows } = await query(
      `SELECT id, user_id, metadata, provider_ref, amount_xpf
       FROM payments
       WHERE provider_ref = $1
       LIMIT 1`,
      [paymentId]
    );
    const payment = paymentRows[0];
    if (!payment) return resource;

    await query(
      `UPDATE payments SET status = 'refunded', updated_at = NOW()
       WHERE id = $1`,
      [payment.id]
    );

    await upsertBillingDocument(query, {
      userId: payment.user_id,
      provider: 'payplug',
      providerRef: payment.provider_ref,
      documentType: 'refund',
      status: 'refunded',
      amountXpf: Number(payment.amount_xpf ?? 0) || null,
      payload: resource,
    }).catch(() => {});

    const meta = payment.metadata ?? {};
    if (meta.payment_type === 'boost' && meta.annonce_id) {
      await query(
        `UPDATE annonces
         SET is_boosted = FALSE, boost_type = NULL, boost_expires_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [Number(meta.annonce_id)]
      );
      await query(
        `DELETE FROM annonce_boosts WHERE payment_id = $1`,
        [payment.id]
      ).catch(() => {});
    }

    if (meta.payment_type === 'subscription' && payment.user_id) {
      await query(
        `UPDATE subscriptions
         SET status = 'refunded', updated_at = NOW()
         WHERE provider = 'payplug' AND provider_sub_id = $1`,
        [payment.provider_ref]
      );
      await query(
        `UPDATE users
         SET is_pro = FALSE, pro_plan = NULL, pro_expires_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [payment.user_id]
      );
    }

    return resource;
  }

  if (resourceType === 'subscription') {
    const meta = resource.metadata ?? {};
    const userId = Number(meta.user_id ?? 0);
    const planId = meta.plan_id;
    const period = meta.billing_period;
    const isActive = resource.is_active ?? resource.state === 'active';
    const planSlug = planId && period ? `${planId}_${period === 'yearly' ? 'annuel' : 'mensuel'}` : null;
    const planConfig = planSlug ? payplug.PAYPLUG_SUBSCRIPTION_PLANS[planSlug] : null;
    const expectedAmountXpf = planConfig ? Math.round((planConfig.amount_cents / 100) * payplug.XPF_PER_EUR) : 0;

    const { rows: paymentRows } = await query(
      `SELECT id, user_id, status, metadata, amount_xpf, provider_ref
       FROM payments
       WHERE provider_ref = $1
       LIMIT 1`,
      [resourceId]
    );
    const payment = paymentRows[0];
    if (!payment) return resource;

    const paymentAmountXpf = Number(payment.amount_xpf ?? meta.amount_xpf ?? 0);
    if (expectedAmountXpf && paymentAmountXpf && expectedAmountXpf !== paymentAmountXpf) {
      return resource;
    }

    if (isActive && userId && planId) {
      const now = new Date();
      const isYearly = period === 'yearly';
      const periodEnd = new Date(now);
      isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO subscriptions
             (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
              current_period_start, current_period_end, cancel_at_period_end,
              payment_status, payment_status_updated_at)
           VALUES ($1, $2, $3, 'payplug', $4, 'payplug', 'active', NOW(), $5, FALSE, 'succeeded', NOW())
           ON CONFLICT (provider_sub_id)
           DO UPDATE SET status = 'active', current_period_end = $5, payment_provider = EXCLUDED.payment_provider, payment_status = 'succeeded', payment_status_updated_at = NOW(), updated_at = NOW()`,
          [userId, planId, period, resourceId, periodEnd]
        );

        await client.query(
          `UPDATE users SET is_pro = TRUE, pro_plan = $2, pro_expires_at = $3, updated_at = NOW()
           WHERE id = $1`,
          [userId, planId, periodEnd]
        );

        await client.query(
          `UPDATE payments SET status = 'succeeded', updated_at = NOW()
           WHERE id = $1`,
          [payment.id]
        );
      });

      await upsertBillingDocument(query, {
        userId,
        provider: 'payplug',
        providerRef: resourceId,
        documentType: 'invoice',
        status: 'succeeded',
        amountXpf: expectedAmountXpf || paymentAmountXpf || Number(payment.amount_xpf ?? 0) || null,
        payload: resource,
      }).catch(() => {});

      const { rows: userRows } = await query('SELECT email, prenom FROM users WHERE id = $1', [userId]);
      if (userRows[0]) {
        const planLabel = 'Pro';
        const periodLabel = isYearly ? 'annuel' : 'mensuel';
        const xpf = expectedAmountXpf || paymentAmountXpf;

        await sendMail({
          to: userRows[0].email,
          subject: `[Troca] Votre abonnement ${planLabel} est activé !`,
          html: `<p>Bonjour ${userRows[0].prenom},</p>
                 <p>Votre abonnement <strong>Troca ${planLabel} ${periodLabel}</strong> via PayPlug est activé.</p>
                 <p>Montant : <strong>${payplug.formatXpfEur(xpf)}</strong></p>
                 <p>Prochain renouvellement : ${periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <p>Gérez votre abonnement depuis <a href="${baseUrl}/parametres">vos paramètres</a>.</p>`,
        }).catch(() => {});
      }
    }

    const isCancelled = resource.is_cancelled ?? resource.state === 'cancelled';
    if (isCancelled && userId) {
      await query(
        `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
         WHERE provider_sub_id = $1`,
        [resourceId]
      );
      await query(
        `UPDATE users SET is_pro = FALSE, pro_plan = NULL, pro_expires_at = NULL, updated_at = NOW()
         WHERE id = $1 AND id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $2 LIMIT 1)`,
        [userId, resourceId]
      );
    }
  }

  return resource;
}

module.exports = {
  processPayplugWebhook,
  processStripeWebhookEvent,
};
