'use strict';

const crypto = require('crypto');

function generateQuoteShareToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashQuoteShareToken(token) {
  const value = String(token || '').trim();
  if (!value) return null;
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function matchesQuoteShareToken(token, storedHash) {
  const candidate = hashQuoteShareToken(token);
  const stored = String(storedHash || '').trim().toLowerCase();
  if (!candidate || !/^[a-f0-9]{64}$/.test(stored)) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(stored, 'hex'));
}

module.exports = { generateQuoteShareToken, hashQuoteShareToken, matchesQuoteShareToken };
