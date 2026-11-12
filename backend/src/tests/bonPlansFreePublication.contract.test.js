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
const businessesRouteSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'businesses.route.js'), 'utf8');
const publishFlowSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'components', 'listings', 'publish', 'PublishFlow.tsx'),
  'utf8'
);
const headerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'components', 'layout', 'HeaderV2.tsx'),
  'utf8'
);
const createRoute = routeSource.slice(routeSource.indexOf("router.post('/',"));
const serializedBonPlan = routeSource.slice(routeSource.indexOf('function serializeBonPlan'), routeSource.indexOf('async function queryBonPlans'));
const mappedBusiness = businessesRouteSource.slice(businessesRouteSource.indexOf('function mapBusinessRow'), businessesRouteSource.indexOf("router.get('/',"));

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

  it('rend l’e-mail facultatif et ne l’expose dans aucune projection publique', () => {
    assert.match(routeSource, /contact_email: Joi\.string\(\)\.email\(\)\.max\(255\)\.optional\(\)\.allow\('', null\)/);
    assert.match(createRoute, /contact_email: value\.contact_email\?\.trim\(\) \|\| null/);
    assert.doesNotMatch(createRoute, /contact_email: value\.contact_email\?\.trim\(\) \|\| req\.user\.email/);
    assert.doesNotMatch(serializedBonPlan, /contact_email:/);
    assert.doesNotMatch(mappedBusiness, /contact_email:/);
    assert.match(frontendSource, /E-mail de contact · facultatif/);
    assert.match(frontendSource, /Tu peux laisser ce champ vide/);
    assert.match(frontendSource, /form\.contactEmail\.trim\(\) && !\/\.\+@\.\+\\\.\.\+\/\.test/);
    assert.match(dealDataSource, /contact_email: form\.contactEmail\.trim\(\) \|\| null/);
  });

  it('alimente les colonnes legacy obligatoires lors de la création', () => {
    assert.match(createRoute, /kind: value\.kind \|\| 'promo'/);
    assert.match(createRoute, /target_audience: value\.target_audience \|\| 'particulier'/);
    assert.match(createRoute, /expires_at: publishedUntil/);
    assert.match(createRoute, /published_until, expires_at, amount_xpf/);
    assert.match(createRoute, /\(user_id, kind, target_audience, business_name/);
    assert.match(createRoute, /payload\.user_id,\s*payload\.kind,\s*payload\.target_audience,\s*payload\.business_name/);

    const insertSql = createRoute.match(/INSERT INTO bon_plans\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*RETURNING \*/);
    assert.ok(insertSql, 'la requête INSERT doit rester détectable par le contrat');
    const columns = insertSql[1].split(',').map((column) => column.trim()).filter(Boolean);
    const placeholders = [...insertSql[2].matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
    assert.strictEqual(placeholders.length, columns.length);
    assert.deepStrictEqual(placeholders, columns.map((_, index) => index + 1));
  });

  it('redirige tous les choix bon plan vers le formulaire canonique', () => {
    assert.match(publishFlowSource, /if \(kind === 'bonplan'\) \{\s*router\.replace\('\/bons-plans\/publier'\)/);
    assert.match(publishFlowSource, /if \(kind === 'bonplan'\) \{\s*router\.push\('\/bons-plans\/publier'\)/);
    assert.match(headerSource, /router\.push\('\/deposer'\)/);
    assert.match(headerSource, /redirectTo: '\/deposer'/);
    assert.doesNotMatch(headerSource, /router\.push\('\/annonces\/nouvelle'\)/);
  });
});
