'use strict';

const XPF_PER_EUR = 119.3317;

function xpfToEurCents(xpf, minimumCents = 50) {
  return Math.max(minimumCents, Math.round((xpf / XPF_PER_EUR) * 100));
}

function formatXpfEur(xpf) {
  const eur = xpf / XPF_PER_EUR;
  return `${xpf.toLocaleString('fr-FR')} XPF (≈ ${eur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)`;
}

const BOOST_CATALOG = [
  { type: 'une', duration: 7, price_xpf: 900, label: 'Boost à la une — 7 jours' },
  { type: 'une', duration: 14, price_xpf: 1500, label: 'Boost à la une — 14 jours' },
  { type: 'une', duration: 30, price_xpf: 2500, label: 'Boost à la une — 30 jours' },
  { type: 'urgent', duration: 7, price_xpf: 500, label: 'Boost urgent — 7 jours' },
  { type: 'remonte', duration: 3, price_xpf: 400, label: 'Boost remontée — 3 jours' },
  { type: 'photos', duration: 30, price_xpf: 300, label: 'Pack photos — 30 jours' },
];

const PRO_PLANS = {
  pro: {
    monthly: { amount_xpf: 4900, stripe_price_id: process.env.STRIPE_PRICE_PRO_MENSUEL || '' },
    yearly: { amount_xpf: 44900, stripe_price_id: process.env.STRIPE_PRICE_PRO_ANNUEL || '' },
  },
};

const MOBILE_PLANS = {
  pro_mensuel: process.env.STRIPE_PRICE_PRO_MENSUEL || '',
  pro_annuel: process.env.STRIPE_PRICE_PRO_ANNUEL || '',
};

const MOBILE_PLANS_XPF = {
  pro_mensuel: 4900,
  pro_annuel: 44900,
};

const MOBILE_PLANS_LABEL = {
  pro_mensuel: 'Pro mensuel',
  pro_annuel: 'Pro annuel',
};

function findBoost(boostType, boostDuration) {
  return BOOST_CATALOG.find((boost) => boost.type === boostType && boost.duration === Number(boostDuration)) || null;
}

function getWebPlan(planId, billingPeriod) {
  return PRO_PLANS[planId]?.[billingPeriod] || null;
}

function getMobilePlan(planSlug) {
  const priceId = MOBILE_PLANS[planSlug];
  if (!priceId) return null;
  return {
    price_id: priceId,
    amount_xpf: MOBILE_PLANS_XPF[planSlug] ?? 0,
    label: MOBILE_PLANS_LABEL[planSlug] ?? planSlug,
  };
}

function getMobilePlanSlugLabel(planSlug) {
  return MOBILE_PLANS_LABEL[planSlug] ?? planSlug;
}

module.exports = {
  XPF_PER_EUR,
  xpfToEurCents,
  formatXpfEur,
  BOOST_CATALOG,
  PRO_PLANS,
  MOBILE_PLANS,
  MOBILE_PLANS_XPF,
  MOBILE_PLANS_LABEL,
  findBoost,
  getWebPlan,
  getMobilePlan,
  getMobilePlanSlugLabel,
};
