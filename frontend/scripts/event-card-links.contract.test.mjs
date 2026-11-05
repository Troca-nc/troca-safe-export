import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('event cards always link to the internal detail page', async () => {
  const card = await read('src/components/bon-plans/EventCard.tsx')

  assert.match(card, /href=\{`\/evenements\/\$\{event\.id\}`\}/)
  assert.match(card, /event\.hasTicketing \? 'Acheter une place' : 'En savoir plus'/)
})

test('external booking remains a separate action', async () => {
  const card = await read('src/components/bon-plans/EventCard.tsx')

  assert.match(card, /event\.bookingUrl/)
  assert.match(card, /Réserver sur le site/)
})

test('calendar entries link to the same event detail page', async () => {
  const page = await read('src/components/bon-plans/BonsPlansPageView.tsx')

  assert.match(page, /aria-label=\{`Voir l’événement \$\{event\.title\}`\}/)
  assert.match(page, /href=\{`\/evenements\/\$\{event\.id\}`\}/)
})
