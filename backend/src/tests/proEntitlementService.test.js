'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const {
  applyCurrentProEntitlement,
  hasCurrentProEntitlement,
} = require('../services/proEntitlementService');

const now = new Date('2026-09-08T10:00:00.000Z');

describe('proEntitlementService', () => {
  it('accorde le droit uniquement avec le drapeau et une échéance future', () => {
    assert.strictEqual(hasCurrentProEntitlement({ is_pro: true, pro_expires_at: '2026-09-09T10:00:00.000Z' }, now), true);
    assert.strictEqual(hasCurrentProEntitlement({ is_pro: false, pro_expires_at: '2026-09-09T10:00:00.000Z' }, now), false);
  });

  it('refuse les droits perpétuels implicites et les échéances invalides', () => {
    assert.strictEqual(hasCurrentProEntitlement({ is_pro: true, pro_expires_at: null }, now), false);
    assert.strictEqual(hasCurrentProEntitlement({ is_pro: true, pro_expires_at: 'invalide' }, now), false);
  });

  it('refuse une échéance atteinte ou dépassée', () => {
    assert.strictEqual(hasCurrentProEntitlement({ is_pro: true, pro_expires_at: now }, now), false);
    assert.strictEqual(hasCurrentProEntitlement({ is_pro: true, pro_expires_at: '2026-09-07T10:00:00.000Z' }, now), false);
  });

  it('masque le plan lorsque le droit courant est absent', () => {
    const normalized = applyCurrentProEntitlement({ is_pro: true, pro_plan: 'pro', pro_expires_at: null }, now);
    assert.strictEqual(normalized.is_pro, false);
    assert.strictEqual(normalized.pro_plan, null);
  });
});
