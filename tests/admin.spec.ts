import { test, expect } from '@playwright/test'

test.describe('legacy admin unavailable', () => {
  for (const path of ['/admin/dashboard', '/admin/users', '/admin/annonces', '/admin/signalements']) {
    test(`shows an explicit notice at ${path} without external redirect`, async ({ page }) => {
      await page.goto(path)
      expect(new URL(page.url()).pathname).toBe(path)
      await expect(page.getByRole('heading', { name: 'Administration indisponible' })).toBeVisible()
      await expect(page.getByText('Aucune action administrative ne peut être effectuée depuis cet écran.')).toBeVisible()
      await expect(page.getByRole('button')).toHaveCount(0)
    })
  }
})
