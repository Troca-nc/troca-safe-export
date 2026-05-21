'use strict';

const { query } = require('../config/database');
const { isConfiguredValue } = require('../config/env');
const {
  XPF_PER_EUR,
  xpfToEurCents,
  formatXpfEur,
} = require('./paymentCatalog');

function ensureStripe(res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  if (!isConfiguredValue(stripeKey)) {
    res.status(503).json({ error: 'Paiements Stripe non configurés.', code: 'PAYMENT_NOT_CONFIGURED' });
    return null;
  }
  return true;
}

async function getOrCreateStripeCustomer(stripe, userId, email) {
  const { rows } = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
  if (rows[0]?.stripe_customer_id) return rows[0].stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: String(userId) },
  });
  await query('UPDATE users SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2', [customer.id, userId]);
  return customer.id;
}

async function markPaymentSucceeded(providerRef) {
  return query(
    `UPDATE payments SET status = 'succeeded', updated_at = NOW()
     WHERE provider_ref = $1 AND status = 'pending' RETURNING id`,
    [providerRef]
  );
}

module.exports = {
  XPF_PER_EUR,
  xpfToEurCents,
  formatXpfEur,
  ensureStripe,
  getOrCreateStripeCustomer,
  markPaymentSucceeded,
};
