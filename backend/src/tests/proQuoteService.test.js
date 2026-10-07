'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const {
  DEFAULT_TGC_RATES,
  QUOTE_UNITS,
  assertAllowedTgcRate,
  canMarkQuotePaid,
  computeQuoteTotals,
  getAllowedTgcRates,
} = require('../services/proQuoteService');

describe('Pro quote calculations', () => {
  it('utilise une configuration serveur nettoyée et un repli explicite', () => {
    assert.deepStrictEqual(getAllowedTgcRates('22, 0, 6, 6, 99, nope'), [0, 6, 22]);
    assert.deepStrictEqual(getAllowedTgcRates(''), [...DEFAULT_TGC_RATES]);
    assert.ok(QUOTE_UNITS.includes('hour'));
  });

  it('refuse un taux absent de la configuration serveur', () => {
    assert.throws(
      () => assertAllowedTgcRate(5, [0, 3, 6]),
      (error) => error.statusCode === 400 && error.message.includes('Taux TGC non autorisé')
    );
  });

  it('calcule et arrondit chaque ligne avant la ventilation TGC', () => {
    const totals = computeQuoteTotals([
      { label: 'Conseil', unit: 'hour', quantity: 1.5, unit_price_xpf: 1001, tgc_rate: 3 },
      { label: 'Matériel', unit: 'unit', quantity: 2, unit_price_xpf: 999, tgc_rate: 11 },
    ], { allowedRates: [0, 3, 11], depositPercent: 25 });

    assert.strictEqual(totals.items[0].subtotal_xpf, 1502);
    assert.strictEqual(totals.items[0].tgc_amount_xpf, 45);
    assert.strictEqual(totals.subtotal_xpf, 3500);
    assert.strictEqual(totals.tgc_amount_xpf, 265);
    assert.strictEqual(totals.total_xpf, 3765);
    assert.strictEqual(totals.deposit_amount_xpf, 941);
    assert.strictEqual(totals.balance_due_xpf, 2824);
    assert.deepStrictEqual(totals.tgc_breakdown, [
      { rate: 3, base_xpf: 1502, amount_xpf: 45 },
      { rate: 11, base_xpf: 1998, amount_xpf: 220 },
    ]);
  });

  it('conserve les anciens devis à taux global', () => {
    const totals = computeQuoteTotals([
      { label: 'Forfait', quantity: 2, unit_price_xpf: 500 },
    ], { allowedRates: [0, 6], defaultTgcRate: 6 });

    assert.strictEqual(totals.items[0].unit, 'unit');
    assert.strictEqual(totals.items[0].tgc_rate, 6);
    assert.strictEqual(totals.tax_rate, 6);
    assert.strictEqual(totals.total_xpf, 1060);
  });

  it('limite la déclaration payée aux devis acceptés ou convertis', () => {
    assert.strictEqual(canMarkQuotePaid('accepted'), true);
    assert.strictEqual(canMarkQuotePaid('converted'), true);
    assert.strictEqual(canMarkQuotePaid('sent'), false);
    assert.strictEqual(canMarkQuotePaid('paid'), false);
  });
});
