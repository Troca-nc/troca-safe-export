'use strict';

const { query } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { getTrustedClientIp } = require('../utils/clientIp');

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

const fallbackBuckets = new Map();

function normalizeToken(value) {
  return String(value || '').trim();
}

async function resolveAdminUser() {
  const adminEmail = normalizeToken(process.env.ADMIN_EMAIL);

  if (adminEmail) {
    const result = await query(
      `SELECT id, email, prenom, nom, is_admin
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [adminEmail],
    ).catch(() => ({ rows: [] }));

    if (result.rows[0]) {
      return result.rows[0];
    }
  }

  const fallback = await query(
    `SELECT id, email, prenom, nom, is_admin
     FROM users
     WHERE is_admin = TRUE
     ORDER BY created_at ASC
     LIMIT 1`,
  ).catch(() => ({ rows: [] }));

  return fallback.rows[0] || null;
}

async function requireAdminToken(req, res, next) {
  const token = normalizeToken(req.headers['x-admin-token']);
  const expected = normalizeToken(process.env.ADMIN_API_TOKEN);

  if (!token || !expected || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminUser = await resolveAdminUser();
    if (!adminUser?.is_admin) {
      return res.status(503).json({ error: 'Admin user unavailable' });
    }

    req.admin = {
      email: normalizeToken(req.headers['x-admin-email']) || normalizeToken(process.env.ADMIN_EMAIL),
    };
    req.user = adminUser;
  } catch {
    return res.status(503).json({ error: 'Admin user unavailable' });
  }

  return next();
}

async function adminRateLimit(req, res, next) {
  const ip = getTrustedClientIp(req);
  const key = `admin:rate:${ip}`;

  try {
    const redis = await getRedisClient();
    if (redis) {
      const current = Number(await redis.incr(key));
      if (current === 1) {
        await redis.pexpire(key, WINDOW_MS);
      }
      if (current > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests' });
      }
      return next();
    }
  } catch {
    // Fallback mémoire ci-dessous.
  }

  const now = Date.now();
  const bucket = fallbackBuckets.get(ip) || { count: 0, expiresAt: now + WINDOW_MS };
  if (bucket.expiresAt <= now) {
    bucket.count = 0;
    bucket.expiresAt = now + WINDOW_MS;
  }
  bucket.count += 1;
  fallbackBuckets.set(ip, bucket);

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  return next();
}

module.exports = {
  adminRateLimit,
  requireAdminToken,
  resolveAdminUser,
};
