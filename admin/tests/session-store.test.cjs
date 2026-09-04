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
    process: { env: { NODE_ENV: 'production' } }, ...globals });
  return mod.exports;
}

function sessionStore({ active = true } = {}) {
  const calls = { set: [], get: [], del: [] };
  const session = { email: 'operator@example.test', role: 'single-admin',
    jti: '12345678-1234-4123-8123-123456789abc', exp: Math.floor(Date.now() / 1000) + 3600 };
  const client = {
    async set(...args) { calls.set.push(args); return 'OK'; },
    async get(key) { calls.get.push(key); return active ? 'active' : null; },
    async del(key) { calls.del.push(key); return 1; },
  };
  const service = moduleAt('src/lib/session-store.ts', {
    'node:crypto': crypto,
    './auth': { getSessionSecret: () => 'local-test-secret-at-least-32-characters',
      verifyAdminSession: (token) => token === 'signed-token' ? session : null },
    './login-rate-limit': { getAdminRedisClient: async () => client },
  });
  return { service, calls, session };
}

test('session is registered with bounded TTL and an opaque key', async () => {
  const { service, calls, session } = sessionStore();
  assert.equal((await service.registerAdminSession('signed-token')).jti, session.jti);
  const [key, value, options] = calls.set[0];
  assert.match(key, /^admin-session:active:[a-f0-9]{64}$/);
  assert.ok(!key.includes(session.email) && !key.includes(session.jti));
  assert.equal(value, 'active');
  assert.equal(options.NX, true);
  assert.ok(options.EX > 3500 && options.EX <= 3600);
});

test('only an active server-side session is accepted and logout revokes it', async () => {
  const current = sessionStore({ active: true });
  assert.equal((await current.service.verifyActiveAdminSession('signed-token')).email, current.session.email);
  assert.equal(await current.service.revokeAdminSession('signed-token'), true);
  assert.equal(current.calls.del.length, 1);
  const revoked = sessionStore({ active: false });
  assert.equal(await revoked.service.verifyActiveAdminSession('signed-token'), null);
});

test('invalid tokens never reach Redis', async () => {
  const { service, calls } = sessionStore();
  assert.equal(await service.verifyActiveAdminSession('forged'), null);
  assert.equal(await service.revokeAdminSession('forged'), false);
  await assert.rejects(() => service.registerAdminSession('forged'));
  assert.deepEqual(calls, { set: [], get: [], del: [] });
});

test('logout keeps the cookie when server-side revocation is unavailable', async () => {
  const cookies = { set: [] };
  const route = moduleAt('src/app/api/auth/logout/route.ts', {
    'next/server': { NextResponse: { json(body, init = {}) { const response = Response.json(body, init);
      response.cookies = { set: (...args) => cookies.set.push(args) }; return response; } } },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'signed-token' }) }) },
    '@/lib/auth': { ADMIN_SESSION_COOKIE: 'session' },
    '@/lib/session-store': { revokeAdminSession: async () => { throw new Error('redis unavailable'); } },
  });
  const response = await route.POST();
  assert.equal(response.status, 503);
  assert.equal(cookies.set.length, 0);
});

test('logout revokes the server session before clearing the browser cookie', async () => {
  const events = [];
  const route = moduleAt('src/app/api/auth/logout/route.ts', {
    'next/server': { NextResponse: { json(body, init = {}) { const response = Response.json(body, init);
      response.cookies = { set: (options) => events.push(['cookie', options]) }; return response; } } },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'signed-token' }) }) },
    '@/lib/auth': { ADMIN_SESSION_COOKIE: 'session' },
    '@/lib/session-store': { revokeAdminSession: async (token) => { events.push(['revoke', token]); return true; } },
  });
  const response = await route.POST();
  assert.equal(response.status, 200);
  assert.deepEqual(events.map(([kind]) => kind), ['revoke', 'cookie']);
  assert.equal(events[1][1].maxAge, 0);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
