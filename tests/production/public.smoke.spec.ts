import { expect, test, type Page } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector } from '../support/auth'

const PUBLIC_ROUTES = ['/', '/annonces', '/connexion', '/inscription'] as const
const RESPONSIVE_VIEWPORTS = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet-portrait' },
  { width: 1024, height: 768, label: 'tablet-landscape' },
  { width: 1279, height: 800, label: 'compact-desktop' },
] as const
const PRODUCTION_ONLY_CONSOLE_NOISE = [
  /static\.cloudflareinsights\.com\/beacon\.min\.js.*Content Security Policy/i,
]

async function expectGuestHeaderReady(page: Page) {
  await expect(page.getByRole('status', { name: 'Chargement du compte' })).toHaveCount(0, { timeout: 15_000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('production public smoke (read-only)', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} is reachable without a blocking browser error`, async ({ page }) => {
      const console = createConsoleCollector(page, PRODUCTION_ONLY_CONSOLE_NOISE)
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })

      expect(response?.status(), `${path} HTTP status`).toBe(200)
      await expect(page.locator('body')).toBeVisible()
      await assertNoForbiddenBodyText(page)
      console.assertClean()
    })
  }

  test('guest auth hydration completes on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expectGuestHeaderReady(page)
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible()
  })

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    test(`guest navigation is available on ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      await expectGuestHeaderReady(page)
      const menu = page.getByRole('button', { name: 'Menu' })
      await expect(menu).toBeVisible()
      await menu.click()
      await expect(page.getByRole('navigation', { name: 'Navigation mobile' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible()
    })
  }

  test('legacy admin root is explicitly unavailable', async ({ page }) => {
    const response = await page.goto('/admin', { waitUntil: 'domcontentloaded' })

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Administration indisponible' })).toBeVisible()
    await expect(page.getByText('Aucune action administrative ne peut être effectuée depuis cet écran.')).toBeVisible()
  })

  test('public API healthcheck is healthy', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true })
  })
})
