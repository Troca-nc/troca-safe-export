'use strict';

const assert = require('assert');
const { loadDatabase, loadServices, metadata, ticketEvent } = require('./paymentTransactionHarness');

function harness({ orderStatus = 'reserved', failOn = '', emailFails = false, missingPayment = false, duplicate = false, receiptProvider = 'stripe' } = {}) {
  const trace = [];
  let updates = 0;
  let releases = 0;
  const client = {
    async query(sql) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      trace.push(normalized);
      if (failOn && normalized.includes(failOn)) throw new Error('injected SQL error');
      if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(normalized)) return { rows: [] };
      if (normalized.startsWith('INSERT INTO webhook_events')) return { rows: duplicate ? [] : [{ id: 1 }] };
      if (normalized.includes('FROM webhook_events')) return { rows: [{ provider: receiptProvider }] };
      if (/^UPDATE/.test(normalized)) { updates++; return { rows: [], rowCount: 1 }; }
      if (normalized.includes('FROM payments')) return { rows: missingPayment ? [] : [{
        id: 9, user_id: 7, metadata, amount_xpf: 3600, status: 'pending',
      }] };
      if (normalized.includes('FROM ticket_orders') && normalized.includes('FOR UPDATE')) {
        return { rows: [{ id: 34, status: orderStatus }] };
      }
      if (normalized.includes('FROM tickets') && normalized.includes('FOR UPDATE')) {
        return { rows: [{ id: 50, ticket_type_id: 60, price_xpf: 3600 }] };
      }
      return { rows: [{ id: 34 }] };
    },
    release() { releases++; },
  };
  const pool = {
    on() {},
    query() { throw new Error('Global pool query escaped transaction'); },
    async connect() { trace.push('CONNECT'); return client; },
  };
  const database = loadDatabase(pool);
  const services = loadServices(database, async () => {
    assert.ok(trace.includes('COMMIT'), 'Email before commit');
    trace.push('EMAIL');
    if (emailFails) throw new Error('synthetic email failure');
  });
  return {
    trace, client, services,
    updates: () => updates,
    releases: () => releases,
    invoke: (event = ticketEvent()) => services.processStripeWebhookEvent({ event, ...database }),
  };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  ✓ ${label}`); }
  await check('Ticket validation, finalization and outbox share one connection without sending email', async () => {
    const h = harness();
    await h.invoke();
    assert.strictEqual(h.trace.filter(x => x === 'CONNECT').length, 1);
    assert.strictEqual(h.trace.filter(x => x === 'BEGIN').length, 1);
    assert.strictEqual(h.trace.filter(x => x === 'COMMIT').length, 1);
    assert.strictEqual(h.updates(), 5);
    assert.strictEqual(h.releases(), 1);
    assert.ok(!h.trace.includes('EMAIL'));
    const enqueued = h.trace.findIndex(sql => sql.startsWith('INSERT INTO ticket_email_outbox'));
    assert.ok(enqueued > 0 && enqueued < h.trace.indexOf('COMMIT'));
    assert.match(h.trace[2], /^INSERT INTO webhook_events/);
    assert.match(h.trace[3], /provider = 'stripe'.*FOR UPDATE/);
  });
  for (const failOn of ['INSERT INTO webhook_events', 'UPDATE ticket_types', 'UPDATE tickets ', 'UPDATE ticket_orders', 'UPDATE events', 'UPDATE payments', 'INSERT INTO ticket_email_outbox', 'COMMIT']) {
    await check(`Ticket failure at ${failOn.trim()} propagates without email`, async () => {
      const h = harness({ failOn });
      await assert.rejects(h.invoke(), /injected SQL error/);
      assert.ok(h.trace.includes('ROLLBACK'));
      assert.ok(!h.trace.includes('EMAIL'));
      assert.strictEqual(h.releases(), 1);
    });
  }
  await check('Already paid ticket order neither mutates nor sends email', async () => {
    const h = harness({ orderStatus: 'paid' });
    await h.invoke();
    assert.strictEqual(h.updates(), 0);
    assert.ok(!h.trace.includes('EMAIL'));
    assert.ok(!h.trace.some(sql => sql.startsWith('INSERT INTO ticket_email_outbox')));
  });
  for (const change of [{ payment_status: 'unpaid' }, { currency: 'usd' }, { amount_total: 1 }, { metadata: { ...metadata, user_id: '8' } }]) {
    await check(`Invalid ticket checkout ${JSON.stringify(change)} causes no writes`, async () => {
      const h = harness();
      await assert.rejects(h.invoke(ticketEvent(change)), /validation failed/);
      assert.ok(h.trace.includes('ROLLBACK') && !h.trace.includes('COMMIT'));
      assert.strictEqual(h.updates(), 0);
      assert.ok(!h.trace.includes('EMAIL'));
    });
  }
  await check('Missing ticket payment causes no writes or email', async () => {
    const h = harness({ missingPayment: true });
    await assert.rejects(h.invoke(), /validation failed/);
    assert.ok(h.trace.includes('ROLLBACK'));
    assert.strictEqual(h.updates(), 0);
    assert.ok(!h.trace.includes('EMAIL'));
  });
  await check('Historical receipt skips ticket effects without replay', async () => {
    const h = harness({ duplicate: true });
    assert.strictEqual((await h.invoke()).duplicate, true);
    assert.ok(h.trace.includes('COMMIT'));
    assert.ok(!h.trace.some(sql => sql.includes('FROM payments')));
    assert.strictEqual(h.updates(), 0);
  });
  await check('Cross-provider receipt conflict fails closed', async () => {
    const h = harness({ duplicate: true, receiptProvider: 'payplug' });
    await assert.rejects(h.invoke(), /provider conflict/);
    assert.ok(h.trace.includes('ROLLBACK'));
    assert.strictEqual(h.updates(), 0);
  });
  await check('Non-finalizable order rolls back its receipt', async () => {
    const h = harness({ orderStatus: 'cancelled' });
    await assert.rejects(h.invoke(), /not finalizable/);
    assert.ok(h.trace.includes('ROLLBACK'));
  });
  await check('Missing event ID fails before opening a transaction', async () => {
    const h = harness();
    await assert.rejects(h.invoke({ ...ticketEvent(), id: undefined }), /event ID/);
    assert.deepStrictEqual(h.trace, []);
  });
  await check('Standalone finalizer still owns its transaction', async () => {
    const h = harness();
    await h.services.finalizeEventTicketPayment({ providerRef: 'cs_synthetic' });
    assert.ok(h.trace.includes('BEGIN') && h.trace.includes('COMMIT'));
    assert.strictEqual(h.releases(), 1);
  });
  await check('Injected client is not committed or released by finalizer', async () => {
    const h = harness();
    await h.services.finalizeEventTicketPayment({ providerRef: 'cs_synthetic', client: h.client });
    assert.ok(!h.trace.includes('CONNECT') && !h.trace.includes('COMMIT'));
    assert.strictEqual(h.releases(), 0);
  });
  await check('Invalid client fails instead of falling back to another transaction', async () => {
    const h = harness();
    await assert.rejects(h.services.finalizeEventTicketPayment({ providerRef: 'cs_synthetic', client: {} }), /transaction client/);
    assert.deepStrictEqual(h.trace, []);
  });
  await check('An unavailable email service is not called by the payment transaction', async () => {
    const h = harness({ emailFails: true });
    await h.invoke();
    assert.ok(h.trace.includes('COMMIT') && !h.trace.includes('ROLLBACK'));
    assert.ok(!h.trace.includes('EMAIL'));
  });
  console.log(`Ticket transaction: ${count} checks passed`);
}
module.exports = run().catch(error => { console.error(error); process.exitCode = 1; });
