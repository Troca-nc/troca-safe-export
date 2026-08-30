'use strict';
// Migration contract on an explicit disposable localhost database, never DB_*.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');

async function run() {
  const port = Number(process.env.KALICO_TEST_PG_PORT);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Explicit KALICO_TEST_PG_PORT required');
  const schema = `payment_types_test_${randomUUID().replace(/-/g, '')}`;
  const connection = { host: '127.0.0.1', port, user: 'test', password: 'test', database: 'kalico_test',
    connectionTimeoutMillis: 5000, statement_timeout: 15000 };
  const admin = new Pool(connection);
  let pool;
  const migration = fs.readFileSync(path.join(__dirname, '../../../../database/migrations/20260830_payment_types_campaign_ticket.sql'), 'utf8');
  try {
    assert.strictEqual((await admin.query('SELECT current_database() AS name')).rows[0].name, 'kalico_test');
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new Pool({ ...connection, max: 3, options: `-c search_path=${schema}` });
    await pool.query(`CREATE TABLE payments (
      id serial PRIMARY KEY, type varchar(20) NOT NULL,
      provider text NOT NULL CHECK (provider IN ('stripe', 'payplug')),
      status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
      metadata jsonb NOT NULL DEFAULT '{}',
      CONSTRAINT payments_type_check CHECK (type IN ('boost', 'subscription', 'bon_plan'))
    )`);
    const insert = (type, provider = 'stripe', status = 'pending') => pool.query(
      'INSERT INTO payments (type, provider, status) VALUES ($1, $2, $3)', [type, provider, status]
    );
    const definition = async () => (await pool.query(`SELECT pg_get_constraintdef(oid) AS definition, convalidated
      FROM pg_constraint WHERE conrelid = 'payments'::regclass AND conname = 'payments_type_check'`)).rows[0];
    let count = 0;
    async function check(label, fn) { await fn(); count++; console.log(`  ✓ PostgreSQL payment types: ${label}`); }
    await check('historical constraint reproduces both rejected types', async () => {
      for (const type of ['campaign', 'event_ticket']) await assert.rejects(insert(type), error => error.code === '23514');
    });
    await check('migration preserves existing rows exactly', async () => {
      for (const type of ['boost', 'subscription', 'bon_plan']) await insert(type);
      const before = (await pool.query('SELECT * FROM payments ORDER BY id')).rows;
      await pool.query(migration);
      assert.deepStrictEqual((await pool.query('SELECT * FROM payments ORDER BY id')).rows, before);
      assert.strictEqual((await definition()).convalidated, true);
    });
    await check('five intended types accepted with both providers', async () => {
      for (const type of ['boost', 'subscription', 'bon_plan', 'campaign', 'event_ticket']) {
        for (const provider of ['stripe', 'payplug']) await insert(type, provider);
      }
      // DB allowlist is not authorization to enable PayPlug ticket checkout.
    });
    await check('unknown type, transport and null still rejected', async () => {
      for (const type of ['unknown', 'pro_transport_ride']) await assert.rejects(insert(type), error => error.code === '23514');
      await assert.rejects(insert(null), error => error.code === '23502');
    });
    await check('provider and payment status checks unchanged', async () => {
      await assert.rejects(insert('campaign', 'unknown'), error => error.code === '23514');
      await assert.rejects(insert('event_ticket', 'stripe', 'unknown'), error => error.code === '23514');
    });
    await check('repeat application remains functionally safe', async () => {
      await pool.query(migration); await insert('campaign');
      await assert.rejects(insert('unknown'), error => error.code === '23514');
    });
    await check('existing extra allowed value preserved', async () => {
      await pool.query(`ALTER TABLE payments DROP CONSTRAINT payments_type_check;
        ALTER TABLE payments ADD CONSTRAINT payments_type_check CHECK
          (type IN ('boost', 'subscription', 'bon_plan', 'campaign', 'event_ticket', 'legacy_extra'))`);
      await insert('legacy_extra'); await pool.query(migration); await insert('legacy_extra');
    });
    await check('missing expected constraint aborts instead of guessing', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('ALTER TABLE payments DROP CONSTRAINT payments_type_check');
        await assert.rejects(client.query(migration), /Expected validated/);
      } finally { await client.query('ROLLBACK'); client.release(); }
      assert.ok(await definition());
    });
    await check('mixed type/status constraint is not weakened', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`ALTER TABLE payments DROP CONSTRAINT payments_type_check;
          ALTER TABLE payments ADD CONSTRAINT payments_type_check CHECK (type <> 'unknown' AND status <> 'unknown')`);
        await assert.rejects(client.query(migration), /Expected validated/);
      } finally { await client.query('ROLLBACK'); client.release(); }
    });
    await check('rollback restores previous constraint definition', async () => {
      const before = await definition(); const client = await pool.connect();
      try { await client.query('BEGIN'); await client.query(migration); }
      finally { await client.query('ROLLBACK'); client.release(); }
      assert.deepStrictEqual(await definition(), before);
    });
    await check('lock timeout aborts without changing the constraint', async () => {
      const before = await definition(); const blocker = await pool.connect();
      try {
        await blocker.query('BEGIN'); await blocker.query('LOCK TABLE payments IN ACCESS SHARE MODE');
        await assert.rejects(pool.query(migration), error => error.code === '55P03');
      } finally { await blocker.query('ROLLBACK'); blocker.release(); }
      assert.deepStrictEqual(await definition(), before);
    });
    console.log(`PostgreSQL payment types: ${count} checks passed`);
  } finally {
    if (pool) await pool.end();
    // Only the freshly generated schema in the explicit test database.
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).finally(() => admin.end());
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
