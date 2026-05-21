'use strict';

const assert = require('assert');

function describe(label, fn) {
  console.log(`\n${label}`);
  fn();
}

function it(label, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ✓ ${label}`);
    })
    .catch((error) => {
      console.error(`  ✗ ${label}\n    ${error.message}`);
      process.exitCode = 1;
    });
}

function loadPaymentRouter() {
  const path = require.resolve('../routes/payment.route');
  delete require.cache[path];
  return require('../routes/payment.route');
}

function invokeRouter(router, { method, url, body, headers }) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      body: body || {},
      headers: headers || {},
    };

    const res = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        resolve({ code: this.statusCode, body: payload });
        return this;
      },
      end() {
        resolve({ code: this.statusCode, body: this.payload });
      },
    };

    router.handle(req, res, (err) => {
      if (err) return reject(err);
      resolve({ code: res.statusCode, body: res.payload });
    });
  });
}

async function run() {
  describe('payment route webhooks', () => {});

  await it('retourne 503 si secret webhook absent', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const router = loadPaymentRouter();
    const result = await invokeRouter(router, {
      method: 'POST',
      url: '/webhooks/stripe',
      body: { id: 'evt_test', type: 'checkout.session.completed' },
    });

    assert.strictEqual(result.code, 503);
    assert.strictEqual(result.body.error, 'STRIPE_WEBHOOK_SECRET manquant');
  });

  await it('retourne 400 si signature/raw body absents', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const router = loadPaymentRouter();
    const result = await invokeRouter(router, {
      method: 'POST',
      url: '/webhooks/stripe',
      body: { id: 'evt_test', type: 'checkout.session.completed' },
      headers: {},
    });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.body.error, 'Signature webhook Stripe manquante');
  });
}

module.exports = run();
