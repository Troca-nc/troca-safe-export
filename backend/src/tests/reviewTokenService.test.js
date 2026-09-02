'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { describe, it } = require('./helpers');
const { hashReviewToken } = require('../services/reviewTokenService');

describe('reviewTokenService', () => {
  it('produit une empreinte SHA-256 déterministe non réversible', () => {
    const token = 'raw-review-invite-token';
    const expected = crypto.createHash('sha256').update(token).digest('hex');

    assert.strictEqual(hashReviewToken(token), expected);
    assert.strictEqual(hashReviewToken(token).length, 64);
    assert.notStrictEqual(hashReviewToken(token), token);
  });
});
