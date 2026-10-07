'use strict';

const DEFAULT_TGC_RATES = Object.freeze([0, 3, 6, 11, 22]);
const QUOTE_UNITS = Object.freeze([
  'unit',
  'hour',
  'day',
  'package',
  'meter',
  'square_meter',
  'kilometer',
]);

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function getAllowedTgcRates(raw = process.env.PRO_QUOTE_TGC_RATES) {
  const parsed = String(raw || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 50);
  const unique = [...new Set(parsed)].sort((left, right) => left - right);
  return unique.length > 0 ? unique : [...DEFAULT_TGC_RATES];
}

function assertAllowedTgcRate(rate, allowedRates = getAllowedTgcRates()) {
  const numericRate = Number(rate ?? 0);
  if (!allowedRates.includes(numericRate)) {
    const error = new Error(`Taux TGC non autorisé. Valeurs acceptées : ${allowedRates.join(', ')}.`);
    error.status = 400;
    error.statusCode = 400;
    throw error;
  }
  return numericRate;
}

function normalizeQuantity(value) {
  return Math.round(Math.max(0.001, Number(value ?? 1)) * 1000) / 1000;
}

function normalizeDepositPercent(value) {
  return Math.round(Math.min(100, Math.max(0, Number(value ?? 0))) * 100) / 100;
}

function normalizeQuoteItems(items, options = {}) {
  const allowedRates = options.allowedRates || getAllowedTgcRates();
  const defaultTgcRate = assertAllowedTgcRate(options.defaultTgcRate ?? 0, allowedRates);
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const quantity = normalizeQuantity(item.quantity);
    const unitPrice = Math.max(0, Math.round(Number(item.unit_price_xpf ?? 0)));
    const tgcRate = assertAllowedTgcRate(item.tgc_rate ?? defaultTgcRate, allowedRates);
    const subtotal = Math.round(quantity * unitPrice);
    const tgcAmount = Math.round((subtotal * tgcRate) / 100);
    return {
      id: item.id || `item_${index + 1}`,
      label: normalizeMaybeText(item.label) || `Ligne ${index + 1}`,
      description: normalizeMaybeText(item.description),
      unit: QUOTE_UNITS.includes(item.unit) ? item.unit : 'unit',
      quantity,
      unit_price_xpf: unitPrice,
      tgc_rate: tgcRate,
      subtotal_xpf: subtotal,
      tgc_amount_xpf: tgcAmount,
      total_xpf: subtotal + tgcAmount,
    };
  });
}

function computeQuoteTotals(items, options = {}) {
  const normalizedItems = normalizeQuoteItems(items, options);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal_xpf, 0);
  const tgcAmount = normalizedItems.reduce((sum, item) => sum + item.tgc_amount_xpf, 0);
  const breakdown = new Map();
  normalizedItems.forEach((item) => {
    const current = breakdown.get(item.tgc_rate) || { rate: item.tgc_rate, base_xpf: 0, amount_xpf: 0 };
    current.base_xpf += item.subtotal_xpf;
    current.amount_xpf += item.tgc_amount_xpf;
    breakdown.set(item.tgc_rate, current);
  });
  const tgcBreakdown = [...breakdown.values()].sort((left, right) => left.rate - right.rate);
  const total = subtotal + tgcAmount;
  const depositPercent = normalizeDepositPercent(options.depositPercent);
  const depositAmount = Math.round((total * depositPercent) / 100);
  const commonRate = tgcBreakdown.length === 1 ? tgcBreakdown[0].rate : 0;
  return {
    items: normalizedItems,
    subtotal_xpf: subtotal,
    tax_rate: commonRate,
    tgc_rate: commonRate,
    tax_amount_xpf: tgcAmount,
    tgc_amount_xpf: tgcAmount,
    tgc_breakdown: tgcBreakdown,
    total_xpf: total,
    deposit_percent: depositPercent,
    deposit_amount_xpf: depositAmount,
    balance_due_xpf: total - depositAmount,
  };
}

function canMarkQuotePaid(status) {
  return status === 'accepted' || status === 'converted';
}

module.exports = {
  DEFAULT_TGC_RATES,
  QUOTE_UNITS,
  assertAllowedTgcRate,
  canMarkQuotePaid,
  computeQuoteTotals,
  getAllowedTgcRates,
  normalizeQuoteItems,
};
