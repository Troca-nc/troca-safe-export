import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateQuotePreview, isLowStock, quoteTrackingColumn, trackingCounts } from './proSpacePresentation'
import type { ProQuote, ProQuoteRequest, ProSpaceProduct } from '../types/pro-space'

test('calcule le même arrondi par ligne que le serveur', () => {
  assert.deepEqual(calculateQuotePreview([
    { label: 'Conseil', unit: 'hour', quantity: 1.5, unit_price_xpf: 1001, tgc_rate: 3 },
    { label: 'Matériel', unit: 'unit', quantity: 2, unit_price_xpf: 999, tgc_rate: 11 },
  ], 25), {
    subtotalXpf: 3500,
    tgcXpf: 265,
    totalXpf: 3765,
    depositXpf: 941,
    balanceXpf: 2824,
  })
})

test('considère uniquement un stock suivi inférieur ou égal au seuil comme faible', () => {
  const base = { id: 1, title: 'Test', description: null, price_type: 'fixed', price_xpf: 0, is_available: true, is_active: true, is_featured: false, unit_label: null, cover_image_url: null, catalog_category_name: null, published_listing_count: 0 }
  assert.equal(isLowStock({ ...base, stock_quantity: 5 } satisfies ProSpaceProduct), true)
  assert.equal(isLowStock({ ...base, stock_quantity: null } satisfies ProSpaceProduct), false)
})

test('classe seulement les états contractuels dans les quatre colonnes', () => {
  assert.equal(quoteTrackingColumn('viewed'), 'sent')
  assert.equal(quoteTrackingColumn('converted'), 'accepted')
  assert.equal(quoteTrackingColumn('refused'), null)
  const requests = [{ id: 'r1' }] as ProQuoteRequest[]
  const quotes = [
    { status: 'draft' },
    { status: 'sent' },
    { status: 'paid' },
  ] as ProQuote[]
  assert.deepEqual(trackingCounts(requests, quotes), { requests: 2, sent: 1, accepted: 0, paid: 1 })
})
