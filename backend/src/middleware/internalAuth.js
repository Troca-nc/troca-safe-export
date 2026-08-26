'use strict';

const crypto = require('crypto');

function tokensMatch(incoming, configured) {
  if (typeof incoming !== 'string' || typeof configured !== 'string') return false;
  const left = Buffer.from(incoming);
  const right = Buffer.from(configured);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function internalAuth(req, res, next) {
  const configured = process.env.INTERNAL_API_TOKEN?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === 'development') return next();
    return res.status(503).json({ error: 'Observabilité interne non configurée' });
  }

  const incoming = req.get('x-internal-token');
  if (tokensMatch(incoming, configured)) return next();

  return res.status(403).json({ error: 'Accès interne refusé' });
}

module.exports = { internalAuth, tokensMatch };
