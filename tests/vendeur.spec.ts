import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, dismissOnboardingWizard, restoreAuthenticatedStore, restoreSessionStorage } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectPageHealthy, gotoPage } from './support/audit'
import { PublishWizardPO } from './pom/publish-wizard.po'

test.describe('vendeur', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'vendeur')
    await restoreSessionStorage(page, 'vendeur')
    await dismissOnboardingWizard(page)
  })

  test('own profile shows the demo account preview', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/profil?tab=listings')
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/Onboarding du compte/i)).toBeVisible()
    await expect(page.getByText(/Mon compte particulier/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Mes annonces/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Messages/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Param[eè]tres/i }).first()).toBeVisible()
    await captureFullPage(page, 'vendeur', 'profil-demo')

    await page.getByRole('link', { name: /Messages/i }).first().click()
    await expect(page).toHaveURL(/\/messages/)

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('seller can still navigate to messages and settings', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/messages')
    await expect(page).toHaveURL(/\/messages/)
    await captureFullPage(page, 'vendeur', 'messages')

    await gotoPage(page, '/parametres')
    await expect(page.getByRole('heading', { name: /Param[eè]tres/i })).toBeVisible()
    await captureFullPage(page, 'vendeur', 'parametres')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('seller can publish a new listing with a photo', async ({ page }) => {
    const console = createConsoleCollector(page)
    const wizard = new PublishWizardPO(page)
    const title = `Test publication Playwright ${Date.now()}`

    await wizard.open()
    await wizard.fillStepOne(
      title,
      'Annonce de test pour valider le parcours de publication complet.',
    )
    await wizard.chooseFirstLeafCategory()
    await wizard.goToStep2()
    await wizard.uploadOnePhoto()
    await wizard.goToStep3()
    await wizard.fillStepThree('12500', 1)
    await wizard.submit()
    await expect(page.getByRole('heading', { name: new RegExp(title, 'i') })).toBeVisible({ timeout: 15_000 })

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
