'use strict';

const crypto = require('crypto');

function hashReviewToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

module.exports = {
  hashReviewToken,
};
