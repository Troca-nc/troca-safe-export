'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./paymentTransactionHarness');

const root = path.join(__dirname, '..', '..', '..');
const bonPlanRoute = fs.readFileSync(path.join(__dirname, '..', 'routes', 'bonPlans.route.js'), 'utf8');
const bonPlanList = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'bon-plans', 'BonsPlansPageView.tsx'), 'utf8');
const bonPlanDetail = fs.readFileSync(path.join(root, 'frontend', 'src', 'app', 'bons-plans', '[id]', 'page.tsx'), 'utf8');
const accountPage = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'profil', 'PersonalAccountPage.tsx'), 'utf8');
const dealForm = fs.readFileSync(path.join(root, 'frontend', 'src', 'app', 'bons-plans', 'publier', 'page.tsx'), 'utf8');

async function run() {
  assert.match(bonPlanList, /href={`\/bons-plans\/\$\{offer\.id\}`}/);
  assert.match(bonPlanList, /Voir les détails/);
  assert.match(bonPlanDetail, /bonPlansApi\.getById\(id\)/);
  assert.match(bonPlanDetail, /Conditions de l’offre/);

  assert.match(accountPage, /id: 'bonPlans', label: 'Mes bons plans'/);
  assert.match(accountPage, /getPersonalBonPlans\(session\)/);
  assert.match(accountPage, /\/bons-plans\/publier\?edit=\$\{item\.id\}/);
  assert.match(accountPage, /personalAccountActions\.deleteBonPlan\(item\.id\)/);
  assert.match(dealForm, /getDealForEditing\(requestedEdit\)/);
  assert.match(dealForm, /updateDeal\(editingId, form, offerType, placeMode, durationDays\)/);

  assert.match(bonPlanRoute, /router\.get\('\/mine', authenticate/);
  assert.match(bonPlanRoute, /router\.put\('\/mine\/:id', authenticate/);
  assert.match(bonPlanRoute, /router\.delete\('\/mine\/:id', authenticate/);
  assert.match(bonPlanRoute, /WHERE id = \$1 AND user_id = \$2 AND kind = 'promo'/);
  assert.match(bonPlanRoute, /promo_valid_until < \(NOW\(\) AT TIME ZONE 'Pacific\/Noumea'\)::date/);

  const calls = [];
  const service = load('services/eventTicketingService.js', {
    '../config/database': {
      async query(sql) { calls.push(sql.replace(/\s+/g, ' ').trim()); return { rows: [] }; },
      async withTransaction() { throw new Error('Unexpected transaction'); },
    },
    '../config/env': { isConfiguredValue() { return false; } },
    './qrCodeService': { generateTicketToken() { return 'unused'; } },
  });
  assert.strictEqual(service.serializeEventRow({ id: 1, status: 'published', event_date: '2000-01-01' }).status, 'completed');
  assert.strictEqual(service.serializeEventRow({ id: 2, status: 'published', event_date: '2999-01-01' }).status, 'published');
  await service.listPublicEvents();
  assert.ok(calls.some((sql) => sql.includes("e.event_date >= (NOW() AT TIME ZONE 'Pacific/Noumea')::date")));

  console.log('Publication lifecycle consistency: public detail, owner management and event expiry passed.');
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
