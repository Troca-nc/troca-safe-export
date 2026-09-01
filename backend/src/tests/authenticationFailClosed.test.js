'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness({ env = 'development', user = { id: 7, deleted_at: null, banned_until: null }, queryError = false } = {}) {
  const queries = [];
  const auth = load('middleware/auth.js', {
    '../config/jwt': { verifyAccessToken: () => ({ sub: 7 }) },
    '../config/database': {
      async query(sql, params) {
        queries.push({ sql, params: Array.from(params) });
        if (queryError) throw new Error('Synthetic database failure');
        return { rows: user ? [user] : [] };
      },
    },
    '../services/authAccountService': { isAccessTokenBlacklisted: async () => false },
  }, { process: { env: { NODE_ENV: env } }, Date });

  async function invoke() {
    const req = { headers: { authorization: 'Bearer synthetic' } };
    const res = {
      statusCode: 200,
      payload: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; return this; },
    };
    let nextCalls = 0;
    await auth.authenticate(req, res, () => { nextCalls++; });
    return { req, res, nextCalls };
  }

  return { invoke, queries };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }

  for (const env of ['development', 'test', 'production']) {
    await check(`${env}: persistent account is required and attached`, async () => {
      const h = harness({ env });
      const result = await h.invoke();
      assert.strictEqual(result.nextCalls, 1);
      assert.strictEqual(result.req.user.id, 7);
      assert.strictEqual(h.queries.length, 1);
    });
    await check(`${env}: missing account fails closed`, async () => {
      const result = await harness({ env, user: null }).invoke();
      assert.strictEqual(result.nextCalls, 0);
      assert.strictEqual(result.req.user, undefined);
      assert.strictEqual(result.res.statusCode, 401);
      assert.match(result.res.payload.error, /introuvable|désactivé/);
    });
    await check(`${env}: database failure fails closed`, async () => {
      const result = await harness({ env, queryError: true }).invoke();
      assert.strictEqual(result.nextCalls, 0);
      assert.strictEqual(result.req.user, undefined);
      assert.strictEqual(result.res.statusCode, 401);
      assert.strictEqual(result.res.payload.error, 'Token invalide');
    });
  }

  await check('deleted account remains rejected', async () => {
    const result = await harness({ user: { id: 7, deleted_at: new Date().toISOString(), banned_until: null } }).invoke();
    assert.strictEqual(result.nextCalls, 0);
    assert.strictEqual(result.res.statusCode, 401);
  });

  console.log(`Authentication fail-closed policy: ${count} checks passed (isolated middleware).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
