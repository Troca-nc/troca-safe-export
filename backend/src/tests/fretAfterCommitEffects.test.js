'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { runFreightTransaction } = require('../services/fretWorkflowService');

describe('Fret after-commit effects', () => {
  it('exécute les effets seulement après le commit', async () => {
    const events = [];
    const transaction = async (work) => {
      events.push('begin');
      const result = await work({}, (value) => value);
      events.push('commit');
      return result;
    };

    const result = await runFreightTransaction(async (_client, afterCommit) => {
      events.push('write');
      afterCommit(async () => { events.push('notify'); });
      return { id: 7 };
    }, transaction);

    assert.deepStrictEqual(events, ['begin', 'write', 'commit', 'notify']);
    assert.deepStrictEqual(result, { id: 7 });
  });

  it('n exécute aucun effet si la transaction échoue', async () => {
    let notified = false;
    const transaction = async (work) => work({});

    await assert.rejects(
      () => runFreightTransaction(async (_client, afterCommit) => {
        afterCommit(async () => { notified = true; });
        throw new Error('rollback');
      }, transaction),
      /rollback/
    );
    assert.strictEqual(notified, false);
  });

  it('conserve le résultat métier si un effet post-commit échoue', async () => {
    const warnings = [];
    const transaction = async (work) => work({});
    const log = { warn: (message, context) => warnings.push({ message, context }) };

    const result = await runFreightTransaction(async (_client, afterCommit) => {
      afterCommit(async () => { throw new Error('provider unavailable'); });
      return { id: 8 };
    }, transaction, log);

    assert.deepStrictEqual(result, { id: 8 });
    assert.deepStrictEqual(warnings, [{
      message: 'fret_after_commit_effect_failed',
      context: { error: 'provider unavailable' },
    }]);
  });

  it('branche les quatre mutations fret sur la frontière post-commit', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'fretWorkflowService.js'), 'utf8');
    assert.strictEqual((source.match(/return runFreightTransaction\(async \(client, afterCommit\)/g) || []).length, 4);
    assert.strictEqual((source.match(/afterCommit\(\(\) =>/g) || []).length, 5);
  });
});
