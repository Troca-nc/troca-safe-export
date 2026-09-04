const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const revoke = require('../scripts/revoke-admin-sessions.cjs');

test('target description never exposes Redis credentials', () => {
  assert.equal(revoke.redisTarget('rediss://admin:super-secret@cache.example.test:6380/2'),
    'rediss://cache.example.test:6380/2');
  assert.throws(() => revoke.redisTarget('https://cache.example.test'));
  assert.equal(revoke.environmentName('production-nc'), 'production-nc');
  assert.throws(() => revoke.environmentName(''));
  assert.throws(() => revoke.environmentName('production\nREVOKE'));
});

test('revocation scans only the fixed session prefix and unlinks in bounded batches', async () => {
  const keys = Array.from({ length: 205 }, (_, index) => `admin-session:active:${String(index).padStart(64, '0')}`);
  const calls = { scan: null, unlink: [] };
  const client = {
    async *scanIterator(options) { calls.scan = options; for (const key of keys) yield key; },
    async unlink(batch) { calls.unlink.push([...batch]); return batch.length; },
  };
  assert.equal(await revoke.revokeAllAdminSessions(client), 205);
  assert.deepEqual(calls.scan, { MATCH: 'admin-session:active:*', COUNT: 100 });
  assert.deepEqual(calls.unlink.map((batch) => batch.length), [100, 100, 5]);
});

test('an unexpected Redis key aborts without deleting that batch', async () => {
  let deletes = 0;
  const client = {
    async *scanIterator() { yield 'another-service:key'; },
    async unlink() { deletes++; return 1; },
  };
  await assert.rejects(() => revoke.revokeAllAdminSessions(client), /hors du périmètre/);
  assert.equal(deletes, 0);
});

test('non-interactive execution stops before connecting to Redis', () => {
  const script = path.join(__dirname, '../scripts/revoke-admin-sessions.cjs');
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, ADMIN_ENVIRONMENT: 'test', REDIS_URL: 'redis://127.0.0.1:1' },
    input: '', encoding: 'utf8', windowsHide: true,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /terminal interactif/);
  assert.ok(!result.stdout.includes('session(s) Admin'));
});

