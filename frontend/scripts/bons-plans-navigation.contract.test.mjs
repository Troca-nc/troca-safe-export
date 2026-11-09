import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/components/bon-plans/BonsPlansPageView.tsx', import.meta.url), 'utf8')

test('la page Bons plans expose directement son parcours de publication', () => {
  assert.match(source, /href="\/bons-plans\/publier"/)
  assert.match(source, />Publier un bon plan</)
  assert.match(source, /Vous avez un bon plan à partager \?/)
  assert.match(source, /<aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">/)
  assert.doesNotMatch(source, /<\/p>\{initialTab === 'promos' \? <Link href="\/bons-plans\/publier"/)
})

test('la navigation secondaire redondante Bons plans et événements est retirée', () => {
  assert.doesNotMatch(source, /aria-label="Bons plans et événements"/)
  assert.doesNotMatch(source, /aria-current=\{initialTab === 'promos'/)
  assert.doesNotMatch(source, /aria-current=\{initialTab === 'events'/)
})
