import { test } from '@playwright/test'

import { expectPageQuality, openStablePage } from './support'

const PUBLIC_CRITICAL_ROUTES = [
  { name: 'accueil', route: '/' },
  { name: 'annonces', route: '/annonces' },
  { name: 'inscription', route: '/inscription' },
  { name: 'connexion', route: '/connexion' },
  { name: 'cgu', route: '/cgu' },
  { name: 'confidentialite', route: '/politique-de-confidentialite' },
] as const

test.describe('qualité UI et contenu des pages publiques critiques', () => {
  for (const entry of PUBLIC_CRITICAL_ROUTES) {
    test(`${entry.name}: contraste, encodage et largeur`, async ({ page }, testInfo) => {
      await openStablePage(page, entry.route)
      await expectPageQuality(page, testInfo, entry.name)
    })
  }
})
