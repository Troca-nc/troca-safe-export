'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const {
  forceDeleteUser,
  normalizeDurationDays,
  normalizePlan,
  normalizeUserId,
  setUserPlan,
  suspendUser,
  unsuspendUser,
} = require('../services/adminUserActionService');

function queryHarness(row) {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  };
  return { calls, query };
}

describe('admin user action integrity', () => {
  it('valide strictement identifiant, durée et plan', () => {
    assert.strictEqual(normalizeUserId('42'), 42);
    assert.strictEqual(normalizeDurationDays(undefined), 30);
    assert.strictEqual(normalizePlan('PRO'), 'pro');
    assert.throws(() => normalizeUserId('1 OR 1=1'), /invalide/i);
    assert.throws(() => normalizeDurationDays(0), /durée/i);
    assert.throws(() => normalizeDurationDays(366), /durée/i);
    assert.throws(() => normalizePlan('enterprise'), /plan/i);
  });

  it('suspend temporairement via banned_until sans supprimer le compte', async () => {
    const db = queryHarness({ id: 7, banned_until: '2026-10-02T00:00:00Z' });
    const result = await suspendUser(7, 30, db.query);

    assert.strictEqual(result.id, 7);
    assert.deepStrictEqual(db.calls[0].params, [7, 30]);
    assert.ok(db.calls[0].sql.includes('banned_until'));
    assert.ok(!db.calls[0].sql.includes('SET deleted_at = NOW()'));
  });

  it('réactive les suspensions nouvelles et historiques', async () => {
    const db = queryHarness({ id: 7, banned_until: null, deleted_at: null });
    await unsuspendUser(7, db.query);

    assert.ok(db.calls[0].sql.includes('banned_until = NULL'));
    assert.ok(db.calls[0].sql.includes('deleted_at = NULL'));
  });

  it('refuse un plan inconnu avant toute requête', async () => {
    const db = queryHarness({ id: 7 });

    await assert.rejects(() => setUserPlan(7, 'enterprise', db.query), /plan/i);
    assert.strictEqual(db.calls.length, 0);
  });

  it('retourne une cible absente au lieu de fabriquer un succès', async () => {
    const db = queryHarness(null);

    assert.strictEqual(await suspendUser(404, 30, db.query), null);
    assert.strictEqual(await unsuspendUser(404, db.query), null);
    assert.strictEqual((await setUserPlan(404, 'free', db.query)).user, null);
    assert.strictEqual(await forceDeleteUser(404, db.query), null);
    assert.ok(db.calls.every((call) => call.sql.includes('RETURNING')));
  });

  it('la suppression forcée invalide aussi une suspension', async () => {
    const db = queryHarness({ id: 9, deleted_at: '2026-09-02T00:00:00Z' });
    await forceDeleteUser(9, db.query);

    assert.ok(db.calls[0].sql.includes('deleted_at = NOW()'));
    assert.ok(db.calls[0].sql.includes('banned_until = NULL'));
  });
});
