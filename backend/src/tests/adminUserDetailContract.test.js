'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const routesSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'admin.routes.js'), 'utf8');
const start = routesSource.indexOf("router.get('/users/:id/full'");
const end = routesSource.indexOf("router.patch('/users/:id/suspend'", start);
const userDetailRoute = routesSource.slice(start, end);

describe('Admin user detail contract', () => {
  it('utilise une projection utilisateur explicite sans secrets internes', () => {
    assert.ok(start >= 0 && end > start);
    assert.strictEqual(/\bu\.\*/.test(userDetailRoute), false);
    for (const sensitiveColumn of ['password_hash', 'stripe_customer_id', 'google_id', 'apple_id', 'pro_referral_code', 'pro_quote_template']) {
      assert.strictEqual(userDetailRoute.includes(sensitiveColumn), false, `${sensitiveColumn} ne doit pas sortir dans la fiche admin`);
    }
  });

  it('ne renvoie pas les références et métadonnées internes des paiements', () => {
    assert.strictEqual(userDetailRoute.includes('provider_ref'), false);
    assert.strictEqual(userDetailRoute.includes('metadata'), false);
  });

  it('retourne les propositions de troc réelles des deux côtés', () => {
    assert.ok(userDetailRoute.includes('FROM troc_proposals p'));
    assert.ok(userDetailRoute.includes('p.proposer_id = $1 OR a.user_id = $1'));
    assert.ok(userDetailRoute.includes('troc_proposals: trocRes.rows'));
    assert.strictEqual(userDetailRoute.includes('troc_proposals: []'), false);
  });

  it('n invente pas un historique de connexion absent du modèle', () => {
    assert.strictEqual(userDetailRoute.includes('login_history'), false);
  });

  it('ne transforme pas silencieusement une erreur SQL en collection vide', () => {
    assert.strictEqual(userDetailRoute.includes('.catch(() => ({ rows: [] }))'), false);
  });
});
