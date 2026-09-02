import { test, expect } from '@playwright/test'

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.kalico.nc'

test.describe('smoke admin redirect', () => {
  test('public frontend delegates admin paths to the isolated application', async ({ page }) => {
    await page.route(`${adminUrl}/**`, (route) => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<h1>Dedicated Kalico admin</h1>',
    }))

    await page.goto('/admin/users')

    await expect(page).toHaveURL(`${adminUrl}/`)
  })
})
