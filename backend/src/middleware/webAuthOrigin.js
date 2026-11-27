'use strict';

function normalizeOrigin(value) {
  try {
    return new URL(String(value || '')).origin;
  } catch {
    return '';
  }
}

function allowedWebOrigins() {
  const origins = new Set([
    normalizeOrigin(process.env.BASE_URL || 'http://localhost:3000'),
  ]);
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }
  origins.delete('');
  return origins;
}

function verifyWebAuthOrigin(req, res, next) {
  const origin = normalizeOrigin(req.get?.('origin') || req.headers?.origin);
  const fetchSite = String(req.get?.('sec-fetch-site') || req.headers?.['sec-fetch-site'] || '').toLowerCase();
  if (!origin || !allowedWebOrigins().has(origin) || (fetchSite && fetchSite !== 'same-origin')) {
    return res.status(403).json({
      error: 'Origine de la requête refusée.',
      code: 'AUTH_ORIGIN_INVALID',
    });
  }
  return next();
}

module.exports = { allowedWebOrigins, verifyWebAuthOrigin };
