import { test, expect } from '@playwright/test'
import { createConsoleCollector, dismissOnboardingWizard, restoreAuthenticatedStore, restoreSessionStorage, assertNoForbiddenBodyText } from './support/auth'
import { expectPageHealthy, expectNotOnConnexion } from './support/audit'
import { ParticulierPO } from './pom/particulier.po'
import { MessagesPO } from './pom/messages.po'

test.describe('particulier', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'particulier')
    await restoreSessionStorage(page, 'particulier')
    await dismissOnboardingWizard(page)
  })

  test('can access protected pages without login wall', async ({ page }) => {
    const console = createConsoleCollector(page)
    const particulier = new ParticulierPO(page)

    await particulier.openMessages()
    await expectNotOnConnexion(page)
    await expect(page).toHaveURL(/\/messages/)

    await particulier.openRdv()
    await expect(page).toHaveURL(/\/mes-rdv/)
    await expect(page.getByText(/Mes rendez-vous/i)).toBeVisible()

    await particulier.openProfile()
    await expect(page.getByText(/Mon compte particulier/i)).toBeVisible()

    await particulier.openSettings()
    await expect(page.getByRole('heading', { name: /Param[eè]tres/i })).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('profile and settings remain accessible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const particulier = new ParticulierPO(page)

    await particulier.openProfile()
    await expect(page.getByText(/Mon compte particulier/i)).toBeVisible()

    await particulier.openSettings()
    await expect(page.getByRole('heading', { name: /Param[eè]tres/i })).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('can send a real message in an existing conversation', async ({ page }) => {
    const console = createConsoleCollector(page)
    const messages = new MessagesPO(page)

    await messages.open()
    await messages.openConversationByListingText('Toyota Hilux 2019 4x4 diesel')

    const text = `Message Playwright ${Date.now()}`
    await messages.sendTextMessage(text)
    await messages.expectMessageVisible(text)

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
