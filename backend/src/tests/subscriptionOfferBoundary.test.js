'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'payment.route.js'), 'utf8');

describe('subscription offer boundary', () => {
  it('n accepte que la nouvelle offre Pro mensuelle sur les entrées Web et mobile', () => {
    assert.ok(source.includes("billing_period: Joi.string().valid('monthly').required()"));
    assert.ok(source.includes("plan: Joi.string().valid('pro_mensuel').required()"));
    assert.strictEqual(source.includes("valid('monthly', 'yearly')"), false);
    assert.strictEqual(source.includes("valid('pro_mensuel', 'pro_annuel')"), false);
  });

  it('conserve la reconnaissance des périodes annuelles historiques dans les webhooks', () => {
    assert.ok(source.includes("billingPeriod === 'yearly'"));
  });
});
