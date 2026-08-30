'use strict';
// Disposable local PostgreSQL only. All notification/provider calls are synthetic.
const assert = require('assert');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { loadDatabase, load } = require('../paymentTransactionHarness');
const { loadCampaigns, payment, campaignEvent, loadCampaignWebhook } = require('../campaignTransactionHarness');

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
      CREATE TABLE webhook_events (id serial PRIMARY KEY, event_id varchar(255) NOT NULL UNIQUE,
        provider varchar(20) NOT NULL CHECK (provider IN ('stripe', 'payplug')),
        type varchar(100) NOT NULL, processed_at timestamptz NOT NULL DEFAULT NOW());
      CREATE TABLE users (id int PRIMARY KEY, email text, telephone text, prenom text, nom text);
      CREATE TABLE campaigns (id int PRIMARY KEY, user_id int REFERENCES users, type text,
        title text, status text, duration_days int, starts_at timestamptz, ends_at timestamptz,
        paused_at timestamptz, updated_at timestamptz, metadata jsonb, category_slug text, is_default_popup boolean);
      CREATE TABLE payments (id int PRIMARY KEY, user_id int REFERENCES users,
        type text NOT NULL CONSTRAINT payments_type_check CHECK (type IN ('boost', 'subscription', 'bon_plan')),
        provider text, provider_ref text, amount_xpf int, status text, metadata jsonb, updated_at timestamptz);
      CREATE TABLE push_tokens (id int PRIMARY KEY, user_id int REFERENCES users, token text);
      CREATE TABLE notifications (id serial PRIMARY KEY, user_id int REFERENCES users, type text, title text, body text, href text);
    `);
    await pool.query(fs.readFileSync(path.join(__dirname, '../../../../database/migrations/20260830_payment_types_campaign_ticket.sql'), 'utf8'));
    await pool.query(fs.readFileSync(path.join(__dirname, '../../../../database/migrations/20260830_campaign_notification_outbox.sql'), 'utf8'));
    const database = loadDatabase(pool);
    const outbox = load('services/campaignNotificationOutboxService.js', { '../config/database': database });
    let notifications = 0;
    const service = loadCampaigns(async () => {
      assert.strictEqual((await state()).payment_status, 'succeeded', 'Delivery must see committed payment');
      notifications++;
      return { accepted: ['synthetic@example.invalid'], sid: 'SM_synthetic', status: 'sent' };
    });
    async function seed() {
      notifications = 0;
      await pool.query('TRUNCATE webhook_events, campaign_notification_outbox, notifications, push_tokens, campaigns, payments, users');
      await pool.query("INSERT INTO users VALUES (7, 'synthetic@example.invalid', '+000', 'Test', 'User'), (8, NULL, NULL, 'Other', 'User')");
      await pool.query("INSERT INTO campaigns (id, user_id, type, title, status, duration_days, metadata, is_default_popup) VALUES (13, 7, 'popup', 'Synthetic', 'pending', 3, '{}', false)");
      await pool.query("INSERT INTO payments VALUES (9, 7, 'campaign', 'stripe', 'cs_synthetic', 1900, 'pending', $1, NOW())", [payment.metadata]);
      await pool.query("INSERT INTO push_tokens VALUES (1, 7, 'synthetic_device_1'), (2, 7, 'synthetic_device_2')");
    }
    const state = async () => (await pool.query(`SELECT c.status, c.starts_at, c.ends_at, c.metadata,
      (SELECT status FROM payments WHERE id = 9) AS payment_status FROM campaigns c WHERE id = 13`)).rows[0];
    const queue = async () => (await pool.query('SELECT channel, target_id, status, attempts FROM campaign_notification_outbox ORDER BY id')).rows;
    const deliver = () => outbox.deliverNextCampaignNotification(service.deliverCampaignNotification);
    const webhook = loadCampaignWebhook(service);
    const receipts = async () => (await pool.query('SELECT event_id, provider FROM webhook_events ORDER BY id')).rows;
    function dispatch(event = campaignEvent(), failOn = '', loseAck = false) {
      return webhook.processStripeWebhookEvent({ event,
        query() { throw new Error('Global query escaped campaign transaction'); },
        async withTransaction(fn) {
          const result = await database.withTransaction(client => fn({ query(sql, values) {
            if (failOn && sql.replace(/\s+/g, ' ').includes(failOn)) return client.query('SELECT 1 / 0');
            return client.query(sql, values);
          } }));
          // Lost acknowledgement is simulated after a real commit, not a DB crash.
          if (loseAck) throw new Error('Simulated lost commit acknowledgement');
          return result;
        },
      });
    }
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
      assert.strictEqual(notifications, 0);
      assert.strictEqual((await queue()).length, 5);
    });
    await check('concurrent same payment applies once', async () => {
      const results = await Promise.all([invoke(), invoke()]);
      assert.strictEqual(results.filter(result => result.duplicate).length, 1);
      const before = await state(); await invoke();
      assert.deepStrictEqual(await state(), before);
      assert.strictEqual(notifications, 0);
      assert.strictEqual((await queue()).length, 5);
    });
    for (const failOn of ['UPDATE payments', 'UPDATE campaigns SET status', 'SET metadata', 'INSERT INTO campaign_notification_outbox']) {
      await check(`SQL rollback at ${failOn}`, async () => {
        const before = await state();
        await assert.rejects(invoke(failOn), error => error.code === '22012');
        assert.deepStrictEqual(await state(), before);
        assert.deepStrictEqual(await queue(), []);
        assert.strictEqual(notifications, 0);
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
      assert.strictEqual(notifications, 0);
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
      assert.deepStrictEqual(await state(), before); assert.strictEqual(notifications, 0);
    });
    await check('legacy applied campaign is not resumed or repaired on duplicate', async () => {
      await invoke();
      await pool.query(`UPDATE campaigns SET status = 'paused', metadata = metadata || '{"payment_status":"pending"}'::jsonb`);
      const before = await state(); assert.strictEqual((await invoke()).duplicate, true);
      assert.deepStrictEqual(await state(), before); assert.strictEqual(notifications, 0);
    });
    await check('concurrent workers deliver each channel/device once after commit', async () => {
      await invoke();
      await Promise.all([deliver(), deliver()]);
      while (await deliver()) { /* drain only the five synthetic items */ }
      assert.strictEqual(notifications, 4); // email, SMS, two devices
      assert.ok((await queue()).every(item => item.status === 'sent'));
      assert.strictEqual((await pool.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n, 1);
    });
    await check('one failed device does not resend successful channels or devices', async () => {
      await invoke();
      const mixed = (item, campaign, client) => item.channel === 'push' && item.target_id === 2
        ? Promise.resolve({ status: 'retry' }) : service.deliverCampaignNotification(item, campaign, client);
      while (await outbox.deliverNextCampaignNotification(mixed)) { /* retry is deferred */ }
      const afterFirst = notifications;
      assert.strictEqual((await queue()).filter(item => item.status === 'pending').length, 1);
      await pool.query("UPDATE campaign_notification_outbox SET available_at = NOW() - interval '1 second' WHERE status = 'pending'");
      await deliver();
      assert.strictEqual(notifications, afterFirst + 1);
      assert.ok((await queue()).every(item => item.status === 'sent'));
    });
    await check('paused campaign cancels pending delivery without external sends', async () => {
      await invoke(); await pool.query("UPDATE campaigns SET status = 'paused'");
      while (await deliver()) { /* cancel only the seeded entries */ }
      assert.strictEqual(notifications, 0);
      assert.ok((await queue()).every(item => item.status === 'cancelled'));
    });
    await check('in-app insert rolls back with failed outbox acknowledgement', async () => {
      await invoke();
      await pool.query("UPDATE campaign_notification_outbox SET available_at = NOW() + interval '1 hour' WHERE channel <> 'in_app'");
      const failingDb = { withTransaction: fn => database.withTransaction(client => fn({ query(sql, values) {
        if (sql.includes('UPDATE campaign_notification_outbox')) return client.query('SELECT 1 / 0');
        return client.query(sql, values);
      } })) };
      const failing = load('services/campaignNotificationOutboxService.js', { '../config/database': failingDb });
      await assert.rejects(failing.deliverNextCampaignNotification(service.deliverCampaignNotification));
      assert.strictEqual((await pool.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n, 0);
      await deliver();
      assert.strictEqual((await pool.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n, 1);
    });
    await check('campaign deletion cascades outbox without historical backfill', async () => {
      assert.deepStrictEqual(await queue(), []); await invoke();
      await pool.query('DELETE FROM campaigns'); assert.deepStrictEqual(await queue(), []);
    });
    await check('worker cannot see notifications before payment commit', async () => {
      await database.withTransaction(async client => {
        await service.activateCampaignFromPayment(client, payment, payment.metadata, 'cs_synthetic', 'stripe');
        assert.deepStrictEqual(await queue(), []);
        assert.strictEqual(await deliver(), null);
        assert.strictEqual(notifications, 0);
      });
      assert.strictEqual((await queue()).length, 5);
    });
    await check('webhook commits receipt, activation and outbox without sending', async () => {
      await dispatch(); assert.strictEqual((await receipts()).length, 1);
      assert.strictEqual((await state()).status, 'active');
      assert.strictEqual((await queue()).length, 5); assert.strictEqual(notifications, 0);
    });
    for (const failOn of ['INSERT INTO webhook_events', 'UPDATE payments', 'SET metadata', 'INSERT INTO campaign_notification_outbox']) {
      await check(`webhook rollback removes receipt and effects at ${failOn}`, async () => {
        const before = await state();
        await assert.rejects(dispatch(campaignEvent(), failOn), error => error.code === '22012');
        assert.deepStrictEqual(await state(), before); assert.deepStrictEqual(await queue(), []);
        assert.deepStrictEqual(await receipts(), []); assert.strictEqual(notifications, 0);
      });
    }
    await check('same event succeeds after failed enqueue', async () => {
      await assert.rejects(dispatch(campaignEvent(), 'INSERT INTO campaign_notification_outbox'));
      await dispatch(); assert.strictEqual((await receipts()).length, 1); assert.strictEqual((await queue()).length, 5);
    });
    await check('concurrent same event yields one receipt and one activation', async () => {
      const results = await Promise.all([dispatch(), dispatch()]);
      assert.strictEqual(results.filter(result => result.duplicate).length, 1);
      assert.strictEqual((await receipts()).length, 1); assert.strictEqual((await queue()).length, 5);
    });
    await check('distinct events for same payment preserve one set of effects', async () => {
      await Promise.all([dispatch(), dispatch({ ...campaignEvent(), id: 'evt_second' })]);
      const before = await state(); await dispatch({ ...campaignEvent(), id: 'evt_third' });
      assert.deepStrictEqual(await state(), before);
      assert.strictEqual((await receipts()).length, 3); assert.strictEqual((await queue()).length, 5);
    });
    await check('historical receipt is preserved without attempting repair', async () => {
      await pool.query("INSERT INTO webhook_events (event_id, provider, type) VALUES ('evt_campaign', 'stripe', 'checkout.session.completed')");
      const before = await state(); assert.strictEqual((await dispatch()).duplicate, true);
      assert.deepStrictEqual(await state(), before); assert.deepStrictEqual(await queue(), []);
    });
    await check('provider collision fails without campaign activation', async () => {
      await pool.query("INSERT INTO webhook_events (event_id, provider, type) VALUES ('evt_campaign', 'payplug', 'payment')");
      const before = await state(); await assert.rejects(dispatch(), /provider conflict/);
      assert.deepStrictEqual(await state(), before); assert.deepStrictEqual(await queue(), []);
      assert.strictEqual((await receipts())[0].provider, 'payplug');
    });
    for (const change of [{ amount_total: 1 }, { metadata: { ...payment.metadata, user_id: '8' } }, { metadata: { ...payment.metadata, campaign_id: '99' } }]) {
      await check('invalid signed Checkout leaves no processed receipt', async () => {
        const before = await state(); await assert.rejects(dispatch(campaignEvent(change)), /validation failed/);
        assert.deepStrictEqual(await state(), before); assert.deepStrictEqual(await queue(), []);
        assert.deepStrictEqual(await receipts(), []);
      });
    }
    await check('lost commit acknowledgement retry skips committed effects', async () => {
      await assert.rejects(dispatch(campaignEvent(), '', true), /lost commit acknowledgement/);
      const before = await state(); assert.strictEqual((await dispatch()).duplicate, true);
      assert.deepStrictEqual(await state(), before); assert.strictEqual((await queue()).length, 5);
      assert.strictEqual((await receipts()).length, 1);
    });
    console.log(`PostgreSQL campaign activation: ${total} checks passed`);
  } finally {
    if (pool) await pool.end();
    // Only the generated schema on the explicit disposable database above.
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).finally(() => admin.end());
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
