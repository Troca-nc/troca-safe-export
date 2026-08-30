'use strict';
const assert = require('assert');
const { loadCampaigns } = require('./campaignTransactionHarness');
const { loadDatabase } = require('./paymentTransactionHarness');

function fixture({ paid = false, demo = false, type = 'popup', failPaymentRead = false } = {}) {
  const campaign = { id: 13, user_id: 7, type, status: 'queued', duration_days: 3,
    metadata: { payment_status: 'succeeded', payment_provider: 'stripe', payment_ref: 'cs_synthetic' },
    ends_at: '2026-09-03T00:00:00Z' };
  const trace = [];
  let notifications = 0;
  const client = { release() { trace.push('RELEASE'); }, async query(sql, values) {
    sql = sql.replace(/\s+/g, ' ').trim(); trace.push(sql);
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql) || sql.includes('pg_advisory_xact_lock')) return { rows: [] };
    if (sql.startsWith("UPDATE campaigns SET status = 'expired'")) return { rows: [], rowCount: 0 };
    if (sql.startsWith('SELECT * FROM campaigns')) return { rows: [campaign] };
    if (sql.startsWith('SELECT COUNT')) return { rows: [{ count: 0 }] };
    if (sql.startsWith('SELECT id FROM payments')) {
      assert.ok(sql.includes("type = 'campaign' AND status = 'succeeded'"));
      assert.ok(sql.includes("metadata->>'campaign_id' = $4"));
      assert.deepStrictEqual(Array.from(values), [7, 'stripe', 'cs_synthetic', '13']);
      if (failPaymentRead) throw new Error('Synthetic payment read failure');
      return { rows: paid ? [{ id: 9 }] : [] };
    }
    if (sql.startsWith('UPDATE campaigns SET status')) {
      campaign.status = values[1]; campaign.starts_at = values[2]; campaign.ends_at = values[3];
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith('SELECT c.*')) return { rows: [{ ...campaign, email: 'test@example.invalid' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const database = loadDatabase({ on() {}, async connect() { return client; }, query() { throw new Error('Escaped transaction'); } });
  const service = loadCampaigns(async () => { notifications++; }, () => Date.parse('2026-08-30T00:00:00Z'), database, demo ? { DEMO_MODE: 'true' } : {});
  return { campaign, trace, service, notifications: () => notifications };
}

async function run() {
  let total = 0;
  async function check(label, fn) { await fn(); total++; console.log(`  ✓ queue payment: ${label}`); }
  for (const type of ['popup', 'banner', 'bon_plan']) {
    await check(`${type}: metadata success alone cannot activate`, async () => {
      const f = fixture({ type }); const before = JSON.stringify(f.campaign);
      const result = await f.service.expireCampaignsAndActivateQueued();
      assert.strictEqual(result.activatedCount, 0); assert.strictEqual(JSON.stringify(f.campaign), before);
      assert.strictEqual(f.notifications(), 0); assert.ok(f.trace.includes('COMMIT'));
    });
    await check(`${type}: confirmed payment activates`, async () => {
      const f = fixture({ type, paid: true });
      const result = await f.service.expireCampaignsAndActivateQueued();
      assert.strictEqual(result.activatedCount, 1); assert.strictEqual(f.campaign.status, 'active');
      const paymentIndex = f.trace.findIndex(sql => sql.startsWith('SELECT id FROM payments'));
      assert.ok(paymentIndex < f.trace.findIndex(sql => sql.startsWith('UPDATE campaigns SET status = $2')));
    });
  }
  for (const fromQueue of [false, true]) {
    await check(`standalone activation rejects unconfirmed payment (fromQueue=${fromQueue})`, async () => {
      const f = fixture(); f.campaign.status = fromQueue ? 'queued' : 'pending';
      const before = JSON.stringify(f.campaign);
      await assert.rejects(f.service.activateCampaignIfSlotAvailable(undefined, { id: 13 }, { fromQueue }), e => e.status === 409);
      assert.strictEqual(JSON.stringify(f.campaign), before);
      assert.ok(f.trace.includes('ROLLBACK')); assert.strictEqual(f.notifications(), 0);
    });
  }
  await check('demo mode preserves unpaid queue activation', async () => {
    const f = fixture({ demo: true });
    assert.strictEqual((await f.service.expireCampaignsAndActivateQueued()).activatedCount, 1);
    assert.ok(!f.trace.some(sql => sql.startsWith('SELECT id FROM payments')));
  });
  await check('payment read error rolls back instead of treating campaign as paid', async () => {
    const f = fixture({ failPaymentRead: true });
    await assert.rejects(f.service.expireCampaignsAndActivateQueued(), /Synthetic/);
    assert.ok(f.trace.includes('ROLLBACK')); assert.ok(!f.trace.includes('COMMIT'));
    assert.strictEqual(f.notifications(), 0);
  });
  console.log(`Campaign queue payment: ${total} checks passed`);
}
module.exports = run().catch(e => { console.error(e); process.exitCode = 1; });
