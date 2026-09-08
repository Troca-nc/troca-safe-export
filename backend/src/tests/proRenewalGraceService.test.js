'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const {
  GRACE_DAYS,
  REMINDER_DAYS,
  startRenewalGrace,
  processRenewalGraceDeadlines,
} = require('../services/proRenewalGraceService');

describe('Pro renewal grace', () => {
  it('ouvre sept jours uniquement depuis un abonnement actif déjà payé', async () => {
    const calls = [];
    const client = { query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('RETURNING user_id')) {
        return { rows: [{ user_id: 7, grace_ends_at: '2026-09-16T00:00:00.000Z' }] };
      }
      return { rows: [], rowCount: 1 };
    } };
    const grace = await startRenewalGrace(async (fn) => fn(client), 'sub_paid');
    assert.strictEqual(GRACE_DAYS, 7);
    assert.strictEqual(grace.user_id, 7);
    assert.ok(calls[0].sql.includes("status IN ('active', 'past_due')"));
    assert.ok(calls[0].sql.includes("payment_status = 'succeeded'"));
    assert.ok(calls[1].sql.includes('is_pro = TRUE'));
  });

  it('ne rouvre pas une grâce déjà démarrée', async () => {
    let calls = 0;
    const client = { query: async () => {
      calls += 1;
      return { rows: [] };
    } };
    assert.strictEqual(await startRenewalGrace(async (fn) => fn(client), 'sub_past_due'), null);
    assert.strictEqual(calls, 1);
  });

  it('suspend à J7 et envoie une seule relance à J3', async () => {
    const calls = [];
    const sent = [];
    const query = async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('RETURNING u.id')) return { rows: [{ id: 7 }], rowCount: 1 };
      if (sql.includes('SELECT s.id AS subscription_id')) {
        return { rows: [{ subscription_id: 4, email: 'pro@example.invalid', prenom: 'Ana', grace_ends_at: '2026-09-16T00:00:00.000Z' }] };
      }
      return { rows: [], rowCount: 1 };
    };
    const result = await processRenewalGraceDeadlines({
      query,
      sendMail: async (message) => sent.push(message),
      baseUrl: 'https://kalico.invalid',
    });
    assert.strictEqual(REMINDER_DAYS, 3);
    assert.deepStrictEqual(result, { suspended: 1, reminded: 1 });
    assert.strictEqual(sent.length, 1);
    assert.ok(calls.some((call) => call.sql.includes('is_pro = FALSE')));
    assert.ok(calls.some((call) => call.sql.includes('grace_reminder_sent_at = NOW()')));
  });

  it('branche la migration, le webhook et le planificateur', () => {
    const init = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'database', 'init.sql'), 'utf8');
    const webhook = fs.readFileSync(path.join(__dirname, '..', 'services', 'paymentWebhookService.js'), 'utf8');
    const scheduler = fs.readFileSync(path.join(__dirname, '..', 'jobs', 'scheduler.js'), 'utf8');
    assert.ok(init.includes('20260909_pro_renewal_grace.sql'));
    assert.ok(webhook.includes('startRenewalGrace(withTransaction, subId)'));
    assert.ok(scheduler.includes('processRenewalGraceDeadlines'));
  });
});
