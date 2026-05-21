'use strict';

// ============================================================
//  Troca - Service PayPlug (API REST v1)
//  Implémentation native sans SDK (dépendances obsolètes)
//  Docs : https://docs.payplug.com/api
//
//  PayPlug = solution locale NC (cartes BCI, BNC, Société Générale...)
//  Complémentaire à Stripe pour les clients sans carte internationale
// ============================================================

const https = require('https');
const { isConfiguredValue } = require('../config/env');
const {
  XPF_PER_EUR,
  xpfToEurCents,
  formatXpfEur,
  MOBILE_PLANS_XPF,
} = require('./paymentCatalog');

const PAYPLUG_API_BASE = 'api.payplug.com';
const PAYPLUG_API_VER = '/v1';

function payplugRequest(method, path, body = null) {
  const secretKey = process.env.PAYPLUG_SECRET_KEY || '';

  if (!isConfiguredValue(secretKey)) {
    return Promise.reject(new Error('PAYPLUG_SECRET_KEY non configurée'));
  }

  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: PAYPLUG_API_BASE,
      port: 443,
      path: `${PAYPLUG_API_VER}${path}`,
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'PayPlug-Version': '2019-08-06',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (res.statusCode >= 400) {
            const err = new Error(data?.message ?? `PayPlug error ${res.statusCode}`);
            err.status = res.statusCode;
            err.payplug = data;
            return reject(err);
          }
          resolve(data);
        } catch {
          reject(new Error(`PayPlug: réponse non-JSON (${res.statusCode}): ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function createPayment({
  amount_xpf,
  description,
  email,
  first_name,
  last_name,
  return_url,
  cancel_url,
  metadata = {},
}) {
  const amount_cents = xpfToEurCents(amount_xpf, 100);
  const notif_url = `${process.env.BASE_URL || 'https://troca.nc'}/api/payment/webhooks/payplug`;

  const payload = {
    amount: amount_cents,
    currency: 'EUR',
    customer: { email, first_name, last_name },
    hosted_payment: {
      payment_url: null,
      return_url,
      cancel_url,
      sent_by: 'customer',
    },
    notification_url: notif_url,
    metadata: {
      ...metadata,
      amount_xpf: String(amount_xpf),
      amount_display: formatXpfEur(amount_xpf),
    },
    description: description.slice(0, 80),
    capture: true,
    allow_save_card: false,
    shipping_address: { title: 'mr', first_name, last_name, email },
  };

  return payplugRequest('POST', '/payments', payload);
}

async function getPayment(paymentId) {
  return payplugRequest('GET', `/payments/${paymentId}`);
}

async function refundPayment(paymentId, reason = 'customer_request') {
  return payplugRequest('POST', `/payments/${paymentId}/refunds`, {
    amount: null,
    metadata: { reason },
  });
}

const PAYPLUG_SUBSCRIPTION_PLANS = {
  pro_mensuel: {
    amount_cents: Math.round((MOBILE_PLANS_XPF.pro_mensuel / XPF_PER_EUR) * 100),
    interval: 'month',
    interval_count: 1,
  },
  pro_annuel: {
    amount_cents: Math.round((MOBILE_PLANS_XPF.pro_annuel / XPF_PER_EUR) * 100),
    interval: 'year',
    interval_count: 1,
  },
  pro_plus_mensuel: {
    amount_cents: Math.round((MOBILE_PLANS_XPF.pro_plus_mensuel / XPF_PER_EUR) * 100),
    interval: 'month',
    interval_count: 1,
  },
  pro_plus_annuel: {
    amount_cents: Math.round((MOBILE_PLANS_XPF.pro_plus_annuel / XPF_PER_EUR) * 100),
    interval: 'year',
    interval_count: 1,
  },
};

async function createSubscription({
  plan,
  email,
  first_name,
  last_name,
  return_url,
  cancel_url,
  metadata = {},
}) {
  const planConfig = PAYPLUG_SUBSCRIPTION_PLANS[plan];
  if (!planConfig) throw new Error(`Plan PayPlug inconnu: ${plan}`);

  const notif_url = `${process.env.BASE_URL || 'https://troca.nc'}/api/payment/webhooks/payplug`;

  const payload = {
    amount: planConfig.amount_cents,
    currency: 'EUR',
    interval: planConfig.interval,
    interval_count: planConfig.interval_count,
    customer: { email, first_name, last_name },
    hosted_payment: {
      return_url,
      cancel_url,
    },
    notification_url: notif_url,
    metadata: {
      ...metadata,
      plan,
      payment_type: 'subscription',
      amount_xpf: String(Math.round((planConfig.amount_cents / 100) * XPF_PER_EUR)),
    },
  };

  return payplugRequest('POST', '/subscriptions', payload);
}

async function cancelSubscription(subscriptionId) {
  return payplugRequest('DELETE', `/subscriptions/${subscriptionId}`);
}

async function getSubscription(subscriptionId) {
  return payplugRequest('GET', `/subscriptions/${subscriptionId}`);
}

async function verifyIPN(resourceId, resourceType = 'payment') {
  if (resourceType === 'subscription') {
    return getSubscription(resourceId);
  }
  return getPayment(resourceId);
}

function isPayPlugConfigured() {
  const key = process.env.PAYPLUG_SECRET_KEY || '';
  return isConfiguredValue(key) && key.startsWith('sk_');
}

module.exports = {
  createPayment,
  getPayment,
  refundPayment,
  createSubscription,
  cancelSubscription,
  getSubscription,
  verifyIPN,
  isPayPlugConfigured,
  xpfToEurCents,
  formatXpfEur,
  PAYPLUG_SUBSCRIPTION_PLANS,
  XPF_PER_EUR,
};
