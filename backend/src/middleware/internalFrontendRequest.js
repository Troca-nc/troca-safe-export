'use strict';

const crypto = require('crypto');

const INTERNAL_FRONTEND_HEADER = 'x-kalico-frontend-token';
const PUBLIC_READ_ROUTES = [
  /^\/api\/listings(?:\/\d+)?$/,
  /^\/api\/annonces\/stats$/,
  /^\/api\/users\/\d+(?:\/reviews)?$/,
  /^\/api\/pros(?:\/\d+(?:\/reviews)?)?$/,
  /^\/api\/events(?:\/\d+)?$/,
  /^\/api\/pro-quotes\/\d+$/,
];

function tokensMatch(incoming, configured) {
  if (typeof incoming !== 'string' || typeof configured !== 'string') return false;
  const left = Buffer.from(incoming);
  const right = Buffer.from(configured);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requestHeader(req, name) {
  if (typeof req.get === 'function') return req.get(name);
  return req.headers?.[name.toLowerCase()];
}

function isAllowedInternalPublicRead(method, path) {
  if (!['GET', 'HEAD'].includes(String(method || '').toUpperCase())) return false;
  return PUBLIC_READ_ROUTES.some((pattern) => pattern.test(String(path || '')));
}

function classifyInternalFrontendRequest(req, _res, next) {
  req.isInternalFrontendRequest = false;

  const incoming = requestHeader(req, INTERNAL_FRONTEND_HEADER);
  const configured = process.env.FRONTEND_INTERNAL_API_TOKEN?.trim();
  if (!tokensMatch(incoming, configured)) return next();

  // Toute requête publique traverse Nginx, qui ajoute X-Forwarded-For.
  // Le frontend appelle directement le backend sur le réseau Docker.
  if (requestHeader(req, 'x-forwarded-for')) return next();

  const path = String(req.originalUrl || req.url || '').split('?')[0];
  if (!isAllowedInternalPublicRead(req.method, path)) return next();

  req.isInternalFrontendRequest = true;
  return next();
}

module.exports = {
  INTERNAL_FRONTEND_HEADER,
  PUBLIC_READ_ROUTES,
  classifyInternalFrontendRequest,
  isAllowedInternalPublicRead,
  tokensMatch,
};
