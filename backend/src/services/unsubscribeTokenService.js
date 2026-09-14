'use strict';

const crypto = require('crypto');

function generateUnsubscribeToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashUnsubscribeToken(token) {
  const value = String(token || '').trim();
  if (!value) return null;
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

module.exports = { generateUnsubscribeToken, hashUnsubscribeToken };