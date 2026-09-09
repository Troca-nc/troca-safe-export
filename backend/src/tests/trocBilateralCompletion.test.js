'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

describe('Troc bilateral completion', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'trocWorkflowService.js'), 'utf8');
  const start = source.indexOf('async function completeTrocProposal');
  const complete = source.slice(start, source.indexOf('async function listTrocCycles', start));

  it('enregistre une confirmation sans terminer au premier participant', () => {
    assert.match(complete, /array_append\(completion_confirmations, \$2\)/);
    assert.match(complete, /requiredConfirmations\.every/);
    assert.match(complete, /completed: false/);
    assert.ok(complete.indexOf('requiredConfirmations.every') < complete.indexOf("transitionTrocProposal(q, proposalId, ['accepted'], 'completed')"));
  });

  it('termine uniquement depuis accepted après les deux confirmations', () => {
    assert.match(complete, /WHERE id = \$1 AND status = 'accepted'/);
    assert.match(complete, /completionConfirmations\.includes\(id\)/);
    assert.match(complete, /completed: true/);
  });

  it('ajoute la colonne persistante par migration additive', () => {
    const migration = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20260909_troc_completion_confirmations.sql'), 'utf8');
    assert.match(migration, /ADD COLUMN IF NOT EXISTS completion_confirmations INTEGER\[\] NOT NULL/);
  });
});
