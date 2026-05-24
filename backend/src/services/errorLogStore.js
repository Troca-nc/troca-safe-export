'use strict';

const { getRedisClient } = require('../config/redis');

const ERROR_LOG_KEY = 'error_logs';

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body ?? null;
  const clone = Array.isArray(body) ? [...body] : { ...body };
  for (const key of ['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'current_password', 'new_password', 'email', 'telephone', 'phone']) {
    if (key in clone) {
      clone[key] = '[redacted]';
    }
  }
  return clone;
}

function maskIp(ip) {
  const value = String(ip || '').trim();
  if (!value) return null;
  if (value.includes(':')) {
    const parts = value.split(':');
    return `${parts.slice(0, 3).join(':')}:*`;
  }
  const parts = value.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return '[redacted]';
}

async function recordErrorLog(entry) {
  const redis = await getRedisClient();
  if (!redis) return false;

  const payload = {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: entry.level || 'error',
    status: entry.status || 500,
    message: entry.message || 'Erreur',
    stack: entry.stack || null,
    route: entry.route || null,
    user_id: entry.user_id ?? null,
    user_email: null,
    ip: maskIp(entry.ip),
    user_agent: null,
    body: sanitizeBody(entry.body),
    request_id: entry.request_id ?? null,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  try {
    await redis
      .multi()
      .lPush(ERROR_LOG_KEY, JSON.stringify(payload))
      .lTrim(ERROR_LOG_KEY, 0, 9999)
      .expire(ERROR_LOG_KEY, 7 * 24 * 3600)
      .incr(`errors:${payload.timestamp.slice(0, 13)}`)
      .expire(`errors:${payload.timestamp.slice(0, 13)}`, 7 * 24 * 3600)
      .exec();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  recordErrorLog,
  sanitizeBody,
}
