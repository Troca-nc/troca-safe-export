'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness({ empty = false, attempts = 0, orderStatus = 'paid', recipient = 'synthetic@example.invalid', tickets = [{}], smtp = 'accepted', sqlFailure = false } = {}) {
  const calls = [];
  const trace = [];
  const client = { async query(sql, params) {
    calls.push({ sql, params });
    if (/SELECT id, order_id/.test(sql)) return { rows: empty ? [] : [{ id: 1, order_id: 34, attempts }] };
    if (/SELECT o\.\*/.test(sql)) return { rows: [{ id: 34, status: orderStatus, buyer_email: recipient }] };
    if (/SELECT t\.\*/.test(sql)) return { rows: tickets };
    if (sqlFailure) throw new Error('SQL failure');
    return { rows: [], rowCount: 1 };
  } };
  const service = load('services/ticketEmailOutboxService.js', {
    '../config/database': { async withTransaction(fn) {
      trace.push('BEGIN');
      try { const result = await fn(client); trace.push('COMMIT'); return result; }
      catch (error) { trace.push('ROLLBACK'); throw error; }
    } },
    './emailService': { async sendTicketEmail() {
      trace.push('SMTP');
      if (smtp === 'throw') throw new Error('private address and token');
      if (smtp === 'simulated') return { simulated: true };
      if (smtp === 'null') return null;
      if (smtp === 'rejected') return { accepted: [], rejected: [recipient] };
      return { accepted: [recipient] };
    } },
  });
  return { service, calls, trace, client };
}
async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  ✓ ${label}`); }
  await check('Queue stores only order id using the supplied transaction client', async () => {
    const h = harness(); await h.service.enqueueTicketEmail(h.client, 34);
    assert.deepStrictEqual(Array.from(h.calls[0].params), [34]);
    assert.match(h.calls[0].sql, /ON CONFLICT \(order_id\) DO NOTHING/);
    assert.deepStrictEqual(h.trace, []);
    await assert.rejects(h.service.enqueueTicketEmail(null, 34), /transaction client/);
  });
  await check('Empty queue is idle and selection locks with SKIP LOCKED', async () => {
    const h = harness({ empty: true });
    assert.strictEqual(await h.service.deliverNextTicketEmail(), null);
    assert.match(h.calls[0].sql, /FOR UPDATE SKIP LOCKED/);
    assert.ok(!h.trace.includes('SMTP'));
  });
  await check('Accepted SMTP is marked sent before queue transaction commits', async () => {
    const h = harness(); const result = await h.service.deliverNextTicketEmail();
    assert.strictEqual(result.status, 'sent');
    assert.deepStrictEqual(h.trace, ['BEGIN', 'SMTP', 'COMMIT']);
    assert.match(h.calls.at(-1).sql, /status = 'sent'/);
  });
  for (const smtp of ['throw', 'simulated', 'null', 'rejected']) {
    await check(`${smtp} SMTP result schedules retry without retaining sensitive details`, async () => {
      const h = harness({ smtp }); const result = await h.service.deliverNextTicketEmail();
      assert.strictEqual(result.status, 'pending');
      const params = Array.from(h.calls.at(-1).params);
      assert.deepStrictEqual(params.slice(0, 4), [1, 'pending', 1, 60]);
      assert.doesNotMatch(JSON.stringify(params), /private|@|token/);
      assert.ok(h.trace.includes('COMMIT'));
    });
  }
  await check('Fifth SMTP failure becomes terminal dead state', async () => {
    const h = harness({ smtp: 'throw', attempts: 4 });
    assert.strictEqual((await h.service.deliverNextTicketEmail()).status, 'dead');
    assert.strictEqual(h.calls.at(-1).params[2], 5);
  });
  for (const options of [{ orderStatus: 'refunded' }, { tickets: [] }]) {
    await check('Non-deliverable order is cancelled without SMTP', async () => {
      const h = harness(options);
      assert.strictEqual((await h.service.deliverNextTicketEmail()).status, 'cancelled');
      assert.ok(!h.trace.includes('SMTP'));
    });
  }
  await check('Missing recipient remains observable as a failed attempt', async () => {
    const h = harness({ recipient: '' });
    assert.strictEqual((await h.service.deliverNextTicketEmail()).errorCode, 'RECIPIENT_MISSING');
    assert.ok(!h.trace.includes('SMTP'));
  });
  await check('DB failure after SMTP propagates; no false successful queue commit', async () => {
    const h = harness({ sqlFailure: true });
    await assert.rejects(h.service.deliverNextTicketEmail(), /SQL failure/);
    assert.deepStrictEqual(h.trace, ['BEGIN', 'SMTP', 'ROLLBACK']);
  });
  await check('Worker bounds each tick and ignores overlapping local ticks', async () => {
    let tick; let resolveSend; let deliveries = 0;
    const first = new Promise(resolve => { resolveSend = resolve; });
    const job = load('jobs/ticketEmailOutbox.js', {
      'node-cron': { schedule(expression, callback) { assert.strictEqual(expression, '* * * * *'); tick = callback; return { stop() {} }; } },
      '../services/ticketEmailOutboxService': { async deliverNextTicketEmail() {
        deliveries++; if (deliveries === 1) await first; return { id: deliveries, status: 'sent' };
      } },
      '../utils/logger': { logger: { info() {}, error() {} } },
    });
    job.startTicketEmailOutboxJob();
    const running = tick(); await tick(); assert.strictEqual(deliveries, 1);
    resolveSend(); await running; assert.strictEqual(deliveries, 5);
    await tick(); assert.strictEqual(deliveries, 10);
  });
  console.log(`Ticket email outbox: ${count} checks passed`);
}
module.exports = run().catch(error => { console.error(error); process.exitCode = 1; });
