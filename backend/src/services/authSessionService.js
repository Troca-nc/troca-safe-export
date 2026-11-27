'use strict';

const crypto = require('crypto');
const { query, withTransaction } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const {
  generateTokens,
  getJwtSecret,
  verifyRefreshToken,
} = require('../config/jwt');
const { isNativeAuthEnabled } = require('../config/nativeAuth');

const REFRESH_REUSE_GRACE_MS = 15_000;
const replayFallback = new Map();

function createHttpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function dependencyUnavailable(cause) {
  const error = createHttpError(
    503,
    'Le service de session est temporairement indisponible.',
    'AUTH_DEPENDENCY_UNAVAILABLE'
  );
  error.cause = cause;
  return error;
}

function isHttpError(error) {
  return Number.isInteger(error?.status) && error.status >= 400 && error.status < 600;
}

function hashRefreshToken(refreshToken) {
  return crypto.createHash('sha256').update(String(refreshToken || '')).digest('hex');
}

function replayKey(refreshHash) {
  return `refresh:replay:${refreshHash}`;
}

function replayEncryptionKey() {
  return crypto
    .createHash('sha256')
    .update(`${getJwtSecret()}:kalico-refresh-replay:v1`)
    .digest();
}

function encryptReplay(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', replayEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

function decryptReplay(value) {
  const [ivPart, tagPart, ciphertextPart] = String(value || '').split('.');
  if (!ivPart || !tagPart || !ciphertextPart) return null;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    replayEncryptionKey(),
    Buffer.from(ivPart, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext);
}

function cleanupReplayFallback() {
  const now = Date.now();
  for (const [key, entry] of replayFallback.entries()) {
    if (entry.expiresAt <= now) replayFallback.delete(key);
  }
}

async function getReplayClient() {
  try {
    return await getRedisClient();
  } catch (error) {
    throw dependencyUnavailable(error);
  }
}

async function writeReplay(client, refreshHash, payload) {
  const encrypted = encryptReplay(payload);
  try {
    if (client) {
      await client.set(replayKey(refreshHash), encrypted, { PX: REFRESH_REUSE_GRACE_MS });
      return;
    }
    cleanupReplayFallback();
    replayFallback.set(replayKey(refreshHash), {
      value: encrypted,
      expiresAt: Date.now() + REFRESH_REUSE_GRACE_MS,
    });
  } catch (error) {
    throw dependencyUnavailable(error);
  }
}

async function readReplay(client, refreshHash) {
  try {
    let encrypted;
    if (client) {
      encrypted = await client.get(replayKey(refreshHash));
    } else {
      cleanupReplayFallback();
      encrypted = replayFallback.get(replayKey(refreshHash))?.value || null;
    }
    if (!encrypted) return null;
    return decryptReplay(encrypted);
  } catch (error) {
    if (isHttpError(error)) throw error;
    throw dependencyUnavailable(error);
  }
}

function normalizeClientType(clientType) {
  return clientType === 'native' ? 'native' : 'web';
}

function normalizeDeviceLabel(deviceLabel) {
  const value = String(deviceLabel || '').trim();
  return value ? value.slice(0, 160) : null;
}

async function issueSessionTokens(userId, options = {}) {
  const clientType = normalizeClientType(options.clientType);
  if (clientType === 'native' && !isNativeAuthEnabled()) {
    throw createHttpError(403, 'Authentification native désactivée.', 'NATIVE_AUTH_DISABLED');
  }

  const sessionId = crypto.randomUUID();
  const tokens = generateTokens(userId, { sessionId });
  try {
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO auth_sessions (
           id, user_id, client_type, device_label, expires_at, last_used_at
         ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          sessionId,
          userId,
          clientType,
          normalizeDeviceLabel(options.deviceLabel),
          tokens.refreshExpiresAt,
        ]
      );
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, session_id)
         VALUES ($1, $2, $3, $4)`,
        [userId, hashRefreshToken(tokens.refreshToken), tokens.refreshExpiresAt, sessionId]
      );
    });
  } catch (error) {
    if (isHttpError(error)) throw error;
    throw dependencyUnavailable(error);
  }

  return { ...tokens, sessionId, clientType };
}

function terminalRefreshError(code) {
  const messages = {
    REFRESH_EXPIRED: 'Token de rafraîchissement expiré.',
    REFRESH_INVALID: 'Token de rafraîchissement invalide.',
    REFRESH_REUSED: 'Réutilisation du token de rafraîchissement détectée.',
    SESSION_EXPIRED: 'Session expirée.',
    SESSION_REVOKED: 'Session révoquée.',
    USER_NOT_FOUND: 'Utilisateur introuvable.',
  };
  return createHttpError(401, messages[code] || messages.REFRESH_INVALID, code);
}

async function rotateRefreshToken(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw terminalRefreshError(error?.name === 'TokenExpiredError' ? 'REFRESH_EXPIRED' : 'REFRESH_INVALID');
  }

  const refreshHash = hashRefreshToken(refreshToken);
  const replayClient = await getReplayClient();
  let outcome;

  try {
    outcome = await withTransaction(async (client) => {
      const tokenResult = await client.query(
        `SELECT rt.id, rt.user_id, rt.session_id, rt.expires_at,
                rt.used_at, rt.revoked_at, rt.replaced_by_token_id,
                session.expires_at AS session_expires_at,
                session.revoked_at AS session_revoked_at,
                u.auth_invalid_before, u.deleted_at
         FROM refresh_tokens rt
         JOIN auth_sessions session ON session.id = rt.session_id
         JOIN users u ON u.id = rt.user_id
         WHERE rt.token = $1
         FOR UPDATE OF rt, session`,
        [refreshHash]
      );
      const row = tokenResult.rows[0];
      if (!row || Number(row.user_id) !== Number(payload.sub)) {
        return { errorCode: 'REFRESH_INVALID' };
      }
      if (row.deleted_at) return { errorCode: 'USER_NOT_FOUND' };
      if (row.session_revoked_at || row.revoked_at) return { errorCode: 'SESSION_REVOKED' };
      if (new Date(row.session_expires_at).getTime() <= Date.now()) {
        return { errorCode: 'SESSION_EXPIRED' };
      }
      if (row.auth_invalid_before && Number(payload.iat || 0) * 1000 <= new Date(row.auth_invalid_before).getTime()) {
        await revokeSessionWithClient(client, row.session_id, 'credentials_changed');
        return { errorCode: 'SESSION_REVOKED' };
      }

      if (row.used_at) {
        const ageMs = Date.now() - new Date(row.used_at).getTime();
        if (ageMs >= 0 && ageMs <= REFRESH_REUSE_GRACE_MS && row.replaced_by_token_id) {
          const replay = await readReplay(replayClient, refreshHash);
          if (replay && replay.sessionId === String(row.session_id)) {
            return { replay, wasReplay: true };
          }
        }
        await revokeSessionWithClient(client, row.session_id, 'refresh_reuse');
        return { errorCode: 'REFRESH_REUSED' };
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        return { errorCode: 'REFRESH_EXPIRED' };
      }

      const next = generateTokens(row.user_id, { sessionId: row.session_id });
      const replay = {
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
        refreshExpiresAt: next.refreshExpiresAt.toISOString(),
        sessionId: String(row.session_id),
      };
      await writeReplay(replayClient, refreshHash, replay);
      const inserted = await client.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, session_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [row.user_id, hashRefreshToken(next.refreshToken), next.refreshExpiresAt, row.session_id]
      );
      await client.query(
        `UPDATE refresh_tokens
         SET used_at = NOW(), replaced_by_token_id = $2
         WHERE id = $1`,
        [row.id, inserted.rows[0].id]
      );
      await client.query(
        `UPDATE auth_sessions
         SET last_used_at = NOW(), expires_at = $2
         WHERE id = $1`,
        [row.session_id, next.refreshExpiresAt]
      );
      return { replay, wasReplay: false };
    });
  } catch (error) {
    if (isHttpError(error)) throw error;
    throw dependencyUnavailable(error);
  }

  if (outcome.errorCode) throw terminalRefreshError(outcome.errorCode);
  return {
    accessToken: outcome.replay.accessToken,
    refreshToken: outcome.replay.refreshToken,
    refreshExpiresAt: new Date(outcome.replay.refreshExpiresAt),
    sessionId: outcome.replay.sessionId,
    replayed: outcome.wasReplay,
  };
}

async function revokeSessionWithClient(client, sessionId, reason) {
  await client.query(
    `UPDATE auth_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()),
         revocation_reason = COALESCE(revocation_reason, $2)
     WHERE id = $1`,
    [sessionId, reason]
  );
  await client.query(
    `UPDATE refresh_tokens
     SET revoked_at = COALESCE(revoked_at, NOW())
     WHERE session_id = $1 AND revoked_at IS NULL`,
    [sessionId]
  );
}

async function revokeSession(sessionId, reason = 'logout') {
  if (!sessionId) return false;
  try {
    return await withTransaction(async (client) => {
      const result = await client.query(
        `SELECT id FROM auth_sessions WHERE id = $1 FOR UPDATE`,
        [sessionId]
      );
      if (!result.rows[0]) return false;
      await revokeSessionWithClient(client, sessionId, reason);
      return true;
    });
  } catch (error) {
    throw dependencyUnavailable(error);
  }
}

async function revokeSessionByRefreshToken(refreshToken, reason = 'logout') {
  if (!refreshToken) return null;
  const refreshHash = hashRefreshToken(refreshToken);
  try {
    return await withTransaction(async (client) => {
      const result = await client.query(
        `SELECT session_id FROM refresh_tokens WHERE token = $1 FOR UPDATE`,
        [refreshHash]
      );
      const sessionId = result.rows[0]?.session_id;
      if (!sessionId) return null;
      await revokeSessionWithClient(client, sessionId, reason);
      return String(sessionId);
    });
  } catch (error) {
    throw dependencyUnavailable(error);
  }
}

async function revokeAllUserSessionsWithClient(client, userId, reason = 'credentials_changed') {
  await client.query(
    `UPDATE users SET auth_invalid_before = NOW(), updated_at = NOW() WHERE id = $1`,
    [userId]
  );
  const result = await client.query(
    `UPDATE auth_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()),
         revocation_reason = COALESCE(revocation_reason, $2)
     WHERE user_id = $1 AND revoked_at IS NULL
     RETURNING id`,
    [userId, reason]
  );
  await client.query(
    `UPDATE refresh_tokens
     SET revoked_at = COALESCE(revoked_at, NOW())
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  return result.rows.map((row) => String(row.id));
}

async function revokeAllUserSessions(userId, reason = 'credentials_changed') {
  try {
    return await withTransaction((client) => revokeAllUserSessionsWithClient(client, userId, reason));
  } catch (error) {
    throw dependencyUnavailable(error);
  }
}

async function isSessionActive(sessionId, userId) {
  if (!sessionId) return true;
  try {
    const result = await query(
      `SELECT 1
       FROM auth_sessions
       WHERE id = $1 AND user_id = $2
         AND revoked_at IS NULL AND expires_at > NOW()`,
      [sessionId, userId]
    );
    return Boolean(result.rows[0]);
  } catch (error) {
    throw dependencyUnavailable(error);
  }
}

module.exports = {
  REFRESH_REUSE_GRACE_MS,
  createHttpError,
  dependencyUnavailable,
  hashRefreshToken,
  isSessionActive,
  issueSessionTokens,
  revokeAllUserSessions,
  revokeAllUserSessionsWithClient,
  revokeSession,
  revokeSessionByRefreshToken,
  rotateRefreshToken,
};
