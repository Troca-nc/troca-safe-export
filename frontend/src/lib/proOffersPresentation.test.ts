import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node utilise l'extension explicite pour le type stripping.
import { buildComparisonRows, getAnnualSavingsXpf, normalizeProPlans } from './proOffersPresentation.ts'

const payload = {
  data: {
    plans: [
      { id: 'free', name: 'Gratuit', price_monthly_xpf: 0, price_yearly_xpf: 0, features: { maxActiveListings: 5, maxPhotosPerListing: 6, listingDurationDays: 60, chat: true, phoneVerification: true, boosts: 'paid' } },
      { id: 'pro', name: 'Pro', price_monthly_xpf: 3000, price_yearly_xpf: 30000, savings_months: 2, features: { maxActiveListings: 'unlimited', maxPhotosPerListing: 12, listingDurationDays: 'permanent', chat: true, phoneVerification: true, listingStats: true, sellerBadge: true, boosts: 'discount', pinnedPerCategory: 1, prioritySupport: true } },
    ],
  },
}

test('normalise les deux offres sans valeur tarifaire locale', () => {
  const plans = normalizeProPlans(payload)
  assert.deepEqual(plans.map((plan) => [plan.id, plan.monthlyPriceXpf, plan.yearlyPriceXpf]), [['free', 0, 0], ['pro', 3000, 30000]])
  assert.equal(plans[1].features.maxActiveListings, 'unlimited')
})

test('calcule l’économie annuelle depuis les prix reçus', () => {
  assert.equal(getAnnualSavingsXpf(normalizeProPlans(payload)[1]), 6000)
})

test('construit le comparatif uniquement depuis les fonctionnalités normalisées', () => {
  const rows = buildComparisonRows(normalizeProPlans(payload))
  assert.equal(rows.find((row) => row.label === 'Annonces actives')?.pro, 'Illimitées')
  assert.equal(rows.find((row) => row.label === 'Statistiques des annonces')?.free, 'Non inclus')
  assert.equal(rows.find((row) => row.label === 'Support prioritaire')?.pro, 'Inclus')
})

test('refuse une réponse sans les deux plans attendus', () => {
  assert.throws(() => normalizeProPlans({ data: { plans: [] } }), /indisponible/)
})
