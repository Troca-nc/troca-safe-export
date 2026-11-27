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
const sessionServicePath = require.resolve('../services/authSessionService');

const originalDatabaseCache = require.cache[databasePath];
const originalRedisCache = require.cache[redisPath];
const originalServiceCache = require.cache[servicePath];
const originalSessionServiceCache = require.cache[sessionServicePath];

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

    if (normalized.startsWith('SELECT USER_ID FROM EMAIL_VERIFICATION_TOKENS')) {
      return { rows: [{ user_id: 21 }], rowCount: 1 };
    }

    if (normalized.startsWith('SELECT USER_ID FROM PASSWORD_RESET_TOKENS')) {
      return { rows: [{ user_id: 22 }], rowCount: 1 };
    }

    if (normalized.startsWith('UPDATE USERS SET EMAIL_VERIFIED = TRUE')) {
      return {
        rows: [{ id: 21, email: 'verified@test.nc', prenom: 'Verified', email_verified: true }],
        rowCount: 1,
      };
    }

    if (normalized.startsWith('SELECT ID, EMAIL, PRENOM, NOM, IS_ADMIN, ACCOUNT_TYPE, CASE WHEN IS_PRO = TRUE AND PRO_EXPIRES_AT > NOW() THEN TRUE ELSE FALSE END AS IS_PRO')) {
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
        const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();
        if (normalized.startsWith('SELECT USER_ID FROM PASSWORD_RESET_TOKENS')) {
          return { rows: [{ user_id: 22 }], rowCount: 1 };
        }
        if (normalized.startsWith('UPDATE AUTH_SESSIONS')) {
          return { rows: [{ id: 'session-test' }], rowCount: 1 };
        }
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
require.cache[sessionServicePath] = {
  exports: {
    hashRefreshToken: (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex'),
    issueSessionTokens: async () => ({ accessToken: 'access', refreshToken: 'refresh' }),
    revokeAllUserSessionsWithClient: async (client, userId, reason) => client.query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revocation_reason = $2',
      [userId, reason]
    ),
    revokeSessionByRefreshToken: async () => null,
    rotateRefreshToken: async () => ({ accessToken: 'access', refreshToken: 'refresh' }),
  },
};
delete require.cache[servicePath];

const {
  confirmEmail,
  hashAccountActionToken,
  hashRefreshToken,
  resetPasswordWithToken,
  upsertEmailVerificationToken,
  upsertPasswordResetToken,
} = require('../services/authAccountService');

require.cache[databasePath] = originalDatabaseCache;
require.cache[redisPath] = originalRedisCache;
if (originalServiceCache) {
  require.cache[servicePath] = originalServiceCache;
} else {
  delete require.cache[servicePath];
}
if (originalSessionServiceCache) require.cache[sessionServicePath] = originalSessionServiceCache;
else delete require.cache[sessionServicePath];

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

describe('authAccountService — refresh token hashing', () => {
  it('produit une empreinte SHA-256 déterministe sans conserver le token brut', () => {
    const token = 'refresh-token-secret';
    const expected = crypto.createHash('sha256').update(token).digest('hex');

    assert.strictEqual(hashRefreshToken(token), expected);
    assert.strictEqual(hashRefreshToken(token).length, 64);
    assert.notStrictEqual(hashRefreshToken(token), token);
  });

});

describe('authAccountService — account action tokens', () => {
  it('hachage SHA-256 déterministe des jetons à usage unique', () => {
    const token = 'account-action-token-secret';
    const expected = crypto.createHash('sha256').update(token).digest('hex');

    assert.strictEqual(hashAccountActionToken(token), expected);
    assert.strictEqual(hashAccountActionToken(token).length, 64);
    assert.notStrictEqual(hashAccountActionToken(token), token);
  });

  it('ne persiste pas en clair les jetons de vérification et de reset', async () => {
    resetState();
    const expiresAt = new Date(Date.now() + 60_000);
    const verificationToken = 'raw-verification-token';
    const resetToken = 'raw-reset-token';

    await upsertEmailVerificationToken(21, verificationToken, expiresAt);
    await upsertPasswordResetToken(22, resetToken, expiresAt);

    const verificationInsert = queryCalls.find((call) => call.sql.toUpperCase().includes('INSERT INTO EMAIL_VERIFICATION_TOKENS'));
    const resetInsert = queryCalls.find((call) => call.sql.toUpperCase().includes('INSERT INTO PASSWORD_RESET_TOKENS'));
    assert.strictEqual(verificationInsert.params[1], hashAccountActionToken(verificationToken));
    assert.strictEqual(resetInsert.params[1], hashAccountActionToken(resetToken));
    assert.ok(!queryCalls.some((call) => call.params?.includes(verificationToken)));
    assert.ok(!queryCalls.some((call) => call.params?.includes(resetToken)));
  });

  it('recherche la vérification email uniquement par empreinte', async () => {
    resetState();
    const token = 'raw-email-verification-token';

    const user = await confirmEmail(token);

    const lookup = queryCalls.find((call) => call.sql.toUpperCase().includes('SELECT USER_ID FROM EMAIL_VERIFICATION_TOKENS'));
    assert.strictEqual(lookup.params[0], hashAccountActionToken(token));
    assert.strictEqual(user.id, 21);
    assert.ok(!queryCalls.some((call) => call.params?.includes(token)));
  });

  it('recherche le reset de mot de passe uniquement par empreinte', async () => {
    resetState();
    const token = 'raw-password-reset-token';

    const result = await resetPasswordWithToken(token, 'A-strong-test-password-2026!');

    const lookup = txCalls.find((call) => call.sql.toUpperCase().includes('SELECT USER_ID FROM PASSWORD_RESET_TOKENS'));
    assert.strictEqual(lookup.params[0], hashAccountActionToken(token));
    assert.strictEqual(result, 22);
    assert.ok(!queryCalls.concat(txCalls).some((call) => call.params?.includes(token)));
    assert.ok(txCalls.some((call) => call.sql.toUpperCase().includes('UPDATE AUTH_SESSIONS')));
  });
});
