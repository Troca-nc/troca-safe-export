'use strict';
// Disposable local PostgreSQL only. All notification/provider calls are synthetic.
const assert = require('assert');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');
const { loadDatabase } = require('../paymentTransactionHarness');
const { loadCampaigns, payment } = require('../campaignTransactionHarness');

async function run() {
  const port = Number(process.env.KALICO_TEST_PG_PORT);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Explicit KALICO_TEST_PG_PORT required');
  const schema = `campaign_test_${randomUUID().replace(/-/g, '')}`;
  const connection = { host: '127.0.0.1', port, user: 'test', password: 'test', database: 'kalico_test',
    connectionTimeoutMillis: 5000, statement_timeout: 10000 };
  const admin = new Pool(connection);
  let pool;
  try {
    assert.strictEqual((await admin.query('SELECT current_database() AS name')).rows[0].name, 'kalico_test');
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new Pool({ ...connection, max: 4, options: `-c search_path=${schema}` });
    await pool.query(`
      CREATE TABLE users (id int PRIMARY KEY, email text, telephone text, prenom text, nom text);
      CREATE TABLE campaigns (id int PRIMARY KEY, user_id int REFERENCES users, type text,
        title text, status text, duration_days int, starts_at timestamptz, ends_at timestamptz,
        paused_at timestamptz, updated_at timestamptz, metadata jsonb, category_slug text, is_default_popup boolean);
      CREATE TABLE payments (id int PRIMARY KEY, user_id int REFERENCES users, type text,
        provider text, provider_ref text, amount_xpf int, status text, metadata jsonb, updated_at timestamptz);
    `);
    const database = loadDatabase(pool);
    let notifications = 0;
    const service = loadCampaigns(async () => { notifications++; });
    async function seed() {
      notifications = 0;
      await pool.query('TRUNCATE campaigns, payments, users');
      await pool.query("INSERT INTO users VALUES (7, 'synthetic@example.invalid', '+000', 'Test', 'User'), (8, NULL, NULL, 'Other', 'User')");
      await pool.query("INSERT INTO campaigns (id, user_id, type, title, status, duration_days, metadata, is_default_popup) VALUES (13, 7, 'popup', 'Synthetic', 'pending', 3, '{}', false)");
      await pool.query("INSERT INTO payments VALUES (9, 7, 'campaign', 'stripe', 'cs_synthetic', 1900, 'pending', $1, NOW())", [payment.metadata]);
    }
    const state = async () => (await pool.query(`SELECT c.status, c.starts_at, c.ends_at, c.metadata,
      (SELECT status FROM payments WHERE id = 9) AS payment_status FROM campaigns c WHERE id = 13`)).rows[0];
    function invoke(failOn = '', provider = 'stripe', paymentInput = payment, ref = 'cs_synthetic') {
      return database.withTransaction(client => service.activateCampaignFromPayment({
        query(sql, values) {
          if (failOn && sql.replace(/\s+/g, ' ').includes(failOn)) return client.query('SELECT 1 / 0');
          return client.query(sql, values);
        },
      }, paymentInput, paymentInput.metadata, ref, provider));
    }
    let total = 0;
    async function check(label, fn) { await seed(); await fn(); total++; console.log(`  ✓ PostgreSQL campaign: ${label}`); }
    await check('activation commits dates and succeeded metadata', async () => {
      await invoke(); const current = await state();
      assert.strictEqual(current.status, 'active');
      assert.strictEqual(current.payment_status, 'succeeded');
      assert.strictEqual(current.metadata.payment_status, 'succeeded');
      assert.strictEqual(current.ends_at - current.starts_at, 3 * 86400000);
      assert.strictEqual(notifications, 4);
    });
    await check('concurrent same payment applies once', async () => {
      const results = await Promise.all([invoke(), invoke()]);
      assert.strictEqual(results.filter(result => result.duplicate).length, 1);
      const before = await state(); await invoke();
      assert.deepStrictEqual(await state(), before);
      assert.strictEqual(notifications, 4);
    });
    for (const failOn of ['UPDATE payments', 'UPDATE campaigns SET status', 'SET metadata']) {
      await check(`SQL rollback at ${failOn}`, async () => {
        const before = await state();
        await assert.rejects(invoke(failOn), error => error.code === '22012');
        assert.deepStrictEqual(await state(), before);
        // This lot does NOT guarantee notification rollback; external calls are mocked.
      });
    }
    await check('queued duration starts at estimated availability', async () => {
      await pool.query("INSERT INTO campaigns (id, user_id, type, title, status, duration_days, ends_at, is_default_popup) VALUES (14, 8, 'popup', 'Occupied', 'active', 30, NOW() + interval '30 days', false)");
      await invoke(); const current = await state();
      assert.strictEqual(current.status, 'queued');
      assert.strictEqual(current.ends_at - current.starts_at, 3 * 86400000);
    });
    await check('PayPlug already marked succeeded still activates pending campaign once', async () => {
      await pool.query("UPDATE payments SET provider = 'payplug', status = 'succeeded'");
      await invoke('', 'payplug');
      assert.strictEqual((await invoke('', 'payplug')).duplicate, true);
      assert.strictEqual(notifications, 4);
    });
    await check('provider mismatch does not mutate', async () => {
      const before = await state(); await assert.rejects(invoke('', 'payplug'), /validation failed/);
      assert.deepStrictEqual(await state(), before); assert.strictEqual(notifications, 0);
    });
    await check('another owner cannot activate campaign', async () => {
      await pool.query('UPDATE campaigns SET user_id = 8');
      await assert.rejects(invoke(), /owner mismatch/); assert.strictEqual(notifications, 0);
    });
    await check('success after refund does not reactivate', async () => {
      await pool.query("UPDATE payments SET status = 'refunded'");
      await assert.rejects(invoke(), /validation failed/); assert.strictEqual(notifications, 0);
    });
    await check('second payment cannot overwrite the first campaign activation', async () => {
      await invoke(); const before = await state();
      await pool.query("INSERT INTO payments VALUES (10, 7, 'campaign', 'stripe', 'cs_second', 1900, 'pending', $1, NOW())", [payment.metadata]);
      await assert.rejects(invoke('', 'stripe', { ...payment, id: 10 }, 'cs_second'), /transition not allowed/);
      assert.deepStrictEqual(await state(), before); assert.strictEqual(notifications, 4);
    });
    await check('legacy applied campaign is not resumed or repaired on duplicate', async () => {
      await invoke();
      await pool.query(`UPDATE campaigns SET status = 'paused', metadata = metadata || '{"payment_status":"pending"}'::jsonb`);
      const before = await state(); assert.strictEqual((await invoke()).duplicate, true);
      assert.deepStrictEqual(await state(), before); assert.strictEqual(notifications, 4);
    });
    console.log(`PostgreSQL campaign activation: ${total} checks passed`);
  } finally {
    if (pool) await pool.end();
    // Only the generated schema on the explicit disposable database above.
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).finally(() => admin.end());
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
