'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { withTransaction } = require('../config/database');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const TRACKING_TABLE = 'schema_migrations';

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      filename VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64),
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE ${TRACKING_TABLE} ADD COLUMN IF NOT EXISTS checksum CHAR(64)`);
}

async function getAppliedMigrations(client) {
  await ensureTrackingTable(client);
  const { rows } = await client.query(`SELECT filename, checksum FROM ${TRACKING_TABLE}`);
  return new Map(rows.map((row) => [row.filename, row.checksum?.trim() || null]));
}

function calculateChecksum(sql) {
  return crypto.createHash('sha256').update(sql).digest('hex');
}

async function applyMigration(client, fileName, sql, checksum) {
  await client.query(sql);
  await client.query(
    `INSERT INTO ${TRACKING_TABLE} (filename, checksum) VALUES ($1, $2)`,
    [fileName, checksum],
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

  for (const file of applied.keys()) {
    if (!files.includes(file)) {
      throw new Error(`Migration appliquée absente du dépôt: ${file}`);
    }
  }

  let appliedCount = 0;

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file));
    const checksum = calculateChecksum(sql);
    const recordedChecksum = applied.get(file);

    if (recordedChecksum) {
      if (recordedChecksum !== checksum) {
        throw new Error(`Migration modifiée après application: ${file}`);
      }
      continue;
    }

    if (applied.has(file)) {
      await client.query(
        `UPDATE ${TRACKING_TABLE} SET checksum = $2 WHERE filename = $1 AND checksum IS NULL`,
        [file, checksum],
      );
      console.log(`✅ checksum initialisé: ${file}`);
      continue;
    }

    await applyMigration(client, file, sql.toString('utf8'), checksum);
    appliedCount += 1;
    console.log(`✅ migration appliquée: ${file}`);
  }

  return { applied: appliedCount, total: files.length };
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

module.exports = { calculateChecksum, listMigrationFiles, runPendingMigrations };
