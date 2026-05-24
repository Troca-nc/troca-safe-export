'use strict';

// ============================================================
//  Troca - Routes paiement
//  Boost, abonnements Pro, webhooks Stripe et PayPlug
// ============================================================

const { Router } = require('express');
const crypto = require('crypto');
const Stripe = require('stripe');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimit');
const { query, withTransaction } = require('../config/database');
const { isConfiguredValue } = require('../config/env');
const { validate, Joi } = require('../middleware/validate');
const { sendMail } = require('../services/emailService');
const payplug = require('../services/payplugService');
const {
  findBoost,
  getWebPlan,
  getMobilePlan,
  XPF_PER_EUR,
  xpfToEurCents,
  formatXpfEur,
} = require('../services/paymentCatalog');
const {
  ensureStripe,
  getOrCreateStripeCustomer,
  markPaymentSucceeded,
} = require('../services/paymentHelpers');
const {
  processPayplugWebhook,
  processStripeWebhookEvent,
} = require('../services/paymentWebhookService');

const router = Router();

const stripeWebhookSecret = isConfiguredValue(process.env.STRIPE_WEBHOOK_SECRET)
  ? process.env.STRIPE_WEBHOOK_SECRET.trim()
  : '';
const payplugWebhookSecret = isConfiguredValue(process.env.PAYPLUG_WEBHOOK_SECRET)
  ? process.env.PAYPLUG_WEBHOOK_SECRET.trim()
  : '';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const demoModeEnabled = process.env.DEMO_MODE === 'true';
const stripe = isConfiguredValue(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' })
  : null;

const boostSchema = {
  body: Joi.object({
    annonce_id: Joi.number().integer().positive().required(),
    boost_type: Joi.string().valid('une', 'urgent', 'remonte', 'photos').required(),
    boost_duration: Joi.number().integer().valid(3, 7, 14, 30).required(),
    provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
  }),
};

const subscriptionSchema = {
  body: Joi.object({
    plan_id: Joi.string().valid('pro').required(),
    billing_period: Joi.string().valid('monthly', 'yearly').required(),
    provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
  }),
};

const mobilePlanSchema = {
  body: Joi.object({
    plan: Joi.string().valid('pro_mensuel', 'pro_annuel').required(),
  }),
};

async function hasExistingSubscription(userId) {
  const { rows } = await query(
    `SELECT id
     FROM subscriptions
     WHERE user_id = $1
       AND status IN ('active', 'trialing', 'payplug_active')
     LIMIT 1`,
    [userId]
  );
  return !!rows[0];
}

function getPayplugSignature(req) {
  const raw = req.headers['x-payplug-signature'] ?? req.headers['payplug-signature'];
  if (Array.isArray(raw)) return raw[0] || '';
  return typeof raw === 'string' ? raw.trim() : '';
}

function verifyPayplugSignature(rawBody, signature) {
  if (!payplugWebhookSecret || !rawBody || !signature) return false;
  const expected = crypto.createHmac('sha256', payplugWebhookSecret).update(rawBody).digest('hex');
  const provided = signature.replace(/^sha256=/i, '').trim().toLowerCase();
  if (!expected || !provided || expected.length !== provided.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}

function safePaymentError(provider, fallback) {
  return { error: fallback || `Erreur de paiement${provider ? ` (${provider})` : ''}` };
}

function buildDemoPaymentUrl(path, params = {}) {
  const query = new URLSearchParams();
  query.set('demo', '1');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }

  return `${baseUrl}${path}?${query.toString()}`;
}

async function verifyStripeSubscriptionStatus(sessionId, userId) {
  if (!isConfiguredValue(process.env.STRIPE_SECRET_KEY)) {
    return { code: 503, body: { status: 'invalid', error: 'STRIPE_SECRET_KEY manquant' } };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'payment_intent'],
  });

  const { rows: pmtRows } = await query(
    'SELECT id, type, metadata FROM payments WHERE provider_ref = $1 AND user_id = $2 LIMIT 1',
    [sessionId, userId]
  );
  const payment = pmtRows[0];
  if (!payment) {
    return { code: 403, body: { status: 'invalid', error: 'Session non autorisée' } };
  }

  if (payment.metadata?.payment_type && payment.metadata.payment_type !== 'subscription') {
    return { code: 403, body: { status: 'invalid', error: 'Type de paiement non cohérent' } };
  }

  if (session.metadata?.user_id !== String(userId)) {
    return { code: 403, body: { status: 'invalid', error: 'Session non autorisée' } };
  }

  if (session.status !== 'complete') {
    return { code: 200, body: { status: 'pending' } };
  }

  const sub = session.subscription;
  if (!sub) {
    return { code: 400, body: { status: 'invalid', error: 'Abonnement manquant' } };
  }

  const isTrial = sub?.status === 'trialing';
  return {
    code: 200,
    body: {
      status: isTrial ? 'ok_trial' : 'ok_subscription',
      plan: session.metadata?.plan_id ?? null,
      trial_end: sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      provider: 'stripe',
    },
  };
}

async function verifyPayplugSubscriptionStatus(paymentId, userId) {
  if (!payplug.isPayPlugConfigured()) {
    return { code: 503, body: { status: 'invalid', error: 'PayPlug non configuré' } };
  }

  const resource = await payplug.verifyIPN(String(paymentId), 'subscription');
  const meta = resource.metadata ?? {};
  const resourceUserId = Number(meta.user_id ?? 0);

  if (resourceUserId && resourceUserId !== Number(userId)) {
    return { code: 403, body: { status: 'invalid', error: 'Ressource non autorisée' } };
  }

  const isActive = resource.is_active ?? resource.state === 'active';
  if (!isActive) {
    return { code: 200, body: { status: 'pending' } };
  }

  const isYearly = meta.billing_period === 'yearly';
  const periodEnd = new Date();
  isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    code: 200,
    body: {
      status: 'ok_subscription',
      plan: meta.plan_id ?? null,
      period_end: periodEnd.toISOString(),
      provider: 'payplug',
    },
  };
}

router.post('/boost/mobile', authenticate, paymentLimiter, validate(boostSchema), async (req, res) => {
  const { annonce_id, boost_type, boost_duration } = req.body;

  const boost = findBoost(boost_type, boost_duration);
  if (!boost) return res.status(400).json({ error: 'Boost introuvable dans le catalogue' });

  if (demoModeEnabled) {
    return res.json({
      data: {
        client_secret: 'demo_client_secret_boost',
        customer_id: 'demo_customer',
        ephemeral_key: 'demo_ephemeral_key',
        boost,
        amount_display: formatXpfEur(boost.price_xpf),
        demo: true,
        success: true,
        message: 'Paiement simulé',
      },
    });
  }

  if (!ensureStripe(res)) return;

  const { rows: annonceRows } = await query(
    `SELECT a.id, a.titre, cat.slug AS category_slug
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
    [annonce_id, req.user.id]
  );
  if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
  if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
    return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const eurCents = xpfToEurCents(boost.price_xpf);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: eurCents,
      currency: 'eur',
      customer: customerId,
      payment_method_types: ['card'],
      description: `${boost.label} — ${annonceRows[0].titre}`,
      metadata: {
        payment_type: 'boost',
        user_id: String(req.user.id),
        annonce_id: String(annonce_id),
        boost_type,
        duration: String(boost_duration),
        amount_xpf: String(boost.price_xpf),
      },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'boost', 'stripe', $2, $3, 'pending', $4)`,
      [
        req.user.id,
        paymentIntent.id,
        boost.price_xpf,
        JSON.stringify({ annonce_id, boost_type, boost_duration }),
      ]
    );

    return res.json({
      data: {
        client_secret: paymentIntent.client_secret,
        customer_id: customerId,
        ephemeral_key: ephemeralKey.secret,
        boost,
        amount_display: formatXpfEur(boost.price_xpf),
      },
    });
  } catch (err) {
    console.error('[payment] boost/mobile error:', err.message);
    return res.status(500).json({ error: 'Erreur création paiement boost mobile' });
  }
});

router.post('/boost', authenticate, paymentLimiter, validate(boostSchema), async (req, res) => {
  const { annonce_id, boost_type, boost_duration, provider } = req.body;

  if (provider === 'payplug') {
    if (demoModeEnabled) {
      return res.json({
        success: true,
        demo: true,
        provider,
        message: 'Paiement simulé',
        checkout_url: buildDemoPaymentUrl('/paiement/succes', {
          type: 'boost',
          provider,
        }),
      });
    }

    if (!payplug.isPayPlugConfigured()) {
      return res.status(503).json({ error: 'PayPlug non configuré — vérifiez PAYPLUG_SECRET_KEY' });
    }

    const boost = findBoost(boost_type, boost_duration);
    if (!boost) return res.status(400).json({ error: 'Boost introuvable' });

    const { rows: annonceRows } = await query(
      `SELECT a.id, a.titre, cat.slug AS category_slug
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
      [annonce_id, req.user.id]
    );
    if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
    if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
      return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
    }

    try {
      const payment = await payplug.createPayment({
        amount_xpf: boost.price_xpf,
        description: `${boost.label} — ${annonceRows[0].titre}`,
        email: req.user.email,
        first_name: req.user.prenom || 'Client',
        last_name: req.user.nom || 'Troca',
        return_url: `${baseUrl}/paiement/succes?type=boost&pp_payment_id={PAYPLUG_PAYMENT_ID}`,
        cancel_url: `${baseUrl}/paiement/annule?provider=payplug`,
        metadata: {
          payment_type: 'boost',
          user_id: String(req.user.id),
          annonce_id: String(annonce_id),
          boost_type,
          duration: String(boost_duration),
        },
      });

      await query(
        `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
         VALUES ($1, 'boost', 'payplug', $2, $3, 'pending', $4)`,
        [
          req.user.id,
          payment.id,
          boost.price_xpf,
          JSON.stringify({ annonce_id, boost_type, boost_duration }),
        ]
      );

      return res.json({ checkout_url: payment.hosted_payment.payment_url });
    } catch (err) {
      console.error('[payment] boost PayPlug error:', err.message);
      return res.status(500).json(safePaymentError('payplug', 'Impossible de finaliser le paiement PayPlug pour ce boost'));
    }
  }

  if (demoModeEnabled) {
    return res.json({
      success: true,
      demo: true,
      provider: 'stripe',
      message: 'Paiement simulé',
      checkout_url: buildDemoPaymentUrl('/paiement/succes', {
        type: 'boost',
        provider: 'stripe',
      }),
    });
  }

  if (!ensureStripe(res)) return;

  const boost = findBoost(boost_type, boost_duration);
  if (!boost) return res.status(400).json({ error: 'Boost introuvable' });

  const { rows: annonceRows } = await query(
    `SELECT a.id, a.titre, cat.slug AS category_slug
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
    [annonce_id, req.user.id]
  );
  if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
  if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
    return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      success_url: `${baseUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}&type=boost`,
      cancel_url: `${baseUrl}/paiement/annule`,
      metadata: {
        payment_type: 'boost',
        user_id: String(req.user.id),
        annonce_id: String(annonce_id),
        boost_type,
        duration: String(boost_duration),
        amount_xpf: String(boost.price_xpf),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: xpfToEurCents(boost.price_xpf),
            product_data: {
              name: `${boost.label} — ${formatXpfEur(boost.price_xpf)}`,
              description: annonceRows[0].titre,
            },
          },
        },
      ],
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'boost', 'stripe', $2, $3, 'pending', $4)`,
      [
        req.user.id,
        session.id,
        boost.price_xpf,
        JSON.stringify({ annonce_id, boost_type, boost_duration }),
      ]
    );

    return res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[payment] boost error:', err.message);
    return res.status(500).json({ error: 'Erreur création boost' });
  }
});

router.post('/subscription', authenticate, paymentLimiter, validate(subscriptionSchema), async (req, res) => {
  const { plan_id, billing_period, provider } = req.body;

  if (provider === 'payplug') {
    if (demoModeEnabled) {
      return res.json({
        success: true,
        demo: true,
        provider,
        message: 'Paiement simulé',
        checkout_url: buildDemoPaymentUrl('/abonnement/confirmation', {
          payment_id: 'demo_payplug_subscription',
          provider,
          type: 'subscription',
        }),
      });
    }

    if (!payplug.isPayPlugConfigured()) {
      return res.status(503).json({ error: 'PayPlug non configuré — vérifiez PAYPLUG_SECRET_KEY' });
    }

    const planSlug = `${plan_id}_${billing_period === 'yearly' ? 'annuel' : 'mensuel'}`;
    const planConfig = payplug.PAYPLUG_SUBSCRIPTION_PLANS[planSlug];
    if (!planConfig) return res.status(400).json({ error: 'Plan PayPlug introuvable' });

    if (await hasExistingSubscription(req.user.id)) {
      return res.status(409).json({ error: 'Abonnement déjà actif' });
    }

    try {
      const subscription = await payplug.createSubscription({
        plan: planSlug,
        email: req.user.email,
        first_name: req.user.prenom || 'Client',
        last_name: req.user.nom || 'Troca',
        return_url: `${baseUrl}/abonnement/confirmation?payment_id={PAYPLUG_SUBSCRIPTION_ID}&provider=payplug`,
        cancel_url: `${baseUrl}/paiement/annule?provider=payplug`,
        metadata: {
          payment_type: 'subscription',
          user_id: String(req.user.id),
          plan_id,
          billing_period,
        },
      });

      await query(
        `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
         VALUES ($1, 'subscription', 'payplug', $2, $3, 'pending', $4)`,
        [
          req.user.id,
          subscription.id,
          Math.round((planConfig.amount_cents / 100) * payplug.XPF_PER_EUR),
          JSON.stringify({ plan_id, billing_period }),
        ]
      );

      return res.json({ checkout_url: subscription.hosted_payment.payment_url });
    } catch (err) {
      console.error('[payment] subscription PayPlug error:', err.message);
      return res.status(500).json(safePaymentError('payplug', 'Impossible de finaliser l’abonnement PayPlug'));
    }
  }

  if (demoModeEnabled) {
    return res.json({
      success: true,
      demo: true,
      provider: 'stripe',
      message: 'Paiement simulé',
      checkout_url: buildDemoPaymentUrl('/abonnement/confirmation', {
        session_id: 'demo_stripe_subscription',
        provider: 'stripe',
        type: 'subscription',
      }),
    });
  }

  if (!ensureStripe(res)) return;

  const plan = getWebPlan(plan_id, billing_period);
  if (!plan) return res.status(400).json({ error: 'Plan introuvable' });
  if (!plan.stripe_price_id) return res.status(500).json({ error: 'Price Stripe non configuré pour ce plan' });

  if (await hasExistingSubscription(req.user.id)) {
    return res.status(409).json({ error: 'Abonnement déjà actif' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${baseUrl}/abonnement/confirmation?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${baseUrl}/paiement/annule`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan_id, billing_period, user_id: String(req.user.id) },
      },
      metadata: {
        payment_type: 'subscription',
        user_id: String(req.user.id),
        plan_id,
        billing_period,
        amount_xpf: String(plan.amount_xpf),
      },
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'subscription', 'stripe', $2, $3, 'pending', $4)`,
      [req.user.id, session.id, plan.amount_xpf, JSON.stringify({ plan_id, billing_period })]
    );

    return res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[payment] subscription error:', err.message);
    return res.status(500).json({ error: 'Erreur création abonnement' });
  }
});

router.post('/subscribe', authenticate, paymentLimiter, validate(subscriptionSchema), async (req, res, next) => {
  req.url = '/subscription';
  return router.handle(req, res, next);
});

router.post('/subscribe/mobile', authenticate, paymentLimiter, validate(mobilePlanSchema), async (req, res) => {
  const { plan } = req.body;

  const planConfig = getMobilePlan(plan);
  if (!planConfig) return res.status(400).json({ error: 'Plan invalide' });
  if (!planConfig.price_id.startsWith('price_')) {
    return res.status(500).json({ error: "Price ID Stripe non configuré — vérifiez les variables d'environnement" });
  }

  if (demoModeEnabled) {
    return res.json({
      data: {
        client_secret: 'demo_client_secret_subscription',
        customer_id: 'demo_customer',
        ephemeral_key: 'demo_ephemeral_key',
        subscription_id: `demo_subscription_${plan}`,
        status: 'active',
        trial_end: null,
        plan,
        amount_display: formatXpfEur(planConfig.amount_xpf),
        demo: true,
        success: true,
        message: 'Paiement simulé',
      },
    });
  }

  if (!ensureStripe(res)) return;

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);

    if (await hasExistingSubscription(req.user.id)) {
      return res.status(409).json({ error: 'Vous avez déjà un abonnement actif' });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: planConfig.price_id }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan,
        user_id: String(req.user.id),
        amount_xpf: String(planConfig.amount_xpf),
      },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    const setupIntent = !paymentIntent
      ? await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session',
          metadata: { subscription_id: subscription.id, plan, user_id: String(req.user.id) },
        })
      : null;

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    await query(
      `INSERT INTO subscriptions
         (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
          current_period_start, current_period_end, cancel_at_period_end)
       VALUES ($1, $2, $3, 'stripe', $4, 'stripe', $5, NOW(), NOW() + INTERVAL '14 days', FALSE)
       ON CONFLICT (provider_sub_id) DO NOTHING`,
      [
        req.user.id,
        'pro',
        plan.includes('annuel') ? 'yearly' : 'monthly',
        subscription.id,
        subscription.status === 'trialing' ? 'trialing' : 'active',
      ]
    );

    await query(
      `UPDATE users SET is_pro = TRUE, pro_plan = $2, updated_at = NOW() WHERE id = $1`,
      [req.user.id, 'pro']
    );

    return res.json({
      data: {
        client_secret: paymentIntent?.client_secret ?? setupIntent?.client_secret,
        customer_id: customerId,
        ephemeral_key: ephemeralKey.secret,
        subscription_id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        plan,
        amount_display: formatXpfEur(planConfig.amount_xpf),
      },
    });
  } catch (err) {
    console.error('[payment] subscribe/mobile error:', err.message);
    return res.status(500).json({ error: 'Erreur création abonnement mobile' });
  }
});

router.post('/cancel', authenticate, paymentLimiter, async (req, res) => {
  if (!ensureStripe(res)) return;

  try {
    const { rows } = await query('SELECT stripe_customer_id, email, prenom FROM users WHERE id = $1', [req.user.id]);
    const { stripe_customer_id, email, prenom } = rows[0] ?? {};
    if (!stripe_customer_id) return res.status(404).json({ error: 'Aucun abonnement actif' });

    const { data: subs } = await stripe.subscriptions.list({ customer: stripe_customer_id, status: 'active', limit: 1 });
    if (!subs.length) {
      const { data: trials } = await stripe.subscriptions.list({ customer: stripe_customer_id, status: 'trialing', limit: 1 });
      if (!trials.length) return res.status(404).json({ error: 'Aucun abonnement actif ou en essai' });
      subs.push(trials[0]);
    }

    const sub = subs[0];
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });

    const periodEnd = new Date(sub.current_period_end * 1000);
    const periodEndStr = periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    await sendMail({
      to: email,
      subject: "[Troca] Confirmation d'annulation de votre abonnement Pro",
      html: `<p>Bonjour ${prenom},</p>
             <p>Votre annulation a bien été prise en compte.</p>
             <p>Votre abonnement Pro reste actif jusqu'au <strong>${periodEndStr}</strong>.<br>
             Vous conservez tous vos avantages Pro jusqu'à cette date.</p>
             <p>Vous pouvez à tout moment réactiver votre abonnement depuis votre espace.</p>`,
    }).catch(() => {});

    await query(
      `UPDATE subscriptions SET cancel_at_period_end = TRUE, updated_at = NOW()
       WHERE user_id = $1 AND status IN ('active','trialing')`,
      [req.user.id]
    );

    return res.json({
      ok: true,
      cancel_at: periodEnd.toISOString(),
      cancel_at_label: periodEndStr,
      message: `Abonnement annulé — actif jusqu'au ${periodEndStr}`,
    });
  } catch (err) {
    console.error('[payment] cancel error:', err.message);
    return res.status(500).json({ error: "Erreur lors de l'annulation" });
  }
});

router.get('/my-subscription', authenticate, paymentLimiter, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, u.is_pro, u.pro_plan
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    return res.json({ data: rows[0] ?? null });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération abonnement' });
  }
});

router.get('/invoices', authenticate, paymentLimiter, async (req, res) => {
  if (!ensureStripe(res)) return;
  try {
    const { rows } = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) return res.json({ data: [] });

    const { data: invoices } = await stripe.invoices.list({
      customer: customerId,
      limit: 24,
      expand: ['data.payment_intent'],
    });

    await Promise.all(invoices.map(async (inv) => {
      const amountXpf = Math.round((inv.amount_paid / 100) * XPF_PER_EUR);
      await query(
        `INSERT INTO billing_documents
           (user_id, provider, provider_ref, document_type, status, amount_eur_cents, amount_xpf,
            currency, pdf_url, hosted_url, payload, updated_at)
         VALUES ($1, 'stripe', $2, 'invoice', $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())
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
          req.user.id,
          inv.id,
          inv.status,
          inv.amount_paid,
          amountXpf,
          inv.currency?.toUpperCase?.() ?? 'EUR',
          inv.invoice_pdf ?? null,
          inv.hosted_invoice_url ?? null,
          JSON.stringify(inv),
        ]
      );
    }));

    return res.json({
      data: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: new Date(inv.created * 1000).toISOString(),
        amount_eur: (inv.amount_paid / 100).toFixed(2),
        amount_xpf: Math.round((inv.amount_paid / 100) * XPF_PER_EUR),
        status: inv.status,
        pdf_url: inv.invoice_pdf,
        hosted_url: inv.hosted_invoice_url,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération factures' });
  }
});

router.get('/billing-documents', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         id,
         provider,
         provider_ref,
         document_type,
         status,
         amount_eur_cents,
         amount_xpf,
         currency,
         pdf_url,
         hosted_url,
         payload,
         created_at
       FROM billing_documents
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 24`,
      [req.user.id]
    );

    return res.json({
      data: rows.map((doc) => ({
        id: doc.id,
        provider: doc.provider,
        provider_ref: doc.provider_ref,
        document_type: doc.document_type,
        status: doc.status,
        amount_eur: doc.amount_eur_cents != null ? (Number(doc.amount_eur_cents) / 100).toFixed(2) : null,
        amount_xpf: doc.amount_xpf,
        currency: doc.currency,
        pdf_url: doc.pdf_url,
        hosted_url: doc.hosted_url,
        date: doc.created_at,
        payload: doc.payload,
      })),
    });
  } catch (err) {
    console.error('[payment] billing-documents error:', err.message);
    return res.status(500).json({ error: 'Erreur récupération historique de facturation' });
  }
});

router.get('/subscriptions/verify', authenticate, paymentLimiter, async (req, res) => {
  const { session_id: sessionId, payment_id: paymentId } = req.query;

  try {
    if (demoModeEnabled) {
      return res.json({
        status: 'ok_subscription',
        plan: req.query.plan_id ?? 'pro',
        trial_end: null,
        period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        provider: (req.query.provider ?? 'stripe'),
        demo: true,
      });
    }

    if (sessionId && typeof sessionId === 'string') {
      const result = await verifyStripeSubscriptionStatus(sessionId, req.user.id);
      return res.status(result.code).json(result.body);
    }

    if (paymentId && typeof paymentId === 'string') {
      const result = await verifyPayplugSubscriptionStatus(paymentId, req.user.id);
      return res.status(result.code).json(result.body);
    }

    return res.status(400).json({ status: 'invalid', error: 'Paramètre de paiement manquant' });
  } catch (err) {
    if (err?.code === 'PAYPLUG_NOT_CONFIGURED') {
      return res.status(503).json({ status: 'invalid', error: 'PayPlug non configuré' });
    }
    console.error('[payment] subscriptions verify error:', err.message);
    return res.status(200).json({ status: 'invalid', error: 'Vérification indisponible' });
  }
});

router.get('/verify-session', authenticate, paymentLimiter, async (req, res) => {
  if (!ensureStripe(res)) return;
  const { session_id, type } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ status: 'invalid', error: 'session_id manquant' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'payment_intent'],
    });

    const { rows: pmtRows } = await query(
      'SELECT id, type, metadata FROM payments WHERE provider_ref = $1 AND user_id = $2 LIMIT 1',
      [session_id, req.user.id]
    );
    const payment = pmtRows[0];
    if (!payment) {
      return res.status(403).json({ status: 'invalid', error: 'Session non autorisée' });
    }

    if (payment.metadata?.payment_type && payment.metadata.payment_type !== type) {
      return res.status(403).json({ status: 'invalid', error: 'Type de paiement non cohérent' });
    }

    if (session.metadata?.user_id !== String(req.user.id)) {
      return res.status(403).json({ status: 'invalid', error: 'Session non autorisée' });
    }

    if (session.status !== 'complete') {
      return res.json({ status: 'pending' });
    }

    if (type === 'boost') {
      const annonceId = session.metadata?.annonce_id;
      if (!annonceId) {
        return res.status(400).json({ status: 'invalid', error: 'Annonce manquante' });
      }
      const boost = annonceId ? await query('SELECT titre, boost_type, boost_expires_at FROM annonces WHERE id = $1', [annonceId]) : { rows: [{}] };
      const boost_days = session.metadata?.duration ? Number(session.metadata.duration) : null;

      return res.json({
        status: 'ok_boost',
        annonce_id: annonceId,
        annonce_titre: boost.rows[0]?.titre ?? null,
        boost_type: session.metadata?.boost_type ?? null,
        boost_days,
      });
    }

    if (type === 'subscription') {
      const sub = session.subscription;
      if (!sub) {
        return res.status(400).json({ status: 'invalid', error: 'Abonnement manquant' });
      }
      const isTrial = sub?.status === 'trialing';
      return res.json({
        status: isTrial ? 'ok_trial' : 'ok_subscription',
        plan: session.metadata?.plan_id ?? null,
        trial_end: sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      });
    }

    return res.json({ status: 'ok_boost' });
  } catch (err) {
    console.error('[payment] verify-session error:', err.message);
    return res.status(200).json({ status: 'invalid', error: 'Vérification indisponible' });
  }
});

router.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!stripeWebhookSecret) return res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET manquant' });
  if (!sig || !req.rawBody) return res.status(400).json({ error: 'Signature webhook Stripe manquante' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('[webhook] Signature invalide:', err.message);
    return res.status(400).json({ error: 'Signature invalide' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO webhook_events (event_id, provider, type, processed_at)
       VALUES ($1, 'stripe', $2, NOW())
       ON CONFLICT (event_id) DO NOTHING RETURNING id`,
      [event.id, event.type]
    );
    if (!rows[0]) return res.json({ received: true, duplicate: true });
  } catch (err) {
    console.error('[webhook] Erreur idempotence:', err.message);
  }

  try {
    await processStripeWebhookEvent({
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
    });
    return res.json({ received: true });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentType = session.metadata?.payment_type;
      const userId = Number(session.metadata?.user_id ?? 0);

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
                 (user_id, plan_id, billing_period, provider, provider_sub_id, status,
                  current_period_start, current_period_end, cancel_at_period_end)
               VALUES ($1, $2, $3, 'stripe', $4, $5, $6, $7, FALSE)
               ON CONFLICT (provider_sub_id)
               DO UPDATE SET
                 status               = EXCLUDED.status,
                 current_period_start = EXCLUDED.current_period_start,
                 current_period_end   = EXCLUDED.current_period_end,
                 updated_at           = NOW()`,
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
             cancel_at_period_end = $5, updated_at = NOW()
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
          `UPDATE subscriptions SET current_period_end = $2, updated_at = NOW() WHERE provider_sub_id = $1`,
          [subId, periodEnd]
        );
        await query(
          `UPDATE users SET pro_expires_at = $2, updated_at = NOW()
           WHERE id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $1 LIMIT 1)`,
          [subId, periodEnd]
        );
        const { rows: userRows } = await query(
          `SELECT u.email, u.prenom FROM users u
           JOIN subscriptions s ON s.user_id = u.id
           WHERE s.provider_sub_id = $1 LIMIT 1`,
          [subId]
        );
        if (userRows[0]) {
          const amountEur = (inv.amount_paid / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
          const amountXpf = Math.round((inv.amount_paid / 100) * XPF_PER_EUR).toLocaleString('fr-FR');
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
        await query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE provider_sub_id = $1`,
          [subId]
        );
        const { rows } = await query(
          `SELECT u.email, u.prenom FROM users u
           JOIN subscriptions s ON s.user_id = u.id
           WHERE s.provider_sub_id = $1 LIMIT 1`,
          [subId]
        );
        if (rows[0]) {
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

    return res.json({ received: true });
  } catch (err) {
    console.error('[webhook] Erreur traitement:', err.message);
    return res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

router.get('/verify-payplug', authenticate, paymentLimiter, async (req, res) => {
  const { id, type, resource_type = 'payment' } = req.query;
  if (!id) return res.status(400).json({ status: 'invalid', error: 'id manquant' });

  try {
    if (demoModeEnabled) {
      if (resource_type === 'payment') {
        return res.json({
          status: 'ok_boost',
          annonce_id: req.query.annonce_id ?? null,
          annonce_titre: null,
          boost_type: req.query.boost_type ?? null,
          boost_days: req.query.duration ? Number(req.query.duration) : null,
          provider: 'payplug',
          demo: true,
        });
      }

      return res.json({
        status: 'ok_subscription',
        plan: req.query.plan_id ?? null,
        period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        provider: 'payplug',
        demo: true,
      });
    }

    if (!payplug.isPayPlugConfigured()) {
      return res.status(503).json({ error: 'PayPlug non configuré' });
    }

    const resource = await payplug.verifyIPN(String(id), String(resource_type));

    const meta = resource.metadata ?? {};
    const userId = Number(meta.user_id ?? 0);
    if (userId && userId !== req.user.id) {
      return res.status(403).json({ status: 'invalid', error: 'Ressource non autorisée' });
    }

    if (resource_type === 'payment') {
      if (!resource.is_paid) return res.json({ status: 'pending' });

      const annonceId = meta.annonce_id;
      let annonceTitre = null;
      if (annonceId) {
        const { rows } = await query(
          'SELECT titre, boost_type, boost_expires_at FROM annonces WHERE id = $1',
          [annonceId]
        );
        annonceTitre = rows[0]?.titre ?? null;
      }

      return res.json({
        status: 'ok_boost',
        annonce_id: annonceId,
        annonce_titre: annonceTitre,
        boost_type: meta.boost_type ?? null,
        boost_days: meta.duration ? Number(meta.duration) : null,
        provider: 'payplug',
      });
    }

    if (resource_type === 'subscription') {
      const isActive = resource.is_active ?? resource.state === 'active';
      if (!isActive) return res.json({ status: 'pending' });

      const isYearly = meta.billing_period === 'yearly';
      const periodEnd = new Date();
      isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

      return res.json({
        status: 'ok_subscription',
        plan: meta.plan_id,
        period_end: periodEnd.toISOString(),
        provider: 'payplug',
      });
    }

    return res.json({ status: 'invalid' });
  } catch (err) {
    console.error('[payment] verify-payplug error:', err.message);
    return res.status(200).json({ status: 'pending' });
  }
});

router.post('/webhooks/payplug', async (req, res) => {
  const resourceId = req.body?.id;
  const resourceType = req.body?.object ?? 'payment';
  const signature = getPayplugSignature(req);

  if (!payplugWebhookSecret) {
    return res.status(503).json({ error: 'PAYPLUG_WEBHOOK_SECRET manquant' });
  }
  if (!resourceId) {
    return res.status(400).json({ error: 'Payload IPN invalide' });
  }
  if (!verifyPayplugSignature(req.rawBody, signature)) {
    return res.status(400).json({ error: 'Signature webhook PayPlug invalide' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO webhook_events (event_id, provider, type, processed_at)
       VALUES ($1, 'payplug', $2, NOW())
       ON CONFLICT (event_id) DO NOTHING RETURNING id`,
      [String(resourceId), resourceType]
    );
    if (!rows[0]) return res.json({ received: true, duplicate: true });
  } catch (err) {
    console.error('[webhook/payplug] idempotence error:', err.message);
  }

  try {
    const resource = await processPayplugWebhook({
      resourceId,
      resourceType,
      payplug,
      query,
      withTransaction,
      sendMail,
      baseUrl,
    });
    if (resourceType === 'payment' && resource.is_paid) {
      return res.json({ received: true });
    }
    if (resourceType === 'subscription') {
      return res.json({ received: true });
    }

    if (false) {
    const resource = await payplug.verifyIPN(resourceId, resourceType);

    if (resourceType === 'payment' && resource.is_paid) {
      const meta = resource.metadata ?? {};
      const userId = Number(meta.user_id ?? 0);

      await query(
        `UPDATE payments SET status = 'succeeded', updated_at = NOW()
         WHERE provider_ref = $1 AND status = 'pending'`,
        [resourceId]
      );

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
          `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_provider)
           VALUES ($1, $2, $3, 'payplug') ON CONFLICT DO NOTHING`,
          [annonceId, boostType, expiresAt]
        ).catch(() => {});

        console.log(`[webhook/payplug] Boost activé - annonce ${annonceId} (${boostType} ${duration}j)`);
      }
    }

    if (resourceType === 'subscription') {
      const meta = resource.metadata ?? {};
      const userId = Number(meta.user_id ?? 0);
      const planId = meta.plan_id;
      const period = meta.billing_period;

      const isActive = resource.is_active ?? resource.state === 'active';

      if (isActive && userId && planId) {
        const now = new Date();
        const isYearly = period === 'yearly';
        const periodEnd = new Date(now);
        isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO subscriptions
               (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
                current_period_start, current_period_end, cancel_at_period_end)
             VALUES ($1, $2, $3, 'payplug', $4, 'payplug', 'active', NOW(), $5, FALSE)
             ON CONFLICT (provider_sub_id)
             DO UPDATE SET status = 'active', current_period_end = $5, payment_provider = EXCLUDED.payment_provider, updated_at = NOW()`,
            [userId, planId, period, resourceId, periodEnd]
          );

          await client.query(
            `UPDATE users SET is_pro = TRUE, pro_plan = $2, pro_expires_at = $3, updated_at = NOW()
             WHERE id = $1`,
            [userId, planId, periodEnd]
          );

          await client.query(
            `UPDATE payments SET status = 'succeeded', updated_at = NOW()
             WHERE provider_ref = $1 AND status = 'pending'`,
            [resourceId]
          );
        });

        const { rows: userRows } = await query(
          'SELECT email, prenom FROM users WHERE id = $1',
          [userId]
        );
        if (userRows[0]) {
          const planLabel = 'Pro';
          const periodLabel = isYearly ? 'annuel' : 'mensuel';
          const planSlug = `${planId}_${isYearly ? 'annuel' : 'mensuel'}`;
          const planConfig = payplug.PAYPLUG_SUBSCRIPTION_PLANS[planSlug];
          const xpf = planConfig ? Math.round((planConfig.amount_cents / 100) * payplug.XPF_PER_EUR) : 0;

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

        console.log(`[webhook/payplug] Abonnement activé - user ${userId} plan ${planId}`);
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
        console.log(`[webhook/payplug] Abonnement annulé - user ${userId}`);
      }
    }

    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[webhook/payplug] Erreur traitement:', err.message);
    return res.status(200).json({ received: true, error: err.message });
  }
});

router.delete('/subscription', authenticate, (req, res, next) => {
  req.method = 'POST';
  req.url = '/cancel';
  router.handle(req, res, next);
});

module.exports = router;
