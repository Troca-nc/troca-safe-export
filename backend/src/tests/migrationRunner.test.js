'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it } = require('./helpers');
const {
  calculateChecksum,
  listMigrationFiles,
  runPendingMigrations,
} = require('../scripts/runMigrations');

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
            return {
              rows: [{
                filename: '001_feature.sql',
                checksum: calculateChecksum(Buffer.from('SELECT 1;')),
              }],
            };
          }
          return { rows: [] };
        },
      };

      const result = await runPendingMigrations(client, migrationsDir);

      assert.deepStrictEqual(result, { applied: 1, total: 2 });
      assert.ok(calls.some(({ sql }) => sql === 'SELECT 0;'));
      assert.ok(!calls.some(({ sql }) => sql === 'SELECT 1;'));
      assert.strictEqual(calls.at(-1).params[0], '000_baseline.sql');
      assert.match(calls.at(-1).params[1], /^[a-f0-9]{64}$/);
    } finally {
      fs.rmSync(migrationsDir, { recursive: true, force: true });
    }
  });

  it('initialise sans rejouer le checksum des migrations historiques', async () => {
    const migrationsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalico-migrations-'));
    fs.writeFileSync(path.join(migrationsDir, '001_legacy.sql'), 'SELECT 1;');
    const calls = [];
    const client = {
      query: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT filename')) {
          return { rows: [{ filename: '001_legacy.sql', checksum: null }] };
        }
        return { rows: [] };
      },
    };

    try {
      const result = await runPendingMigrations(client, migrationsDir);
      assert.deepStrictEqual(result, { applied: 0, total: 1 });
      assert.ok(calls.some(({ sql }) => sql.includes('SET checksum = $2')));
      assert.ok(!calls.some(({ sql }) => sql === 'SELECT 1;'));
    } finally {
      fs.rmSync(migrationsDir, { recursive: true, force: true });
    }
  });

  it('refuse une migration modifiée après son application', async () => {
    const migrationsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalico-migrations-'));
    fs.writeFileSync(path.join(migrationsDir, '001_locked.sql'), 'SELECT 2;');
    const client = {
      query: async (sql) => {
        if (sql.includes('SELECT filename')) {
          return { rows: [{ filename: '001_locked.sql', checksum: '0'.repeat(64) }] };
        }
        return { rows: [] };
      },
    };

    try {
      await assert.rejects(
        runPendingMigrations(client, migrationsDir),
        /Migration modifiée après application: 001_locked\.sql/,
      );
    } finally {
      fs.rmSync(migrationsDir, { recursive: true, force: true });
    }
  });
});
