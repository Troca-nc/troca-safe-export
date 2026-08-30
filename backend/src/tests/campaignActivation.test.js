'use strict';
const assert = require('assert');
const { loadCampaigns, payment } = require('./campaignTransactionHarness');

function harness({ failOn = '', count = 0, paymentChange = {}, campaignChange = {}, zeroOn = '' } = {}) {
  let now = Date.parse('2026-08-30T00:00:00Z');
  const stored = { ...payment, ...paymentChange };
  const campaign = { id: 13, user_id: 7, type: 'popup', title: 'Synthetic', status: 'pending', duration_days: 3,
    email: 'synthetic@example.invalid', telephone: '+000', metadata: {}, ...campaignChange };
  const trace = [];
  const db = { async query(sql, values) {
    sql = sql.replace(/\s+/g, ' ').trim(); trace.push(sql);
    if (failOn && sql.includes(failOn)) throw new Error('injected SQL error');
    if (zeroOn && sql.includes(zeroOn)) return { rows: [], rowCount: 0 };
    if (sql.includes('FROM payments')) return { rows: [stored] };
    if (sql.startsWith('UPDATE payments')) stored.status = 'succeeded';
    if (sql.includes('SELECT COUNT')) return { rows: [{ count }] };
    if (sql.includes('SELECT MAX')) return { rows: [{ next_start: '2026-09-10T00:00:00Z' }] };
    if (sql.startsWith('UPDATE campaigns SET status')) {
      campaign.status = values[1]; campaign.starts_at = values[2]; campaign.ends_at = values[3];
    }
    if (sql.includes('SET metadata')) campaign.metadata = JSON.parse(values[1]);
    return { rows: [campaign], rowCount: 1 };
  } };
  const service = loadCampaigns(async channel => { trace.push(channel); }, () => now);
  return { trace, campaign, service, db, advance: () => { now += 86400000; },
    invoke: () => service.activateCampaignFromPayment(db, payment, payment.metadata, 'cs_synthetic', 'stripe') };
}
async function run() {
  let total = 0;
  async function check(label, fn) { await fn(); total++; console.log(`  ✓ ${label}`); }
  await check('Payment and campaign are locked; metadata records succeeded', async () => {
    const h = harness(); await h.invoke();
    assert.match(h.trace[0], /provider = \$2.*FOR UPDATE/);
    assert.match(h.trace[1], /campaigns.*FOR UPDATE/);
    assert.strictEqual(h.campaign.metadata.payment_status, 'succeeded');
  });
  await check('Same payment preserves dates and does not resend notifications', async () => {
    const h = harness(); await h.invoke(); const end = h.campaign.ends_at;
    h.advance(); assert.strictEqual((await h.invoke()).duplicate, true);
    assert.strictEqual(h.campaign.ends_at, end);
    assert.strictEqual(h.trace.filter(x => x === 'email').length, 0);
    assert.strictEqual(h.trace.filter(x => x.startsWith('INSERT INTO campaign_notification_outbox')).length, 2);
  });
  await check('Queued end is computed from estimated start, including scheduler path', async () => {
    const h = harness({ count: 1 });
    const activation = await h.service.activateCampaignIfSlotAvailable(h.db, h.campaign, { fromQueue: true });
    assert.strictEqual(activation.starts_at, '2026-09-10T00:00:00.000Z');
    assert.strictEqual(activation.ends_at, '2026-09-13T00:00:00.000Z');
    assert.strictEqual(activation.fromQueue, true);
    assert.strictEqual(h.trace.filter(x => x === 'email').length, 1, 'Legacy scheduler notifications remain enabled');
  });
  for (const status of ['refunded', 'failed']) await check(`Reject payment ${status}`, async () => {
    await assert.rejects(harness({ paymentChange: { status } }).invoke(), /validation failed/);
  });
  for (const status of ['active', 'queued', 'paused', 'expired', 'cancelled']) await check(`No new activation of ${status} campaign`, async () => {
    await assert.rejects(harness({ campaignChange: { status } }).invoke(), /transition not allowed/);
  });
  await check('Wrong owner rejected', async () => {
    await assert.rejects(harness({ campaignChange: { user_id: 8 } }).invoke(), /owner mismatch/);
  });
  await check('Changed payment amount rejected under lock', async () => {
    await assert.rejects(harness({ paymentChange: { amount_xpf: 1 } }).invoke(), /validation failed/);
  });
  for (const failOn of ['UPDATE payments', 'UPDATE campaigns SET status', 'SET metadata', 'INSERT INTO campaign_notification_outbox']) await check(`SQL failure propagates: ${failOn}`, async () => {
    await assert.rejects(harness({ failOn }).invoke(), /injected SQL error/);
  });
  for (const zeroOn of ['UPDATE payments', 'SET metadata']) await check(`Missing update rejected: ${zeroOn}`, async () => {
    await assert.rejects(harness({ zeroOn }).invoke(), /update failed/);
  });
  await check('Pool fallback rejected', async () => {
    await assert.rejects(harness().service.activateCampaignFromPayment(() => {}, payment, payment.metadata, 'cs_synthetic', 'stripe'), /transaction client required/);
  });
  console.log(`Campaign activation: ${total} checks passed`);
}
module.exports = run().catch(error => { console.error(error); process.exitCode = 1; });
