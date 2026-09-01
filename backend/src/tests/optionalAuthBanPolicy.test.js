'use strict';

const assert = require('assert');
const { load } = require('./paymentTransactionHarness');

function harness({ user = { id: 7, banned_until: null }, tokenState = 'valid', queryError = false } = {}) {
  const queries = [];
  const auth = load('middleware/auth.js', {
    '../config/jwt': {
      verifyAccessToken(token) {
        if (tokenState === 'invalid') throw new Error('Synthetic invalid token');
        return { sub: 7, token };
      },
    },
    '../config/database': {
      async query(sql, params) {
        queries.push({ sql, params: Array.from(params) });
        assert.match(sql, /banned_until/);
        assert.match(sql, /deleted_at IS NULL/);
        if (queryError) throw new Error('Synthetic DB failure');
        return { rows: user ? [user] : [] };
      },
    },
    '../services/authAccountService': {
      async isAccessTokenBlacklisted() { return tokenState === 'revoked'; },
    },
  }, { process: { env: { NODE_ENV: 'test' } }, Date });
  async function invoke(header = 'Bearer synthetic') {
    const req = { headers: header ? { authorization: header } : {} };
    let calls = 0;
    await auth.optionalAuth(req, {}, () => { calls++; });
    return { req, calls };
  }
  return { invoke, queries };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }
  await check('active account is attached', async () => {
    const h = harness(); const result = await h.invoke();
    assert.strictEqual(result.req.user.id, 7); assert.strictEqual(result.calls, 1); assert.strictEqual(h.queries.length, 1);
  });
  await check('future ban becomes anonymous', async () => {
    const result = await harness({ user: { id: 7, banned_until: new Date(Date.now() + 60000).toISOString() } }).invoke();
    assert.strictEqual(result.req.user, null); assert.strictEqual(result.calls, 1);
  });
  await check('past ban remains authenticated', async () => {
    const result = await harness({ user: { id: 7, banned_until: new Date(Date.now() - 60000).toISOString() } }).invoke();
    assert.strictEqual(result.req.user.id, 7);
  });
  for (const tokenState of ['revoked', 'invalid']) {
    await check(`${tokenState} token becomes anonymous`, async () => {
      const h = harness({ tokenState }); const result = await h.invoke();
      assert.strictEqual(result.req.user, null); assert.strictEqual(result.calls, 1);
      assert.strictEqual(h.queries.length, 0);
    });
  }
  await check('missing account becomes anonymous', async () => {
    assert.strictEqual((await harness({ user: null }).invoke()).req.user, null);
  });
  await check('database failure becomes anonymous', async () => {
    assert.strictEqual((await harness({ queryError: true }).invoke()).req.user, null);
  });
  await check('missing bearer token stays anonymous without query', async () => {
    const h = harness(); const result = await h.invoke(null);
    assert.strictEqual(result.req.user, null); assert.strictEqual(result.calls, 1); assert.strictEqual(h.queries.length, 0);
  });
  console.log(`Optional authentication ban policy: ${count} checks passed (isolated middleware).`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
