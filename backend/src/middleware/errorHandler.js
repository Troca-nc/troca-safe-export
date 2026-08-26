// ============================================================
//  Middleware — Gestion globale des erreurs
// ============================================================

const { logger } = require('../utils/logger');
const { sanitizeLogPath } = require('../utils/logSanitizer');
const { recordError } = require('../services/observability');
const { recordErrorLog } = require('../services/errorLogStore');

const errorHandler = (err, req, res, next) => {
  const path = sanitizeLogPath(req?.originalUrl ?? req?.url);
  recordError({
    source: 'api',
    request_id: req?.requestId ?? null,
    method: req?.method ?? null,
    path,
    user_id: req?.user?.id ?? null,
    error_code: err?.code ?? null,
    message: err?.message ?? null,
  });
  void recordErrorLog({
    level: err?.status >= 500 ? 'error' : 'warning',
    status: err?.status || 500,
    message: err?.message || 'Erreur interne du serveur',
    stack: process.env.NODE_ENV === 'production' ? null : err?.stack,
    route: `${req?.method || 'GET'} ${path}`,
    user_id: req?.user?.id ?? null,
    user_email: req?.user?.email ?? null,
    ip: req?.ip ?? null,
    user_agent: req?.headers?.['user-agent'] ?? null,
    body: null,
    request_id: req?.requestId ?? null,
    timestamp: new Date().toISOString(),
  });
  logger.error('request_error', {
    request_id: req?.requestId ?? null,
    method: req?.method ?? null,
    path,
    user_id: req?.user?.id ?? null,
    error: err,
  });

  // Erreur de validation Joi
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message, request_id: req?.requestId ?? null });
  }

  // Violation de contrainte PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Cette valeur existe déjà.', request_id: req?.requestId ?? null });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Référence invalide (clé étrangère).', request_id: req?.requestId ?? null });
  }

  // Erreur générique
  const status = err.status || 500;
  if (status === 429 && err.retryAfter) {
    res.setHeader('Retry-After', String(err.retryAfter));
  }
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Erreur interne du serveur'
    : err.message || 'Erreur interne du serveur';

  res.status(status).json({ error: message, request_id: req?.requestId ?? null });
};

module.exports = errorHandler;
