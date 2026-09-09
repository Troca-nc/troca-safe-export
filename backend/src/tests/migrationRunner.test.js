'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it } = require('./helpers');
const { listMigrationFiles, runPendingMigrations } = require('../scripts/runMigrations');

describe('Migration runner', () => {
  it('traite la baseline comme la première migration SQL', async () => {
    const migrationsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalico-migrations-'));
    fs.writeFileSync(path.join(migrationsDir, '001_feature.sql'), 'SELECT 1;');
    fs.writeFileSync(path.join(migrationsDir, '000_baseline.sql'), 'SELECT 0;');
    fs.writeFileSync(path.join(migrationsDir, 'README.md'), 'ignored');

    try {
      assert.deepStrictEqual(listMigrationFiles(migrationsDir), [
        '000_baseline.sql',
        '001_feature.sql',
      ]);

      const calls = [];
      const client = {
        query: async (sql, params) => {
          calls.push({ sql, params });
          if (sql.includes('SELECT filename')) {
            return { rows: [{ filename: '001_feature.sql' }] };
          }
          return { rows: [] };
        },
      };

      const result = await runPendingMigrations(client, migrationsDir);

      assert.deepStrictEqual(result, { applied: 1, total: 2 });
      assert.ok(calls.some(({ sql }) => sql === 'SELECT 0;'));
      assert.ok(!calls.some(({ sql }) => sql === 'SELECT 1;'));
      assert.deepStrictEqual(calls.at(-1).params, ['000_baseline.sql']);
    } finally {
      fs.rmSync(migrationsDir, { recursive: true, force: true });
    }
  });
});
