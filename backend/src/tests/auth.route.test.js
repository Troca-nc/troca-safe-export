'use strict';

const assert = require('assert');
const { describe, it, makeRes, makeAuthReq, assertStatus } = require('./helpers');

const phoneOtpCalls = [];

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';

require.cache[require.resolve('../services/phoneOtpService')] = {
  id: require.resolve('../services/phoneOtpService'),
  filename: require.resolve('../services/phoneOtpService'),
  loaded: true,
  exports: {
    normalizePhoneNumber: (telephone) => telephone.startsWith('+') ? telephone : `+687${telephone.replace(/^0/, '')}`,
    resendPhoneOtp: async ({ user, telephone, preferChannel }) => {
      phoneOtpCalls.push({ userId: user.id, telephone, preferChannel });
      return {
        message: preferChannel === 'email' ? 'Code envoyé par email' : 'Code SMS envoyé',
        channel: preferChannel,
        masked: preferChannel === 'email' ? 't***@troca.nc' : '+687••••34',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        cooldown: 60,
      };
    },
  },
};

const queryCalls = [];
require.cache[require.resolve('../config/database')] = {
  id: require.resolve('../config/database'),
  filename: require.resolve('../config/database'),
  loaded: true,
  exports: {
    query: async (sql) => {
      queryCalls.push(sql);
      return { rows: [] };
    },
  },
};

const router = require('../routes/auth');

function callRoute(method, path, req, res) {
  return new Promise((resolve, reject) => {
    req.method = method.toUpperCase();
    req.url = path;
    res.setHeader = res.setHeader || (() => {});
    res.getHeader = res.getHeader || (() => undefined);
    res.status = ((original) => (code) => { res._code = code; return original.call(res, code); })(res.status);
    res.json = ((original) => (body) => { res._payload = body; resolve(); return original.call(res, body); })(res.json);
    res.send = ((original) => (body) => { res._payload = body; resolve(); return original.call(res, body); })(res.send || ((body) => body));
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

describe('POST /api/auth/otp/resend', () => {
  it('renvoie le code par email quand demandé', async () => {
    const req = makeAuthReq(1, { body: { telephone: '+687751234', channel: 'email' } });
    const res = makeRes();
    await callRoute('post', '/otp/resend', req, res);
    assertStatus(res, 200);
    assert.strictEqual(res._payload?.channel, 'email');
    assert.strictEqual(phoneOtpCalls[0]?.preferChannel, 'email');
    assert.ok(queryCalls.some((sql) => sql.toLowerCase().includes('select id from users')));
  });
});
