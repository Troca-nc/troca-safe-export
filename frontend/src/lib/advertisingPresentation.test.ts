import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node utilise l’extension explicite pour le type stripping.
import { buildAdvertisingFormats, formatStartingPrice, normalizeCampaignConfig } from './advertisingPresentation.ts'

const payload = {
  data: {
    currency: 'XPF',
    formats: [
      { type: 'bon_plan', label: 'Bon plan sponsorisé', concurrent_capacity: 6, pricing_options: [{ pricing_mode: 'one_shot', duration_days: 3, price_xpf: 500 }, { pricing_mode: 'monthly', pricing_plan: 'essential', duration_days: 30, price_xpf: 1800 }] },
      { type: 'banner', label: 'Bannière catégorie', concurrent_capacity: 2, pricing_options: [{ pricing_mode: 'one_shot', duration_days: 7, price_xpf: 990 }] },
      { type: 'popup', label: 'Popup homepage', concurrent_capacity: 1, pricing_options: [{ pricing_mode: 'one_shot', duration_days: 3, price_xpf: 1900 }] },
    ],
  },
}

test('normalise les trois formats depuis le contrat serveur', () => {
  const config = normalizeCampaignConfig(payload)
  assert.deepEqual(config.formats.map((format) => format.id), ['bon_plan', 'banner', 'popup'])
  assert.equal(config.formats[0].pricingOptions[1].label, 'Essentiel · 30 jours')
})

test('enrichit les formats sans recopier les tarifs', () => {
  const formats = buildAdvertisingFormats(normalizeCampaignConfig(payload))
  assert.equal(formats[1].targetingLabel, 'Une catégorie Kalico')
  assert.equal(formatStartingPrice(formats[1]), 'À partir de 990 XPF')
})

test('refuse une configuration incomplète', () => {
  assert.throws(() => normalizeCampaignConfig({ data: { currency: 'XPF', formats: [] } }), /indisponible/)
})
