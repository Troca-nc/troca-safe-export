import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('l\'accueil affiche les statistiques de l\'API sans valeurs de maquette', () => {
  const stats = read('../src/components/home/HomePlatformStats.tsx')
  const data = read('../src/lib/data/home.ts')

  assert.doesNotMatch(stats, /Placeholder/)
  assert.match(stats, /stats\?\.membersCount/)
  assert.match(stats, /stats\?\.listingsCount/)
  assert.match(data, /statsApi\.getPlatform\(\)/)
})

test('le choix de commune est interactif et transmis au catalogue', () => {
  const hero = read('../src/components/home/HomeSectionsV2.tsx')
  const page = read('../src/components/home/HomePage.tsx')

  assert.match(hero, /<Select/)
  assert.match(hero, /onCommuneChange\(event\.target\.value\)/)
  assert.match(hero, /<option value="">Toute la NC<\/option>/)
  assert.match(page, /params\.set\('commune', communeSlug\)/)
  assert.match(read('../src/lib/data/home.ts'), /metaApi\.getCommunes\(\)/)
  assert.doesNotMatch(hero, /Près de chez vous|CommunesBarSection/)
  assert.doesNotMatch(page, /CommunesBarSection/)
})

