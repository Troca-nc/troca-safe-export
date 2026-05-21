// ============================================================
//  JWT — Génération et vérification des tokens
// ============================================================

const jwt = require('jsonwebtoken');
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

/**
 * Génère un access token + refresh token pour un utilisateur
 */
const generateTokens = (userId) => {
  const accessSecret = getAccessSecret();
  const refreshSecret = getRefreshSecret();
  const accessExpires = getAccessExpires();
  const refreshExpires = getRefreshExpires();

  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    accessSecret,
    { expiresIn: accessExpires }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshExpires }
  );

  // Date d'expiration du refresh token (pour la BDD)
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

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

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
