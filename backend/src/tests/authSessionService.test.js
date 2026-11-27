'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');

process.env.JWT_SECRET = 'test_jwt_secret_minimum_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

function createHarness({ failDatabase = false, failRedis = false } = {}) {
  const sessions = new Map();
  const tokens = new Map();
  const redis = new Map();
  let tokenSequence = 0;

  async function execute(sql, params = []) {
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    if (failDatabase && normalized.startsWith('SELECT RT.ID')) {
      throw new Error('Synthetic PostgreSQL outage');
    }
    if (normalized.startsWith('INSERT INTO AUTH_SESSIONS')) {
      sessions.set(String(params[0]), {
        id: String(params[0]), user_id: Number(params[1]), client_type: params[2],
        device_label: params[3], expires_at: params[4], last_used_at: new Date(),
        revoked_at: null, revocation_reason: null,
      });
      return { rows: [], rowCount: 1 };
    }
    if (normalized.startsWith('INSERT INTO REFRESH_TOKENS')) {
      const row = {
        id: ++tokenSequence, user_id: Number(params[0]), token: params[1],
        expires_at: params[2], session_id: String(params[3]), used_at: null,
        revoked_at: null, replaced_by_token_id: null,
      };
      tokens.set(row.token, row);
      return { rows: [{ id: row.id }], rowCount: 1 };
    }
    if (normalized.startsWith('SELECT RT.ID')) {
      const row = tokens.get(params[0]);
      if (!row) return { rows: [], rowCount: 0 };
      const session = sessions.get(row.session_id);
      return {
        rows: [{
          ...row,
          session_expires_at: session.expires_at,
          session_revoked_at: session.revoked_at,
          auth_invalid_before: null,
          deleted_at: null,
        }],
        rowCount: 1,
      };
    }
    if (normalized.startsWith('UPDATE REFRESH_TOKENS SET USED_AT')) {
      const row = [...tokens.values()].find((candidate) => candidate.id === Number(params[0]));
      row.used_at = new Date();
      row.replaced_by_token_id = Number(params[1]);
      return { rows: [], rowCount: 1 };
    }
    if (normalized.startsWith('UPDATE AUTH_SESSIONS SET LAST_USED_AT')) {
      const session = sessions.get(String(params[0]));
      session.last_used_at = new Date();
      session.expires_at = params[1];
      return { rows: [], rowCount: 1 };
    }
    if (normalized.startsWith('UPDATE AUTH_SESSIONS SET REVOKED_AT')) {
      const byUser = normalized.includes('WHERE USER_ID = $1');
      const affected = [];
      for (const session of sessions.values()) {
        if ((byUser && session.user_id === Number(params[0])) || (!byUser && session.id === String(params[0]))) {
          session.revoked_at = session.revoked_at || new Date();
          session.revocation_reason = session.revocation_reason || params[1];
          affected.push({ id: session.id });
        }
      }
      return { rows: affected, rowCount: affected.length };
    }
    if (normalized.startsWith('UPDATE REFRESH_TOKENS SET REVOKED_AT')) {
      const byUser = normalized.includes('WHERE USER_ID = $1');
      for (const row of tokens.values()) {
        if ((byUser && row.user_id === Number(params[0])) || (!byUser && row.session_id === String(params[0]))) {
          row.revoked_at = row.revoked_at || new Date();
        }
      }
      return { rows: [], rowCount: 1 };
    }
    if (normalized.startsWith('UPDATE USERS SET AUTH_INVALID_BEFORE')) {
      return { rows: [], rowCount: 1 };
    }
    if (normalized.startsWith('SELECT ID FROM AUTH_SESSIONS')) {
      const session = sessions.get(String(params[0]));
      return { rows: session ? [{ id: session.id }] : [], rowCount: session ? 1 : 0 };
    }
    if (normalized.startsWith('SELECT SESSION_ID FROM REFRESH_TOKENS')) {
      const row = tokens.get(params[0]);
      return { rows: row ? [{ session_id: row.session_id }] : [], rowCount: row ? 1 : 0 };
    }
    if (normalized.startsWith('SELECT 1 FROM AUTH_SESSIONS')) {
      const session = sessions.get(String(params[0]));
      const active = session && session.user_id === Number(params[1]) && !session.revoked_at;
      return { rows: active ? [{ '?column?': 1 }] : [], rowCount: active ? 1 : 0 };
    }
    throw new Error(`Unexpected SQL: ${normalized}`);
  }

  const redisClient = {
    async get(key) {
      if (failRedis) throw new Error('Synthetic Redis outage');
      return redis.get(key) || null;
    },
    async set(key, value) {
      if (failRedis) throw new Error('Synthetic Redis outage');
      redis.set(key, value);
    },
  };

  const databasePath = require.resolve('../config/database');
  const redisPath = require.resolve('../config/redis');
  const servicePath = require.resolve('../services/authSessionService');
  const previousDatabase = require.cache[databasePath];
  const previousRedis = require.cache[redisPath];
  const previousService = require.cache[servicePath];
  require.cache[databasePath] = {
    exports: {
      query: execute,
      withTransaction: async (fn) => fn({ query: execute }),
    },
  };
  require.cache[redisPath] = { exports: { getRedisClient: async () => redisClient } };
  delete require.cache[servicePath];
  const service = require('../services/authSessionService');
  if (previousDatabase) require.cache[databasePath] = previousDatabase;
  else delete require.cache[databasePath];
  if (previousRedis) require.cache[redisPath] = previousRedis;
  else delete require.cache[redisPath];
  if (previousService) require.cache[servicePath] = previousService;
  else delete require.cache[servicePath];

  return { redis, service, sessions, tokens };
}

describe('authSessionService', () => {
  it('crée une famille Web et signe le même sid dans les deux jetons', async () => {
    const h = createHarness();
    const issued = await h.service.issueSessionTokens(7, { clientType: 'web' });
    const access = require('../config/jwt').verifyAccessToken(issued.accessToken);
    const refresh = require('../config/jwt').verifyRefreshToken(issued.refreshToken);
    assert.strictEqual(access.sid, issued.sessionId);
    assert.strictEqual(refresh.sid, issued.sessionId);
    assert.strictEqual(h.sessions.get(issued.sessionId).client_type, 'web');
    assert.ok(![...h.tokens.values()].some((row) => row.token === issued.refreshToken));
  });

  it('rotationne sous verrou et rejoue exactement le même descendant pendant 15 secondes', async () => {
    const h = createHarness();
    const issued = await h.service.issueSessionTokens(7, { clientType: 'web' });
    const first = await h.service.rotateRefreshToken(issued.refreshToken);
    const duplicate = await h.service.rotateRefreshToken(issued.refreshToken);
    assert.strictEqual(duplicate.accessToken, first.accessToken);
    assert.strictEqual(duplicate.refreshToken, first.refreshToken);
    assert.strictEqual(duplicate.replayed, true);
    assert.strictEqual(h.sessions.get(issued.sessionId).revoked_at, null);
    const redisPayload = [...h.redis.values()].join('');
    assert.ok(!redisPayload.includes(first.refreshToken));
    assert.ok(!redisPayload.includes(first.accessToken));
  });

  it('révoque toute la famille quand un ancien token est rejoué après la grâce', async () => {
    const h = createHarness();
    const issued = await h.service.issueSessionTokens(7, { clientType: 'web' });
    const first = await h.service.rotateRefreshToken(issued.refreshToken);
    const oldRow = [...h.tokens.values()].find((row) => row.used_at);
    oldRow.used_at = new Date(Date.now() - h.service.REFRESH_REUSE_GRACE_MS - 1);
    await assert.rejects(
      () => h.service.rotateRefreshToken(issued.refreshToken),
      (error) => error.status === 401 && error.code === 'REFRESH_REUSED'
    );
    assert.ok(h.sessions.get(issued.sessionId).revoked_at);
    await assert.rejects(
      () => h.service.rotateRefreshToken(first.refreshToken),
      (error) => error.status === 401 && error.code === 'SESSION_REVOKED'
    );
  });

  it('expose des codes 401 stables pour un token inconnu et une famille expirée', async () => {
    const h = createHarness();
    const unknown = require('../config/jwt').generateTokens(7, {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
    }).refreshToken;
    await assert.rejects(
      () => h.service.rotateRefreshToken(unknown),
      (error) => error.status === 401 && error.code === 'REFRESH_INVALID'
    );

    const issued = await h.service.issueSessionTokens(7, { clientType: 'web' });
    h.sessions.get(issued.sessionId).expires_at = new Date(Date.now() - 1);
    await assert.rejects(
      () => h.service.rotateRefreshToken(issued.refreshToken),
      (error) => error.status === 401 && error.code === 'SESSION_EXPIRED'
    );
  });

  it('renvoie 503 sur une panne PostgreSQL au lieu d’un faux 401', async () => {
    const healthy = createHarness();
    const issued = await healthy.service.issueSessionTokens(7, { clientType: 'web' });
    const broken = createHarness({ failDatabase: true });
    await assert.rejects(
      () => broken.service.rotateRefreshToken(issued.refreshToken),
      (error) => error.status === 503 && error.code === 'AUTH_DEPENDENCY_UNAVAILABLE'
    );
  });

  it('renvoie 503 sur une panne Redis au lieu de révoquer la session', async () => {
    const h = createHarness({ failRedis: true });
    const issued = await h.service.issueSessionTokens(7, { clientType: 'web' });
    await assert.rejects(
      () => h.service.rotateRefreshToken(issued.refreshToken),
      (error) => error.status === 503 && error.code === 'AUTH_DEPENDENCY_UNAVAILABLE'
    );
    assert.strictEqual(h.sessions.get(issued.sessionId).revoked_at, null);
  });

  it('prépare la révocation de toutes les familles sans interface utilisateur', async () => {
    const h = createHarness();
    const first = await h.service.issueSessionTokens(7, { clientType: 'web' });
    const second = await h.service.issueSessionTokens(7, { clientType: 'web' });
    const revoked = await h.service.revokeAllUserSessions(7, 'all_devices');
    assert.deepStrictEqual(new Set(revoked), new Set([first.sessionId, second.sessionId]));
    assert.ok(h.sessions.get(first.sessionId).revoked_at);
    assert.ok(h.sessions.get(second.sessionId).revoked_at);
  });
});
