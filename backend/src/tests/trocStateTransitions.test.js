'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { transitionTrocProposal } = require('../services/trocWorkflowService');

describe('Troc state transitions', () => {
  it('conditionne atomiquement la transition aux états sources', async () => {
    const calls = [];
    const updated = await transitionTrocProposal(async (sql, params) => {
      calls.push({ sql, params });
      return { rows: [{ id: 4, status: 'accepted' }] };
    }, 4, ['pending', 'seen'], 'accepted');

    assert.strictEqual(updated.status, 'accepted');
    assert.match(calls[0].sql, /status = ANY\(\$2::text\[\]\)/);
    assert.deepStrictEqual(calls[0].params, [4, ['pending', 'seen'], 'accepted']);
  });

  it('retourne un conflit lorsqu une course est perdue', async () => {
    await assert.rejects(
      () => transitionTrocProposal(async () => ({ rows: [] }), 4, ['pending'], 'declined'),
      (error) => error.status === 409
    );
  });

  it('centralise les transitions et lie la contre-proposition dans une transaction', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'trocWorkflowService.js'), 'utf8');
    assert.match(source, /transitionTrocProposal\(client, proposalId, \['pending', 'seen'\], 'accepted'\)/);
    assert.match(source, /transitionTrocProposal\(q, proposalId, \['pending', 'seen', 'countered'\], 'declined'\)/);
    assert.match(source, /transitionTrocProposal\(q, proposalId, \['accepted'\], 'completed'\)/);
    assert.match(source, /AND counter_proposal_id IS NULL/);
    assert.match(source, /const created = await withTransaction/);
  });
});
