// ============================================================
//  Middleware — Authentification JWT
// ============================================================

const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../config/database');

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

    // Vérifier que l'utilisateur existe encore
    const result = await query(
      'SELECT id, email, is_admin, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at, deleted_at, banned_until FROM users WHERE id = $1',
      [payload.sub]
    );

    const user = result.rows[0];
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
