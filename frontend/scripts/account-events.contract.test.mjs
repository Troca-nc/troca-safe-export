import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('le compte expose un chemin vers les événements du membre', async () => {
  const account = await read('src/components/profil/PersonalAccountPage.tsx')
  const overview = await read('src/components/profil/AccountOverview.tsx')
  const page = await read('src/app/profil/evenements/page.tsx')
  for (const source of [account, overview]) assert.match(source, /href: '\/profil\/evenements'/)
  assert.match(account, /getPersonalEvents/)
  assert.match(account, /Voir la fiche/)
  assert.match(page, /activeTab="events"/)
})

test('la récupération utilise la route authentifiée dédiée', async () => {
  const api = await read('src/lib/api.ts')
  const data = await read('src/lib/data/personal-account.ts')
  assert.match(api, /listMine:.*[\s\S]*?\/events\/mine/)
  assert.match(data, /eventsApi\.listMine/)
})
