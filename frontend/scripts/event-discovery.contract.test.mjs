import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('le header expose les événements directement sur desktop et mobile', async () => {
  const header = await read('src/components/layout/HeaderV2.tsx')

  assert.match(header, /\{ href: '\/annonces', label: 'Annonces' \},\s*\{ href: '\/evenements', label: 'Événements' \}/)
  assert.match(header, /navigation\.map/)
})

test('l’accueil charge et affiche les prochains événements avant les annonces', async () => {
  const page = await read('src/components/home/HomePage.tsx')
  const eventsIndex = page.indexOf('<UpcomingEventsSection')
  const listingsIndex = page.indexOf('<RecentListingsSection')

  assert.match(page, /getUpcomingEvents\(4\)/)
  assert.ok(eventsIndex > 0 && eventsIndex < listingsIndex)
})

test('la section d’accueil réutilise la carte publique et les routes canoniques', async () => {
  const sections = await read('src/components/home/HomeSectionsV2.tsx')

  assert.match(sections, /<EventCard key=\{event\.id\} event=\{event\} \/>/)
  assert.match(sections, /href="\/evenements"/)
  assert.match(sections, /href="\/evenements\/publier"/)
})

test('la source d’accueil exclut les événements passés et trie les prochains', async () => {
  const data = await read('src/lib/data/bon-plans.ts')

  assert.match(data, /export async function getUpcomingEvents/)
  assert.match(data, /!isPastEvent\(item\.dateIso\)/)
  assert.match(data, /left\.dateIso\.localeCompare\(right\.dateIso\)/)
  assert.match(data, /\.slice\(0, limit\)/)
})
