// ============================================================
//  Middleware — Authentification JWT
// ============================================================

const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../config/database');
const { isAccessTokenBlacklisted } = require('../services/authAccountService');

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
    if (await isAccessTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.', code: 'TOKEN_REVOKED' });
    }
    const payload = verifyAccessToken(token);

    // Vérifier que l'utilisateur existe encore
    let user = null;
    try {
      const result = await query(
        'SELECT id, email, is_admin, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at, deleted_at, banned_until FROM users WHERE id = $1',
        [payload.sub]
      );
      user = result.rows[0];
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production') {
        user = {
          id: payload.sub,
          email: null,
          is_admin: false,
          is_pro: false,
          pro_plan: null,
          pro_expires_at: null,
          last_bon_plan_offer_at: null,
          deleted_at: null,
          banned_until: null,
        };
      } else {
        throw dbErr;
      }
    }

    if (!user && process.env.NODE_ENV !== 'production') {
      user = {
        id: payload.sub,
        email: null,
        is_admin: false,
        is_pro: false,
        pro_plan: null,
        pro_expires_at: null,
        last_bon_plan_offer_at: null,
        deleted_at: null,
        banned_until: null,
      };
    }

    if (!user || user.deleted_at) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' });
    }

    // Vérifier le ban temporaire
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return res.status(403).json({
        error: 'Votre compte est temporairement suspendu.',
        banned_until: user.banned_until,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide' });
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
    if (await isAccessTokenBlacklisted(token)) {
      req.user = null;
      return next();
    }
    const payload = verifyAccessToken(token);
    const result = await query(
      'SELECT id, email, is_admin, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [payload.sub]
    );
    req.user = result.rows[0] || null;
  } catch {
    req.user = null;
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
