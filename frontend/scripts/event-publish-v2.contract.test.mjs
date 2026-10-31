import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('la page publier conserve ses contrats produit', async () => {
  const page = await read('src/app/evenements/publier/page.tsx')
  const data = await read('src/lib/data/events.ts')
  const publishPanel = await read('src/components/events/PublishPanel.tsx')
  const source = `${page}\n${publishPanel}`

  for (const label of ['L’événement', 'Quand et où', 'Billetterie', 'L’organisateur', 'Prêt à publier ?']) {
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(page, /beforeunload/)
  assert.match(page, /openAuthModal\(\{ type: 'publish_listing', redirectTo: '\/evenements\/publier' \}\)/)
  assert.match(page, /Adresse de la photo · facultative/)
  assert.match(page, /EventPreviewCard/)
  assert.doesNotMatch(page, /eventsApi|metaApi/)
  assert.match(data, /saveLocalEventDraft/)
  assert.match(data, /status: 'published'/)
  assert.match(data, /ticket_types:/)
})

test('la carte publique est réellement partagée avec l’aperçu', async () => {
  const preview = await read('src/components/events/EventPreviewCard.tsx')
  const listing = await read('src/components/bon-plans/BonsPlansPageView.tsx')
  assert.match(preview, /import \{ EventCard \} from '@\/components\/bon-plans\/EventCard'/)
  assert.match(preview, /variant="preview"/)
  assert.match(listing, /import \{ EventCard \} from '@\/components\/bon-plans\/EventCard'/)
})

test('les catégories envoyées correspondent au contrat serveur', async () => {
  const data = await read('src/lib/data/events.ts')
  for (const category of ['concert', 'festival', 'sport', 'marche', 'conference', 'exposition', 'cinema', 'spectacle', 'autre']) {
    assert.match(data, new RegExp(`value: '${category}'`))
  }
})

test('les communes imbriquées dans les provinces sont aplaties pour le menu', async () => {
  const data = await read('src/lib/data/events.ts')
  assert.match(data, /Array\.isArray\(row\.communes\) \? row\.communes : \[row\]/)
  assert.match(data, /nestedCommunes\.flatMap/)
})

test('les fichiers du lot ne contiennent pas de signature mojibake', async () => {
  const paths = [
    'src/app/evenements/publier/page.tsx',
    'src/lib/data/events.ts',
    'src/components/events/EventFormSection.tsx',
    'src/components/events/TicketTypeCard.tsx',
    'src/components/events/EventPreviewCard.tsx',
    'src/components/events/PublishChecklist.tsx',
    'src/components/events/PublishPanel.tsx',
  ]
  for (const path of paths) assert.doesNotMatch(await read(path), /Ã.|Â.|â€™|ï¿½|\uFFFD/, path)
})
