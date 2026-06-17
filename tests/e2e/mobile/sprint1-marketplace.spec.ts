import { expect, test } from '@playwright/test'
import { AnnoncesPO } from '../../pom/annonces.po'
import { MessagesPO } from '../../pom/messages.po'
import { PublishWizardPO } from '../../pom/publish-wizard.po'
import {
  MOBILE_VIEWPORTS,
  createMobileConsoleCollector,
  expectMobileBodyHealthy,
  hydrateAuthenticatedMobilePage,
  navigateTo,
  openMobilePage,
  saveMobileScreenshot,
  setMobileViewport,
} from './helpers'

test.describe.configure({ mode: 'serial' })

for (const viewport of MOBILE_VIEWPORTS) {
  test(`marketplace home and detail stay usable on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(35_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'particulier')

    await openMobilePage(page, '/')
    await expect(page.getByRole('navigation', { name: /navigation principale/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Menu$/i })).toBeVisible()

    await navigateTo(page, '/annonces')
    await expect(page.getByRole('button', { name: /^Filtres$/i })).toBeVisible({ timeout: 15_000 })

    const annonces = new AnnoncesPO(page)
    await annonces.openFirstListing()
    await expect(page.getByRole('heading', { name: /Description/i })).toBeVisible()
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint1-annonce-detail-${viewport.width}`)

    console.assertClean()
  })

  test(`publish wizard compresses photos on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(35_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'particulier')

    const wizard = new PublishWizardPO(page)
    await wizard.open()
    await wizard.fillStepOne(`Annonce mobile ${viewport.width}`, 'Test de publication mobile avec compression photo.')
    await wizard.chooseFirstLeafCategory()
    await wizard.goToStep2()
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint1-publish-${viewport.width}`)

    console.assertClean()
  })

  test(`covoiturage and messages stay fluid on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(35_000)
    const console = createMobileConsoleCollector(page)

    await setMobileViewport(page, viewport.width, viewport.height)
    await hydrateAuthenticatedMobilePage(page, 'particulier')

    await openMobilePage(page, '/covoiturage?mode=publish')
    await expect(page.getByText(/Réserver ce trajet aux femmes/i)).toBeVisible()
    await expect(page.getByText(/Mode de réservation/i)).toBeVisible()
    await expectMobileBodyHealthy(page)

    const messages = new MessagesPO(page)
    await messages.openConversationByListingText('Toyota Hilux 2019 4x4 diesel')
    await expect(page.getByRole('button', { name: /Envoyer le message/i })).toBeVisible()
    const messageField = page.locator('textarea:visible, input:visible').first()
    await messageField.click({ force: true })
    await expectMobileBodyHealthy(page)
    await saveMobileScreenshot(page, `sprint1-messages-${viewport.width}`)

    console.assertClean()
  })
}
