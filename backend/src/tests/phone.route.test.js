'use strict';

// ============================================================
//  Tests — phone.route.js
// ============================================================

const assert = require('assert');
const { describe, it, makeRes, makeAuthReq, assertStatus, assertError } = require('./helpers');

// ── Stubs ─────────────────────────────────────────────────────

// Stub Twilio
const twilioSentSMS = [];
let twilioVerifyStatus = 'approved';

require.cache[require.resolve('twilio')] = {
  id: require.resolve('twilio'), filename: require.resolve('twilio'), loaded: true,
  exports: function TwilioClient() {
    return {
      verify: { v2: { services: (_sid) => ({
        verifications: { create: async ({ to }) => { twilioSentSMS.push(to); return { status: 'pending' }; } },
        verificationChecks: { create: async () => ({ status: twilioVerifyStatus }) },
      })}},
    };
  },
};

// Stub DB
let dbRows = [];
let lastQuerySql = '';
const dbStub = {
  query: async (sql, params) => {
    lastQuerySql = sql;
    return { rows: dbRows, rowCount: dbRows.length };
  },
};

// Override require pour database
const origLoad = require('module')._load;
require('module')._load = function (req, parent, isMain) {
  if (req.includes('config/database') || req.endsWith('database')) return dbStub;
  return origLoad.apply(this, arguments);
};

process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_AUTH_TOKEN  = 'authtoken';
process.env.TWILIO_VERIFY_SID  = 'VAtest';

const router = require('../routes/phone.route');

require('module')._load = origLoad;

// ── Helper pour simuler une route ─────────────────────────────
function callRoute(method, path, req, res) {
  return new Promise((resolve) => {
    const layer = router.stack?.find(
      (l) => l.route?.path === path && l.route?.methods?.[method]
    );
    if (!layer) { resolve(); return; }
    const handler = layer.route.stack[layer.route.stack.length - 1].handle;
    const result = handler(req, res, () => resolve());
    if (result && typeof result.then === 'function') result.then(resolve).catch(resolve);
  });
}

describe('POST /api/phone/send', () => {
  it('envoie un SMS et normalise le numéro NC (+687)', async () => {
    twilioSentSMS.length = 0;
    dbRows = []; // pas de doublon
    const req = makeAuthReq(1, { body: { telephone: '751234' } });
    const res = makeRes();
    await callRoute('post', '/send', req, res);
    assertStatus(res, 200);
    assert.ok(res._payload?.telephone?.startsWith('+687'));
  });

  it('accepte un numéro avec indicatif +687', async () => {
    twilioSentSMS.length = 0;
    dbRows = [];
    const req = makeAuthReq(1, { body: { telephone: '+687751234' } });
    const res = makeRes();
    await callRoute('post', '/send', req, res);
    assertStatus(res, 200);
    assert.strictEqual(res._payload?.telephone, '+687751234');
  });

  it('rejette si le numéro est déjà utilisé par un autre compte', async () => {
    dbRows = [{ id: 99 }]; // autre utilisateur avec ce numéro
    const req = makeAuthReq(1, { body: { telephone: '+687751234' } });
    const res = makeRes();
    await callRoute('post', '/send', req, res);
    assertStatus(res, 409);
  });
});

describe('POST /api/phone/verify', () => {
  it('valide le code correct et marque le téléphone comme vérifié', async () => {
    twilioVerifyStatus = 'approved';
    dbRows = [];
    const req = makeAuthReq(1, { body: { telephone: '+687751234', code: '123456' } });
    const res = makeRes();
    await callRoute('post', '/verify', req, res);
    assertStatus(res, 200);
    assert.strictEqual(res._payload?.verified, true);
  });

  it('retourne 400 si le code est incorrect', async () => {
    twilioVerifyStatus = 'pending'; // pas 'approved'
    dbRows = [];
    const req = makeAuthReq(1, { body: { telephone: '+687751234', code: '000000' } });
    const res = makeRes();
    await callRoute('post', '/verify', req, res);
    assertStatus(res, 400);
  });
});

describe('DELETE /api/phone', () => {
  it('supprime le numéro de téléphone', async () => {
    dbRows = [];
    const req = makeAuthReq(1);
    const res = makeRes();
    await callRoute('delete', '/', req, res);
    assertStatus(res, 200);
    assert.ok(lastQuerySql.toLowerCase().includes('update'));
  });
});
