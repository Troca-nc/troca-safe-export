'use strict';

// ============================================================
//  Troca Tests — Helpers & mocks réutilisables
// ============================================================

const assert = require('assert');
const jwt    = require('jsonwebtoken');

let testChain = Promise.resolve();

// ── Helpers d'assertion ──────────────────────────────────────

function describe(label, fn) {
  console.log(`\n  ${label}`);
  fn();
}

function it(label, fn) {
  testChain = testChain.then(async () => {
    try {
      await fn();
      console.log(`    ✓ ${label}`);
    } catch (err) {
      console.error(`    ✗ ${label}\n      ${err.message}`);
      process.exitCode = 1;
    }
  });
  return testChain;
}

function flushTests() {
  return testChain;
}

// ── Factories de mock Express ─────────────────────────────────

function makeRes() {
  const res = {
    _code:    200,
    _payload: null,
    _headers: {},
    status(code)  { this._code = code; return this; },
    json(body)    { this._payload = body; return this; },
    send(body)    { this._payload = body; return this; },
    set(k, v)     { this._headers[k] = v; return this; },
    end()         { return this; },
    redirect(url) { this._redirect = url; return this; },
  };
  return res;
}

function makeReq(overrides = {}) {
  return {
    body:    {},
    params:  {},
    query:   {},
    headers: {},
    user:    null,
    rawBody: Buffer.from(''),
    ...overrides,
  };
}

// ── Token JWT de test ─────────────────────────────────────────

function makeAccessToken(userId = 1, extra = {}) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_in_prod';
  return jwt.sign(
    { sub: userId, type: 'access', ...extra },
    secret,
    { expiresIn: '1h' }
  );
}

function makeAuthReq(userId = 1, overrides = {}) {
  return makeReq({
    user:    { id: userId, email: 'test@troca.nc', prenom: 'Test', nom: 'User', is_admin: false, is_pro: false },
    headers: { authorization: `Bearer ${makeAccessToken(userId)}` },
    ...overrides,
  });
}

function makeAdminReq(userId = 99) {
  return makeAuthReq(userId, { user: { id: userId, email: 'admin@troca.nc', prenom: 'Admin', nom: 'Troca', is_admin: true, is_pro: true } });
}

// ── Mock DB query ─────────────────────────────────────────────

function makeQueryMock(rowsOrFn = []) {
  const calls = [];
  const fn = async (sql, params) => {
    calls.push({ sql, params });
    const result = typeof rowsOrFn === 'function'
      ? await rowsOrFn(sql, params, calls.length - 1)
      : rowsOrFn;
    return { rows: Array.isArray(result) ? result : result.rows ?? [], rowCount: Array.isArray(result) ? result.length : (result.rowCount ?? 0) };
  };
  fn.calls = calls;
  return fn;
}

// ── Assertion helpers ─────────────────────────────────────────

function assertStatus(res, expected, msg = '') {
  assert.strictEqual(res._code, expected, `Status ${res._code} !== ${expected}${msg ? ' — ' + msg : ''}\nPayload: ${JSON.stringify(res._payload)}`);
}

function assertHasKey(obj, key, msg = '') {
  assert.ok(obj && key in obj, `Clé "${key}" absente de ${JSON.stringify(obj)}${msg ? ' — ' + msg : ''}`);
}

function assertError(res, code, msgFragment = '') {
  assertStatus(res, code);
  assert.ok(res._payload?.error, `Réponse d'erreur attendue mais payload: ${JSON.stringify(res._payload)}`);
  if (msgFragment) {
    assert.ok(
      res._payload.error.toLowerCase().includes(msgFragment.toLowerCase()),
      `"${msgFragment}" non trouvé dans "${res._payload.error}"`
    );
  }
}

module.exports = {
  describe, it,
  makeRes, makeReq, makeAuthReq, makeAdminReq, makeQueryMock, makeAccessToken,
  assertStatus, assertHasKey, assertError, flushTests,
};
