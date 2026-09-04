// Local built-server smoke test; never uses a real backend or production secrets.
const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function run() {
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: require('node:path').resolve(__dirname, '..'),
    windowsHide: true,
    env: { ...process.env, NODE_ENV: 'production', BACKEND_URL: 'http://127.0.0.1:9',
      NEXTAUTH_URL: `http://127.0.0.1:${port}`, ADMIN_EMAIL: 'local@example.test',
      NEXTAUTH_SECRET: 'local-http-test-only-key-01234567890123456789',
      ADMIN_PASSWORD_HASH: '', ADMIN_TOTP_SECRET: '', ADMIN_API_TOKEN: 'local-test-only',
      NEXT_PUBLIC_DEMO_MODE: 'false', TOTP_CONFIGURED: 'false', REDIS_URL: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Drain output without exposing configuration in test logs.
  child.stdout.resume();
  child.stderr.resume();
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error('Local Admin server exited');
      try { ready = (await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'Local Admin server did not start');
    const headers = { cookie: 'kalico_admin_session=forged', 'content-type': 'application/json' };
    const mutation = await fetch(`${base}/api/admin/users/7/suspend`, { method: 'POST', headers, body: '{}', redirect: 'manual' });
    assert.equal(mutation.status, 401);
    const me = await fetch(`${base}/api/auth/me`, { headers, redirect: 'manual' });
    assert.equal(me.status, 401);
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ email: 'local@example.test', password: 'invalid', totp: '000000' }), redirect: 'manual' });
    assert.equal(login.status, 503);
    for (const method of ['GET', 'POST']) {
      const setup = await fetch(`${base}/api/setup`, { method, headers, redirect: 'manual' });
      assert.equal(setup.status, 503);
      assert.ok(!(await setup.text()).includes('otpauth://'));
    }
    const page = await fetch(`${base}/setup`, { redirect: 'manual' });
    assert.equal(page.status, 200);
    assert.ok(!(await page.text()).includes('otpauth://'));
    console.log('HTTP Admin: forged session rejected; login fails closed without Redis; public setup disabled.');
  } finally {
    if (child.exitCode === null) {
      const stopped = once(child, 'exit');
      child.kill();
      await stopped;
    }
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
