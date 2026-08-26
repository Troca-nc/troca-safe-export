import { expect, test } from '@playwright/test'

test('critical local services answer successfully', async ({ page, request }) => {
  const backendUrl = process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001'

  const healthResponse = await request.get(`${backendUrl}/api/health`)
  expect(healthResponse.ok()).toBeTruthy()

  const response = await page.goto('/')
  expect(response, 'The frontend should return an HTTP response').not.toBeNull()
  expect(response?.status()).toBeLessThan(500)
  await expect(page.locator('body')).not.toBeEmpty()
})
