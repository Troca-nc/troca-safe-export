import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('event cards expose their image, content and action as detail links', async () => {
  const card = await read('src/components/bon-plans/EventCard.tsx')

  assert.match(card, /href=\{`\/evenements\/\$\{event\.id\}`\}/)
  assert.match(card, /Voir tous les détails de \$\{event\.title\}/)
  assert.match(card, /Voir les détails/)
  assert.doesNotMatch(card, /Acheter une place|Tarif à confirmer/)
})

test('external booking remains a separate action', async () => {
  const card = await read('src/components/bon-plans/EventCard.tsx')

  assert.match(card, /event\.bookingUrl/)
  assert.match(card, /Payer en ligne/)
  assert.match(card, /whitespace-nowrap/)
})

test('event payment labels come from ticketing data', async () => {
  const card = await read('src/components/bon-plans/EventCard.tsx')
  const data = await read('src/lib/data/bon-plans.ts')

  for (const label of ['Entrée libre', 'Réservation gratuite', 'Paiement en ligne', 'Paiement sur place']) {
    assert.match(card, new RegExp(label))
  }
  assert.match(data, /Array\.isArray\(item\.ticket_types\)/)
  assert.match(data, /paymentMode: !hasTicketing \? 'open'/)
  assert.match(data, /ticketPrices\.length \? Math\.min/)
  assert.doesNotMatch(data, /item\.booking_url \?\? item\.ticketing_url \?\? item\.link_url \?\? item\.website_url/)
})

test('calendar entries link to the same event detail page', async () => {
  const page = await read('src/components/bon-plans/BonsPlansPageView.tsx')

  assert.match(page, /aria-label=\{`Voir l’événement \$\{event\.title\}`\}/)
  assert.match(page, /href=\{`\/evenements\/\$\{event\.id\}`\}/)
})
