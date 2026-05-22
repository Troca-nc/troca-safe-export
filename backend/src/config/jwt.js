// ============================================================
//  JWT — Génération et vérification des tokens
// ============================================================

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { requireConfiguredEnv } = require('./env');

function getJwtSecret() {
  return requireConfiguredEnv('JWT_SECRET', {
    fallback: 'dev_secret_change_in_prod',
    minLength: 64,
  });
}

function getAccessSecret() {
  return getJwtSecret();
}

function getRefreshSecret() {
  return getJwtSecret();
}

function getAccessExpires() {
  return process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES || '15m';
}

function getRefreshExpires() {
  return process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES || '30d';
}

function parseDurationToMs(duration, fallbackMs = 30 * 24 * 60 * 60 * 1000) {
  const normalized = String(duration || '').trim();
  const match = normalized.match(/^(\d+)(ms|s|m|h|d|w)?$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackMs;

  const unit = (match[2] || 'ms').toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return Math.round(amount * (multipliers[unit] || 1));
}

function getRefreshExpiresMs() {
  return parseDurationToMs(getRefreshExpires());
}

/**
 * Génère un access token + refresh token pour un utilisateur
 */
const generateTokens = (userId) => {
  const accessSecret = getAccessSecret();
  const refreshSecret = getRefreshSecret();
  const accessExpires = getAccessExpires();
  const refreshExpires = getRefreshExpires();
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    accessSecret,
    { expiresIn: accessExpires, jwtid: accessJti }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshExpires, jwtid: refreshJti }
  );

  // Date d'expiration du refresh token (pour la BDD) alignée sur JWT_REFRESH_EXPIRES
  const refreshExpiresAt = new Date(Date.now() + getRefreshExpiresMs());

  return { accessToken, refreshToken, refreshExpiresAt };
};

/**
 * Vérifie un access token et retourne le payload
 */
const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, getAccessSecret());
  if (payload.type !== 'access') throw new Error('Type de token invalide');
  return payload;
};

/**
 * Vérifie un refresh token et retourne le payload
 */
const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, getRefreshSecret());
  if (payload.type !== 'refresh') throw new Error('Type de token invalide');
  return payload;
};

module.exports = { generateTokens, getRefreshExpires, getRefreshExpiresMs, verifyAccessToken, verifyRefreshToken };
