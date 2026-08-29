'use strict';

// Exercise the real dispatcher with an allowlisted set of in-memory dependencies.
// No database connection, provider request, credentials or email delivery.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { xpfToEurCents } = require('../services/paymentCatalog');

function harness({ type = 'boost', status = 'pending', activationResult = {} } = {}) {
  const writes = [];
  const activations = [];
  const emails = [];
  const metadata = {
    payment_type: type, user_id: '7', annonce_id: '12', boost_type: 'une',
    duration: '7', amount_xpf: '3600', campaign_id: '13', bon_plan_id: '14',
  };
  const payment = { id: 9, user_id: 7, type, status, amount_xpf: 3600, metadata };
  const query = async (sql, params) => {
    if (/^\s*(UPDATE|INSERT|DELETE)/i.test(sql)) writes.push({ sql, params });
    if (/FROM payments/.test(sql)) return { rows: [payment] };
    if (/SELECT u\./.test(sql)) return { rows: [{ id: 7, email: 'synthetic@example.invalid' }] };
    if (/RETURNING user_id/.test(sql)) return { rows: [{ user_id: 7 }] };
    return { rows: [{ id: 9 }] };
  };
  const activate = product => async (...args) => {
    activations.push({ product, args });
    return activationResult;
  };
  const imports = {
    './bonPlansService': { activateBonPlanFromPayment: activate('bon_plan') },
    './campaignsService': { activateCampaignFromPayment: activate('campaign') },
    './emailService': { sendBoostActivatedEmail: async () => {}, sendTicketEmail: async () => {} },
    './eventTicketingService': { finalizeEventTicketPayment: async () => null },
    './paymentCatalog': { xpfToEurCents },
  };
  const sandbox = {
    module: { exports: {} },
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
      return imports[name];
    },
  };
  const file = path.join(__dirname, '../services/paymentWebhookService.js');
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  const dependencies = {
    query,
    withTransaction: async fn => fn({ query }),
    markPaymentSucceeded: async () => { writes.push({ sql: 'markPaymentSucceeded' }); },
    sendMail: async (...args) => { emails.push(args); },
    sendBoostActivatedEmail: async (...args) => { emails.push(args); },
  };
  const checkout = (overrides = {}) => sandbox.module.exports.processStripeWebhookEvent({
    ...dependencies,
    event: { type: 'checkout.session.completed', data: { object: {
      id: 'cs_synthetic', metadata, payment_status: 'paid', currency: 'eur',
      amount_total: xpfToEurCents(3600), ...overrides,
    } } },
  });
  const stripeEvent = (eventType, object) => sandbox.module.exports.processStripeWebhookEvent({
    ...dependencies, event: { type: eventType, data: { object } },
  });
  const payplug = () => sandbox.module.exports.processPayplugWebhook({
    ...dependencies, resourceId: 'pay_synthetic', resourceType: 'payment',
    payplug: {
      XPF_PER_EUR: 100,
      verifyIPN: async () => ({ is_paid: true, amount: 3600, metadata }),
    },
  });
  return { writes, activations, emails, checkout, stripeEvent, payplug };
}

async function run() {
  let count = 0;
  const check = async (label, fn) => {
    await fn();
    count += 1;
    console.log(`  ✓ ${label}`);
  };

  await check('Stripe boost completes and uses stored billing metadata', async () => {
    const h = harness();
    await h.checkout();
    assert.ok(h.writes.some(x => /UPDATE annonces/.test(x.sql)));
    const invoice = h.writes.find(x => /INSERT INTO invoices/.test(x.sql));
    assert.ok(invoice);
    assert.strictEqual(invoice.params[2], 3600);
  });
  await check('PayPlug boost completes and sends its first email', async () => {
    const h = harness();
    await h.payplug();
    assert.strictEqual(h.emails.length, 1);
  });
  await check('PayPlug previously succeeded boost does not send another email', async () => {
    const h = harness({ status: 'succeeded' });
    await h.payplug();
    assert.strictEqual(h.emails.length, 0);
  });
  await check('Unrelated Stripe event does not fall into product activation', async () => {
    const h = harness();
    await h.stripeEvent('unhandled.synthetic', {});
    assert.strictEqual(h.writes.length, 0);
    assert.strictEqual(h.activations.length, 0);
  });
  await check('Stripe subscription deletion reaches its handler', async () => {
    const h = harness();
    await h.stripeEvent('customer.subscription.deleted', { id: 'sub_synthetic' });
    assert.ok(h.writes.some(x => /UPDATE subscriptions/.test(x.sql)));
    assert.ok(h.writes.some(x => /UPDATE users/.test(x.sql)));
    assert.strictEqual(h.activations.length, 0);
  });
  await check('Stripe subscription update completes without unrelated variables', async () => {
    const h = harness();
    await h.stripeEvent('customer.subscription.updated', {
      id: 'sub_synthetic', status: 'active', current_period_start: 1, current_period_end: 2,
    });
    assert.ok(h.writes.some(x => /UPDATE subscriptions/.test(x.sql)));
    assert.strictEqual(h.activations.length, 0);
  });
  for (const product of ['campaign', 'bon_plan']) {
    await check(`Stripe ${product} dispatches from its paid Checkout Session`, async () => {
      const h = harness({ type: product });
      await h.checkout();
      assert.strictEqual(h.activations.length, 1);
      assert.strictEqual(h.activations[0].product, product);
      assert.strictEqual(h.activations[0].args[3], 'cs_synthetic');
      assert.strictEqual(h.activations[0].args[4], 'stripe');
      assert.ok(!h.writes.some(x => x.sql === 'markPaymentSucceeded'));
    });
    for (const invalid of [{ payment_status: 'unpaid' }, { currency: 'usd' }, { amount_total: 1 }]) {
      await check(`Stripe ${product} rejects ${JSON.stringify(invalid)} before mutation`, async () => {
        const h = harness({ type: product });
        await h.checkout(invalid);
        assert.strictEqual(h.activations.length, 0);
        assert.strictEqual(h.writes.length, 0);
      });
    }
    await check(`Stripe ${product} surfaces missing activation target`, async () => {
      const h = harness({ type: product, activationResult: null });
      await assert.rejects(h.checkout(), /activation target unavailable/);
    });
  }
  console.log(`Webhook runtime: ${count} checks passed`);
}

module.exports = run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
