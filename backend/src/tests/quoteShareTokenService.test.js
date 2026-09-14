'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { describe, it } = require('./helpers');
const {
  generateQuoteShareToken,
  hashQuoteShareToken,
  matchesQuoteShareToken,
} = require('../services/quoteShareTokenService');

describe('quoteShareTokenService', () => {
  it('génère une capacité aléatoire et ne conserve que son empreinte', () => {
    const token = generateQuoteShareToken();
    const digest = hashQuoteShareToken(token);
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.notStrictEqual(token, digest);
    assert.notStrictEqual(token, generateQuoteShareToken());
  });

  it('compare l’empreinte en temps constant et refuse token vide ou empreinte invalide', () => {
    const token = 'legacy-quote-share-token';
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    assert.strictEqual(hashQuoteShareToken(token), digest);
    assert.strictEqual(matchesQuoteShareToken(token, digest), true);
    assert.strictEqual(matchesQuoteShareToken(digest, digest), false);
    assert.strictEqual(matchesQuoteShareToken('', digest), false);
    assert.strictEqual(matchesQuoteShareToken(token, 'not-a-digest'), false);
  });
});
