'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const {
  normalizeModerationAction,
  resolveReport,
} = require('../services/adminModerationActionService');

function transactionHarness({ report = { id: 9, annonce_id: 21, content_owner_id: 7 }, effectRow = { id: 21 } } = {}) {
  const calls = [];
  const transactionFn = async (fn) => fn({
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('FROM signalements s')) return { rows: report ? [report] : [] };
      if (sql.includes('UPDATE annonces')) return { rows: effectRow ? [effectRow] : [] };
      if (sql.includes('UPDATE users')) return { rows: effectRow ? [effectRow] : [] };
      if (sql.includes('UPDATE signalements')) {
        return { rows: [{ id: 9, status: params[1], action_taken: params[2], resolved_by: params[3] }] };
      }
      return { rows: [] };
    },
  });
  return { calls, transactionFn };
}

describe('Admin moderation action integrity', () => {
  it('refuse les actions absentes ou inconnues', () => {
    assert.throws(() => normalizeModerationAction(), /invalide/);
    assert.throws(() => normalizeModerationAction('delete_everything'), /invalide/);
  });

  it('classe un signalement rejeté sans modifier le contenu', async () => {
    const h = transactionHarness();
    const result = await resolveReport(9, 'dismiss', 3, h.transactionFn);
    assert.strictEqual(result.status, 'dismissed');
    assert.strictEqual(h.calls.some(({ sql }) => sql.includes('UPDATE annonces')), false);
    assert.strictEqual(h.calls.some(({ sql }) => sql.includes('UPDATE users')), false);
    assert.ok(h.calls.some(({ sql }) => sql.includes('INSERT INTO admin_logs')));
  });

  it('supprime logiquement le contenu avant de clore le signalement', async () => {
    const h = transactionHarness();
    const result = await resolveReport(9, 'remove_content', 3, h.transactionFn);
    const contentIndex = h.calls.findIndex(({ sql }) => sql.includes('UPDATE annonces'));
    const reportIndex = h.calls.findIndex(({ sql }) => sql.includes('UPDATE signalements'));
    assert.ok(contentIndex >= 0 && contentIndex < reportIndex);
    assert.ok(h.calls[contentIndex].sql.includes("status = 'deleted'"));
    assert.strictEqual(result.status, 'resolved');
  });

  it('suspend le propriétaire pendant 30 jours avant de clore le signalement', async () => {
    const h = transactionHarness();
    await resolveReport(9, 'suspend_user', 3, h.transactionFn);
    const suspension = h.calls.find(({ sql }) => sql.includes('UPDATE users'));
    assert.deepStrictEqual(suspension.params, [7]);
    assert.ok(suspension.sql.includes("INTERVAL '30 days'"));
    assert.ok(suspension.sql.includes('is_admin IS NOT TRUE'));
  });

  it('ne produit pas de faux succès pour un signalement absent ou déjà résolu', async () => {
    const h = transactionHarness({ report: null });
    await assert.rejects(() => resolveReport(9, 'dismiss', 3, h.transactionFn), (error) => error.status === 404);
    assert.strictEqual(h.calls.length, 1);
  });

  it('annule la résolution si le contenu est déjà supprimé', async () => {
    const h = transactionHarness({ effectRow: null });
    await assert.rejects(() => resolveReport(9, 'remove_content', 3, h.transactionFn), (error) => error.status === 409);
    assert.strictEqual(h.calls.some(({ sql }) => sql.includes('UPDATE signalements')), false);
  });
});
