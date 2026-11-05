'use strict';

const fs = require('fs');
const path = require('path');

function runBonPlanCatalogPersistenceTest() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'bonPlans.route.js'), 'utf8');
  if (!source.includes('catalog_pdf_url: value.catalog_pdf_url || null')) {
    throw new Error('La création de bon plan doit conserver l’URL du catalogue PDF validée.');
  }
  if (!source.includes('payload.catalog_pdf_url')) {
    throw new Error('Le catalogue PDF doit être transmis à l’insertion SQL.');
  }
  if (!source.includes('original_price_xpf: toNumberOrNull(value.original_price_xpf ?? value.normal_price_xpf),')) {
    throw new Error('Le prix initial de l’offre ne doit pas reprendre les frais de publication.');
  }
  if (!source.includes('promo_price_xpf: toNumberOrNull(value.promo_price_xpf),')) {
    throw new Error('Le prix promotionnel ne doit pas reprendre les frais de publication.');
  }
  if (!source.includes('const publicationPrice = row.amount_xpf ?? pricing.final_price_xpf;')) {
    throw new Error('Les frais de publication doivent rester distincts du prix de l’offre sérialisé.');
  }
  if (!source.includes('discount_pct: offerDiscount,')) {
    throw new Error('La remise affichée ne doit pas reprendre la remise tarifaire des frais de publication.');
  }
  console.log('Bon plan catalog persistence: validated payload mapping.');
}

const completion = Promise.resolve().then(runBonPlanCatalogPersistenceTest);
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
