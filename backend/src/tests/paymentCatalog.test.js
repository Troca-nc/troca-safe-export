'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { PRO_PLANS, MOBILE_PLANS_XPF, getWebPlan } = require('../services/paymentCatalog');

describe('payment catalog', () => {
  it('utilise le tarif mensuel Pro validé sur le Web et le mobile', () => {
    assert.strictEqual(PRO_PLANS.pro.monthly.amount_xpf, 2900);
    assert.strictEqual(getWebPlan('pro', 'monthly').amount_xpf, 2900);
    assert.strictEqual(MOBILE_PLANS_XPF.pro_mensuel, 2900);
  });
});
