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
        paused_at timestamptz, updated_at timestamptz, metadata jsonb, category_slug text, is_default_popup boolean,
        created_at timestamptz DEFAULT NOW());
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
    const stateService = loadCampaigns(async () => { throw new Error('Unexpected state notification'); }, () => Date.now(), database);
    const stateArgs = { campaignId: 13, userId: 7 };
    const completeState = async () => (await pool.query('SELECT * FROM campaigns WHERE id = 13')).rows[0];
    for (const method of ['pauseCampaign', 'resumeCampaign']) {
      await check(`${method} rejects unpaid pending campaign without mutation`, async () => {
        const before = await completeState();
        await assert.rejects(stateService[method](database.query, stateArgs), e => e.status === 409);
        assert.deepStrictEqual(await completeState(), before);
      });
    }
    for (const mutation of [
      "UPDATE payments SET status = 'refunded'",
      "UPDATE payments SET status = 'pending'",
      'UPDATE payments SET user_id = 8',
      "UPDATE payments SET provider = 'payplug'",
      "UPDATE payments SET provider_ref = 'other'",
      "UPDATE payments SET type = 'event_ticket'",
      "UPDATE payments SET metadata = '{\"campaign_id\":\"99\"}'::jsonb",
      'DELETE FROM payments',
    ]) {
      await check(`resume rejects payment mismatch: ${mutation}`, async () => {
        await invoke(); await stateService.pauseCampaign(undefined, stateArgs);
        // Outbox foreign keys deliberately retain payment rows in production.
        if (mutation === 'DELETE FROM payments') await pool.query('DELETE FROM campaign_notification_outbox');
        await pool.query(mutation);
        const before = await completeState();
        await assert.rejects(stateService.resumeCampaign(undefined, { ...stateArgs, isAdmin: true }), e => e.status === 409);
        assert.deepStrictEqual(await completeState(), before);
      });
    }
    await check('concurrent pauses set one timestamp and repeats are stable', async () => {
      await invoke();
      await Promise.all([stateService.pauseCampaign(undefined, stateArgs), stateService.pauseCampaign(undefined, stateArgs)]);
      const before = await completeState(); assert.strictEqual(before.status, 'paused');
      assert.ok(before.paused_at);
      await stateService.pauseCampaign(undefined, stateArgs);
      assert.deepStrictEqual(await completeState(), before);
    });
    await check('concurrent resumes extend once, without counting itself as competitor', async () => {
      await invoke(); await stateService.pauseCampaign(undefined, stateArgs);
      await pool.query("UPDATE campaigns SET paused_at = NOW() - interval '1 day' WHERE id = 13");
      const before = await completeState();
      await Promise.all([stateService.resumeCampaign(undefined, stateArgs), stateService.resumeCampaign(undefined, stateArgs)]);
      const after = await completeState(); assert.strictEqual(after.status, 'active');
      assert.strictEqual(after.paused_at, null);
      assert.ok(after.ends_at - before.ends_at >= 86400000);
      assert.ok(after.ends_at - before.ends_at < 86410000);
      await stateService.resumeCampaign(undefined, stateArgs);
      assert.deepStrictEqual(await completeState(), after);
    });
    await check('resume queues when another popup is active', async () => {
      await invoke(); await stateService.pauseCampaign(undefined, stateArgs);
      await pool.query("INSERT INTO campaigns (id, user_id, type, status, ends_at, is_default_popup) VALUES (14, 8, 'popup', 'active', NOW() + interval '30 days', false)");
      await stateService.resumeCampaign(undefined, stateArgs);
      const before = await completeState(); assert.strictEqual(before.status, 'queued');
      await stateService.resumeCampaign(undefined, stateArgs);
      assert.deepStrictEqual(await completeState(), before);
    });
    await check('state update SQL failure rolls back and releases lock', async () => {
      await invoke(); await stateService.pauseCampaign(undefined, stateArgs);
      const before = await completeState();
      await assert.rejects(database.withTransaction(client => stateService.resumeCampaign({ query(sql, values) {
        return sql.includes('UPDATE campaigns') ? client.query('SELECT 1 / 0') : client.query(sql, values);
      } }, stateArgs)), e => e.code === '22012');
      assert.deepStrictEqual(await completeState(), before);
      await stateService.resumeCampaign(undefined, stateArgs);
      assert.strictEqual((await state()).status, 'active');
    });
    async function competitor(id, type = 'popup', category = null, status = 'pending') {
      await pool.query(`INSERT INTO campaigns (id, user_id, type, title, status, duration_days, metadata, is_default_popup, category_slug)
        VALUES ($1, 7, $2, 'Synthetic competitor', $3, 3, '{}', false, $4)`, [id, type, status, category]);
      const meta = { ...payment.metadata, campaign_id: String(id) };
      await pool.query("INSERT INTO payments VALUES ($1, 7, 'campaign', 'stripe', $2, 1900, 'pending', $3, NOW())", [id, `cs_${id}`, meta]);
      return () => invoke('', 'stripe', { ...payment, id, metadata: meta }, `cs_${id}`);
    }
    async function activeCount(type) {
      return (await pool.query("SELECT count(*)::int AS n FROM campaigns WHERE type=$1 AND status='active' AND is_default_popup=false", [type])).rows[0].n;
    }
    await check('two different paid popups reserve one slot', async () => {
      const other = await competitor(14);
      await Promise.all([invoke(), other()]);
      assert.strictEqual(await activeCount('popup'), 1);
      assert.strictEqual((await pool.query("SELECT count(*)::int AS n FROM campaigns WHERE status='queued'")).rows[0].n, 1);
    });
    await check('capacity lock remains held until caller commit and is then released', async () => {
      await database.withTransaction(async client => {
        await service.activateCampaignFromPayment(client, payment, payment.metadata, 'cs_synthetic', 'stripe');
        const probe = await pool.query('SELECT pg_try_advisory_xact_lock(1262570569, 1) AS acquired');
        assert.strictEqual(probe.rows[0].acquired, false);
      });
      const probe = await pool.query('SELECT pg_try_advisory_xact_lock(1262570569, 1) AS acquired');
      assert.strictEqual(probe.rows[0].acquired, true);
    });
    await check('seven concurrent bon plans reserve at most six slots', async () => {
      await pool.query("UPDATE campaigns SET type='bon_plan'");
      const operations = [invoke];
      for (let id = 14; id < 20; id++) operations.push(await competitor(id, 'bon_plan'));
      await Promise.all(operations.map(fn => fn()));
      assert.strictEqual(await activeCount('bon_plan'), 6);
    });
    await check('banner capacity is two per category, not two globally', async () => {
      await pool.query("UPDATE campaigns SET type='banner', category_slug='auto'");
      const operations = [invoke, await competitor(14, 'banner', 'auto'), await competitor(15, 'banner', 'auto'), await competitor(16, 'banner', 'maison')];
      await Promise.all(operations.map(fn => fn()));
      const counts = (await pool.query("SELECT category_slug, count(*)::int AS n FROM campaigns WHERE status='active' GROUP BY category_slug ORDER BY category_slug")).rows;
      assert.deepStrictEqual(counts, [{ category_slug: 'auto', n: 2 }, { category_slug: 'maison', n: 1 }]);
    });
    await check('payment racing paid resume cannot overbook popup', async () => {
      await invoke(); await stateService.pauseCampaign(undefined, stateArgs);
      const other = await competitor(14);
      await Promise.all([stateService.resumeCampaign(undefined, stateArgs), other()]);
      assert.strictEqual(await activeCount('popup'), 1);
    });
    await check('two paid resumes cannot overbook popup', async () => {
      await invoke(); const other = await competitor(14); await other();
      await stateService.pauseCampaign(undefined, stateArgs);
      await stateService.pauseCampaign(undefined, { campaignId: 14, userId: 7 });
      await Promise.all([stateService.resumeCampaign(undefined, stateArgs), stateService.resumeCampaign(undefined, { campaignId: 14, userId: 7 })]);
      assert.strictEqual(await activeCount('popup'), 1);
    });
    // Record outside legacy delivery's swallowed errors; assert after the operation.
    const notificationLockResults = [];
    const schedulerService = loadCampaigns(async () => {
      const result = await database.withTransaction(client => client.query('SELECT pg_try_advisory_xact_lock(1262570569, 1) AS acquired'));
      notificationLockResults.push(result.rows[0].acquired);
    }, () => Date.now(), database);
    await check('two schedulers activate queued popup once after expiry', async () => {
      await invoke(); const other = await competitor(14); await other();
      await pool.query("UPDATE campaigns SET ends_at=NOW()-interval '1 second' WHERE id=13");
      const results = await Promise.all([schedulerService.expireCampaignsAndActivateQueued(), schedulerService.expireCampaignsAndActivateQueued()]);
      assert.strictEqual(results.reduce((n, r) => n + r.activatedCount, 0), 1);
      assert.strictEqual(await activeCount('popup'), 1);
    });
    await check('scheduler notifications run after releasing capacity lock', async () => {
      await invoke(); const other = await competitor(14); await other();
      await pool.query("UPDATE campaigns SET ends_at=NOW()-interval '1 second' WHERE id=13");
      notificationLockResults.length = 0;
      await schedulerService.expireCampaignsAndActivateQueued();
      assert.ok(notificationLockResults.length > 0);
      assert.ok(notificationLockResults.every(Boolean));
    });
    await check('scheduler racing payment respects popup capacity', async () => {
      await invoke(); const other = await competitor(14); await other();
      await pool.query("UPDATE campaigns SET ends_at=NOW()-interval '1 second' WHERE id=13");
      const third = await competitor(15);
      await Promise.all([stateService.expireCampaignsAndActivateQueued(), third()]);
      assert.strictEqual(await activeCount('popup'), 1);
    });
    await check('demo activation racing payment respects capacity', async () => {
      const other = await competitor(14);
      const demo = loadCampaigns(async () => {}, () => Date.now(), database, { DEMO_MODE: 'true' });
      await Promise.all([demo.activateCampaignIfSlotAvailable(database.query, { id: 13 }), other()]);
      assert.strictEqual(await activeCount('popup'), 1);
    });
    await check('rollback releases capacity for another campaign', async () => {
      const other = await competitor(14);
      await assert.rejects(invoke('UPDATE campaigns SET status'), e => e.code === '22012');
      await other(); assert.strictEqual(await activeCount('popup'), 1);
      assert.strictEqual((await state()).status, 'pending');
    });
    await check('stale standalone activation cannot resume a paused campaign', async () => {
      await invoke(); await stateService.pauseCampaign(undefined, stateArgs);
      const before = await completeState();
      const result = await stateService.activateCampaignIfSlotAvailable(undefined, { id: 13 });
      assert.strictEqual(result.duplicate, true); assert.deepStrictEqual(await completeState(), before);
    });
    for (const mutation of [
      "UPDATE payments SET status='refunded' WHERE id=14",
      "UPDATE payments SET status='pending' WHERE id=14",
      'UPDATE payments SET user_id=8 WHERE id=14',
      "UPDATE payments SET provider='payplug' WHERE id=14",
      "UPDATE payments SET provider_ref='other' WHERE id=14",
      "UPDATE payments SET type='event_ticket' WHERE id=14",
      "UPDATE payments SET metadata='{\"campaign_id\":\"99\"}'::jsonb WHERE id=14",
      'DELETE FROM payments WHERE id=14',
    ]) {
      await check(`queue skips invalid payment: ${mutation}`, async () => {
        await invoke(); const other = await competitor(14); await other();
        await pool.query("UPDATE campaigns SET ends_at=NOW()-interval '1 second' WHERE id=13");
        if (mutation.startsWith('DELETE')) await pool.query('DELETE FROM campaign_notification_outbox WHERE payment_id=14');
        await pool.query(mutation);
        const before = (await pool.query('SELECT * FROM campaigns WHERE id=14')).rows[0];
        let sent = 0;
        const guarded = loadCampaigns(async () => { sent++; }, () => Date.now(), database);
        assert.strictEqual((await guarded.expireCampaignsAndActivateQueued()).activatedCount, 0);
        assert.deepStrictEqual((await pool.query('SELECT * FROM campaigns WHERE id=14')).rows[0], before);
        assert.strictEqual(sent, 0);
        await assert.rejects(guarded.activateCampaignIfSlotAvailable(undefined, { id: 14 }, { fromQueue: true }), e => e.status === 409);
        assert.strictEqual(sent, 0);
      });
    }
    await check('invalid queue head does not block a later paid campaign', async () => {
      await invoke(); const second = await competitor(14); await second();
      const third = await competitor(15); await third();
      await pool.query("UPDATE payments SET status='refunded' WHERE id=14");
      await pool.query("UPDATE campaigns SET created_at=NOW()-interval '1 day' WHERE id=14");
      await pool.query("UPDATE campaigns SET ends_at=NOW()-interval '1 second' WHERE id=13");
      const result = await stateService.expireCampaignsAndActivateQueued();
      assert.strictEqual(result.activatedCount, 1);
      assert.deepStrictEqual((await pool.query('SELECT id, status FROM campaigns WHERE id IN (14,15) ORDER BY id')).rows,
        [{ id: 14, status: 'queued' }, { id: 15, status: 'active' }]);
    });
    await check('server demo still promotes unpaid queue entries', async () => {
      await pool.query("UPDATE campaigns SET status='queued'");
      const demo = loadCampaigns(async () => {}, () => Date.now(), database, { DEMO_MODE: 'true' });
      assert.strictEqual((await demo.expireCampaignsAndActivateQueued()).activatedCount, 1);
      assert.strictEqual((await state()).status, 'active');
      assert.strictEqual((await state()).payment_status, 'pending');
    });
    await check('payment query failure rolls back expiry and queue changes together', async () => {
      await invoke(); const other = await competitor(14); await other();
      await pool.query("UPDATE campaigns SET ends_at=NOW()-interval '1 second' WHERE id=13");
      const before = (await pool.query('SELECT * FROM campaigns ORDER BY id')).rows;
      const failingDatabase = { ...database, withTransaction(fn) {
        return database.withTransaction(client => fn({ query(sql, values) {
          return sql.includes('SELECT id FROM payments') ? client.query('SELECT 1 / 0') : client.query(sql, values);
        } }));
      } };
      let sent = 0;
      const guarded = loadCampaigns(async () => { sent++; }, () => Date.now(), failingDatabase);
      await assert.rejects(guarded.expireCampaignsAndActivateQueued(), e => e.code === '22012');
      assert.deepStrictEqual((await pool.query('SELECT * FROM campaigns ORDER BY id')).rows, before);
      assert.strictEqual(sent, 0);
    });
    const paymentState = async () => (await pool.query('SELECT * FROM payments WHERE id=9')).rows[0];
    for (const intent of ['pi_synthetic', { id: 'pi_synthetic', object: 'payment_intent' }]) {
      await check('Checkout commits PaymentIntent link with receipt, activation and outbox', async () => {
        await dispatch(campaignEvent({ payment_intent: intent }));
        const current = await paymentState();
        assert.strictEqual(current.provider_ref, 'cs_synthetic');
        assert.deepStrictEqual(current.metadata, { ...payment.metadata, stripe_payment_intent_id: 'pi_synthetic' });
        assert.strictEqual((await state()).status, 'active'); assert.strictEqual((await queue()).length, 5);
        assert.strictEqual((await receipts()).length, 1);
      });
    }
    await check('Identity is rolled back if activation outbox fails later', async () => {
      const before = await paymentState();
      await assert.rejects(dispatch(campaignEvent(), 'INSERT INTO campaign_notification_outbox'), e => e.code === '22012');
      assert.deepStrictEqual(await paymentState(), before);
      assert.deepStrictEqual(await receipts(), []); assert.deepStrictEqual(await queue(), []);
    });
    await check('Identity write SQL failure rolls back receipt and effects', async () => {
      const before = await paymentState();
      await assert.rejects(dispatch(campaignEvent(), "jsonb_build_object('stripe_payment_intent_id'"), e => e.code === '22012');
      assert.deepStrictEqual(await paymentState(), before); assert.deepStrictEqual(await receipts(), []);
      assert.strictEqual((await state()).status, 'pending');
    });
    await check('Missing PaymentIntent does not persist receipt', async () => {
      await assert.rejects(dispatch(campaignEvent({ payment_intent: null })), /identity invalid/);
      assert.deepStrictEqual(await receipts(), []); assert.strictEqual((await state()).status, 'pending');
    });
    await check('Different stored identity cannot be overwritten', async () => {
      await pool.query(`UPDATE payments SET metadata=metadata || '{"stripe_payment_intent_id":"pi_other"}'::jsonb WHERE id=9`);
      const before = await paymentState(); await assert.rejects(dispatch(), /identity conflict/);
      assert.deepStrictEqual(await paymentState(), before); assert.deepStrictEqual(await receipts(), []);
    });
    await check('Another Stripe payment using the same provider reference blocks binding', async () => {
      await pool.query("INSERT INTO payments VALUES (10, 8, 'boost', 'stripe', 'pi_synthetic', 1900, 'succeeded', '{}', NOW())");
      await assert.rejects(dispatch(), /identity already linked/);
      assert.deepStrictEqual(await receipts(), []);
    });
    await check('Concurrent different Checkouts cannot bind the same PaymentIntent', async () => {
      await competitor(14);
      const second = campaignEvent({ id: 'cs_14', metadata: { ...payment.metadata, campaign_id: '14' } });
      second.id = 'evt_second_payment';
      const results = await Promise.allSettled([dispatch(), dispatch(second)]);
      assert.strictEqual(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.match(results.find(r => r.status === 'rejected').reason.message, /identity already linked/);
      assert.strictEqual((await pool.query("SELECT count(*)::int AS n FROM payments WHERE metadata->>'stripe_payment_intent_id'='pi_synthetic'")).rows[0].n, 1);
      assert.strictEqual((await receipts()).length, 1);
    });
    await check('New event with same identity preserves dates and outbox', async () => {
      await dispatch(); const before = await state(); const current = await paymentState();
      const next = campaignEvent(); next.id = 'evt_same_link'; await dispatch(next);
      assert.deepStrictEqual(await state(), before); assert.deepStrictEqual(await paymentState(), current);
      assert.strictEqual((await queue()).length, 5); assert.strictEqual((await receipts()).length, 2);
    });
    console.log(`PostgreSQL campaign activation: ${total} checks passed`);
  } finally {
    if (pool) await pool.end();
    // Only the generated schema on the explicit disposable database above.
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).finally(() => admin.end());
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
