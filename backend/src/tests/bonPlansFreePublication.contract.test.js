'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const routeSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'bonPlans.route.js'), 'utf8');
const frontendSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'app', 'bons-plans', 'publier', 'page.tsx'),
  'utf8'
);
const dealDataSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'lib', 'data', 'deals.ts'),
  'utf8'
);
const createRoute = routeSource.slice(routeSource.indexOf("router.post('/',"));

describe('publication gratuite des bons plans', () => {
  it('active immédiatement le bon plan sans imposer de fournisseur de paiement', () => {
    assert.match(createRoute, /freeBonPlanPublication \? 'active' : 'draft'/);
    assert.match(createRoute, /paymentProvider = freeBonPlanPublication \? null/);
    assert.match(createRoute, /final_price_xpf: 0/);
    assert.match(createRoute, /Bon plan publié gratuitement/);
    assert.match(createRoute, /if \(freeBonPlanPublication\) \{\s*business = await upsertBusinessFromBonPlan/);
  });

  it('présente les deux durées comme gratuites et retire le checkout du client', () => {
    assert.match(frontendSource, /\(\[7, 30\] as const\)/);
    assert.match(frontendSource, /Pour tous les comptes/);
    assert.match(frontendSource, /Publier gratuitement/);
    assert.match(frontendSource, /Aucun paiement ne sera demandé/);
    assert.doesNotMatch(frontendSource, /paymentProvider|Stripe|PayPlug|Prix public|Prix Pro/);
    assert.doesNotMatch(dealDataSource, /payment_provider|DealPaymentProvider|checkoutUrl/);
  });
});
