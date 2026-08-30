'use strict';

// Explicit opt-in integration suite. Only a disposable localhost PostgreSQL,
// never application DB_* settings. No provider calls and no real emails.
// Start postgres:16-alpine with POSTGRES_DB=kalico_test,
// POSTGRES_USER=test, POSTGRES_PASSWORD=test; publish its
// port on 127.0.0.1 and pass KALICO_TEST_PG_PORT to this script.
const assert = require('assert');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');
const { loadDatabase, loadServices, metadata, ticketEvent } = require('../paymentTransactionHarness');

async function run() {
  const port = Number(process.env.KALICO_TEST_PG_PORT);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Explicit KALICO_TEST_PG_PORT required');
  const schema = `ticket_test_${randomUUID().replace(/-/g, '')}`;
  const connection = {
    host: '127.0.0.1', port, user: 'test', password: 'test',
    database: 'kalico_test', connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  };
  const admin = new Pool(connection);
  let pool;
  try {
    assert.strictEqual((await admin.query('SELECT current_database() AS name')).rows[0].name, connection.database);
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new Pool({ ...connection, max: 4, options: `-c search_path=${schema}` });
    // Minimal schema for the production queries, not a full migration test.
    await pool.query(`
      CREATE TABLE events (id int PRIMARY KEY, title text, tickets_sold int NOT NULL, updated_at timestamptz);
      CREATE TABLE payments (id int PRIMARY KEY, provider text, provider_ref text, user_id int,
        type text, metadata jsonb, status text, amount_xpf int, updated_at timestamptz);
      CREATE TABLE ticket_orders (id int PRIMARY KEY, event_id int REFERENCES events, status text,
        expires_at timestamptz, buyer_email text, buyer_name text, total_xpf int,
        paid_at timestamptz, updated_at timestamptz);
      CREATE TABLE ticket_types (id int PRIMARY KEY, quantity_reserved int, quantity_sold int, updated_at timestamptz);
      CREATE TABLE tickets (id int PRIMARY KEY, order_id int REFERENCES ticket_orders,
        event_id int REFERENCES events, ticket_type_id int REFERENCES ticket_types,
        token text, qr_code_url text, status text, price_xpf int);
    `);
    async function seed() {
      await pool.query('TRUNCATE tickets, ticket_types, ticket_orders, payments, events');
      await pool.query("INSERT INTO events VALUES (12, 'Synthetic event', 0, NOW())");
      await pool.query("INSERT INTO payments VALUES (9, 'stripe', 'cs_synthetic', 7, 'event_ticket', $1, 'pending', 3600, NOW())", [metadata]);
      await pool.query("INSERT INTO ticket_orders VALUES (34, 12, 'reserved', NOW() + interval '1 hour', 'synthetic@example.invalid', 'Test', 3600, NULL, NOW())");
      await pool.query('INSERT INTO ticket_types VALUES (60, 2, 0, NOW())');
      await pool.query("INSERT INTO tickets VALUES (50, 34, 12, 60, 'synthetic-1', NULL, 'reserved', 1800), (51, 34, 12, 60, 'synthetic-2', NULL, 'reserved', 1800)");
    }
    async function state() {
      const result = await pool.query(`SELECT
        (SELECT status FROM payments WHERE id = 9) AS payment,
        (SELECT status FROM ticket_orders WHERE id = 34) AS order_status,
        (SELECT count(*)::int FROM tickets WHERE status = 'active') AS active,
        (SELECT quantity_sold FROM ticket_types WHERE id = 60) AS sold,
        (SELECT quantity_reserved FROM ticket_types WHERE id = 60) AS reserved,
        (SELECT tickets_sold FROM events WHERE id = 12) AS event_sold`);
      return result.rows[0];
    }
    const initial = { payment: 'pending', order_status: 'reserved', active: 0, sold: 0, reserved: 2, event_sold: 0 };
    const paid = { payment: 'succeeded', order_status: 'paid', active: 2, sold: 2, reserved: 0, event_sold: 2 };
    const database = loadDatabase(pool);
    function handler(failOn = '') {
      let emails = 0;
      const transactionDb = {
        query() { throw new Error('Global pool query escaped transaction'); },
        withTransaction: fn => database.withTransaction(client => fn({
          query(sql, values) {
            // Inject a real SQL error on this connection, after earlier writes.
            if (failOn && sql.replace(/\s+/g, ' ').includes(failOn)) return client.query('SELECT 1 / 0');
            return client.query(sql, values);
          },
        })),
      };
      const service = loadServices(transactionDb, async () => {
        // A different DB connection must see the committed state before email.
        assert.deepStrictEqual(await state(), paid);
        emails++;
      });
      return {
        invoke: (event = ticketEvent()) => service.processStripeWebhookEvent({ event, ...transactionDb }),
        emails: () => emails,
      };
    }
    let count = 0;
    async function check(label, fn) {
      await seed(); await fn(); count++; console.log(`  ✓ PostgreSQL: ${label}`);
    }
    await check('commit makes all ticket effects visible before notification', async () => {
      const h = handler(); await h.invoke();
      assert.deepStrictEqual(await state(), paid);
      assert.strictEqual(h.emails(), 1);
    });
    for (const failOn of ['UPDATE ticket_types', 'UPDATE tickets ', 'UPDATE ticket_orders', 'UPDATE events', 'UPDATE payments', 'SELECT o.*']) {
      await check(`rollback on ${failOn} restores all counters and statuses`, async () => {
        const h = handler(failOn);
        await assert.rejects(h.invoke(), error => error.code === '22012');
        assert.deepStrictEqual(await state(), initial);
        assert.strictEqual(h.emails(), 0);
      });
    }
    await check('two concurrent dispatches grant tickets and email once', async () => {
      const h = handler();
      await Promise.all([h.invoke(), h.invoke()]);
      assert.deepStrictEqual(await state(), paid);
      assert.strictEqual(h.emails(), 1);
    });
    await check('later duplicate leaves counters unchanged and sends no second email', async () => {
      const h = handler(); await h.invoke(); await h.invoke();
      assert.deepStrictEqual(await state(), paid);
      assert.strictEqual(h.emails(), 1);
    });
    await check('invalid amount leaves all reserved state intact', async () => {
      const h = handler(); await h.invoke(ticketEvent({ amount_total: 1 }));
      assert.deepStrictEqual(await state(), initial);
      assert.strictEqual(h.emails(), 0);
    });
    console.log(`PostgreSQL ticket transaction: ${count} checks passed`);
  } finally {
    if (pool) await pool.end();
    // Only the freshly generated schema above, on the hardcoded test DB.
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).finally(() => admin.end());
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
