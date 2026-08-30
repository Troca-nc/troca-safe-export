'use strict';
const assert = require('assert');
const { loadCampaigns } = require('./campaignTransactionHarness');
const { loadDatabase } = require('./paymentTransactionHarness');

async function run() {
  let total = 0;
  function fixture(status = 'paused', options = {}) {
    const row = { id: 13, user_id: 7, type: 'popup', status, is_default_popup: false,
      paused_at: '2026-08-29T00:00:00.000Z', ends_at: '2026-09-01T00:00:00.000Z',
      metadata: { payment_provider: 'stripe', payment_ref: 'cs_synthetic' } };
    const calls = [];
    const client = { release() { calls.push('RELEASE'); }, async query(sql, values) {
      sql = sql.replace(/\s+/g, ' ').trim(); calls.push(sql);
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
      if (sql.startsWith('SELECT * FROM campaigns')) {
        assert.ok(sql.endsWith('FOR UPDATE')); return { rows: options.missing ? [] : [row] };
      }
      if (sql.startsWith('SELECT id FROM payments')) {
        assert.ok(sql.includes("type = 'campaign' AND status = 'succeeded'"));
        assert.ok(sql.includes("metadata->>'campaign_id' = $4"));
        assert.deepStrictEqual(Array.from(values), [7, 'stripe', 'cs_synthetic', '13']);
        return { rows: options.unpaid ? [] : [{ id: 9 }] };
      }
      if (sql.startsWith('SELECT COUNT')) return { rows: [{ count: options.full ? 1 : 0 }] };
      if (sql.startsWith('UPDATE campaigns')) {
        if (options.failUpdate) throw new Error('Synthetic update failure');
        if (sql.includes("SET status = 'paused'")) { row.status = 'paused'; row.paused_at = '2026-08-30T00:00:00.000Z'; }
        else { row.status = values[1]; row.ends_at = values[2]; row.paused_at = null; }
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
    const database = loadDatabase({ on() {}, async connect() { return client; }, query() { throw new Error('Pool escaped transaction'); } });
    const service = loadCampaigns(() => { throw new Error('Unexpected notification'); },
      () => Date.parse('2026-08-30T00:00:00Z'), database, options.demo ? { DEMO_MODE: 'true' } : {});
    return { row, calls, service, database, client };
  }
  async function check(label, fn) { await fn(); total++; console.log(`  ✓ campaign state: ${label}`); }
  for (const status of ['pending', 'expired', 'cancelled', 'rejected']) {
    for (const method of ['pauseCampaign', 'resumeCampaign']) {
      await check(`${method} rejects ${status}`, async () => {
        const f = fixture(status);
        await assert.rejects(f.service[method](f.database.query, { campaignId: 13, userId: 7 }), e => e.status === 409);
        assert.ok(f.calls.includes('ROLLBACK')); assert.strictEqual(f.row.status, status);
        assert.ok(!f.calls.some(sql => sql.startsWith('UPDATE')));
      });
    }
  }
  for (const method of ['pauseCampaign', 'resumeCampaign']) {
    await check(`${method} verifies owner before idempotence`, async () => {
      const f = fixture(method === 'pauseCampaign' ? 'paused' : 'active');
      await assert.rejects(f.service[method](undefined, { campaignId: 13, userId: 8 }), e => e.status === 403);
    });
    await check(`${method} rejects default popup even for admin`, async () => {
      const f = fixture(); f.row.is_default_popup = true;
      await assert.rejects(f.service[method](undefined, { campaignId: 13, userId: 7, isAdmin: true }), e => e.status === 400);
    });
    await check(`${method} missing campaign`, async () => {
      const f = fixture('paused', { missing: true });
      await assert.rejects(f.service[method](undefined, { campaignId: 13, userId: 7 }), e => e.status === 404);
    });
  }
  for (const isAdmin of [false, true]) {
    await check(`unpaid paused campaign rejected (admin=${isAdmin})`, async () => {
      const f = fixture('paused', { unpaid: true });
      await assert.rejects(f.service.resumeCampaign(undefined, { campaignId: 13, userId: 7, isAdmin }), e => e.status === 409);
      assert.ok(!f.calls.some(sql => sql.startsWith('UPDATE')));
    });
  }
  for (const full of [false, true]) {
    await check(`paid resume and repeat preserve dates (full=${full})`, async () => {
      const f = fixture('paused', { full });
      await f.service.resumeCampaign(undefined, { campaignId: 13, userId: 7 });
      assert.strictEqual(f.row.status, full ? 'queued' : 'active');
      assert.strictEqual(f.row.ends_at, '2026-09-02T00:00:00.000Z');
      const before = JSON.stringify(f.row);
      await f.service.resumeCampaign(undefined, { campaignId: 13, userId: 7 });
      assert.strictEqual(JSON.stringify(f.row), before);
      assert.strictEqual(f.calls.filter(sql => sql.startsWith('UPDATE')).length, 1);
    });
  }
  for (const status of ['active', 'queued']) {
    await check(`pause ${status} and repeat preserve timestamp`, async () => {
      const f = fixture(status);
      await f.service.pauseCampaign(undefined, { campaignId: 13, userId: 7 });
      const before = JSON.stringify(f.row);
      await f.service.pauseCampaign(undefined, { campaignId: 13, userId: 7 });
      assert.strictEqual(JSON.stringify(f.row), before);
      assert.strictEqual(f.calls.filter(sql => sql.startsWith('UPDATE')).length, 1);
    });
  }
  await check('server demo explicitly permits unpaid resume', async () => {
    const f = fixture('paused', { demo: true, unpaid: true });
    await f.service.resumeCampaign(undefined, { campaignId: 13, userId: 7 });
    assert.strictEqual(f.row.status, 'active');
    assert.ok(!f.calls.some(sql => sql.startsWith('SELECT id FROM payments')));
  });
  await check('update failure rolls back and releases transaction', async () => {
    const f = fixture('paused', { failUpdate: true });
    await assert.rejects(f.service.resumeCampaign(undefined, { campaignId: 13, userId: 7 }), /Synthetic/);
    assert.deepStrictEqual(f.calls.slice(-2), ['ROLLBACK', 'RELEASE']);
    assert.ok(!f.calls.includes('COMMIT'));
  });
  await check('supplied transaction client does not create nested transaction', async () => {
    const f = fixture('active');
    await f.service.pauseCampaign(f.client, { campaignId: 13, userId: 7 });
    assert.ok(!f.calls.includes('BEGIN'));
  });
  await check('arbitrary query function rejected', async () => {
    const f = fixture();
    await assert.rejects(f.service.resumeCampaign(async () => {}, { campaignId: 13, userId: 7 }), /transaction client required/);
  });
  console.log(`Campaign state transitions: ${total} checks passed`);
}
module.exports = run().catch(e => { console.error(e); process.exitCode = 1; });
