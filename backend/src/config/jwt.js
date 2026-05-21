// ============================================================
//  JWT — Génération et vérification des tokens
// ============================================================

const jwt = require('jsonwebtoken');
const { requireConfiguredEnv } = require('./env');

const JWT_SECRET = requireConfiguredEnv('JWT_SECRET', {
  fallback: 'dev_secret_change_in_prod',
  minLength: 64,
});
const ACCESS_SECRET  = JWT_SECRET;
const REFRESH_SECRET = `${JWT_SECRET}_refresh`;

const ACCESS_EXPIRES =
  process.env.JWT_EXPIRES_IN ||
  process.env.JWT_ACCESS_EXPIRES ||
  '15m';

const REFRESH_EXPIRES =
  process.env.JWT_REFRESH_EXPIRES_IN ||
  process.env.JWT_REFRESH_EXPIRES ||
  '30d';

/**
 * Génère un access token + refresh token pour un utilisateur
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
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
  const payload = jwt.verify(token, ACCESS_SECRET);
  if (payload.type !== 'access') throw new Error('Type de token invalide');
  return payload;
};

/**
 * Vérifie un refresh token et retourne le payload
 */
const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, REFRESH_SECRET);
  if (payload.type !== 'refresh') throw new Error('Type de token invalide');
  return payload;
};

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
