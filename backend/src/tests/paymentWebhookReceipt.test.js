'use strict';

// Execute the actual route callbacks with isolated dependencies. This tests
// HTTP control flow, not signature cryptography or PostgreSQL concurrency.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ticketEvent } = require('./paymentTransactionHarness');

function harness(provider, { secret = true, validSignature = true, outcomes = ['inserted'], event = { id: 'evt_synthetic', type: 'synthetic.event' }, processTicket = async () => {} } = {}) {
  const file = path.join(__dirname, '../routes/payment.route.js');
  const source = fs.readFileSync(file, 'utf8');
  const marker = `router.post('/webhooks/${provider}',`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `Missing ${provider} route`);
  const end = source.indexOf('\nrouter.', start + marker.length);
  assert.ok(end > start, 'Missing route boundary');
  let handler;
  const calls = { registry: 0, business: 0 };
  const sandbox = {
    router: { post(route, callback) { assert.strictEqual(route, `/webhooks/${provider}`); handler = callback; } },
    console: { error() {} },
    stripeWebhookSecret: secret ? 'synthetic' : '',
    payplugWebhookSecret: secret ? 'synthetic' : '',
    stripe: { webhooks: { constructEvent() {
      if (!validSignature) throw new Error('Invalid signature');
      return event;
    } } },
    getPayplugSignature: () => 'synthetic',
    verifyPayPlugWebhook: () => validSignature,
    query: async (sql) => {
      assert.match(sql, /INSERT INTO webhook_events/);
      const outcome = outcomes[Math.min(calls.registry++, outcomes.length - 1)];
      if (outcome === 'error') throw new Error('synthetic DB failure: private detail');
      return { rows: outcome === 'duplicate' ? [] : [{ id: 1 }] };
    },
    processStripeWebhookEvent: async () => { calls.business++; return processTicket(); },
    processPayplugWebhook: async () => { calls.business++; return { is_paid: true }; },
    payplug: {}, withTransaction() {}, sendMail() {}, sendBoostActivatedEmail() {},
    getWebPlan() {}, markPaymentSucceeded() {}, formatXpfEur() {}, XPF_PER_EUR: 119.33, baseUrl: '',
  };
  vm.runInNewContext(source.slice(start, end), sandbox, { filename: file, timeout: 1000 });
  return {
    calls,
    async invoke(overrides = {}) {
      const req = {
        body: { id: 'pay_synthetic', object: 'payment' },
        headers: { 'stripe-signature': 'synthetic' },
        rawBody: Buffer.from('{}'), ...overrides,
      };
      const res = {
        code: 200, payload: undefined, replies: 0,
        status(code) { this.code = code; return this; },
        json(payload) { this.payload = payload; this.replies++; return this; },
      };
      await handler(req, res);
      assert.strictEqual(res.replies, 1);
      return res;
    },
  };
}

async function run() {
  let count = 0;
  async function check(label, test) {
    await test();
    count++;
    console.log(`  ✓ ${label}`);
  }
  for (const provider of ['stripe', 'payplug']) {
    await check(`${provider}: missing secret stops before registry and business`, async () => {
      const h = harness(provider, { secret: false });
      assert.strictEqual((await h.invoke()).code, 503);
      assert.deepStrictEqual(h.calls, { registry: 0, business: 0 });
    });
    await check(`${provider}: invalid signature stops before registry and business`, async () => {
      const h = harness(provider, { validSignature: false });
      assert.strictEqual((await h.invoke()).code, provider === 'stripe' ? 400 : 401);
      assert.deepStrictEqual(h.calls, { registry: 0, business: 0 });
    });
    await check(`${provider}: registry failure stops business and returns generic 503`, async () => {
      const h = harness(provider, { outcomes: ['error'] });
      const res = await h.invoke();
      assert.strictEqual(res.code, 503);
      assert.strictEqual(res.payload.error, 'Enregistrement webhook indisponible');
      assert.strictEqual(res.payload.received, undefined);
      assert.deepStrictEqual(h.calls, { registry: 1, business: 0 });
    });
    await check(`${provider}: existing receipt skips business`, async () => {
      const h = harness(provider, { outcomes: ['duplicate'] });
      const res = await h.invoke();
      assert.strictEqual(res.code, 200);
      assert.strictEqual(res.payload.duplicate, true);
      assert.deepStrictEqual(h.calls, { registry: 1, business: 0 });
    });
    await check(`${provider}: new receipt runs business once`, async () => {
      const h = harness(provider);
      const res = await h.invoke();
      assert.strictEqual(res.code, 200);
      assert.strictEqual(res.payload.received, true);
      assert.deepStrictEqual(h.calls, { registry: 1, business: 1 });
    });
    await check(`${provider}: retry after simulated uncommitted insert failure`, async () => {
      const h = harness(provider, { outcomes: ['error', 'inserted', 'duplicate'] });
      assert.strictEqual((await h.invoke()).code, 503);
      assert.strictEqual(h.calls.business, 0);
      assert.strictEqual((await h.invoke()).code, 200);
      assert.strictEqual((await h.invoke()).payload.duplicate, true);
      assert.deepStrictEqual(h.calls, { registry: 3, business: 1 });
    });
  }
  await check('Ticket receipt is delegated to business transaction, including duplicates', async () => {
    const h = harness('stripe', { event: ticketEvent(), outcomes: ['error'], processTicket: async () => ({ duplicate: true }) });
    const res = await h.invoke();
    assert.strictEqual(res.code, 200);
    assert.strictEqual(res.payload.duplicate, true);
    assert.deepStrictEqual(h.calls, { registry: 0, business: 1 });
  });
  await check('Ticket transaction failure returns 500 without a premature receipt', async () => {
    const h = harness('stripe', { event: ticketEvent(), processTicket: async () => { throw new Error('private database detail'); } });
    const res = await h.invoke();
    assert.strictEqual(res.code, 500);
    assert.ok(!JSON.stringify(res.payload).includes('private database detail'));
    assert.deepStrictEqual(h.calls, { registry: 0, business: 1 });
  });
  await check('Ticket response waits until the transaction resolves', async () => {
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const h = harness('stripe', { event: ticketEvent(), processTicket: () => pending });
    let responded = false;
    const response = h.invoke().then(res => { responded = true; return res; });
    await Promise.resolve(); await Promise.resolve();
    assert.strictEqual(responded, false);
    finish({ duplicate: false });
    assert.strictEqual((await response).code, 200);
  });
  await check('Unverified body cannot select ticket receipt handling', async () => {
    const h = harness('stripe');
    await h.invoke({ body: ticketEvent() });
    assert.deepStrictEqual(h.calls, { registry: 1, business: 1 });
    const invalid = harness('stripe', { event: ticketEvent(), validSignature: false });
    assert.strictEqual((await invalid.invoke()).code, 400);
    assert.deepStrictEqual(invalid.calls, { registry: 0, business: 0 });
  });
  console.log(`Webhook receipt: ${count} checks passed`);
}

module.exports = run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
