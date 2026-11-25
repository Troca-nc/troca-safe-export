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
const MISSING_PUBLIC_ROUTES = [
  '/annonces/2147483647',
  '/evenements/2147483647',
  '/pro/2147483647',
  '/profil/2147483647',
] as const
const REVERSE_PROXY_HEADERS = {
  Connection: 'keep-alive',
  'X-Forwarded-For': '203.0.113.10',
  'X-Forwarded-Host': 'kalico.nc',
  'X-Forwarded-Proto': 'https',
}

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

  test('public API healthcheck is healthy', async ({ request }, testInfo) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const payload = await response.json()
    const baseURL = String(testInfo.project.use.baseURL || '')
    const isLocalFrontend = /^http:\/\/(?:127\.0\.0\.1|localhost|0\.0\.0\.0)(?::\d+)?/i.test(baseURL)
    expect(payload).toMatchObject(isLocalFrontend ? { status: 'ok' } : { ok: true })
  })

  for (const path of MISSING_PUBLIC_ROUTES) {
    test(`${path} returns a real HTTP 404`, async ({ request }) => {
      const htmlResponse = await request.get(path, { headers: { Accept: 'text/html' } })
      expect(htmlResponse.status(), `${path} HTML status`).toBe(404)

      const rscResponse = await request.get(path, { headers: { RSC: '1' } })
      expect(rscResponse.status(), `${path} RSC status`).toBe(404)

      const proxyResponse = await request.get(path, { headers: REVERSE_PROXY_HEADERS })
      expect(proxyResponse.status(), `${path} proxy status`).toBe(404)

      const prefetchResponse = await request.get(path, {
        headers: {
          ...REVERSE_PROXY_HEADERS,
          RSC: '1',
          'Next-Router-Prefetch': '1',
        },
      })
      expect(prefetchResponse.status(), `${path} prefetch status`).toBe(404)
      expect(prefetchResponse.headers()['x-kalico-public-preflight'], `${path} preflight proof`).toBe('not-found')
    })
  }
})
