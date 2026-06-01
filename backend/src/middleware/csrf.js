'use strict';

const crypto = require('crypto');
const { setSecureCookie } = require('../config/cookies');

const CSRF_COOKIE_NAME = 'troca_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((acc, pair) => {
    const [rawName, ...rawValue] = pair.split('=');
    const name = String(rawName || '').trim();
    if (!name) return acc;
    const value = rawValue.join('=').trim();
    acc[name] = decodeURIComponent(value || '');
    return acc;
  }, {});
}

function getCsrfCookie(req) {
  if (req.cookies && req.cookies[CSRF_COOKIE_NAME]) {
    return String(req.cookies[CSRF_COOKIE_NAME]);
  }
  const cookies = parseCookieHeader(req.headers?.cookie);
  return cookies[CSRF_COOKIE_NAME] ? String(cookies[CSRF_COOKIE_NAME]) : '';
}

function getCsrfCandidate(req) {
  const headerToken = req.headers?.[CSRF_HEADER_NAME];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  if (typeof req.body?._csrf === 'string' && req.body._csrf.trim()) {
    return req.body._csrf.trim();
  }
  return '';
}

function csrfMiddleware(req, res, next) {
  const method = String(req.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const existing = getCsrfCookie(req);
  if (existing) {
    res.locals.csrfToken = existing;
    return next();
  }

  const token = generateCsrfToken();
  res.locals.csrfToken = token;
  setSecureCookie(res, CSRF_COOKIE_NAME, token, {
    httpOnly: false,
  });
  return next();
}

function verifyCsrf(req, res, next) {
  const cookieToken = getCsrfCookie(req);
  const candidate = getCsrfCandidate(req);

  if (!cookieToken && !candidate) {
    return next();
  }

  if (!cookieToken || !candidate || cookieToken !== candidate) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  return next();
}

module.exports = {
  CSRF_COOKIE_NAME,
  csrfMiddleware,
  generateCsrfToken,
  verifyCsrf,
};
