const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function moduleAt(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, { module: mod, exports: mod.exports, Headers, Response,
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; },
    process: { env: { REDIS_URL: 'redis://local.test:6379' } }, ...globals });
  return mod.exports;
}

function limiter(evalResult = [0, 900], setResult = 'OK') {
  const calls = { eval: [], del: [], set: [] };
  const client = {
    isReady: true,
    on() {}, async connect() {},
    async eval(script, options) { calls.eval.push({ script, options }); return evalResult; },
    async del(keys) { calls.del.push(keys); },
    async set(...args) { calls.set.push(args); return setResult; },
  };
  const service = moduleAt('src/lib/login-rate-limit.ts', {
    'node:crypto': crypto,
    redis: { createClient: () => client },
    './auth': { getSessionSecret: () => 'local-test-secret-at-least-32-characters' },
  });
  return { service, calls };
}

test('login limit hashes source and identity and applies separate ceilings', async () => {
  const { service, calls } = limiter();
  const result = await service.consumeAdminLoginAttempt(new Headers({ 'x-real-ip': '203.0.113.4',
    'x-forwarded-for': 'attacker-controlled' }), 'Operator@Example.test');
  assert.equal(result.allowed, true);
  assert.equal(result.retryAfter, 900);
  const { keys, arguments: args } = calls.eval[0].options;
  assert.deepEqual(Array.from(args), ['900', '5', '10']);
  assert.equal(keys.length, 2);
  assert.ok(keys.every((key) => !key.includes('203.0.113.4') && !key.includes('operator')));
  assert.ok(!keys.join('').includes('attacker-controlled'));
});

test('TOTP counter claim is atomic, short-lived and contains no identity or counter', async () => {
  const { service, calls } = limiter([0, 900], 'OK');
  assert.equal(await service.claimAdminTotpCounter('operator@example.test', 57_500_000), true);
  const [key, value, options] = calls.set[0];
  assert.match(key, /^admin-login:totp:[a-f0-9]{64}$/);
  assert.ok(!key.includes('operator') && !key.includes('57500000'));
  assert.equal(value, 'used');
  assert.deepEqual({ ...options }, { NX: true, EX: 120 });
  assert.equal(await limiter([0, 900], null).service.claimAdminTotpCounter('operator@example.test', 57_500_000), false);
  await assert.rejects(() => service.claimAdminTotpCounter('operator@example.test', -1));
});

test('blocked result exposes a bounded Retry-After and success reset clears both scopes', async () => {
  const { service, calls } = limiter([1, 742]);
  const headers = new Headers({ 'x-real-ip': '203.0.113.5' });
  assert.deepEqual(Array.from(service.loginLimitKeys(headers, 'a@example.test'), (item) => item.maximum), [5, 10]);
  const result = await service.consumeAdminLoginAttempt(headers, 'a@example.test');
  assert.equal(result.allowed, false);
  assert.equal(result.retryAfter, 742);
  await service.resetAdminLoginAttempts(headers, 'a@example.test');
  assert.equal(calls.del.length, 1);
  assert.equal(calls.del[0].length, 2);
});

test('missing Redis configuration fails closed', async () => {
  const service = moduleAt('src/lib/login-rate-limit.ts', {
    'node:crypto': crypto, redis: { createClient: () => assert.fail('client must not be created') },
    './auth': { getSessionSecret: () => 'local-test-secret-at-least-32-characters' },
  }, { process: { env: {} } });
  await assert.rejects(() => service.consumeAdminLoginAttempt(new Headers(), 'a@example.test'));
});

test('login route checks the limiter before credentials and returns Retry-After', async () => {
  let credentialChecks = 0;
  const route = moduleAt('src/app/api/auth/login/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => Response.json(body, init) } },
    '@/lib/auth': {
      ADMIN_SESSION_COOKIE: 'session', createAdminSession: () => 'token',
      verifyAdminCredentials: async () => { credentialChecks++; return null; },
    },
    '@/lib/login-rate-limit': {
      consumeAdminLoginAttempt: async () => ({ allowed: false, retryAfter: 321 }),
      claimAdminTotpCounter: async () => assert.fail('blocked login cannot claim a TOTP step'),
      resetAdminLoginAttempts: async () => assert.fail('blocked login cannot reset limits'),
    },
  });
  const response = await route.POST({ headers: new Headers(), json: async () => ({ email: 'a@example.test' }) });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '321');
  assert.equal(credentialChecks, 0);
});

test('login route rejects a replay before creating a session or clearing limits', async () => {
  let sessions = 0;
  const route = moduleAt('src/app/api/auth/login/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => Response.json(body, init) } },
    '@/lib/auth': {
      ADMIN_SESSION_COOKIE: 'session', createAdminSession: () => { sessions++; return 'token'; },
      verifyAdminCredentials: async () => ({ email: 'a@example.test', role: 'single-admin', totpCounter: 123 }),
    },
    '@/lib/login-rate-limit': {
      consumeAdminLoginAttempt: async () => ({ allowed: true, retryAfter: 900 }),
      claimAdminTotpCounter: async (_email, counter) => { assert.equal(counter, 123); return false; },
      resetAdminLoginAttempts: async () => assert.fail('replay cannot reset limits'),
    },
  });
  const response = await route.POST({ headers: new Headers(), json: async () => ({ email: 'a@example.test' }) });
  assert.equal(response.status, 401);
  assert.equal(sessions, 0);
});
