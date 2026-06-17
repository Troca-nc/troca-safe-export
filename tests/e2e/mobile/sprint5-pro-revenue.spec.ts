import { expect, test } from '@playwright/test'
import {
  MOBILE_VIEWPORTS,
  createMobileConsoleCollector,
  expectMobileBodyHealthy,
  hydrateAuthenticatedMobilePage,
  openMobilePage,
  saveMobileScreenshot,
  setMobileViewport,
} from './helpers'

test.describe.configure({ mode: 'serial' })

for (const viewport of MOBILE_VIEWPORTS) {
  test(`quotes and boosts stay usable on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(35_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'pro')

    await openMobilePage(page, '/pro/dashboard/devis')
    await expect(page.getByRole('heading', { name: /Mes devis/i })).toBeVisible()
    await expect(page.getByText(/24h|Aucune demande/i)).toBeVisible()
    await page.getByRole('button', { name: /Nouveau devis/i }).first().click()
    await expect(page.getByRole('heading', { name: /^Nouveau devis$/i })).toBeVisible({ timeout: 15_000 })
    await expectMobileBodyHealthy(page)

    await openMobilePage(page, '/pro/dashboard')
    await expect(page.getByRole('heading', { name: /Vos meilleures annonces/i }).first()).toBeVisible()
    const boosterButtons = page.getByRole('button', { name: /^Booster$/i })
    if (await boosterButtons.count()) {
      await boosterButtons.first().click()
      await expect(page.getByRole('heading', { name: /Booster cette annonce/i })).toBeVisible({ timeout: 15_000 })
    } else {
      globalThis.console.warn(`[mobile-audit] Aucun bouton Booster disponible sur ${viewport.label}; test limité au dashboard Pro.`)
    }
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint5-boost-${viewport.width}`)

    console.assertClean()
  })
}
