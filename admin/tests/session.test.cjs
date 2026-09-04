const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const key = 'local-test-only-secret-01234567890123456789';
const email = 'operator@example.test';
const env = { NEXTAUTH_SECRET: key, ADMIN_EMAIL: email, ADMIN_PASSWORD_HASH: bcrypt.hashSync('local-password', 4),
  ADMIN_TOTP_SECRET: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', TOTP_CONFIGURED: 'true' };

function moduleAt(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, { module: mod, exports: mod.exports, Buffer, URLSearchParams, Headers, Response,
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; }, ...globals });
  return mod.exports;
}

function auth(overrides = {}, totp = () => true) {
  return moduleAt('src/lib/auth.ts', {
    bcryptjs: bcrypt, jsonwebtoken: jwt, 'node:path': path, 'node:crypto': crypto,
    'node:fs': { existsSync: () => false }, './totp': { matchTotpCounter: (...args) => totp(...args) ? 123 : null },
  }, { process: { env: { ...env, ...overrides }, cwd: () => '/isolated-test' } });
}

test('session requires a configured non-placeholder key', () => {
  for (const secret of ['', 'short', 'dev-admin-secret-change-me', 'CHANGE_ME_NEXTAUTH_SECRET_MIN_64_CHARS']) {
    const service = auth({ NEXTAUTH_SECRET: secret });
    assert.throws(() => service.createAdminSession({ email, role: 'single-admin' }));
    assert.equal(service.verifyAdminSession('forged'), null);
  }
});

test('valid session is accepted; arbitrary cookie and legacy-key token are rejected', () => {
  const service = auth();
  const token = service.createAdminSession({ email, role: 'single-admin' });
  assert.equal(service.verifyAdminSession(token).email, email);
  assert.equal(service.verifyAdminSession('anything'), null);
  assert.equal(service.verifyAdminSession(jwt.sign({ email }, 'dev-admin-secret-change-me')), null);
});

test('wrong identity, role, issuer, audience, algorithm and expiry are rejected', () => {
  const service = auth();
  const payload = { email, role: 'single-admin' };
  const options = { algorithm: 'HS256', issuer: 'kalico-admin', audience: 'kalico-admin-session', subject: email,
    jwtid: '12345678-1234-4123-8123-123456789abc', expiresIn: '1h' };
  for (const [claims, settings] of [
    [{ email: 'other@example.test' }, {}], [{ role: 'user' }, {}], [{}, { subject: 'other' }],
    [{}, { issuer: 'other' }], [{}, { audience: 'other' }], [{}, { algorithm: 'HS384' }], [{}, { expiresIn: '-1s' }],
  ]) {
    assert.equal(service.verifyAdminSession(jwt.sign({ ...payload, ...claims }, key, { ...options, ...settings })), null);
  }
  const { expiresIn, ...noExpiry } = options;
  assert.equal(service.verifyAdminSession(jwt.sign(payload, key, noExpiry)), null);
});

test('changing configured admin invalidates the old identity', () => {
  const token = auth().createAdminSession({ email, role: 'single-admin' });
  assert.equal(auth({ ADMIN_EMAIL: 'replacement@example.test' }).verifyAdminSession(token), null);
});

test('demo flag cannot bypass TOTP and missing enrollment blocks login', async () => {
  let checks = 0;
  const service = auth({ NEXT_PUBLIC_DEMO_MODE: 'true' }, () => { checks++; return false; });
  assert.equal(await service.verifyAdminCredentials(email, 'local-password', '123456'), null);
  assert.equal(checks, 1);
  assert.equal(await auth({ TOTP_CONFIGURED: 'false' }).verifyAdminCredentials(email, 'local-password', '123456'), null);
  await assert.rejects(() => auth({ ADMIN_TOTP_SECRET: '' }).verifyAdminCredentials(email, 'local-password', '123456'));
});

test('TOTP verifier agrees with the RFC SHA1 vector truncated to six digits', () => {
  const totp = moduleAt('src/lib/totp.ts', { 'node:crypto': require('node:crypto') });
  assert.equal(totp.matchTotpCounter({ secret: env.ADMIN_TOTP_SECRET, token: '287082', epoch: 59000, window: 0 }), 1);
  assert.equal(totp.verifyTotpToken({ secret: env.ADMIN_TOTP_SECRET, token: '287082', epoch: 59000, window: 0 }), true);
  assert.equal(totp.verifyTotpToken({ secret: env.ADMIN_TOTP_SECRET, token: '287083', epoch: 59000, window: 0 }), false);
});

test('backend relay verifies the actual cookie before sending any request', async () => {
  const service = auth();
  for (const token of [undefined, 'forged', service.createAdminSession({ email, role: 'single-admin' })]) {
    let requests = 0;
    const session = moduleAt('src/lib/session.ts', {
      './auth': service,
      './session-store': { verifyActiveAdminSession: async (candidate) => service.verifyAdminSession(candidate) },
      'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    });
    const backend = moduleAt('src/lib/backend.ts', { './auth': service, './session': session }, {
      process: { env: { ADMIN_API_TOKEN: 'local-internal-test-token' } },
      fetch: async (_url, options) => { requests++; assert.equal(options.headers.get('x-admin-token'), 'local-internal-test-token'); return Response.json({ data: [] }); },
    });
    const response = await backend.adminBackendFetch('/admin/users');
    assert.equal(response.status, token && token !== 'forged' ? 200 : 401);
    assert.equal(requests, token && token !== 'forged' ? 1 : 0);
  }
});

test('public setup never returns an enrollment secret or marks configuration', async () => {
  const setup = moduleAt('src/app/api/setup/route.ts', { 'next/server': { NextResponse: Response } });
  for (const handler of [setup.GET, setup.POST]) {
    const response = await handler();
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes('otpauth://'));
  }
  const page = fs.readFileSync(path.join(__dirname, '../src/app/setup/page.tsx'), 'utf8');
  assert.ok(!page.includes('getAdminTotpSecret'));
  assert.ok(!page.includes('SetupClient'));
});
