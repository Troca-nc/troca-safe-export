'use strict';

// ============================================================
//  Tests — Middleware auth.js
// ============================================================

const assert = require('assert');
const {
  describe, it, makeRes, makeReq, makeAuthReq, makeAdminReq, makeQueryMock,
  makeAccessToken, assertStatus, assertError,
} = require('./helpers');

process.env.JWT_SECRET = 'test_jwt_secret_minimum_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Mock du module database AVANT de charger auth.js
const fakeUser = { id: 1, email: 'test@troca.nc', prenom: 'Jean', nom: 'Test', is_admin: false, is_pro: false, deleted_at: null };
let mockRows = [fakeUser];
const blacklistedTokens = new Set();

// Patch require cache pour database
const Module = require('module');
const _originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.includes('config/database') || request.endsWith('database')) {
    return {
      query: async () => ({ rows: mockRows }),
      withTransaction: async (fn) => fn({ query: async () => ({ rows: mockRows }) }),
      checkConnection: async () => new Date().toISOString(),
    };
  }
  if (request.includes('services/authAccountService')) {
    return {
      isAccessTokenBlacklisted: async (token) => blacklistedTokens.has(token),
    };
  }
  return _originalLoad.apply(this, arguments);
};

const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

// Restaurer
Module._load = _originalLoad;

describe('authenticate — token manquant', () => {
  it('retourne 401 si pas de header Authorization', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    authenticate(req, res, () => { throw new Error('next ne doit pas être appelé'); });
    assertStatus(res, 401);
    assert.ok(res._payload?.error);
  });

  it('retourne 401 pour un token malformé', () => {
    const req = makeReq({ headers: { authorization: 'Bearer INVALID.TOKEN.HERE' } });
    const res = makeRes();
    authenticate(req, res, () => { throw new Error('next ne doit pas être appelé'); });
    assertStatus(res, 401);
  });
});

describe('authenticate — token valide', () => {
  it('appelle next() et attache req.user avec un bon token', (done) => {
    const token = makeAccessToken(1);
    const req   = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res   = makeRes();
    mockRows = [fakeUser];

    const next = () => {
      assert.ok(req.user, 'req.user doit être défini');
      assert.strictEqual(req.user.id, 1);
      done?.();
    };

    const result = authenticate(req, res, next);
    // Si authenticate est async
    if (result && typeof result.then === 'function') {
      result.then(() => {}).catch(done);
    }
  });

  it('refuse un token révoqué', () => {
    const token = makeAccessToken(1);
    blacklistedTokens.add(token);
    const req   = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res   = makeRes();
    mockRows = [fakeUser];

    authenticate(req, res, () => { throw new Error('next ne doit pas être appelée'); });
    assertStatus(res, 401);
    blacklistedTokens.delete(token);
  });
});

describe('requireAdmin', () => {
  it('bloque un non-admin avec 403', () => {
    const req = makeReq({ user: { is_admin: false } });
    const res = makeRes();
    requireAdmin(req, res, () => { throw new Error('ne doit pas passer'); });
    assertStatus(res, 403);
    assertError(res, 403);
  });

  it('laisse passer un admin', () => {
    let passed = false;
    const req = makeAdminReq();
    const res = makeRes();
    requireAdmin(req, res, () => { passed = true; });
    assert.ok(passed, 'next() aurait dû être appelé');
  });
});

describe('optionalAuth', () => {
  it('appelle next() sans token — req.user reste null', () => {
    let called = false;
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const result = optionalAuth(req, res, () => { called = true; });
    if (result && typeof result.then === 'function') {
      return result.then(() => assert.ok(called));
    }
    assert.ok(called);
  });
});
