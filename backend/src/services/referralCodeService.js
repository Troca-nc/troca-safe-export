'use strict';

const crypto = require('crypto');
const { query } = require('../config/database');

function getExecutor(db) {
  if (db && typeof db.query === 'function') {
    return db.query.bind(db);
  }
  return query;
}

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function generateReferralCode() {
  return `PRO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function ensureProReferralCode(db, userId) {
  const execute = getExecutor(db);
  const id = Number(userId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid pro user id');
  }

  const existing = await execute(
    `SELECT pro_referral_code
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  const currentCode = normalizeCode(existing.rows[0]?.pro_referral_code);
  if (currentCode) {
    return currentCode;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateReferralCode();
    try {
      const updated = await execute(
        `UPDATE users
         SET pro_referral_code = $2,
             updated_at = NOW()
         WHERE id = $1
           AND COALESCE(pro_referral_code, '') = ''
         RETURNING pro_referral_code`,
        [id, candidate]
      );

      const code = normalizeCode(updated.rows[0]?.pro_referral_code);
      if (code) {
        return code;
      }

      const refreshed = await execute(
        `SELECT pro_referral_code
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [id]
      );
      const refreshedCode = normalizeCode(refreshed.rows[0]?.pro_referral_code);
      if (refreshedCode) {
        return refreshedCode;
      }
    } catch (error) {
      if (String(error?.code || '') !== '23505') {
        throw error;
      }
    }
  }

  throw new Error('Unable to generate referral code');
}

function buildReferralLink(code, baseUrl = '') {
  const normalized = normalizeCode(code);
  if (!normalized) return '/inscription';
  const trimmedBase = String(baseUrl || '').trim().replace(/\/+$/, '');
  const path = `/inscription?ref=${encodeURIComponent(normalized)}`;
  return trimmedBase ? `${trimmedBase}${path}` : path;
}

module.exports = {
  buildReferralLink,
  ensureProReferralCode,
  generateReferralCode,
  normalizeCode,
};
