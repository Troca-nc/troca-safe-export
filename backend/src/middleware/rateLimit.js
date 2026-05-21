// ============================================================
//  Middleware — Rate Limiting
// ============================================================

const rateLimit = require('express-rate-limit')
const { createRedisRateLimitStore } = require('../services/redisRateLimitStore')

const normalizeKeyPart = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized || 'unknown'
}

const getIpKey = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip ?? 'unknown'
}

const keyByFields = (fields = []) => (req) => {
  const values = fields.map((field) => normalizeKeyPart(req.body?.[field] ?? req.query?.[field]))
  return `${getIpKey(req)}:${values.join(':')}`
}

const keyByUserOrIp = (req) => {
  if (req.user?.id) return `user:${req.user.id}`
  return `ip:${getIpKey(req)}`
}

const createRateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message, prefix = 'api', keyGenerator } = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip ?? 'unknown'),
    store: createRedisRateLimitStore(prefix),
    message: {
      error: message || `Trop de requêtes, veuillez réessayer dans ${Math.round(windowMs / 60000)} minutes.`,
    },
  })

// Limiteur général pour toutes les routes /api/
const apiLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 300, prefix: 'api' })

// Limiteur strict pour les routes d'authentification (anti brute-force)
const loginLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: 'auth-login',
  keyGenerator: keyByFields(['email']),
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
})

const registerLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  prefix: 'auth-register',
  keyGenerator: keyByFields(['email']),
  message: 'Trop de créations de compte. Réessayez dans 1 heure.',
})

const forgotPasswordLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'auth-forgot',
  keyGenerator: keyByFields(['email']),
  message: 'Trop de demandes de réinitialisation. Réessayez dans 15 minutes.',
})

const verificationLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'auth-verification',
  keyGenerator: keyByFields(['email']),
  message: 'Trop de demandes de vérification. Réessayez dans 15 minutes.',
})

const refreshLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  prefix: 'auth-refresh',
  keyGenerator: keyByFields(['refresh_token']),
  message: 'Trop de rafraîchissements de session. Réessayez dans 15 minutes.',
})

const socialAuthLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  prefix: 'auth-social',
  message: 'Trop de tentatives de connexion sociale. Réessayez dans 15 minutes.',
})

const phoneLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'phone',
  keyGenerator: keyByUserOrIp,
  message: 'Trop de demandes de vérification téléphone. Réessayez dans 15 minutes.',
})

const paymentLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: 'payment',
  keyGenerator: keyByUserOrIp,
  message: 'Trop de tentatives de paiement. Réessayez dans 15 minutes.',
})

const messageLimiter = createRateLimit({
  windowMs: 60 * 1000,
  max: 15,
  prefix: 'message',
  keyGenerator: keyByUserOrIp,
  message: 'Trop d’actions de messagerie. Réessayez dans 1 minute.',
})

// Limiteur upload
const uploadLimiter = createRateLimit({
  windowMs: 60 * 1000,
  max: 10,
  prefix: 'upload',
  keyGenerator: keyByUserOrIp,
})

const authLimiter = loginLimiter

module.exports = {
  rateLimit: createRateLimit,
  apiLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verificationLimiter,
  refreshLimiter,
  socialAuthLimiter,
  phoneLimiter,
  paymentLimiter,
  messageLimiter,
  uploadLimiter,
}
