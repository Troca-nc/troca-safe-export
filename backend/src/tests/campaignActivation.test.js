'use strict';
const assert = require('assert');
const { loadCampaigns, payment, campaignEvent, loadCampaignWebhook } = require('./campaignTransactionHarness');
const { loadDatabase } = require('./paymentTransactionHarness');

function harness({ failOn = '', count = 0, paymentChange = {}, campaignChange = {}, zeroOn = '', duplicate = false, receiptProvider = 'stripe' } = {}) {
  let now = Date.parse('2026-08-30T00:00:00Z');
  const stored = { ...payment, metadata: { ...payment.metadata }, ...paymentChange };
  const campaign = { id: 13, user_id: 7, type: 'popup', title: 'Synthetic', status: 'pending', duration_days: 3,
    email: 'synthetic@example.invalid', telephone: '+000', metadata: {}, ...campaignChange };
  const trace = [];
  const db = { async query(sql, values) {
    sql = sql.replace(/\s+/g, ' ').trim(); trace.push(sql);
    if (failOn && sql.includes(failOn)) throw new Error('injected SQL error');
    if (zeroOn && sql.includes(zeroOn)) return { rows: [], rowCount: 0 };
    if (sql.startsWith('INSERT INTO webhook_events')) return { rows: duplicate ? [] : [{ id: 1 }] };
    if (sql.includes('FROM webhook_events')) return { rows: [{ provider: receiptProvider }] };
    if (sql.includes('AS linked_payment_id')) return { rows: [] };
    if (sql.includes("jsonb_build_object('stripe_payment_intent_id'")) {
      stored.metadata = { ...stored.metadata, stripe_payment_intent_id: values[1] };
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith('SELECT id FROM payments')) return { rows: stored.status === 'succeeded'
      && values[0] === stored.user_id && values[1] === 'stripe' && values[2] === 'cs_synthetic'
      && values[3] === stored.metadata.campaign_id ? [{ id: stored.id }] : [] };
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
  const database = loadDatabase({ on() {}, query() { throw new Error('Global query outside transaction'); },
    async connect() { trace.push('CONNECT'); return { ...db, release() { trace.push('RELEASE'); } }; } });
  const webhook = loadCampaignWebhook(service);
  return { trace, campaign, stored, service, db, advance: () => { now += 86400000; },
    dispatch: (event = campaignEvent()) => webhook.processStripeWebhookEvent({ event, ...database }),
    invoke: () => service.activateCampaignFromPayment(db, payment, payment.metadata, 'cs_synthetic', 'stripe') };
}
async function run() {
  let total = 0;
  async function check(label, fn) { await fn(); total++; console.log(`  ✓ ${label}`); }
  await check('Payment and campaign are locked; metadata records succeeded', async () => {
    const h = harness(); await h.invoke();
    assert.match(h.trace[0], /provider = \$2.*FOR UPDATE/);
    assert.match(h.trace[1], /pg_advisory_xact_lock/);
    assert.match(h.trace[2], /campaigns.*FOR UPDATE/);
    assert.strictEqual(h.campaign.metadata.payment_status, 'succeeded');
  });
  await check('Same payment preserves dates and does not resend notifications', async () => {
    const h = harness(); await h.invoke(); const end = h.campaign.ends_at;
    h.advance(); assert.strictEqual((await h.invoke()).duplicate, true);
    assert.strictEqual(h.campaign.ends_at, end);
    assert.strictEqual(h.trace.filter(x => x === 'email').length, 0);
    assert.strictEqual(h.trace.filter(x => x.startsWith('INSERT INTO campaign_notification_outbox')).length, 2);
  });
  await check('Capacity lock failure prevents activation writes', async () => {
    const h = harness({ failOn: 'pg_advisory_xact_lock' });
    await assert.rejects(h.invoke(), /injected SQL error/);
    assert.ok(!h.trace.some(sql => sql.startsWith('UPDATE')));
  });
  await check('Borrowed transaction cannot send legacy notifications before commit', async () => {
    const h = harness();
    await assert.rejects(h.service.activateCampaignIfSlotAvailable(h.db, h.campaign), /owned transaction/);
    assert.strictEqual(h.trace.length, 0);
  });
  await check('Scheduler rejects borrowed transaction before doing work', async () => {
    const h = harness();
    await assert.rejects(h.service.expireCampaignsAndActivateQueued(h.db), /owned transaction/);
    assert.strictEqual(h.trace.length, 0);
  });
  await check('Stale activation rereads paused campaign and preserves dates', async () => {
    const h = harness({ campaignChange: { status: 'paused' } });
    const result = await h.service.activateCampaignIfSlotAvailable(h.db, { id: 13, status: 'pending' }, { notifyOwner: false });
    assert.strictEqual(result.duplicate, true);
    assert.strictEqual(h.campaign.status, 'paused');
    assert.ok(!h.trace.some(sql => sql.startsWith('UPDATE')));
  });
  await check('Queued end is computed from estimated start, including scheduler path', async () => {
    const h = harness({ count: 1, paymentChange: { status: 'succeeded' }, campaignChange: {
      status: 'queued', metadata: { payment_provider: 'stripe', payment_ref: 'cs_synthetic' },
    } });
    const activation = await h.service.activateCampaignIfSlotAvailable(h.db, h.campaign, { fromQueue: true, notifyOwner: false });
    assert.strictEqual(activation.starts_at, '2026-09-10T00:00:00.000Z');
    assert.strictEqual(activation.ends_at, '2026-09-13T00:00:00.000Z');
    assert.strictEqual(activation.fromQueue, true);
    assert.strictEqual(h.trace.filter(x => x === 'email').length, 0, 'No notification before caller commit');
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
  await check('Receipt, campaign and queue share one transaction with no external send', async () => {
    const h = harness(); await h.dispatch();
    for (const marker of ['CONNECT', 'BEGIN', 'COMMIT', 'RELEASE']) assert.strictEqual(h.trace.filter(x => x === marker).length, 1);
    assert.ok(h.trace.findIndex(x => x.startsWith('INSERT INTO webhook_events')) < h.trace.findIndex(x => x.includes('FROM payments')));
    assert.ok(h.trace.findIndex(x => x.startsWith('INSERT INTO campaign_notification_outbox')) < h.trace.indexOf('COMMIT'));
    assert.ok(!h.trace.some(x => ['email', 'sms', 'push', 'notification'].includes(x)));
  });
  for (const failOn of ['INSERT INTO webhook_events', 'UPDATE payments', 'SET metadata', 'INSERT INTO campaign_notification_outbox', 'COMMIT']) {
    await check(`Atomic campaign failure rolls back: ${failOn}`, async () => {
      const h = harness({ failOn }); await assert.rejects(h.dispatch(), /injected SQL error/);
      assert.ok(h.trace.includes('ROLLBACK'));
    });
  }
  await check('Historical receipt skips all business queries', async () => {
    const h = harness({ duplicate: true }); assert.strictEqual((await h.dispatch()).duplicate, true);
    assert.ok(!h.trace.some(x => x.includes('FROM payments')));
  });
  await check('Other provider receipt fails closed', async () => {
    const h = harness({ duplicate: true, receiptProvider: 'payplug' });
    await assert.rejects(h.dispatch(), /provider conflict/); assert.ok(h.trace.includes('ROLLBACK'));
  });
  for (const change of [{ amount_total: 1 }, { payment_status: 'unpaid' }, { currency: 'usd' },
    { metadata: { ...payment.metadata, campaign_id: '99' } }, { metadata: { ...payment.metadata, user_id: '8' } }]) {
    await check('Invalid Checkout rolls back receipt', async () => {
      const h = harness(); await assert.rejects(h.dispatch(campaignEvent(change)), /validation failed/);
      assert.ok(h.trace.includes('ROLLBACK') && !h.trace.includes('COMMIT'));
    });
  }
  for (const intent of ['pi_synthetic', { id: 'pi_synthetic', object: 'payment_intent' }]) {
    await check('Verified Checkout stores only its PaymentIntent ID and preserves metadata', async () => {
      const h = harness();
      await h.dispatch(campaignEvent({ payment_intent: intent, metadata: { ...payment.metadata, stripe_payment_intent_id: 'pi_untrusted' } }));
      assert.strictEqual(h.stored.metadata.stripe_payment_intent_id, 'pi_synthetic');
      assert.strictEqual(h.stored.metadata.campaign_id, '13');
      assert.ok(h.trace.indexOf('COMMIT') > h.trace.findIndex(sql => sql.includes("jsonb_build_object('stripe_payment_intent_id'")));
    });
  }
  for (const intent of [null, undefined, '', 'cs_wrong', {}, 123, 'pi_' + 'a'.repeat(256)]) {
    await check('Invalid or missing PaymentIntent rolls back Checkout receipt', async () => {
      const h = harness();
      await assert.rejects(h.dispatch(campaignEvent({ payment_intent: intent })), /identity invalid/);
      assert.ok(h.trace.includes('ROLLBACK')); assert.ok(!h.trace.includes('COMMIT'));
      assert.ok(!h.trace.some(sql => sql.startsWith('UPDATE')));
    });
  }
  await check('Existing different PaymentIntent is never overwritten', async () => {
    const h = harness({ paymentChange: { metadata: { ...payment.metadata, stripe_payment_intent_id: 'pi_other' } } });
    await assert.rejects(h.dispatch(), /identity conflict/);
    assert.strictEqual(h.stored.metadata.stripe_payment_intent_id, 'pi_other');
    assert.ok(h.trace.includes('ROLLBACK'));
  });
  await check('Missing identity update row rolls back instead of acknowledging', async () => {
    const h = harness({ zeroOn: "jsonb_build_object('stripe_payment_intent_id'" });
    await assert.rejects(h.dispatch(), /identity update failed/); assert.ok(h.trace.includes('ROLLBACK'));
  });
  await check('Identity write error rolls back instead of activating', async () => {
    const h = harness({ failOn: "jsonb_build_object('stripe_payment_intent_id'" });
    await assert.rejects(h.dispatch(), /injected SQL error/); assert.ok(h.trace.includes('ROLLBACK'));
    assert.ok(!h.trace.some(sql => sql.startsWith('UPDATE campaigns')));
  });
  await check('Matching association does not rewrite identity on a new event', async () => {
    const h = harness(); await h.dispatch();
    const next = campaignEvent(); next.id = 'evt_second'; await h.dispatch(next);
    assert.strictEqual(h.trace.filter(sql => sql.includes("jsonb_build_object('stripe_payment_intent_id'")).length, 1);
  });
  console.log(`Campaign activation: ${total} checks passed`);
}
module.exports = run().catch(error => { console.error(error); process.exitCode = 1; });
