'use strict';

const fs = require('fs');
const path = require('path');
const { withTransaction } = require('../config/database');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const TRACKING_TABLE = 'schema_migrations';

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  await ensureTrackingTable(client);
  const { rows } = await client.query(`SELECT filename FROM ${TRACKING_TABLE}`);
  return new Set(rows.map((row) => row.filename));
}

async function applyMigration(client, fileName, sql) {
  await client.query(sql);
  await client.query(
    `INSERT INTO ${TRACKING_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
    [fileName],
  );
}

function listMigrationFiles(migrationsDir = MIGRATIONS_DIR) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Dossier de migrations introuvable: ${migrationsDir}`);
  }

  return fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

async function runPendingMigrations(client, migrationsDir = MIGRATIONS_DIR) {
  const files = listMigrationFiles(migrationsDir);
  const applied = await getAppliedMigrations(client);
  const pending = files.filter((file) => !applied.has(file));

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await applyMigration(client, file, sql);
    console.log(`✅ migration appliquée: ${file}`);
  }

  return { applied: pending.length, total: files.length };
}

async function main() {
  const result = await withTransaction((client) => runPendingMigrations(client));

  console.log('\n=== Migrations Kalico ===');
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[migrate]', err.message);
    process.exit(1);
  });
}

module.exports = { listMigrationFiles, runPendingMigrations };
