import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreSessionStorage } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectPageHealthy, gotoPage } from './support/audit'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

test.describe('mobile', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const role = testInfo.project.name
    if (role !== 'particulier' && role !== 'pro') {
      test.skip()
    }
    await restoreSessionStorage(page, role as 'particulier' | 'pro')
  })

  test('drawer and hero chips are usable on mobile', async ({ page }, testInfo) => {
    const console = createConsoleCollector(page)
    const role = testInfo.project.name as 'particulier' | 'pro'

    await gotoPage(page, '/')
    await expectMainHeadingVisible(page)
    await expect(page.getByRole('button', { name: /Plus/i })).toBeVisible()
    await page.getByRole('button', { name: /Plus/i }).click()
    await expect(page.getByText(/Troc/i)).toBeVisible()
    await expect(page.getByText(/Pros/i)).toBeVisible()
    await expect(page.getByText(/Bons plans/i).or(page.getByText(/Bons plans/i))).toBeVisible()
    await page.getByText(/Pros/i).click()
    await captureFullPage(page, role, 'mobile-home-drawer')

    if (role === 'particulier') {
      await gotoPage(page, '/annonces/nouvelle')
      await expect(page.getByRole('button', { name: /Publier l’annonce/i })).toBeVisible()
      await expect(page.getByText(/Troc possible/i)).toBeVisible()
      await captureFullPage(page, role, 'mobile-wizard')
    } else {
      await gotoPage(page, '/pro/dashboard')
      await expect(page.getByText(/Vue d'ensemble/i).or(page.getByText(/Vue d’ensemble/i))).toBeVisible()
      await expect(page.getByText(/Rendez-vous/i).or(page.getByText(/Rendez-vous en ligne/i))).toBeVisible()
      await captureFullPage(page, role, 'mobile-pro-dashboard')
    }

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
