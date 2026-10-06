import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node utilise l'extension explicite pour le type stripping.
import { filterAndSortPros, uniqueProValues } from './prosPresentation.ts'
import type { ProSummary } from '../types/pro-public'

const base = (id: number, name: string, overrides: Partial<ProSummary> = {}): ProSummary => ({ id, name, firstName: '', lastName: '', companyName: name, category: 'Service', commune: 'Nouméa', description: '', logoUrl: null, bannerUrl: null, rating: 0, reviewCount: 0, listingCount: 0, latestReview: null, verified: true, ...overrides })

test('filtre sans tenir compte de la casse et trie par note', () => {
  const pros = [base(1, 'Atelier Boréal', { rating: 4.2 }), base(2, 'Déclic local', { rating: 4.9 })]
  const result = filterAndSortPros(pros, { query: 'DÉCLIC', category: '', commune: '', minRating: 4, sort: 'rating' })
  assert.deepEqual(result.map((pro) => pro.id), [2])
})

test('les options viennent uniquement des professionnels chargés', () => {
  const pros = [base(1, 'A', { commune: 'Païta' }), base(2, 'B', { commune: 'Nouméa' }), base(3, 'C', { commune: 'Païta' })]
  assert.deepEqual(uniqueProValues(pros, 'commune'), ['Nouméa', 'Païta'])
})

test('un professionnel sans avis reste visible', () => {
  assert.equal(filterAndSortPros([base(1, 'Nouveau pro')], { query: '', category: '', commune: '', minRating: 0, sort: 'rating' }).length, 1)
})
