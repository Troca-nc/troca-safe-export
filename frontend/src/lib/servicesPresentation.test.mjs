import assert from 'node:assert/strict'
import test from 'node:test'

import { filterAndSortPros, shippingPriceLabel } from './servicesPresentation.ts'

const pros = [
  { id: 1, name: 'Atelier Nord', category: 'Menuiserie', commune: 'Koné', description: '', logoUrl: null, rating: 4.2, reviewCount: 18, listingCount: 2, verified: true },
  { id: 2, name: 'Équipe Sud', category: 'Plomberie', commune: 'Païta', description: '', logoUrl: null, rating: 4.9, reviewCount: 7, listingCount: 1, verified: true },
]

test('filtre les professionnels avec les champs réellement disponibles', () => {
  const result = filterAndSortPros(pros, { query: 'atelier', category: 'Menuiserie', commune: 'Koné', verifiedOnly: true, sort: 'rating' })
  assert.deepEqual(result.map((pro) => pro.id), [1])
})

test('trie les professionnels par nombre d’avis', () => {
  const result = filterAndSortPros(pros, { query: '', category: '', commune: '', verifiedOnly: true, sort: 'reviews' })
  assert.deepEqual(result.map((pro) => pro.id), [1, 2])
})

test('affiche le repli tarifaire sans montant serveur', () => {
  assert.equal(shippingPriceLabel(null), 'Tarif sur demande')
  assert.equal(shippingPriceLabel({ estimatedMinXpf: null, estimatedMaxXpf: null, distanceKm: null, volumeLabel: '', weightLabel: '', summary: '' }), 'Tarif sur demande')
})
