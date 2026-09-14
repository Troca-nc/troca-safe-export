'use strict';

const crypto = require('crypto');

function generateBookingAccessToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashBookingAccessToken(token) {
  const value = String(token || '').trim();
  if (!value) return null;
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function matchesBookingAccessToken(token, storedHash) {
  const candidate = hashBookingAccessToken(token);
  const stored = String(storedHash || '').trim().toLowerCase();
  if (!candidate || !/^[a-f0-9]{64}$/.test(stored)) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(stored, 'hex'));
}

module.exports = { generateBookingAccessToken, hashBookingAccessToken, matchesBookingAccessToken };
