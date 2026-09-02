'use strict';

// ============================================================
//  Tests — services/authAccountService.js
// ============================================================

const assert = require('assert');
const crypto = require('crypto');
const { describe, it } = require('./helpers');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_minimum_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const databasePath = require.resolve('../config/database');
const redisPath = require.resolve('../config/redis');
const servicePath = require.resolve('../services/authAccountService');

const originalDatabaseCache = require.cache[databasePath];
const originalRedisCache = require.cache[redisPath];
const originalServiceCache = require.cache[servicePath];

const queryCalls = [];
const txCalls = [];
const redisGets = [];
const redisSets = [];
const redisState = new Map();

const dbStub = {
  query: async (sql, params) => {
    queryCalls.push({ sql, params });
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (normalized.startsWith('SELECT ID FROM REFRESH_TOKENS')) {
      return { rows: [{ id: 1 }], rowCount: 1 };
    }

    if (normalized.startsWith('SELECT ID, EMAIL, PRENOM, NOM, IS_ADMIN, ACCOUNT_TYPE, CASE WHEN IS_PRO = TRUE AND (PRO_EXPIRES_AT IS NULL OR PRO_EXPIRES_AT > NOW()) THEN TRUE ELSE FALSE END AS IS_PRO')) {
      return {
        rows: [{
          id: params[0],
          email: 'user@test.nc',
          prenom: 'Test',
          nom: 'User',
          is_admin: false,
          account_type: 'personal',
          is_pro: false,
          pro_plan: null,
          pro_expires_at: null,
          last_bon_plan_offer_at: null,
          email_verified: true,
          onboarding_step: 0,
          deleted_at: null,
        }],
        rowCount: 1,
      };
    }

    if (normalized.startsWith('DELETE FROM REFRESH_TOKENS')) {
      return { rows: [], rowCount: 1 };
    }

    if (normalized.startsWith('INSERT INTO REFRESH_TOKENS')) {
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  },
  withTransaction: async (fn) => {
    const client = {
      query: async (sql, params) => {
        txCalls.push({ sql, params });
        return { rows: [], rowCount: 1 };
      },
    };
    return fn(client);
  },
};

const redisClient = {
  get: async (key) => {
    redisGets.push(key);
    return redisState.get(key) ?? null;
  },
  set: async (key, value, options) => {
    redisSets.push({ key, value, options });
    redisState.set(key, value);
  },
};

require.cache[databasePath] = { exports: dbStub };
require.cache[redisPath] = { exports: { getRedisClient: async () => redisClient } };
delete require.cache[servicePath];

const {
  buildRefreshBlacklistKey,
  deleteRefreshToken,
  hashRefreshToken,
  refreshSessionWithRotation,
} = require('../services/authAccountService');

require.cache[databasePath] = originalDatabaseCache;
require.cache[redisPath] = originalRedisCache;
if (originalServiceCache) {
  require.cache[servicePath] = originalServiceCache;
} else {
  delete require.cache[servicePath];
}

const { generateTokens } = require('../config/jwt');

function resetState() {
  queryCalls.length = 0;
  txCalls.length = 0;
  redisGets.length = 0;
  redisSets.length = 0;
  redisState.clear();
}

function withRefreshExpiry(expiry, fn) {
  const previous = process.env.JWT_REFRESH_EXPIRES;
  process.env.JWT_REFRESH_EXPIRES = expiry;

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (previous === undefined) {
        delete process.env.JWT_REFRESH_EXPIRES;
      } else {
        process.env.JWT_REFRESH_EXPIRES = previous;
      }
    });
}

describe('authAccountService — refresh rotation', () => {
  it('produit une empreinte SHA-256 déterministe sans conserver le token brut', () => {
    const token = 'refresh-token-secret';
    const expected = crypto.createHash('sha256').update(token).digest('hex');

    assert.strictEqual(hashRefreshToken(token), expected);
    assert.strictEqual(hashRefreshToken(token).length, 64);
    assert.notStrictEqual(hashRefreshToken(token), token);
  });

  it('rejette un refresh token déjà blacklisté', async () => {
    resetState();

    await withRefreshExpiry('2h', async () => {
      const { refreshToken } = generateTokens(7);
      redisState.set(buildRefreshBlacklistKey(refreshToken), '1');

      await assert.rejects(() => refreshSessionWithRotation(refreshToken), /rafra/i);
      assert.strictEqual(queryCalls.length, 0);
      assert.strictEqual(txCalls.length, 0);
      assert.ok(redisGets.includes(buildRefreshBlacklistKey(refreshToken)));
    });
  });

  it('rotationne le refresh token et blackliste l ancien', async () => {
    resetState();

    await withRefreshExpiry('2h', async () => {
      const { refreshToken } = generateTokens(7);
      const result = await refreshSessionWithRotation(refreshToken);

      assert.ok(typeof result.accessToken === 'string' && result.accessToken.length > 20);
      assert.ok(typeof result.refreshToken === 'string' && result.refreshToken.length > 20);
      assert.notStrictEqual(result.refreshToken, refreshToken);

      const expectedKey = buildRefreshBlacklistKey(refreshToken);
      const blacklistEntry = redisSets.find((entry) => entry.key === expectedKey);
      assert.ok(blacklistEntry, 'Blacklist Redis non écrite');
      assert.strictEqual(blacklistEntry.options.PX, 2 * 60 * 60 * 1000);

      const lookup = queryCalls.find((call) => call.sql.toUpperCase().includes('SELECT ID FROM REFRESH_TOKENS'));
      const deletion = txCalls.find((call) => call.sql.toUpperCase().includes('DELETE FROM REFRESH_TOKENS'));
      const insertion = txCalls.find((call) => call.sql.toUpperCase().includes('INSERT INTO REFRESH_TOKENS'));
      assert.strictEqual(lookup.params[0], hashRefreshToken(refreshToken));
      assert.strictEqual(deletion.params[0], hashRefreshToken(refreshToken));
      assert.strictEqual(insertion.params[1], hashRefreshToken(result.refreshToken));
      assert.ok(!queryCalls.concat(txCalls).some((call) => call.params?.includes(refreshToken)));
      assert.ok(!queryCalls.concat(txCalls).some((call) => call.params?.includes(result.refreshToken)));
    });
  });

  it('révoque aussi un refresh token lors du logout', async () => {
    resetState();

    await withRefreshExpiry('2h', async () => {
      const { refreshToken } = generateTokens(12);
      await deleteRefreshToken(refreshToken);

      const expectedKey = buildRefreshBlacklistKey(refreshToken);
      assert.ok(queryCalls.some((call) => call.sql.toUpperCase().includes('DELETE FROM REFRESH_TOKENS') && call.params[0] === hashRefreshToken(refreshToken)));
      assert.ok(!queryCalls.some((call) => call.params?.includes(refreshToken)));
      assert.ok(redisSets.some((entry) => entry.key === expectedKey));
    });
  });
});
