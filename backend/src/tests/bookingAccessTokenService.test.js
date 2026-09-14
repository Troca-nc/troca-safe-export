'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { describe, it } = require('./helpers');
const {
  generateBookingAccessToken,
  hashBookingAccessToken,
  matchesBookingAccessToken,
} = require('../services/bookingAccessTokenService');

describe('bookingAccessTokenService', () => {
  it('génère une capacité aléatoire et ne conserve que son empreinte', () => {
    const token = generateBookingAccessToken();
    const digest = hashBookingAccessToken(token);
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.notStrictEqual(token, digest);
    assert.notStrictEqual(token, generateBookingAccessToken());
  });

  it('compare l’empreinte en temps constant et refuse un rejeu de l’empreinte', () => {
    const token = 'legacy-booking-access-token';
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    assert.strictEqual(hashBookingAccessToken(token), digest);
    assert.strictEqual(matchesBookingAccessToken(token, digest), true);
    assert.strictEqual(matchesBookingAccessToken(digest, digest), false);
    assert.strictEqual(matchesBookingAccessToken('', digest), false);
    assert.strictEqual(matchesBookingAccessToken(token, 'not-a-digest'), false);
  });
});
