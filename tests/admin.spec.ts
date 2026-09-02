import { test, expect } from '@playwright/test'

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.kalico.nc'

test.describe('legacy admin surface', () => {
  test('redirects every public-frontend admin path to the dedicated back-office', async ({ page }) => {
    await page.route(`${adminUrl}/**`, (route) => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<h1>Dedicated Kalico admin</h1>',
    }))

    await page.goto('/admin/dashboard')

    await expect(page).toHaveURL(`${adminUrl}/`)
    await expect(page.getByRole('heading', { name: 'Dedicated Kalico admin' })).toBeVisible()
  })
})
