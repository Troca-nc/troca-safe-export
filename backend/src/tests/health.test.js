const assert = require('assert');

const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { apiLimiter, authLimiter, uploadLimiter } = require('../middleware/rateLimit');

function describe(label, fn) {
  console.log(`\n${label}`);
  fn();
}

function it(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (error) {
    console.error(`  ✗ ${label}\n    ${error.message}`);
    process.exitCode = 1;
  }
}

describe('middleware exports', () => {
  it('expose les middlewares d auth', () => {
    assert.strictEqual(typeof authenticate, 'function');
    assert.strictEqual(typeof optionalAuth, 'function');
    assert.strictEqual(typeof requireAdmin, 'function');
  });

  it('expose les rate limiters', () => {
    assert.strictEqual(typeof apiLimiter, 'function');
    assert.strictEqual(typeof authLimiter, 'function');
    assert.strictEqual(typeof uploadLimiter, 'function');
  });
});

describe('requireAdmin', () => {
  it('bloque un utilisateur non admin', () => {
    const req = { user: { is_admin: false } };
    const res = {
      code: 200,
      payload: null,
      status(code) { this.code = code; return this; },
      json(body) { this.payload = body; return this; },
    };
    const next = () => {
      throw new Error('next() ne doit pas etre appele');
    };

    requireAdmin(req, res, next);
    assert.strictEqual(res.code, 403);
    assert.strictEqual(res.payload.error, 'Accès réservé aux administrateurs');
  });

  it('laisse passer un admin', () => {
    let called = false;
    const req = { user: { is_admin: true } };
    const res = {};
    const next = () => {
      called = true;
    };

    requireAdmin(req, res, next);
    assert.ok(called);
  });
});
