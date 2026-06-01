'use strict';

const assert = require('assert');
const { describe, it, makeReq, makeRes } = require('./helpers');
const { csrfMiddleware, verifyCsrf, CSRF_COOKIE_NAME } = require('../middleware/csrf');

describe('csrf middleware', () => {
  it('dépose un cookie CSRF sur les requêtes sûres', () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();

    let called = false;
    csrfMiddleware(req, res, () => {
      called = true;
    });

    assert.ok(called, 'next() doit être appelé');
    assert.ok(res.locals.csrfToken, 'csrfToken doit être exposé');
    assert.ok(res._cookies[CSRF_COOKIE_NAME], 'cookie CSRF attendu');
    assert.strictEqual(res._cookies[CSRF_COOKIE_NAME].value, res.locals.csrfToken);
  });

  it('autorise la requête si le cookie et le header CSRF correspondent', () => {
    const token = 'csrf-token-test';
    const req = makeReq({
      method: 'POST',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=${token}`,
        'x-csrf-token': token,
      },
      body: {},
    });
    const res = makeRes();

    let called = false;
    verifyCsrf(req, res, () => {
      called = true;
    });

    assert.ok(called, 'next() doit être appelé');
    assert.strictEqual(res._code, 200);
  });

  it('bloque une requête avec token CSRF invalide', () => {
    const req = makeReq({
      method: 'POST',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=csrf-token-test`,
        'x-csrf-token': 'wrong-token',
      },
      body: {},
    });
    const res = makeRes();

    verifyCsrf(req, res, () => {
      throw new Error('next ne doit pas être appelé');
    });

    assert.strictEqual(res._code, 403);
    assert.strictEqual(res._payload.error, 'Invalid CSRF token');
  });
});
