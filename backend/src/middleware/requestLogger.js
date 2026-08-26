'use strict';

const { logger } = require('../utils/logger');
const { sanitizeLogPath } = require('../utils/logSanitizer');
const { recordHttp } = require('../services/observability');

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const path = sanitizeLogPath(req.originalUrl || req.url);
    recordHttp({
      requestId: req.requestId,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id ?? null,
    });
    logger.info('http_request', {
      request_id: req.requestId,
      method: req.method,
      path,
      status_code: res.statusCode,
      duration_ms: durationMs,
      user_id: req.user?.id ?? null,
      ip: req.ip,
      user_agent: req.get('user-agent'),
    });
  });

  next();
}

module.exports = { requestLogger };
