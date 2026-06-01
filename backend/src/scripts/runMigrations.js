'use strict';

const fs = require('fs');
const path = require('path');
const { withTransaction } = require('../config/database');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const SCHEMA_FILE = path.resolve(__dirname, '../../../database/schema.sql');
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

async function ensureBaseSchema(client) {
  const { rows } = await client.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'annonces'
    ) AS exists`
  );

  if (rows[0]?.exists) {
    return false;
  }

  if (!fs.existsSync(SCHEMA_FILE)) {
    throw new Error(`Schéma de base introuvable: ${SCHEMA_FILE}`);
  }

  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  await client.query(schemaSql);
  console.log('✅ schéma de base appliqué: database/schema.sql');
  return true;
}

async function applyMigration(client, fileName, sql) {
  await client.query(sql);
  await client.query(
    `INSERT INTO ${TRACKING_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
    [fileName],
  );
}

async function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Dossier de migrations introuvable: ${MIGRATIONS_DIR}`);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const result = await withTransaction(async (client) => {
    await ensureBaseSchema(client);
    const applied = await getAppliedMigrations(client);
    const pending = files.filter((file) => !applied.has(file));

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await applyMigration(client, file, sql);
      console.log(`✅ migration appliquée: ${file}`);
    }

    return { applied: pending.length, total: files.length };
  });

  console.log('\n=== Migrations Troca ===');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('[migrate]', err.message);
  process.exit(1);
});
