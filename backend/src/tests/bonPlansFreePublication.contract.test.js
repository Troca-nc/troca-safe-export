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
const uploadRouteSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'upload.js'), 'utf8');
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

  it('redirige une publication réussie vers la fiche d’enseigne existante', () => {
    assert.match(createRoute, /business_slug: created\.business\?\.slug \|\| null/);
    assert.match(dealDataSource, /const businessSlug = String\(data\?\.business_slug \?\? ''\)\.trim\(\)/);
    assert.match(dealDataSource, /businessSlug: businessSlug \|\| null/);
    assert.match(frontendSource, /`\/bons-plans\/enseigne\/\$\{encodeURIComponent\(result\.businessSlug\)\}`/);
    assert.match(frontendSource, /: '\/bons-plans'/);
    assert.doesNotMatch(frontendSource, /`\/bons-plans\/\$\{result\.id\}`/);
  });

  it('retire les offres après leur date de fin en heure civile de Nouméa', () => {
    const noumeaExpiry = /promo_valid_until IS NULL OR bp\.promo_valid_until >= \(NOW\(\) AT TIME ZONE 'Pacific\/Noumea'\)::date/g;
    assert.ok((routeSource.match(noumeaExpiry) || []).length >= 2, 'la liste et le détail doivent appliquer la date de fin');
    assert.match(businessesRouteSource, noumeaExpiry);
  });

  it('utilise des téléversements dédiés et publics pour la photo et le catalogue', () => {
    assert.match(uploadRouteSource, /router\.post\('\/bon-plan\/image'/);
    assert.match(uploadRouteSource, /processImage\(req\.file\.buffer, `bon-plans\/\$\{req\.user\.id\}`\)/);
    assert.match(uploadRouteSource, /router\.post\('\/bon-plan\/catalog'/);
    assert.match(uploadRouteSource, /file\.mimetype !== 'application\/pdf'/);
    assert.match(uploadRouteSource, /err\.code === 'LIMIT_FILE_SIZE'/);
    assert.match(uploadRouteSource, /res\.status\(413\)/);
    assert.match(uploadRouteSource, /path\.join\('bon-plans', String\(req\.user\.id\)\)/);
    assert.doesNotMatch(frontendSource, /uploadChatDocument|Adresse de la photo/);
    assert.match(dealDataSource, /uploadApi\.uploadBonPlanImage/);
    assert.match(dealDataSource, /uploadApi\.uploadBonPlanCatalog/);
    assert.match(businessesRouteSource, /bp\.catalog_pdf_url/);
  });
});
