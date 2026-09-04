// End-to-end Admin authentication against an isolated Redis instance.
const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const bcrypt = require('bcryptjs');
const { createClient } = require('redis');
const { generateTotpToken, verifyTotpToken } = require('../scripts/provision-admin.cjs');
const { revokeAllAdminSessions } = require('../scripts/revoke-admin-sessions.cjs');

const redisUrl = String(process.env.ADMIN_TEST_REDIS_URL || '').trim();
if (!redisUrl) throw new Error('ADMIN_TEST_REDIS_URL is required for the isolated Redis smoke test.');

async function removePattern(client, pattern) {
  let batch = [];
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    batch.push(key);
    if (batch.length === 100) { await client.unlink(batch); batch = []; }
  }
  if (batch.length) await client.unlink(batch);
}

async function reservePort() {
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  return port;
}

async function waitForServer(child, base) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error('Local Admin server exited before becoming ready.');
    try {
      if ((await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Local Admin server did not start.');
}

async function run() {
  const client = createClient({ url: redisUrl, socket: { connectTimeout: 2_000, reconnectStrategy: false } });
  client.on('error', () => undefined);
  await client.connect();
  const unrelatedKey = 'kalico-test:admin-redis-smoke:unrelated';
  await removePattern(client, 'admin-session:active:*');
  await removePattern(client, 'admin-login:*');
  await client.del(unrelatedKey);

  const port = await reservePort();
  const base = `http://127.0.0.1:${port}`;
  const email = 'redis-smoke@example.test';
  const password = 'local-test-password-only';
  const totpSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: path.resolve(__dirname, '..'), windowsHide: true,
    env: { ...process.env, NODE_ENV: 'production', REDIS_URL: redisUrl,
      NEXTAUTH_URL: base, NEXTAUTH_SECRET: 'redis-smoke-session-key-01234567890123456789',
      ADMIN_EMAIL: email, ADMIN_PASSWORD_HASH: bcrypt.hashSync(password, 4),
      ADMIN_TOTP_SECRET: totpSecret, TOTP_CONFIGURED: 'true', ADMIN_API_TOKEN: 'local-test-only',
      BACKEND_URL: 'http://127.0.0.1:9', NEXT_PUBLIC_DEMO_MODE: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.resume();
  child.stderr.resume();

  try {
    await waitForServer(child, base);
    const totp = generateTotpToken(totpSecret);
    assert.equal(verifyTotpToken(totpSecret, totp), true);
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '192.0.2.10' },
      body: JSON.stringify({ email, password, totp }), redirect: 'manual' });
    assert.equal(login.status, 200);
    const setCookie = login.headers.getSetCookie?.()[0] || login.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('kalico_admin_session='));
    const cookie = setCookie.split(';', 1)[0];

    const me = await fetch(`${base}/api/auth/me`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).data.email, email);

    const replay = await fetch(`${base}/api/auth/login`, { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '192.0.2.10' },
      body: JSON.stringify({ email, password, totp }), redirect: 'manual' });
    assert.equal(replay.status, 401);

    const logout = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { cookie }, redirect: 'manual' });
    assert.equal(logout.status, 200);
    const revoked = await fetch(`${base}/api/auth/me`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(revoked.status, 401);

    await client.set('admin-session:active:test-one', 'active');
    await client.set('admin-session:active:test-two', 'active');
    await client.set(unrelatedKey, 'preserved');
    assert.equal(await revokeAllAdminSessions(client), 2);
    assert.equal(await client.get(unrelatedKey), 'preserved');
    console.log('Redis Admin: login active, TOTP replay rejected, logout revoked, global revocation scoped.');
  } finally {
    if (child.exitCode === null) {
      const stopped = once(child, 'exit');
      child.kill();
      await stopped;
    }
    await removePattern(client, 'admin-session:active:*');
    await removePattern(client, 'admin-login:*');
    await client.del(unrelatedKey);
    await client.quit();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

