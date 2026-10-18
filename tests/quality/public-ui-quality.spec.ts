import { expect, test } from '@playwright/test'

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

  test('inscription: la liste des communes garde un contraste visible au survol', async ({ page }) => {
    await openStablePage(page, '/inscription')
    await page.getByRole('button', { name: 'Continuer' }).click()

    const communeSelect = page.getByRole('combobox', { name: 'Commune' })
    await communeSelect.click()
    const communeOption = page.getByRole('option').filter({ hasText: 'Nouméa' })
    await communeOption.hover()

    const colors = await communeOption.evaluate((element) => {
      const style = window.getComputedStyle(element)
      return { color: style.color, backgroundColor: style.backgroundColor }
    })
    expect(colors.color).not.toBe('rgb(255, 255, 255)')
    expect(colors.backgroundColor).not.toBe('rgb(255, 255, 255)')

    await communeOption.click()
    await expect(communeSelect).toContainText('Nouméa')
  })

  test('vérification email: une nouvelle session propose une connexion préremplie', async ({ page }) => {
    await page.route('**/api/auth/verify-email', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user: { email: 'testeur@kalico.nc' } } }),
    }))

    await openStablePage(page, '/verification-email?token=test-token')
    const loginLink = page.getByRole('link', { name: 'Se connecter' })
    await expect(loginLink).toBeVisible()
    await loginLink.click()

    await expect(page.getByLabel('Adresse e-mail')).toHaveValue('testeur@kalico.nc')
    await expect(page.getByText('Adresse email vérifiée')).toBeVisible()
  })

  test('vérification email: la session d’inscription continue automatiquement', async ({ page }) => {
    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3_600 }))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
      window.sessionStorage.setItem('access_token', `test.${payload}.signature`)
      window.sessionStorage.setItem('refresh_token', 'test-refresh-token')
    })
    await page.route('**/api/auth/verify-email', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user: { email: 'testeur@kalico.nc' } } }),
    }))
    await page.route('**/api/users/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'audit-user',
          email: 'testeur@kalico.nc',
          first_name: 'Test',
          last_name: 'Kalico',
          avatar_url: null,
          is_verified: true,
          is_pro: false,
          is_admin: false,
          rating: 0,
        },
      }),
    }))

    await openStablePage(page, '/verification-email?token=test-token')
    await expect(page).toHaveURL(/\/$/, { timeout: 5_000 })
  })
})
