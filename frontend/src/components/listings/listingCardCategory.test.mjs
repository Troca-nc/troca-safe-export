import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const listingCard = readFileSync(new URL('./ListingCard.tsx', import.meta.url), 'utf8')

test('la carte affiche le libellé de catégorie normalisé', () => {
  assert.match(listingCard, /const categoryLabel = getListingCategoryLabel\(listing\)/)
  assert.match(listingCard, /<span className="truncate">\{categoryLabel\}<\/span>/)
})

test('la catégorie utilise uniquement les tokens du design system', () => {
  assert.match(listingCard, /border-info-border bg-info-soft/)
  assert.match(listingCard, /text-caption font-semibold text-info-text/)
})
