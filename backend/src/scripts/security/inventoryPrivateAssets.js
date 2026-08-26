'use strict';

const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../../config/database');

const CLASSES = ['chat', 'pro-documents', 'imports', 'qr-tickets', 'products', 'listings'];

function assertSafeEnvironment() {
  if (process.env.NODE_ENV !== 'test' || process.env.KALICO_SECURITY_TEST_ONLY !== 'true') {
    throw new Error('Inventory requires the explicit security-test environment');
  }
  if (!String(process.env.DB_NAME || '').endsWith('_security_test')) {
    throw new Error('Inventory refuses databases outside *_security_test');
  }
  return path.resolve(process.env.STORAGE_LOCAL_PATH || '');
}

function parseOutput(argv) {
  const index = argv.indexOf('--output');
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value) throw new Error('--output requires a path');
  const output = path.resolve(value);
  const allowedRoots = [path.resolve('/tmp'), path.resolve(process.cwd(), 'security-test-artifacts')];
  if (!allowedRoots.some((root) => output === root || output.startsWith(`${root}${path.sep}`))) {
    throw new Error('Inventory output must stay under /tmp or security-test-artifacts');
  }
  return output;
}

function classify(relativePath) {
  const first = String(relativePath).split(/[\\/]/)[0];
  return CLASSES.includes(first) ? first : 'unknown';
}

async function walk(root) {
  const counts = Object.fromEntries([...CLASSES, 'unknown'].map((name) => [name, { count: 0, bytes: 0, zero_bytes: 0 }]));
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const absolute = path.resolve(directory, entry.name);
      if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error('Inventory path escaped storage root');
      if (entry.isSymbolicLink()) {
        counts.unknown.count += 1;
        continue;
      }
      if (entry.isDirectory()) await visit(absolute);
      if (entry.isFile()) {
        const stat = await fs.stat(absolute);
        const bucket = counts[classify(path.relative(root, absolute))];
        bucket.count += 1;
        bucket.bytes += stat.size;
        if (stat.size === 0) bucket.zero_bytes += 1;
      }
    }
  }
  await visit(root);
  return counts;
}

async function readDatabaseCounts() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const result = {};
    const queries = {
      message_media: `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE COALESCE(photo_url, attachment_url, '') LIKE '%/uploads/%')::int AS public_path
        FROM messages WHERE photo_url IS NOT NULL OR attachment_url IS NOT NULL`,
      pro_documents: `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE file_url LIKE '%/uploads/%')::int AS public_path FROM pro_documents`,
      imports: `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE file_url LIKE '%/uploads/%')::int AS public_path FROM import_jobs`,
      tickets: `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE qr_code_url LIKE '%/uploads/%')::int AS public_path FROM tickets`,
      ticket_state_anomalies: `SELECT COUNT(*)::int AS total FROM tickets t
        JOIN ticket_orders o ON o.id=t.order_id
        WHERE t.status='active' AND o.status <> 'paid'`,
      coupons: `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE qr_code_url LIKE '%/uploads/%')::int AS public_path FROM coupons`,
    };
    for (const [name, sql] of Object.entries(queries)) {
      const rows = await client.query(sql);
      result[name] = rows.rows[0];
    }
    await client.query('ROLLBACK');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const root = assertSafeEnvironment();
  const output = parseOutput(process.argv.slice(2));
  const report = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source_environment: 'security-test',
    db: await readDatabaseCounts(),
    filesystem: await walk(root),
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (output) {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, serialized, { encoding: 'utf8', flag: 'wx' });
  } else {
    process.stdout.write(serialized);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[security-inventory]', error.message);
    process.exitCode = 1;
  }).finally(() => pool.end());
}

module.exports = { assertSafeEnvironment, classify, parseOutput, walk };
