// ============================================================
//  Middleware — Rate Limiting
// ============================================================

const rateLimit = require('express-rate-limit')
const { createRedisRateLimitStore } = require('../services/redisRateLimitStore')
const { getTrustedClientIp } = require('../utils/clientIp')
const { logger } = require('../utils/logger')

const INTERNAL_FRONTEND_WINDOW_MS = 15 * 60 * 1000
const INTERNAL_FRONTEND_WARNING_RATIO = 0.5

const normalizeKeyPart = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized || 'unknown'
}

const getIpKey = (req) => getTrustedClientIp(req)

const keyByFields = (fields = []) => (req) => {
  const values = fields.map((field) => normalizeKeyPart(req.body?.[field] ?? req.query?.[field]))
  return `${getIpKey(req)}:${values.join(':')}`
}

const keyByUserOrIp = (req) => {
  if (req.user?.id) return `user:${req.user.id}`
  return `ip:${getIpKey(req)}`
}

const createRateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message, prefix = 'api', keyGenerator, skip } = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || getIpKey,
    skip,
    store: createRedisRateLimitStore(prefix),
    message: {
      error: message || `Trop de requêtes, veuillez réessayer dans ${Math.round(windowMs / 60000)} minutes.`,
    },
  })

// Limiteur général pour toutes les routes /api/
const isRefreshSessionPath = (req) => {
  const path = String(req.originalUrl || req.url || '').split('?')[0]
  return path === '/api/auth/refresh' || path === '/api/auth/refresh/logout'
}

const apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  prefix: 'api',
  skip: isRefreshSessionPath,
})

const configuredInternalFrontendMax = Number.parseInt(process.env.INTERNAL_FRONTEND_RATE_LIMIT_MAX || '', 10)
const internalFrontendLimiter = createRateLimit({
  windowMs: INTERNAL_FRONTEND_WINDOW_MS,
  max: Number.isSafeInteger(configuredInternalFrontendMax) && configuredInternalFrontendMax > 0
    ? configuredInternalFrontendMax
    : 100,
  prefix: 'internal-frontend',
  keyGenerator: () => 'frontend',
  message: 'Trop de lectures internes, veuillez réessayer plus tard.',
})

let lastWarnedInternalFrontendResetMs = 0

function internalFrontendUsageWarning(rateLimit, lastWarnedResetMs = 0) {
  const used = Number(rateLimit?.used)
  const limit = Number(rateLimit?.limit)
  const resetMs = rateLimit?.resetTime instanceof Date
    ? rateLimit.resetTime.getTime()
    : Number(rateLimit?.resetTime)
  if (!Number.isSafeInteger(used) || !Number.isSafeInteger(limit) || limit <= 0) return null
  if (!Number.isFinite(resetMs) || resetMs <= lastWarnedResetMs) return null

  const warningAt = Math.ceil(limit * INTERNAL_FRONTEND_WARNING_RATIO)
  if (used < warningAt) return null
  return { used, limit, warningAt, resetMs }
}

function warnInternalFrontendUsage(req, _res, next) {
  const warning = internalFrontendUsageWarning(
    req.rateLimit,
    lastWarnedInternalFrontendResetMs
  )
  if (warning) {
    lastWarnedInternalFrontendResetMs = warning.resetMs
    logger.warn('internal_frontend_rate_limit_half_consumed', {
      used: warning.used,
      limit: warning.limit,
      warning_at: warning.warningAt,
      window_ms: INTERNAL_FRONTEND_WINDOW_MS,
      window_minutes: INTERNAL_FRONTEND_WINDOW_MS / 60_000,
      reset_at: new Date(warning.resetMs).toISOString(),
    })
  }
  next()
}

const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: 'auth',
  skip: (req) => req.path === '/refresh' || req.path === '/refresh/logout',
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
})

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
  keyGenerator: (req) => req.refreshRateLimitKey || `invalid:${getIpKey(req)}`,
  message: 'Trop de rafraîchissements de session. Réessayez dans 15 minutes.',
})

const socialAuthLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  prefix: 'auth-social',
  message: 'Trop de tentatives de connexion sociale. Réessayez dans 15 minutes.',
})

const phoneLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  prefix: 'phone',
  keyGenerator: keyByFields(['telephone']),
  message: 'Trop de demandes de vérification téléphone. Réessayez dans 1 heure.',
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

const scanLimiter = createRateLimit({
  windowMs: 60 * 1000,
  max: 60,
  prefix: 'ticket-scan',
  keyGenerator: keyByUserOrIp,
  message: 'Trop de scans de billets. Réessayez dans 1 minute.',
})

// Limiteur upload
const uploadLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  prefix: 'upload',
  keyGenerator: keyByUserOrIp,
  message: 'Trop de téléversements. Réessayez dans 1 heure.',
})

module.exports = {
  rateLimit: createRateLimit,
  apiLimiter,
  internalFrontendLimiter,
  internalFrontendUsageWarning,
  warnInternalFrontendUsage,
  authLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verificationLimiter,
  refreshLimiter,
  socialAuthLimiter,
  phoneLimiter,
  scanLimiter,
  paymentLimiter,
  messageLimiter,
  uploadLimiter,
}
