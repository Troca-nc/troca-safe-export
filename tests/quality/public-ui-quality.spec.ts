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

  test('fiche annonce: les textes hors carte restent lisibles en thème sombre', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'dark')
      window.localStorage.setItem('kalico-theme', 'dark')
      window.localStorage.setItem('kalico-cookie-consent', JSON.stringify({
        analytics: false,
        marketing: false,
        decidedAt: '2026-01-01T00:00:00.000Z',
      }))
    })

    await openStablePage(page, '/annonces/101')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    const primaryText = [
      page.getByRole('heading', { name: 'Description' }),
      page.getByRole('heading', { name: 'Avis sur le vendeur' }),
      page.getByRole('heading', { name: 'Échangez en toute sécurité' }),
      page.getByRole('heading', { name: 'Annonces similaires' }),
    ]
    const characteristics = page.getByRole('heading', { name: 'Caractéristiques' })
    if (await characteristics.count()) primaryText.push(characteristics)

    for (const locator of primaryText) {
      await expect(locator).toBeVisible()
      const colors = await locator.evaluate((element) => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--color-text-primary)'
        document.body.appendChild(probe)
        const expected = window.getComputedStyle(probe).color
        probe.remove()
        return { actual: window.getComputedStyle(element).color, expected }
      })
      expect(colors.actual).toBe(colors.expected)
    }

    await expectPageQuality(page, testInfo, 'annonce-detail-sombre')
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
    const user = {
      id: 'audit-user',
      email: 'testeur@kalico.nc',
      first_name: 'Test',
      last_name: 'Kalico',
      avatar_url: null,
      is_verified: true,
      is_pro: false,
      is_admin: false,
      rating: 0,
    }
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3_600 })).toString('base64url')
    const accessToken = `test.${payload}.signature`

    await page.addInitScript(({ token, storedUser }) => {
      window.sessionStorage.setItem('access_token', token)
      window.sessionStorage.setItem('refresh_token', 'test-refresh-token')
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: { user: storedUser, isAuthenticated: true, demoProfile: null },
        version: 0,
      }))
    }, { token: accessToken, storedUser: user })
    await page.route('**/api/auth/verify-email', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user: { email: 'testeur@kalico.nc' } } }),
    }))
    await page.route('**/api/auth/refresh', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { access_token: accessToken, refresh_token: 'test-refresh-token' } }),
    }))
    await page.route('**/api/users/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: user }),
    }))

    await openStablePage(page, '/verification-email?token=test-token')
    await expect(page).toHaveURL(/\/$/, { timeout: 5_000 })
  })
})
