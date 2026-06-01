'use strict';

const { getRedisClient } = require('../config/redis');

const ERROR_LOG_KEY = 'error_logs';
const PII_KEYS = [
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'current_password',
  'new_password',
  'email',
  'telephone',
  'phone',
  'address',
  'ip',
  'secret',
  'api_key',
  'credit_card',
  'cvv',
  'ssn',
];

function maskEmail(value) {
  const email = String(value || '').trim();
  if (!email || !email.includes('@')) return '[redacted]';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[redacted]';
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.max(2, local.length - 2))}${local.slice(-1)}@${domain}`;
}

function maskIp(ip) {
  const value = String(ip || '').trim();
  if (!value) return '[redacted]';
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

function maskPII(value, seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[redacted]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => maskPII(item, seen));
  }

  const masked = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = String(rawKey).toLowerCase();

    if (key.includes('email')) {
      masked[rawKey] = maskEmail(rawValue);
      continue;
    }

    if (key === 'ip' || key.endsWith('_ip')) {
      masked[rawKey] = maskIp(rawValue);
      continue;
    }

    if (PII_KEYS.some((piiKey) => key === piiKey || key.includes(piiKey))) {
      masked[rawKey] = '[redacted]';
      continue;
    }

    masked[rawKey] = maskPII(rawValue, seen);
  }

  return masked;
}

function sanitizeBody(body) {
  return maskPII(body);
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
  maskEmail,
  maskIp,
  maskPII,
  recordErrorLog,
  sanitizeBody,
};
