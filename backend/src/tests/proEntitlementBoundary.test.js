'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const authAccountSource = fs.readFileSync(path.join(__dirname, '..', 'services', 'authAccountService.js'), 'utf8');
const proRouteSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'pro.js'), 'utf8');

describe('Pro entitlement boundary', () => {
  it('enregistre le type de compte professionnel sans accorder le droit Pro', () => {
    assert.ok(authAccountSource.includes('commune_id || null, false, normalizedAccountType'));
    assert.strictEqual(authAccountSource.includes("normalizedAccountType === 'professional', normalizedAccountType"), false);
  });

  it('enregistre une candidature comme intention professionnelle sans activer is_pro', () => {
    const applyRoute = proRouteSource.slice(
      proRouteSource.indexOf("router.post('/apply'"),
      proRouteSource.indexOf("router.post('/:id/reviews'"),
    );

    assert.ok(applyRoute.includes("SET account_type = 'professional'"));
    assert.strictEqual(applyRoute.includes('SET is_pro ='), false);
    assert.strictEqual(applyRoute.includes('is_pro: true'), false);
    assert.strictEqual(applyRoute.includes('pro_since ='), false);
  });

  it('permet de modifier un profil sans transformer cette écriture en activation Pro', () => {
    const profileRoute = proRouteSource.slice(
      proRouteSource.indexOf("router.patch('/me'"),
      proRouteSource.indexOf("router.get('/dashboard'"),
    );

    assert.strictEqual(profileRoute.includes('is_pro = TRUE'), false);
  });
});
