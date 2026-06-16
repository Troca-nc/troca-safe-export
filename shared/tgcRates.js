'use strict';

const TGC_RATE_OPTIONS = [0, 3, 6, 11];

function normalizeTgcRate(value) {
  const rate = Number(value ?? 0);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.round(rate * 100) / 100;
}

function formatTgcRateLabel(value) {
  const rate = normalizeTgcRate(value);
  return `${rate.toLocaleString('fr-FR')} %`;
}

module.exports = {
  TGC_RATE_OPTIONS,
  normalizeTgcRate,
  formatTgcRateLabel,
};
