'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { anonymizeAccount } = require('../services/accountDeletionService');

describe('Account deletion retention', () => {
  it('anonymise atomiquement sans effacer paiements ni historiques partagés', async () => {
    const calls = [];
    let transactionCalls = 0;
    const client = {
      query: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('FROM users') && sql.includes('FOR UPDATE')) {
          return { rows: [{ id: 12, email: 'demo@kalico.nc', prenom: 'Demo' }] };
        }
        return { rows: [] };
      },
    };
    const user = await anonymizeAccount(12, async (fn) => {
      transactionCalls += 1;
      return fn(client);
    });

    assert.strictEqual(transactionCalls, 1);
    assert.strictEqual(user.email, 'demo@kalico.nc');
    assert.ok(calls.some(({ sql }) => sql.includes('UPDATE users')));
    assert.ok(calls.some(({ sql }) => sql.includes('UPDATE annonces')));
    assert.ok(calls.some(({ sql }) => sql.includes('UPDATE messages')));
    assert.ok(!calls.some(({ sql }) => /DELETE FROM (users|payments|subscriptions|conversations)/.test(sql)));
  });

  it('protège en base les relations comptables et partagées', () => {
    const migration = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20260909_preserve_user_business_history.sql'),
      'utf8',
    );
    for (const table of ['payments', 'subscriptions', 'conversations', 'verified_reviews', 'troc_proposals']) {
      assert.ok(migration.includes(`ALTER TABLE ${table}`));
    }
    assert.ok(!migration.includes('ON DELETE CASCADE'));
  });
});
