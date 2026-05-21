'use strict';

function internalAuth(req, res, next) {
  const configured = process.env.INTERNAL_API_TOKEN?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === 'development') return next();
    return res.status(503).json({ error: 'Observabilité interne non configurée' });
  }

  const incoming = req.get('x-internal-token') || req.query?.token;
  if (incoming && incoming === configured) return next();

  return res.status(403).json({ error: 'Accès interne refusé' });
}

module.exports = { internalAuth };
