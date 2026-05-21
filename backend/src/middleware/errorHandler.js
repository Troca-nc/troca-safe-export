// ============================================================
//  Middleware — Gestion globale des erreurs
// ============================================================

const { logger } = require('../utils/logger');
const { recordError } = require('../services/observability');

const errorHandler = (err, req, res, next) => {
  recordError({
    source: 'api',
    request_id: req?.requestId ?? null,
    method: req?.method ?? null,
    path: req?.originalUrl ?? req?.url ?? null,
    user_id: req?.user?.id ?? null,
    error_code: err?.code ?? null,
    message: err?.message ?? null,
  });
  logger.error('request_error', {
    request_id: req?.requestId ?? null,
    method: req?.method ?? null,
    path: req?.originalUrl ?? req?.url ?? null,
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
