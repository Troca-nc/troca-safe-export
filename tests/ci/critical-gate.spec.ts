import { expect, test } from '@playwright/test'

const PROXY_HEADERS = {
  Connection: 'keep-alive',
  'X-Forwarded-For': '203.0.113.10',
  'X-Forwarded-Host': 'kalico.nc',
  'X-Forwarded-Proto': 'https',
}

const RSC_HEADERS = {
  ...PROXY_HEADERS,
  Connection: 'upgrade',
  RSC: '1',
  'Next-Router-Prefetch': '1',
}

test('critical local services answer successfully', async ({ page, request }) => {
  const backendUrl = process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001'

  const healthResponse = await request.get(`${backendUrl}/api/health`)
  expect(healthResponse.ok()).toBeTruthy()

  const response = await page.goto('/')
  expect(response, 'The frontend should return an HTTP response').not.toBeNull()
  expect(response?.status()).toBeLessThan(500)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('public detail preflight tolerates reverse proxy headers', async ({ request }) => {
  const cases = [
    { path: '/annonces/101', expected: 200 },
    { path: '/pro/3', expected: 200 },
    { path: '/profil/2', expected: 200 },
    { path: '/annonces/2147483647', expected: 404 },
    { path: '/evenements/2147483647', expected: 404 },
    { path: '/pro/2147483647', expected: 404 },
    { path: '/profil/2147483647', expected: 404 },
  ] as const

  for (const item of cases.filter(({ expected }) => expected === 200)) {
    const response = await request.get(item.path, { headers: { Accept: 'text/html' } })
    expect(response.status(), `${item.path} HTML headers`).toBe(200)
  }

  for (const headers of [PROXY_HEADERS, RSC_HEADERS]) {
    for (const item of cases) {
      const response = await request.get(item.path, { headers })
      expect(response.status(), `${item.path} with ${'RSC' in headers ? 'RSC' : 'proxy'} headers`).toBe(item.expected)
      expect(response.headers()['x-kalico-public-preflight'], `${item.path} preflight proof`).toBe(
        item.expected === 404 ? 'not-found' : 'hit',
      )
    }
  }
})
