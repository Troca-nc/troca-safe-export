'use strict';

// ============================================================
//  Tests — alert.route.js
// ============================================================

const assert = require('assert');
const { describe, it, makeRes, makeAuthReq, assertStatus, assertError } = require('./helpers');

// ── Stub DB ───────────────────────────────────────────────────
let mockAlerts = [];
let lastInserted = null;
let lastUpdated  = null;
let mockCount = 0;
let sentEmails = [];

const dbStub = {
  query: async (sql, params) => {
    const s = sql.trim().toUpperCase();
    if (s.includes('COUNT(*)')) return { rows: [{ total: String(mockCount) }], rowCount: 1 };
    if (s.startsWith('SELECT')) return { rows: mockAlerts, rowCount: mockAlerts.length };
    if (s.startsWith('INSERT')) {
      lastInserted = { label: params[1], filters: params[2], frequency: params[3], nb_results: params[5] };
      return { rows: [{ id: 1, ...lastInserted, status: 'active', created_at: new Date().toISOString() }], rowCount: 1 };
    }
    if (s.startsWith('UPDATE')) {
      lastUpdated = { id: params[params.length - 2], status: params[0] };
      return { rows: [{ id: params[params.length - 2], label: 'test', status: params[0] || 'deleted', frequency: 'daily' }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  },
};

const origLoad = require('module')._load;
const databaseModulePath = require.resolve('../config/database');
const emailModulePath = require.resolve('../services/emailService');
require('module')._load = function (req, parent, isMain) {
  if (req.includes('config/database') || req.endsWith('database')) return dbStub;
  if (req.includes('services/emailService')) return { sendMail: async (payload) => { sentEmails.push(payload); return { simulated: true }; } };
  return origLoad.apply(this, arguments);
};

require.cache[databaseModulePath] = { id: databaseModulePath, filename: databaseModulePath, loaded: true, exports: dbStub };
require.cache[emailModulePath] = { id: emailModulePath, filename: emailModulePath, loaded: true, exports: { sendMail: async (payload) => { sentEmails.push(payload); return { simulated: true }; } } };
delete require.cache[require.resolve('../middleware/auth')];
delete require.cache[require.resolve('../middleware/validate')];
delete require.cache[require.resolve('../routes/alert.route')];

const router = require('../routes/alert.route');
require('module')._load = origLoad;

function callRoute(method, path, req, res) {
  return new Promise((resolve) => {
    // Trouver le bon handler — matcher exact ou avec param
    const layer = router.stack?.find((l) => {
      if (!l.route?.methods?.[method]) return false;
      if (l.route.path === path) return true;
      // matcher /:id
      if (l.route.path.includes(':') && path.match(/\/\d+$/)) return true;
      return false;
    });
    if (!layer) { resolve(); return; }

    // Injecter le param si besoin
    const paramMatch = path.match(/\/(\d+)$/);
    if (paramMatch) req.params = req.params || {};
    if (paramMatch && layer.route.path.includes(':id')) req.params.id = paramMatch[1];

    req.method = method.toUpperCase();
    req.url = path;

    const finish = () => resolve();
    const wrap = (fn) => (body) => {
      const result = fn.call(res, body);
      finish();
      return result;
    };

    if (typeof res.json === 'function') res.json = wrap(res.json);
    if (typeof res.send === 'function') res.send = wrap(res.send);
    if (typeof res.end === 'function') res.end = wrap(res.end);

    router.handle(req, res, () => {});
  });
}

describe('GET /api/alerts', () => {
  it('retourne la liste des alertes de l\'utilisateur', async () => {
    mockAlerts = [
      { id: 1, label: 'iPhone', filters: {}, frequency: 'daily', status: 'active', nb_results: 5, last_sent_at: null, created_at: new Date().toISOString() },
    ];
    const req = makeAuthReq(1);
    const res = makeRes();
    await callRoute('get', '/', req, res);
    assertStatus(res, 200);
    assert.ok(Array.isArray(res._payload?.data));
    assert.strictEqual(res._payload.data.length, 1);
    assert.strictEqual(res._payload.data[0].label, 'iPhone');
  });

  it('retourne un tableau vide si aucune alerte', async () => {
    mockAlerts = [];
    const req = makeAuthReq(1);
    const res = makeRes();
    await callRoute('get', '/', req, res);
    assertStatus(res, 200);
    assert.strictEqual(res._payload.data.length, 0);
  });
});

describe('POST /api/alerts', () => {
  it('crée une alerte avec label + frequency', async () => {
    lastInserted = null;
    mockCount = 7;
    sentEmails = [];
    const req = makeAuthReq(1, { body: { label: 'Vélo Nouméa', frequency: 'daily', filters: { q: 'vélo' } } });
    const res = makeRes();
    await callRoute('post', '/', req, res);
    assertStatus(res, 201);
    assert.ok(res._payload?.data?.id);
    assert.strictEqual(lastInserted?.label, 'Vélo Nouméa');
    assert.strictEqual(lastInserted?.nb_results, 7);
    assert.strictEqual(sentEmails.length, 1);
    assert.ok(String(sentEmails[0].subject).includes('alerte'));
  });

  it('refuse si label manquant', async () => {
    const req = makeAuthReq(1, { body: { frequency: 'daily' } });
    const res = makeRes();
    await callRoute('post', '/', req, res);
    assertStatus(res, 400);
  });

  it('refuse une fréquence invalide', async () => {
    const req = makeAuthReq(1, { body: { label: 'Test', frequency: 'hourly' } });
    const res = makeRes();
    await callRoute('post', '/', req, res);
    assertStatus(res, 400);
  });
});

describe('PATCH /api/alerts/:id', () => {
  it('met en pause une alerte active', async () => {
    lastUpdated = null;
    const req = makeAuthReq(1, { body: { status: 'paused' }, params: { id: '1' } });
    const res = makeRes();
    await callRoute('patch', '/1', req, res);
    assertStatus(res, 200);
  });
});

describe('DELETE /api/alerts/:id', () => {
  it('supprime une alerte existante', async () => {
    const req = makeAuthReq(1, { params: { id: '1' } });
    const res = makeRes();
    await callRoute('delete', '/1', req, res);
    assertStatus(res, 200);
  });

  it('retourne 404 si alerte inexistante', async () => {
    // Simuler rowCount = 0
    const origQuery = dbStub.query;
    dbStub.query = async () => ({ rows: [], rowCount: 0 });
    const req = makeAuthReq(1, { params: { id: '999' } });
    const res = makeRes();
    await callRoute('delete', '/999', req, res);
    assertStatus(res, 404);
    dbStub.query = origQuery;
  });
});
