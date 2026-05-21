'use strict';

const assert = require('assert');
const { validate, Joi } = require('../middleware/validate');

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

function createResponse() {
  return {
    code: 200,
    payload: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

describe('validate middleware', () => {
  it('rejette un payload invalide avec details', () => {
    const middleware = validate({
      body: Joi.object({
        value: Joi.number().integer().required(),
      }),
    });

    const req = { body: { value: 'abc' }, params: {}, query: {} };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.code, 400);
    assert.strictEqual(res.payload.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(res.payload.details));
    assert.ok(res.payload.details.length > 0);
  });

  it('nettoie les champs inconnus sur payload valide', () => {
    const middleware = validate({
      body: Joi.object({
        value: Joi.number().integer().required(),
      }),
    });

    const req = { body: { value: 42, extra: true }, params: {}, query: {} };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.code, 200);
    assert.deepStrictEqual(req.body, { value: 42 });
  });
});
