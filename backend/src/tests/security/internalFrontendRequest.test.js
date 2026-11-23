'use strict';

const assert = require('assert');
const { describe, it, makeReq, makeRes } = require('../helpers');
const {
  classifyInternalFrontendRequest,
  isAllowedInternalPublicRead,
} = require('../../middleware/internalFrontendRequest');

const TOKEN = 'f'.repeat(48);

function classify({ method = 'GET', path = '/api/listings/42', token, forwardedFor } = {}) {
  const previous = process.env.FRONTEND_INTERNAL_API_TOKEN;
  process.env.FRONTEND_INTERNAL_API_TOKEN = TOKEN;
  const headers = {};
  if (token !== undefined) headers['x-kalico-frontend-token'] = token;
  if (forwardedFor !== undefined) headers['x-forwarded-for'] = forwardedFor;
  const req = makeReq({ method, originalUrl: path, headers });
  let called = false;
  classifyInternalFrontendRequest(req, makeRes(), () => { called = true; });
  if (previous === undefined) delete process.env.FRONTEND_INTERNAL_API_TOKEN;
  else process.env.FRONTEND_INTERNAL_API_TOKEN = previous;
  assert.strictEqual(called, true);
  return req.isInternalFrontendRequest;
}

describe('authenticated internal frontend reads', () => {
  it('does not trust a missing, forged or incorrect token', () => {
    assert.strictEqual(classify(), false);
    assert.strictEqual(classify({ token: 'forged' }), false);
    assert.strictEqual(classify({ token: `${TOKEN}x` }), false);
  });

  it('accepts only a direct authenticated GET or HEAD on the closed public allowlist', () => {
    for (const [method, path] of [
      ['GET', '/api/listings'],
      ['HEAD', '/api/listings/42'],
      ['GET', '/api/annonces/stats?categorie=vehicules'],
      ['GET', '/api/users/42'],
      ['GET', '/api/users/42/reviews'],
      ['GET', '/api/pros'],
      ['GET', '/api/pros/42'],
      ['GET', '/api/pros/42/reviews'],
      ['GET', '/api/events'],
      ['GET', '/api/events/42'],
      ['GET', '/api/pro-quotes/42'],
    ]) {
      assert.strictEqual(classify({ method, path, token: TOKEN }), true, `${method} ${path}`);
    }
  });

  it('never gives internal treatment to writes, auth, payments, uploads or private reads', () => {
    for (const [method, path] of [
      ['POST', '/api/listings'],
      ['GET', '/api/auth/refresh'],
      ['GET', '/api/payment/saved-cards'],
      ['HEAD', '/api/upload/42'],
      ['GET', '/api/messages/conversations'],
      ['GET', '/api/events/mine'],
      ['GET', '/api/users/me'],
    ]) {
      assert.strictEqual(classify({ method, path, token: TOKEN }), false, `${method} ${path}`);
      assert.strictEqual(isAllowedInternalPublicRead(method, path), false, `${method} ${path}`);
    }
  });

  it('treats a request carrying the token through the public proxy as public', () => {
    assert.strictEqual(classify({ token: TOKEN, forwardedFor: '203.0.113.10' }), false);
  });
});
