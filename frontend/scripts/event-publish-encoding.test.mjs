import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../src/app/evenements/publier/page.tsx', import.meta.url),
  'utf8',
)

test('la page de publication d’événement conserve ses libellés français en UTF-8', () => {
  const expectedLabels = [
    'Publier un événement avec billets',
    'Créez un événement, définissez vos billets, puis gérez la réservation',
    'Catégorie',
    'Conférence',
    'Cinéma',
    'Téléphone organisateur',
    'Billetterie activée',
    'Événement gratuit',
    'Capacité totale',
    'Quantité totale',
    'Aperçu',
    'Réservation native 10 minutes',
    'QR code de contrôle généré automatiquement',
    'Besoin d’aide ?',
  ]

  expectedLabels.forEach((label) => assert.ok(source.includes(label), `Libellé manquant : ${label}`))
})

test('la page ne contient ni mojibake ni caractère de contrôle', () => {
  assert.doesNotMatch(source, /ï¿½|Ã.|Â.|â.|�/u)
  assert.doesNotMatch(source, /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u)
})
