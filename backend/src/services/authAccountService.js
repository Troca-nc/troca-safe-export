'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, withTransaction } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { generateTokens, getRefreshExpiresMs, verifyAccessToken, verifyRefreshToken } = require('../config/jwt');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeAccountType(accountType) {
  const value = String(accountType || '').trim().toLowerCase();
  if (value === 'professional' || value === 'pro') return 'professional';
  return 'personal';
}

function createHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) {
    err.code = code;
  }
  return err;
}

function buildRefreshBlacklistKey(refreshToken) {
  const hash = crypto.createHash('sha256').update(String(refreshToken || '')).digest('hex');
  return `refresh:blacklist:${hash}`;
}

function buildAccessBlacklistKey(accessToken) {
  const hash = crypto.createHash('sha256').update(String(accessToken || '')).digest('hex');
  return `access:blacklist:${hash}`;
}

function buildSafeUser(user) {
  if (!user) return null;
  const { password_hash, deleted_at, ...safeUser } = user;
  return safeUser;
}

function createTimedToken(ttlMs) {
  return {
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + ttlMs),
  };
}

const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAILURE_MAX = 5;
const loginFallback = new Map();

function getLoginScope(email, ip) {
  return `${normalizeEmail(email)}|${String(ip || 'unknown').trim().toLowerCase() || 'unknown'}`;
}

function getLoginScopes(email, ip) {
  const normalizedEmail = normalizeEmail(email);
  const scopes = [
    `email:${normalizedEmail}`,
    `email_ip:${getLoginScope(email, ip)}`,
  ];
  return [...new Set(scopes)];
}

function cleanupLoginFallback(scope) {
  const entry = loginFallback.get(scope);
  if (!entry) return null;
  if (entry.blockedUntil && entry.blockedUntil <= Date.now()) {
    loginFallback.delete(scope);
    return null;
  }
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    loginFallback.delete(scope);
    return null;
  }
  return entry;
}

async function getLoginThrottleState(scopes) {
  const client = await getRedisClient();
  if (client) {
    let blockedUntil = 0;
    let count = 0;
    for (const scope of scopes) {
      blockedUntil = Math.max(blockedUntil, Number(await client.get(`login:block:${scope}`) || 0));
      count = Math.max(count, Number(await client.get(`login:fail:${scope}`) || 0));
    }
    return {
      blockedUntil: Number.isFinite(blockedUntil) ? blockedUntil : 0,
      count,
      source: 'redis',
    };
  }

  let blockedUntil = 0;
  let count = 0;
  for (const scope of scopes) {
    const fallback = cleanupLoginFallback(scope);
    if (!fallback) continue;
    blockedUntil = Math.max(blockedUntil, fallback.blockedUntil || 0);
    count = Math.max(count, fallback.count || 0);
  }
  return { blockedUntil, count, source: 'memory' };
}

async function recordLoginFailure(scopes) {
  const client = await getRedisClient();
  if (client) {
    let maxCount = 0;
    let maxBlockedUntil = 0;
    for (const scope of scopes) {
      const count = await client.incr(`login:fail:${scope}`);
      if (count === 1) {
        await client.expire(`login:fail:${scope}`, Math.ceil(LOGIN_FAILURE_WINDOW_MS / 1000));
      }
      maxCount = Math.max(maxCount, count);
      if (count >= LOGIN_FAILURE_MAX) {
        const blockedUntil = Date.now() + LOGIN_FAILURE_WINDOW_MS;
        await client.set(`login:block:${scope}`, String(blockedUntil), {
          PX: LOGIN_FAILURE_WINDOW_MS,
        });
        await client.del(`login:fail:${scope}`);
        maxBlockedUntil = Math.max(maxBlockedUntil, blockedUntil);
      }
    }
    return { count: maxCount, blockedUntil: maxBlockedUntil };
  }

  let maxCount = 0;
  let maxBlockedUntil = 0;
  for (const scope of scopes) {
    const existing = cleanupLoginFallback(scope) || { count: 0, expiresAt: Date.now() + LOGIN_FAILURE_WINDOW_MS, blockedUntil: 0 };
    existing.count += 1;
    existing.expiresAt = Date.now() + LOGIN_FAILURE_WINDOW_MS;
    if (existing.count >= LOGIN_FAILURE_MAX) {
      existing.blockedUntil = Date.now() + LOGIN_FAILURE_WINDOW_MS;
    }
    loginFallback.set(scope, existing);
    maxCount = Math.max(maxCount, existing.count);
    maxBlockedUntil = Math.max(maxBlockedUntil, existing.blockedUntil || 0);
  }
  return { count: maxCount, blockedUntil: maxBlockedUntil };
}

async function clearLoginFailures(scopes) {
  const client = await getRedisClient();
  if (client) {
    const keys = scopes.flatMap((scope) => [`login:fail:${scope}`, `login:block:${scope}`]);
    await client.del(...keys).catch(() => {});
    return;
  }
  for (const scope of scopes) {
    loginFallback.delete(scope);
  }
}

function createVerificationToken() {
  return createTimedToken(24 * 60 * 60 * 1000);
}

function createPasswordResetToken() {
  return createTimedToken(60 * 60 * 1000);
}

async function upsertEmailVerificationToken(userId, token, expiresAt) {
  await query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [userId, token, expiresAt]
  ).catch(() => {});
}

async function upsertPasswordResetToken(userId, token, expiresAt) {
  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [userId, token, expiresAt]
  ).catch(() => {});
}

async function persistRefreshToken(userId, refreshToken, refreshExpiresAt) {
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [userId, refreshToken, refreshExpiresAt]
  ).catch(() => {});
}

async function deleteRefreshToken(refreshToken) {
  await revokeRefreshToken(refreshToken);
}

async function blacklistRefreshToken(refreshToken) {
  const client = await getRedisClient();
  if (!client || !refreshToken) return false;

  try {
    await client.set(buildRefreshBlacklistKey(refreshToken), '1', {
      PX: Math.max(1, getRefreshExpiresMs()),
    });
    return true;
  } catch {
    return false;
  }
}

async function blacklistAccessToken(accessToken) {
  const client = await getRedisClient();
  if (!client || !accessToken) return false;

  try {
    const payload = verifyAccessToken(accessToken);
    const ttlMs = Math.max(1, (Number(payload.exp || 0) * 1000) - Date.now());
    await client.set(buildAccessBlacklistKey(accessToken), '1', {
      PX: ttlMs,
    });
    return true;
  } catch {
    return false;
  }
}

async function isRefreshTokenBlacklisted(refreshToken) {
  const client = await getRedisClient();
  if (!client || !refreshToken) return false;

  try {
    return Boolean(await client.get(buildRefreshBlacklistKey(refreshToken)));
  } catch {
    return false;
  }
}

async function isAccessTokenBlacklisted(accessToken) {
  const client = await getRedisClient();
  if (!client || !accessToken) return false;

  try {
    return Boolean(await client.get(buildAccessBlacklistKey(accessToken)));
  } catch {
    return false;
  }
}

async function revokeRefreshToken(refreshToken) {
  await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]).catch(() => {});
  await blacklistRefreshToken(refreshToken).catch(() => {});
}

async function rotateRefreshToken(userId, oldRefreshToken) {
  const { accessToken, refreshToken: newRefresh, refreshExpiresAt } = generateTokens(userId);

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM refresh_tokens WHERE token = $1`, [oldRefreshToken]);
    await client.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, newRefresh, refreshExpiresAt]
    );
  });

  await blacklistRefreshToken(oldRefreshToken).catch(() => {});

  return { accessToken, refreshToken: newRefresh };
}

async function findUserByEmail(email) {
  return query(
    `SELECT id, email, password_hash, prenom, nom, is_admin, account_type,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, email_verified, onboarding_step, deleted_at
     FROM users WHERE email = $1`,
    [normalizeEmail(email)]
  );
}

async function findUserById(userId) {
  return query(
    `SELECT id, email, prenom, nom, telephone, phone_verified, email_verified,
            avatar_url, commune_id, bio, is_admin, account_type,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, onboarding_step,
            nb_annonces, note_moyenne, nb_avis, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
}

async function registerAccount({ email, password, prenom, nom, commune_id, account_type }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedAccountType = normalizeAccountType(account_type);
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw createHttpError(409, 'Cet email est déjà utilisé.');
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO users (email, password_hash, prenom, nom, commune_id, is_pro, account_type, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id, email, prenom, nom, is_admin, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified, onboarding_step, account_type`,
      [normalizedEmail, password_hash, prenom.trim(), nom.trim(), commune_id || null, normalizedAccountType === 'professional', normalizedAccountType]
    );
    return ins.rows[0];
  });

  const verification = createVerificationToken();
  await upsertEmailVerificationToken(user.id, verification.token, verification.expiresAt);

  const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(user.id);
  await persistRefreshToken(user.id, refreshToken, refreshExpiresAt);

  return {
    user,
    verificationToken: verification.token,
    accessToken,
    refreshToken,
  };
}

async function loginAccount({ email, password }, meta = {}) {
  const scopes = getLoginScopes(email, meta.ip);
  const throttle = await getLoginThrottleState(scopes);
  if (throttle.blockedUntil && throttle.blockedUntil > Date.now()) {
    const waitMs = Math.max(0, throttle.blockedUntil - Date.now());
    const retryAfter = Math.max(1, Math.ceil(waitMs / 1000));
    const err = createHttpError(429, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 'LOGIN_LOCKED');
    err.retryAfter = retryAfter;
    throw err;
  }

  const result = await findUserByEmail(email);
  const user = result.rows[0];

  if (!user || !user.password_hash) {
    const after = await recordLoginFailure(scopes);
    if (after.blockedUntil && after.blockedUntil > Date.now()) {
      const err = createHttpError(429, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 'LOGIN_LOCKED');
      err.retryAfter = Math.max(1, Math.ceil((after.blockedUntil - Date.now()) / 1000));
      throw err;
    }
    throw createHttpError(401, 'Email ou mot de passe incorrect.');
  }
  if (user.deleted_at) {
    throw createHttpError(401, 'Ce compte a été supprimé.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const after = await recordLoginFailure(scopes);
    if (after.blockedUntil && after.blockedUntil > Date.now()) {
      const err = createHttpError(429, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 'LOGIN_LOCKED');
      err.retryAfter = Math.max(1, Math.ceil((after.blockedUntil - Date.now()) / 1000));
      throw err;
    }
    throw createHttpError(401, 'Email ou mot de passe incorrect.');
  }

  if (!user.email_verified) {
    throw createHttpError(403, 'Veuillez confirmer votre email avant de vous connecter.', 'EMAIL_NOT_VERIFIED');
  }

  await clearLoginFailures(scopes);
  const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(user.id);
  await persistRefreshToken(user.id, refreshToken, refreshExpiresAt);

  return {
    user: buildSafeUser(user),
    accessToken,
    refreshToken,
  };
}

// SECURITY: rotation active, old refresh tokens are revoked and blacklisted on use.
// TODO: test refresh rotation after deploy with Redis blacklist enabled.
async function refreshSessionWithRotation(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createHttpError(401, 'Token de rafraÃ®chissement invalide ou expirÃ©.');
  }

  if (await isRefreshTokenBlacklisted(refreshToken)) {
    throw createHttpError(401, 'Token de rafraÃ®chissement invalide ou expirÃ©.');
  }

  const tokenRow = await query(
    `SELECT id FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
    [refreshToken, payload.sub]
  ).catch(() => ({ rows: [] }));
  if (!tokenRow.rows[0]) {
    throw createHttpError(401, 'Token de rafraÃ®chissement invalide ou expirÃ©.');
  }

  const user = await query(
    `SELECT id, email, prenom, nom, is_admin, account_type,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, email_verified
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [payload.sub]
  );
  if (!user.rows[0]) {
    throw createHttpError(401, 'Utilisateur introuvable.');
  }

  return rotateRefreshToken(payload.sub, refreshToken);
}

async function requestPasswordReset(email) {
  const result = await query(
    `SELECT id, email, prenom, account_type, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [normalizeEmail(email)]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const token = createPasswordResetToken();
  await upsertPasswordResetToken(result.rows[0].id, token.token, token.expiresAt);

  return {
    user: result.rows[0],
    token: token.token,
  };
}

async function confirmEmail(token) {
  const tokenRow = await query(
    `SELECT user_id FROM email_verification_tokens
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (!tokenRow.rows[0]) {
    return null;
  }

  const userRow = await query(
    `UPDATE users
     SET email_verified = TRUE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, prenom, nom, is_admin, account_type, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified`,
    [tokenRow.rows[0].user_id]
  );

  await query(`DELETE FROM email_verification_tokens WHERE user_id = $1`, [tokenRow.rows[0].user_id]).catch(() => {});

  return userRow.rows[0] || null;
}

async function resendVerification(email) {
  const result = await query(
    `SELECT id, email, prenom, account_type, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [normalizeEmail(email)]
  );

  const user = result.rows[0];
  if (!user || user.email_verified) {
    return null;
  }

  const verification = createVerificationToken();
  await upsertEmailVerificationToken(user.id, verification.token, verification.expiresAt);

  return {
    user,
    token: verification.token,
  };
}

async function resetPasswordWithToken(token, password) {
  const tokenRow = await query(
    `SELECT user_id FROM password_reset_tokens
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (!tokenRow.rows[0]) {
    return false;
  }

  const hash = await bcrypt.hash(password, 12);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, tokenRow.rows[0].user_id]);
  await query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [tokenRow.rows[0].user_id]).catch(() => {});

  return true;
}

module.exports = {
  buildSafeUser,
  blacklistAccessToken,
  blacklistRefreshToken,
  confirmEmail,
  createHttpError,
  buildRefreshBlacklistKey,
  buildAccessBlacklistKey,
  createPasswordResetToken,
  createVerificationToken,
  deleteRefreshToken,
  findUserByEmail,
  findUserById,
  loginAccount,
  normalizeEmail,
  persistRefreshToken,
  refreshSessionWithRotation,
  registerAccount,
  resendVerification,
  requestPasswordReset,
  resetPasswordWithToken,
  isAccessTokenBlacklisted,
  revokeRefreshToken,
  rotateRefreshToken,
  upsertEmailVerificationToken,
  upsertPasswordResetToken,
};
