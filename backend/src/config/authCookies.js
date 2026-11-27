'use strict';

const { clearSecureCookie, getCookieValue, setSecureCookie } = require('./cookies');
const { getRefreshExpiresMs } = require('./jwt');

const REFRESH_COOKIE_NAME = 'kalico_refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth/refresh';
const LEGACY_REFRESH_COOKIE_PATH = '/';

function setRefreshCookie(res, refreshToken) {
  clearSecureCookie(res, REFRESH_COOKIE_NAME, { path: LEGACY_REFRESH_COOKIE_PATH });
  setSecureCookie(res, REFRESH_COOKIE_NAME, refreshToken, {
    maxAge: getRefreshExpiresMs(),
    path: REFRESH_COOKIE_PATH,
  });
}

function clearRefreshCookies(res) {
  clearSecureCookie(res, REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  clearSecureCookie(res, REFRESH_COOKIE_NAME, { path: LEGACY_REFRESH_COOKIE_PATH });
}

function readRefreshToken(req, { allowBody = true } = {}) {
  if (allowBody) {
    const bodyToken = String(req.body?.refresh_token || '').trim();
    if (bodyToken) return bodyToken;
  }
  return getCookieValue(req, REFRESH_COOKIE_NAME);
}

module.exports = {
  LEGACY_REFRESH_COOKIE_PATH,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  clearRefreshCookies,
  readRefreshToken,
  setRefreshCookie,
};
