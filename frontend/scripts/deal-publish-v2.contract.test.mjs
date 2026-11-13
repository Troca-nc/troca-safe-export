import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('la page reprend les blocs de la maquette et les médias dédiés', async () => {
  const page = await read('src/app/bons-plans/publier/page.tsx')
  const media = await read('src/components/deals/DealMediaFields.tsx')
  const panel = await read('src/components/events/PublishPanel.tsx')
  const source = `${page}\n${media}\n${panel}`

  for (const label of ['Quel type d’offre ?', 'L’offre', 'Quand et où', 'Qui propose l’offre ?', 'Prêt à publier ?']) {
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  for (const label of ['Prix réduit', 'Pourcentage', 'Code promo', 'Offre spéciale']) assert.match(page, new RegExp(label))
  assert.match(page, /durationDays/)
  assert.match(page, /uploadCatalogPdf/)
  assert.match(page, /uploadImage/)
  assert.match(page, /DealMediaFields/)
  assert.match(media, /Choisir une photo sur ton appareil/)
  assert.match(media, /Ajouter un catalogue PDF/)
  assert.doesNotMatch(page, /Adresse de la photo/)
  assert.match(page, /beforeunload/)
  assert.match(page, /successfulNavigation\.current = true/)
})

test('la page utilise la couche de données et les composants partagés', async () => {
  const page = await read('src/app/bons-plans/publier/page.tsx')
  assert.match(page, /EventFormSection/)
  assert.match(page, /PublishChecklist/)
  assert.match(page, /PublishPanel/)
  assert.match(page, /DealPreviewCard/)
  assert.doesNotMatch(page, /bonPlansApi|metaApi/)
})

test('la remise calculée suit la règle arrondie de la fiche', async () => {
  const data = await read('src/lib/data/deals.ts')
  const match = data.match(/export function computeDiscountPercent\(beforeValue: string, afterValue: string\) \{([\s\S]*?)\n\}/)
  assert.ok(match)
  const compute = new Function('beforeValue', 'afterValue', match[1])
  assert.equal(compute('12000', '9000'), 25)
  assert.equal(compute('1000', '999'), 0)
  assert.equal(compute('1000', '1000'), null)
  assert.equal(compute('', '0'), null)
})

test('les communes réelles sont aplaties et le brouillon reste local', async () => {
  const data = await read('src/lib/data/deals.ts')
  assert.match(data, /Array\.isArray\(row\.communes\) \? row\.communes : \[row\]/)
  assert.match(data, /localStorage/)
  assert.match(data, /duration_days/)
  assert.match(data, /uploadDealPhoto/)
  assert.match(data, /uploadDealCatalog/)
})

test('les fichiers de la refonte ne contiennent pas de signature mojibake', async () => {
  const paths = [
    'src/app/bons-plans/publier/page.tsx',
    'src/lib/data/deals.ts',
    'src/types/deals.ts',
    'src/components/deals/OfferTypeCard.tsx',
    'src/components/deals/DiscountReadout.tsx',
    'src/components/deals/DealPreviewCard.tsx',
    'src/components/deals/DealMediaFields.tsx',
    'src/components/events/PublishPanel.tsx',
  ]
  for (const path of paths) assert.doesNotMatch(await read(path), /Ã.|Â.|â€™|ï¿½|\uFFFD/, path)
})
