'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { autoResolveExpiredFretRequests } = require('../services/fretWorkflowService');

describe('Fret expiration', () => {
  it('sélectionne la meilleure offre et expire une demande vide', async () => {
    const selected = [];
    const queries = [];
    const dbQuery = async (sql, params) => {
      queries.push({ sql, params });
      if (queries.length === 1) return { rows: [
        { id: 10, author_id: 2, offer_id: 30 },
        { id: 11, author_id: 3, offer_id: null },
      ] };
      return { rowCount: 1, rows: [{ id: 11 }] };
    };

    const result = await autoResolveExpiredFretRequests({
      dbQuery,
      selectOffer: async (input) => selected.push(input),
    });

    assert.deepStrictEqual(selected, [{ userId: 2, requestId: 10, offerId: 30, mode: 'auto' }]);
    assert.deepStrictEqual(result, { auto_selected: 1, expired_without_offer: 1 });
    assert.match(queries[0].sql, /response_deadline_at <= NOW\(\)/);
    assert.match(queries[0].sql, /score DESC NULLS LAST, o\.amount_xpf ASC/);
    assert.match(queries[1].sql, /NOT EXISTS/);
  });

  it('ignore une demande gagnée par une exécution concurrente', async () => {
    const result = await autoResolveExpiredFretRequests({
      dbQuery: async () => ({ rows: [{ id: 12, author_id: 4, offer_id: 31 }] }),
      selectOffer: async () => { const error = new Error('concurrent'); error.status = 409; throw error; },
    });
    assert.deepStrictEqual(result, { auto_selected: 0, expired_without_offer: 0 });
  });

  it('branche le délai à la création et le traitement dans le scheduler', () => {
    const service = fs.readFileSync(path.join(__dirname, '..', 'services', 'fretWorkflowService.js'), 'utf8');
    const scheduler = fs.readFileSync(path.join(__dirname, '..', 'jobs', 'scheduler.js'), 'utf8');
    assert.match(service, /NOW\(\) \+ INTERVAL '60 minutes'/);
    assert.match(service, /SELECT id FROM delivery_requests WHERE id = \$1 FOR UPDATE/);
    assert.match(service, /computeOfferScore\(/);
    assert.match(scheduler, /await autoResolveExpiredFretRequests\(\)/);
    assert.doesNotMatch(scheduler, /cron_fret_expiry_skipped/);
  });
});
