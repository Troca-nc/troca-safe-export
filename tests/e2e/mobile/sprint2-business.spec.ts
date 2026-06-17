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
  test(`fret and events stay readable on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(20_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'particulier')

    await openMobilePage(page, '/fret')
    await expect(page.getByText(/Module fret/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Calculez votre fret/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Envoyer ma demande fret/i })).toBeVisible()
    await expectMobileBodyHealthy(page)

    await openMobilePage(page, '/evenements')
    await expect(page.getByText(/Agenda Kalico/i)).toBeVisible()
    await expect(page.getByText('Calendrier', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Scanner un billet/i })).toBeVisible()
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint2-evenements-${viewport.width}`)

    console.assertClean()
  })
}
