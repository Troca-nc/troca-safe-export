import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const paths = [
  '../src/app/evenements/publier/page.tsx',
  '../src/components/events/PublishPanel.tsx',
  '../src/components/events/EventPreviewCard.tsx',
  '../src/lib/data/events.ts',
]
const source = (await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), 'utf8')))).join('\n')

test('la page de publication d’événement conserve ses libellés français en UTF-8', () => {
  const expectedLabels = [
    'Publie ton événement.',
    'Événement · Billetterie intégrée',
    'Catégorie',
    'Atelier ou conférence',
    'Cinéma',
    'Téléphone · facultatif',
    'Billetterie activée',
    'Sans billetterie',
    'Capacité totale',
    'Ajouter un type de billet',
    'Aperçu',
    'QR code unique',
    'Prêt à publier ?',
    'Un doute ?',
  ]

  expectedLabels.forEach((label) => assert.ok(source.includes(label), `Libellé manquant : ${label}`))
})

test('la page ne contient ni mojibake ni caractère de contrôle', () => {
  assert.doesNotMatch(source, /ï¿½|Ã.|Â.|â.|�/u)
  assert.doesNotMatch(source, /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u)
})
