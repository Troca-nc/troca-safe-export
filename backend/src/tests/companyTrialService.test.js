'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { startCompanyTrial } = require('../services/companyTrialService');

function transactionWith(handler) {
  return async (operation) => operation({ query: handler });
}

describe('Company Pro trial', () => {
  it('active exactement trente jours pour une entreprise vérifiée', async () => {
    const calls = [];
    const trial = await startCompanyTrial(9, transactionWith(async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('FROM company_members')) return { rows: [{ id: 4, ridet_verified_at: new Date(), trial_started_at: null, is_pro: false }] };
      if (sql.includes('UPDATE companies')) return { rows: [{ trial_started_at: '2026-09-09T00:00:00Z', trial_ends_at: '2026-10-09T00:00:00Z' }] };
      if (sql.includes('UPDATE users')) return { rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    }));
    assert.strictEqual(trial.trial_ends_at, '2026-10-09T00:00:00Z');
    assert.ok(calls[0].sql.includes('FOR UPDATE OF c, u'));
    assert.ok(calls[1].sql.includes("INTERVAL '30 days'"));
    assert.deepStrictEqual(calls[2].params, [9, trial.trial_started_at, trial.trial_ends_at]);
  });

  it('refuse un compte sans entreprise RIDET vérifiée', async () => {
    await assert.rejects(
      startCompanyTrial(9, transactionWith(async () => ({ rows: [] }))),
      (error) => error.status === 403,
    );
  });

  it("refuse de réutiliser l'essai au niveau de l'entreprise", async () => {
    await assert.rejects(
      startCompanyTrial(9, transactionWith(async () => ({ rows: [{ ridet_verified_at: new Date(), trial_started_at: new Date() }] }))),
      (error) => error.status === 409,
    );
  });

  it("expose la route et l'état d'essai sans fournisseur de paiement", () => {
    const route = fs.readFileSync(path.join(__dirname, '..', 'routes', 'subscriptions.js'), 'utf8');
    const page = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'app', 'abonnement', 'page.tsx'), 'utf8');
    assert.ok(route.includes("router.post('/trial/start'"));
    assert.ok(route.includes("status: 'trialing'"));
    assert.ok(page.includes('Activer mon essai Pro — 30 jours'));
    assert.ok(!page.includes("Commencer l'essai 14 jours"));
  });
});
