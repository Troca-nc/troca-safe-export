// ============================================================
//  Middleware — Authentification JWT
// ============================================================

const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../config/database');
const { isAccessTokenBlacklisted } = require('../services/authAccountService');
const { applyCurrentProEntitlement } = require('../services/proEntitlementService');

function authDependencyError(cause) {
  const error = new Error('Le service d’authentification est temporairement indisponible.');
  error.status = 503;
  error.code = 'AUTH_DEPENDENCY_UNAVAILABLE';
  error.cause = cause;
  return error;
}

function isJwtError(error) {
  return ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error?.name);
}

/**
 * Middleware obligatoire — bloque si non connecté
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant. Veuillez vous connecter.' });
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (await isAccessTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.', code: 'TOKEN_REVOKED' });
    }

    // L'identité applicative vient toujours du compte persistant.
    // Une erreur DB ou un compte absent ne doit jamais être remplacé par le JWT.
    const result = await query(
      `SELECT u.id, u.email, u.is_admin, u.is_pro, u.pro_plan, u.pro_expires_at,
              u.last_bon_plan_offer_at, u.deleted_at, u.banned_until, u.auth_invalid_before,
              session.id AS auth_session_id, session.revoked_at AS auth_session_revoked_at,
              session.expires_at AS auth_session_expires_at
       FROM users u
       LEFT JOIN auth_sessions session
         ON session.id = $2 AND session.user_id = u.id
       WHERE u.id = $1`,
      [payload.sub, payload.sid || null]
    );
    const user = result.rows[0];

    if (!user || user.deleted_at) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' });
    }
    if (user.auth_invalid_before && Number(payload.iat || 0) * 1000 <= new Date(user.auth_invalid_before).getTime()) {
      return res.status(401).json({ error: 'Session révoquée.', code: 'SESSION_REVOKED' });
    }
    if (payload.sid && (
      !user.auth_session_id
      || user.auth_session_revoked_at
      || new Date(user.auth_session_expires_at).getTime() <= Date.now()
    )) {
      return res.status(401).json({ error: 'Session révoquée.', code: 'SESSION_REVOKED' });
    }

    // Vérifier le ban temporaire
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return res.status(403).json({
        error: 'Votre compte est temporairement suspendu.',
        banned_until: user.banned_until,
      });
    }

    req.user = applyCurrentProEntitlement(user);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.', code: 'TOKEN_EXPIRED' });
    }
    if (isJwtError(err)) return res.status(401).json({ error: 'Token invalide' });
    return next(authDependencyError(err));
  }
};

/**
 * Middleware optionnel — continue même si non connecté
 * Utile pour les pages publiques (liste annonces, détail)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (await isAccessTokenBlacklisted(token)) {
      req.user = null;
      return next();
    }
    const result = await query(
      `SELECT u.id, u.email, u.is_admin, u.is_pro, u.pro_plan, u.pro_expires_at,
              u.last_bon_plan_offer_at, u.banned_until, u.auth_invalid_before,
              session.id AS auth_session_id, session.revoked_at AS auth_session_revoked_at,
              session.expires_at AS auth_session_expires_at
       FROM users u
       LEFT JOIN auth_sessions session
         ON session.id = $2 AND session.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [payload.sub, payload.sid || null]
    );
    const user = result.rows[0] || null;
    const credentialsRevoked = Boolean(
      user?.auth_invalid_before
      && Number(payload.iat || 0) * 1000 <= new Date(user.auth_invalid_before).getTime()
    );
    const sessionRevoked = Boolean(payload.sid && (
      !user?.auth_session_id
      || user.auth_session_revoked_at
      || new Date(user.auth_session_expires_at).getTime() <= Date.now()
    ));
    req.user = !user || credentialsRevoked || sessionRevoked || (user.banned_until && new Date(user.banned_until) > new Date())
      ? null
      : applyCurrentProEntitlement(user);
  } catch (error) {
    if (isJwtError(error)) {
      req.user = null;
      return next();
    }
    return next(authDependencyError(error));
  }
  next();
};

/**
 * Middleware admin — bloque si non administrateur
 */
const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin };
