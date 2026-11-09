import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('le sélecteur Déposer envoie les événements vers le formulaire canonique', async () => {
  const flow = await read('src/components/listings/publish/PublishFlow.tsx')

  assert.match(flow, /if \(kind === 'event'\) \{\s*router\.push\('\/evenements\/publier'\)/)
  assert.match(flow, /if \(kind === 'event'\) \{\s*router\.replace\('\/evenements\/publier'\)/)
})

test('le CTA événement de l’accueil utilise la même route canonique', async () => {
  const home = await read('src/components/home/HomeSpotlightSection.tsx')

  assert.match(home, /cta: 'Publier un événement',\s*href: '\/evenements\/publier'/)
})
