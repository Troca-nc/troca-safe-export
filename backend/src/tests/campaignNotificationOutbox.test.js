'use strict';
const assert = require('assert');
const { load } = require('./paymentTransactionHarness');
const { loadCampaigns } = require('./campaignTransactionHarness');

function harness({ empty = false, attempts = 0, campaignChange = {}, channel = 'email', result = { status: 'sent' }, failDelivery = false, failAck = false } = {}) {
  const calls = [];
  const trace = [];
  const campaign = { id: 13, user_id: 7, payment_user_id: 7, status: 'active', payment_status: 'succeeded',
    not_expired: true, provider: 'stripe', provider_ref: 'cs_test',
    metadata: { payment_provider: 'stripe', payment_ref: 'cs_test' }, ...campaignChange };
  const client = { async query(sql, params) {
    calls.push({ sql, params });
    if (sql.startsWith('SELECT * FROM campaign_notification_outbox')) return { rows: empty ? [] : [{ id: 1, payment_id: 9, campaign_id: 13, user_id: 7, channel, attempts, expected_status: 'active' }] };
    if (sql.includes('SELECT c.*')) return { rows: [campaign] };
    if (failAck && sql.startsWith('UPDATE')) throw new Error('DB failure');
    return { rows: [], rowCount: 1 };
  } };
  const service = load('services/campaignNotificationOutboxService.js', { '../config/database': {
    async withTransaction(fn) {
      trace.push('BEGIN');
      try { const value = await fn(client); trace.push('COMMIT'); return value; }
      catch (error) { trace.push('ROLLBACK'); throw error; }
    },
  } });
  const deliver = async () => { trace.push('DELIVER'); if (failDelivery) throw new Error('private provider details'); return result; };
  return { service, calls, client, trace, invoke: () => service.deliverNextCampaignNotification(deliver) };
}

async function run() {
  let total = 0;
  async function check(label, fn) { await fn(); total++; console.log(`  ✓ ${label}`); }
  await check('Enqueue uses supplied client with per-device IDs and deduplication', async () => {
    const h = harness(); await h.service.enqueueCampaignNotifications(h.client, 9, 13, 7, 'active');
    assert.strictEqual(h.calls.length, 2);
    for (const call of h.calls) assert.match(call.sql, /ON CONFLICT \(payment_id, channel, target_id\) DO NOTHING/);
    assert.match(h.calls[1].sql, /FROM push_tokens WHERE user_id = \$3/);
    assert.deepStrictEqual(Array.from(h.calls[0].params), [9, 13, 7, 'active']);
  });
  await check('Idle queue locks with SKIP LOCKED and does not call provider', async () => {
    const h = harness({ empty: true }); assert.strictEqual(await h.invoke(), null);
    assert.match(h.calls[0].sql, /FOR UPDATE SKIP LOCKED/); assert.ok(!h.trace.includes('DELIVER'));
  });
  for (const status of ['sent', 'skipped']) await check(`Explicit channel outcome ${status}`, async () => {
    const h = harness({ result: { status } }); assert.strictEqual((await h.invoke()).status, status);
    assert.ok(h.trace.includes('COMMIT')); assert.strictEqual(h.calls.at(-1).params[1], status);
  });
  for (const result of [undefined, { simulated: true }, { status: 'retry' }]) await check('Unconfirmed delivery is deferred, never marked sent', async () => {
    const h = harness({ result: result ?? null }); assert.strictEqual((await h.invoke()).status, 'pending');
    assert.strictEqual(h.calls.at(-1).params[3], 60);
  });
  await check('Fifth provider failure is dead and stores no provider detail', async () => {
    const h = harness({ attempts: 4, failDelivery: true }); assert.strictEqual((await h.invoke()).status, 'dead');
    assert.ok(!JSON.stringify(h.calls).includes('private provider details'));
  });
  for (const campaignChange of [{ status: 'paused' }, { payment_status: 'refunded' }, { not_expired: false }, { user_id: 8 }, { payment_user_id: 8 }, { metadata: {} }]) {
    await check(`State change cancels before delivery: ${JSON.stringify(campaignChange)}`, async () => {
      const h = harness({ campaignChange }); assert.strictEqual((await h.invoke()).status, 'cancelled');
      assert.ok(!h.trace.includes('DELIVER'));
    });
  }
  await check('In-app SQL failure propagates and rolls back', async () => {
    const h = harness({ channel: 'in_app', failDelivery: true });
    await assert.rejects(h.invoke()); assert.ok(h.trace.includes('ROLLBACK'));
  });
  await check('Acknowledgement DB failure rolls back, not false success', async () => {
    const h = harness({ failAck: true }); await assert.rejects(h.invoke()); assert.ok(h.trace.includes('ROLLBACK'));
  });
  const campaign = { id: 13, status: 'active', title: 'Synthetic', email: 'synthetic@example.invalid', telephone: '+000', type: 'popup' };
  for (const [channel, response, expected] of [
    ['email', { accepted: ['synthetic@example.invalid'] }, 'sent'], ['email', { simulated: true }, 'retry'],
    ['email', { accepted: [] }, 'retry'], ['sms', { sid: 'SM_test', status: 'queued' }, 'sent'],
    ['sms', { sid: 'SM_test', status: 'failed' }, 'retry'], ['sms', { skipped: true }, 'retry'],
    ['push', { status: 'sent' }, 'sent'], ['push', { status: 'retry' }, 'retry'],
  ]) await check(`Strict ${channel} adapter returns ${expected}`, async () => {
    const service = loadCampaigns(async () => response);
    const value = await service.deliverCampaignNotification({ channel, target_id: 1, user_id: 7 }, campaign, { query: async () => ({ rows: [{ token: 'synthetic' }] }) });
    assert.strictEqual(value.status, expected);
  });
  for (const channel of ['email', 'sms', 'push']) await check(`Missing ${channel} recipient is explicitly skipped`, async () => {
    const service = loadCampaigns(async () => { throw new Error('Must not send'); });
    const value = await service.deliverCampaignNotification({ channel, target_id: 1, user_id: 7 }, { ...campaign, email: null, telephone: null }, { query: async () => ({ rows: [] }) });
    assert.strictEqual(value.status, 'skipped');
  });
  await check('In-app adapter uses the delivery transaction, not global notification service', async () => {
    let writes = 0;
    const service = loadCampaigns(async () => { throw new Error('Must not use external adapter'); });
    await service.deliverCampaignNotification({ channel: 'in_app', user_id: 7 }, campaign, { async query(sql) { assert.match(sql, /INSERT INTO notifications/); writes++; } });
    assert.strictEqual(writes, 1);
  });
  for (const [response, expected] of [
    [{ ok: false }, 'retry'], [{ ok: true, data: [{ status: 'ok', id: 'ticket' }] }, 'sent'],
    [{ ok: true, data: [{ status: 'ok' }] }, 'retry'], [{ ok: true, data: [] }, 'retry'],
    [{ ok: true, data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }] }, 'skipped'],
  ]) await check(`Expo response mapped to ${expected}`, async () => {
    const service = load('services/campaignPushDelivery.js', {}, { AbortSignal, fetch: async (url, options) => {
      assert.strictEqual(url, 'https://exp.host/--/api/v2/push/send'); assert.strictEqual(options.redirect, 'error');
      assert.ok(options.signal); return { ok: response.ok, json: async () => ({ data: response.data }) };
    } });
    assert.strictEqual((await service.sendCampaignPush('synthetic', { title: 'Test' })).status, expected);
  });
  await check('Worker limits batches and prevents local overlapping ticks', async () => {
    let tick, calls = 0, release;
    const pending = new Promise(resolve => { release = resolve; });
    const stop = () => {};
    const job = load('jobs/campaignNotificationOutbox.js', {
      'node-cron': { schedule(expression, callback) { assert.strictEqual(expression, '* * * * *'); tick = callback; return { stop }; } },
      '../services/campaignNotificationOutboxService': { async deliverNextCampaignNotification() { calls++; if (calls === 1) await pending; return { status: 'sent' }; } },
      '../services/campaignsService': { deliverCampaignNotification() {} }, '../utils/logger': { logger: { info() {}, error() {} } },
    });
    assert.strictEqual(job.startCampaignNotificationOutboxJob().stop, stop);
    const first = tick(); await tick(); assert.strictEqual(calls, 1); release(); await first; assert.strictEqual(calls, 5);
  });
  console.log(`Campaign notification outbox: ${total} checks passed`);
}
module.exports = run().catch(error => { console.error(error); process.exitCode = 1; });
