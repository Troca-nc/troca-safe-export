'use strict';

const crypto = require('crypto');
const { verifyRefreshToken } = require('../config/jwt');
const { readRefreshToken } = require('../config/authCookies');
const { getTrustedClientIp } = require('../utils/clientIp');

function hashKey(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function prepareRefreshRateLimit(req, _res, next) {
  const refreshToken = readRefreshToken(req);
  req.refreshToken = refreshToken;
  if (!refreshToken) {
    req.refreshRateLimitKey = `invalid:${getTrustedClientIp(req)}`;
    return next();
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    req.refreshTokenPayload = payload;
    req.refreshRateLimitKey = payload.sid
      ? `session:${String(payload.sid)}`
      : `legacy:${hashKey(refreshToken)}`;
  } catch {
    req.refreshRateLimitKey = `invalid:${getTrustedClientIp(req)}`;
  }
  return next();
}

module.exports = { prepareRefreshRateLimit };
