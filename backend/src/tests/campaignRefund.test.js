'use strict';
const assert = require('assert');
const { loadDatabase } = require('./paymentTransactionHarness');
const { loadCampaigns, loadCampaignWebhook, campaignRefundEvent, payment } = require('./campaignTransactionHarness');

function fixture({ failOn = '', zeroOn = '', candidates = 1, provider = 'stripe' } = {}) {
  const state = { payment: { ...payment, provider: 'stripe', provider_ref: 'cs_synthetic', status: 'succeeded',
    metadata: { ...payment.metadata, stripe_payment_intent_id: 'pi_synthetic' } },
    campaign: { id: 13, user_id: 7, status: 'active', starts_at: '2026-08-30', ends_at: '2026-09-03',
      metadata: { payment_provider: 'stripe', payment_ref: 'cs_synthetic' } }, receipts: {}, outbox: 'pending' };
  const trace = []; let snapshot;
  const query = async (raw, values = []) => {
    const sql = raw.replace(/\s+/g, ' ').trim(); trace.push(sql);
    if (failOn && sql.includes(failOn)) throw new Error('Synthetic SQL failure');
    if (zeroOn && sql.includes(zeroOn)) return { rows: [], rowCount: 0 };
    if (sql === 'BEGIN') { snapshot = JSON.parse(JSON.stringify(state)); return { rows: [] }; }
    if (sql === 'ROLLBACK') { Object.assign(state, snapshot); return { rows: [] }; }
    if (sql === 'COMMIT' || sql.includes('pg_advisory_xact_lock')) return { rows: [] };
    if (sql.startsWith('SELECT provider FROM webhook_events')) return { rows: state.receipts[values[0]] ? [{ provider: state.receipts[values[0]] }] : [] };
    if (sql.startsWith('INSERT INTO webhook_events')) {
      if (state.receipts[values[0]]) return { rows: [] };
      state.receipts[values[0]] = provider; return { rows: [{ id: 1 }] };
    }
    if (sql.startsWith('SELECT id, type FROM payments')) return { rows: Array.from({ length: candidates }, () => ({ id: 9, type: 'campaign' })) };
    if (sql.startsWith('SELECT * FROM payments')) return { rows: [state.payment] };
    if (sql.startsWith('SELECT * FROM campaigns')) return { rows: [state.campaign] };
    if (sql.startsWith('UPDATE payments')) {
      state.payment.status = values[1]; Object.assign(state.payment.metadata, JSON.parse(values[2])); return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith('UPDATE campaigns')) {
      state.campaign.status = 'expired'; state.campaign.ends_at = 'stopped'; state.campaign.paused_at = null;
      Object.assign(state.campaign.metadata, JSON.parse(values[1])); return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith('UPDATE campaign_notification_outbox')) { state.outbox = 'cancelled'; return { rows: [], rowCount: 1 }; }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  const database = loadDatabase({ on() {}, query, async connect() { return { query, release() { trace.push('RELEASE'); } }; } });
  const webhook = loadCampaignWebhook(loadCampaigns(() => { throw new Error('Unexpected delivery'); }));
  return { state, trace, run: (event = campaignRefundEvent()) => webhook.processStripeWebhookEvent({ event, ...database }) };
}
async function run() {
  let total = 0;
  async function check(label, fn) { await fn(); total++; console.log(`  ✓ campaign refund: ${label}`); }
  await check('partial refund leaves campaign and dates untouched', async () => {
    const f = fixture(); const before = JSON.stringify(f.state.campaign);
    await f.run(campaignRefundEvent({ amount_refunded: 100, refunded: false }));
    assert.strictEqual(JSON.stringify(f.state.campaign), before); assert.strictEqual(f.state.payment.status, 'succeeded');
    assert.strictEqual(f.state.payment.metadata.stripe_refund_amount_eur_cents, 100); assert.strictEqual(f.state.outbox, 'pending');
  });
  await check('total refund stops campaign and cancels pending activation notifications atomically', async () => {
    const f = fixture(); await f.run();
    assert.strictEqual(f.state.payment.status, 'refunded'); assert.strictEqual(f.state.campaign.status, 'expired');
    assert.strictEqual(f.state.campaign.metadata.stop_reason, 'stripe_full_refund'); assert.strictEqual(f.state.outbox, 'cancelled');
    assert.ok(f.trace.indexOf('COMMIT') > f.trace.findIndex(sql => sql.startsWith('UPDATE campaign_notification_outbox')));
    assert.ok(f.trace.findIndex(sql => sql.includes('FOR UPDATE') && sql.includes('payments')) < f.trace.findIndex(sql => sql.includes('pg_advisory')));
  });
  await check('same event returns duplicate without writes', async () => {
    const f = fixture(); await f.run(); const before = JSON.stringify(f.state); const count = f.trace.length;
    assert.strictEqual((await f.run()).duplicate, true); assert.strictEqual(JSON.stringify(f.state), before);
    assert.ok(!f.trace.slice(count).some(sql => sql.startsWith('UPDATE')));
  });
  await check('late partial after full cannot reactivate or reduce cumulative amount', async () => {
    const f = fixture(); await f.run(); const before = JSON.stringify(f.state.payment);
    await f.run(campaignRefundEvent({ amount_refunded: 100, refunded: false }, 'evt_old'));
    assert.strictEqual(JSON.stringify(f.state.payment), before); assert.strictEqual(f.state.campaign.status, 'expired');
  });
  for (const changes of [{ currency: 'usd' }, { amount: 1 }, { amount_refunded: -1 }, { amount_refunded: 0 },
    { amount_refunded: 999999 }, { amount_refunded: 1.5 }, { refunded: false }, { captured: false }, { paid: false },
    { amount_captured: 1 }, { payment_intent: 'pi_other' }, { id: 'wrong' }]) {
    await check('invalid charge rolls back receipt and all effects', async () => {
      const f = fixture(); const before = JSON.stringify(f.state);
      await assert.rejects(f.run(campaignRefundEvent(changes)), /validation failed/);
      assert.strictEqual(JSON.stringify(f.state), before); assert.ok(f.trace.includes('ROLLBACK'));
    });
  }
  for (const failOn of ['INSERT INTO webhook_events', 'UPDATE payments', 'UPDATE campaigns', 'UPDATE campaign_notification_outbox']) {
    await check(`SQL failure at ${failOn} rolls back everything`, async () => {
      const f = fixture({ failOn }); const before = JSON.stringify(f.state);
      await assert.rejects(f.run(), /Synthetic/); assert.strictEqual(JSON.stringify(f.state), before);
    });
  }
  for (const zeroOn of ['UPDATE payments', 'UPDATE campaigns']) {
    await check(`missing update at ${zeroOn} rejects acknowledgement`, async () => {
      const f = fixture({ zeroOn }); const before = JSON.stringify(f.state);
      await assert.rejects(f.run(), /failed/); assert.strictEqual(JSON.stringify(f.state), before);
    });
  }
  for (const candidates of [0, 2]) {
    await check('unresolved or ambiguous reference gets no receipt', async () => {
      const f = fixture({ candidates }); await assert.rejects(f.run(), /unresolved or ambiguous/);
      assert.deepStrictEqual(f.state.receipts, {}); assert.ok(!f.trace.includes('BEGIN'));
    });
  }
  await check('owner mismatch cannot stop another campaign', async () => {
    const f = fixture(); f.state.campaign.user_id = 8;
    await assert.rejects(f.run(), /target mismatch/); assert.deepStrictEqual(f.state.receipts, {});
  });
  await check('foreign historical receipt is not accepted', async () => {
    const f = fixture(); f.state.receipts.evt_refund = 'payplug';
    await assert.rejects(f.run(), /provider conflict/); assert.ok(!f.trace.includes('BEGIN'));
  });
  await check('expanded PaymentIntent ID is accepted', async () => {
    const f = fixture(); await f.run(campaignRefundEvent({ payment_intent: { id: 'pi_synthetic' } }));
    assert.strictEqual(f.state.campaign.status, 'expired');
  });
  for (const change of [{ status: 'pending' }, { amount_xpf: 0 }, { metadata: { ...payment.metadata, stripe_payment_intent_id: 'pi_synthetic', stripe_refund_amount_eur_cents: '100' } }]) {
    await check('invalid stored payment or refund history is rejected', async () => {
      const f = fixture(); Object.assign(f.state.payment, change); const before = JSON.stringify(f.state);
      await assert.rejects(f.run(), /validation failed|history conflict/);
      assert.strictEqual(JSON.stringify(f.state), before);
    });
  }
  await check('another charge cannot replace the refund history', async () => {
    const f = fixture(); await f.run(campaignRefundEvent({ amount_refunded: 100, refunded: false }));
    const before = JSON.stringify(f.state);
    await assert.rejects(f.run(campaignRefundEvent({ id: 'ch_other' }, 'evt_other_charge')), /history conflict/);
    assert.strictEqual(JSON.stringify(f.state), before);
  });
  console.log(`Campaign refund: ${total} checks passed`);
}
module.exports = run().catch(e => { console.error(e); process.exitCode = 1; });
