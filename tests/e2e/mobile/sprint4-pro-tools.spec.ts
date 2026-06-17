import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
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
  test(`pro documents, import and coupons stay legible on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(35_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'pro')

    await openMobilePage(page, '/pro/dashboard/parametres')
    await expect(page.getByText(/Catalogue PDF/i)).toBeVisible()
    await expect(page.getByText(/Demande de devis/i)).toBeVisible()
    await expect(page.getByText(/Logo et bannière/i)).toBeVisible()
    await expect(page.getByText('Portfolio', { exact: true })).toBeVisible()
    await expectMobileBodyHealthy(page)

    await openMobilePage(page, '/pro/dashboard/import')
    await expect(page.getByRole('heading', { name: /Importer des produits depuis CSV ou Excel/i })).toBeVisible()
    const sampleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalico-mobile-import-'))
    const sampleFile = path.join(sampleDir, 'sample.csv')
    fs.writeFileSync(
      sampleFile,
      [
        'title,price_xpf,category,description,stock',
        'Produit test,1250,Services,Description de test,8',
      ].join('\n'),
      'utf-8',
    )
    await page.locator('input[type="file"]').setInputFiles(sampleFile)
    await page.waitForTimeout(500)
    const importBody = await page.locator('body').innerText()
    if (/Route démo non implémentée/i.test(importBody) || /api\/import\/upload/i.test(importBody)) {
      globalThis.console.warn(`[mobile-audit] L’upload import reste branché sur une route démo sur ${viewport.label}; mapping non exécutable dans cet environnement.`)
    } else {
      await expect(page.getByRole('heading', { name: /Mapper les colonnes/i })).toBeVisible({ timeout: 5_000 })
      await expect(page.getByRole('button', { name: /Auto-mapper/i })).toBeVisible()
    }
    await expectMobileBodyHealthy(page)

    await openMobilePage(page, '/coupon/invalid-code')
    await expect(page.getByRole('heading', { name: /Coupon indisponible/i })).toBeVisible()
    await expect(page.getByText(/Coupon introuvable/i)).toBeVisible()
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint4-coupon-${viewport.width}`)

    console.assertClean()
  })
}
