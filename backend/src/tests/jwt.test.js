'use strict';

// ============================================================
//  Tests — Config JWT
// ============================================================

const assert = require('assert');
const { describe, it } = require('./helpers');
const { generateTokens, verifyAccessToken, verifyRefreshToken } = require('../config/jwt');

process.env.JWT_SECRET = 'test_jwt_secret_minimum_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('JWT — generateTokens', () => {
  it('génère un accessToken et un refreshToken', () => {
    const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(42);
    assert.ok(typeof accessToken === 'string' && accessToken.length > 20);
    assert.ok(typeof refreshToken === 'string' && refreshToken.length > 20);
    assert.ok(refreshExpiresAt instanceof Date);
  });

  it('les deux tokens sont différents', () => {
    const { accessToken, refreshToken } = generateTokens(1);
    assert.notStrictEqual(accessToken, refreshToken);
  });
});

describe('JWT — verifyAccessToken', () => {
  it('vérifie un token valide et retourne le bon sub', () => {
    const { accessToken } = generateTokens(7);
    const payload = verifyAccessToken(accessToken);
    assert.strictEqual(payload.sub, 7);
    assert.strictEqual(payload.type, 'access');
  });

  it('rejette un token expiré', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign({ sub: 1, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    assert.throws(() => verifyAccessToken(expired), /expired/i);
  });

  it('rejette un token au mauvais type', () => {
    const { refreshToken } = generateTokens(1);
    assert.throws(() => verifyAccessToken(refreshToken), /type/i);
  });

  it('rejette un token avec un secret incorrect', () => {
    const jwt = require('jsonwebtoken');
    const fake = jwt.sign({ sub: 1, type: 'access' }, 'mauvais_secret');
    assert.throws(() => verifyAccessToken(fake));
  });
});

describe('JWT — verifyRefreshToken', () => {
  it('vérifie un refresh token valide', () => {
    const { refreshToken } = generateTokens(99);
    const payload = verifyRefreshToken(refreshToken);
    assert.strictEqual(payload.sub, 99);
    assert.strictEqual(payload.type, 'refresh');
  });

  it('rejette un access token passé comme refresh', () => {
    const { accessToken } = generateTokens(1);
    assert.throws(() => verifyRefreshToken(accessToken));
  });
});
