import { test, expect } from '@playwright/test'
import { createConsoleCollector, restoreSessionStorage, assertNoForbiddenBodyText } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectPageHealthy, expectNotOnConnexion, gotoPage } from './support/audit'

test.describe('particulier', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSessionStorage(page, 'particulier')
  })

  test('can access protected pages without login wall', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/annonces/nouvelle')
    await expectNotOnConnexion(page)
    await expect(page.getByText(/Connexion requise/i)).not.toBeVisible()
    await expect(page.getByText(/Troc possible/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Publier l’annonce/i })).toBeVisible()
    await captureFullPage(page, 'particulier', 'publication-annonce')

    await gotoPage(page, '/messages')
    await expect(page.getByText(/Messages/i)).toBeVisible()
    await expect(page.getByText(/Connectez-vous pour consulter vos conversations/i)).not.toBeVisible()
    await captureFullPage(page, 'particulier', 'messages')

    await gotoPage(page, '/troc')
    await expect(page.getByText(/Trocômètre/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Trouver des trocs/i })).toBeVisible()
    await captureFullPage(page, 'particulier', 'troc')

    await gotoPage(page, '/covoiturage')
    await expect(page.getByText(/Proposer un trajet/i)).toBeVisible()
    await expect(page.getByLabel(/Date/i).or(page.getByPlaceholder(/Date/i))).toBeVisible()
    await expect(page.getByText(/Mode de réservation/i)).toBeVisible()
    await captureFullPage(page, 'particulier', 'covoiturage')

    await gotoPage(page, '/mes-rdv')
    await expect(page.getByText(/Mes rendez-vous/i)).toBeVisible()
    await expect(page.getByRole('tab', { name: /Tous/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Mes demandes/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Demandes reçues/i })).toBeVisible()
    await captureFullPage(page, 'particulier', 'mes-rdv')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('listing publication wizard exposes all expected steps', async ({ page }) => {
    const console = createConsoleCollector(page)
    await gotoPage(page, '/annonces/nouvelle')
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/Détails/i)).toBeVisible()
    await expect(page.getByText(/Photos/i)).toBeVisible()
    await expect(page.getByText(/Publication/i)).toBeVisible()
    await expect(page.getByText(/Troc possible/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Publier l’annonce/i })).toBeVisible()
    await expect(page.locator('select, input, textarea')).toBeVisible()
    await captureFullPage(page, 'particulier', 'wizard-steps')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('profile and settings remain accessible', async ({ page }) => {
    const console = createConsoleCollector(page)
    await gotoPage(page, '/profil')
    await expect(page.getByText(/Profil/i)).toBeVisible()
    await captureFullPage(page, 'particulier', 'profil')

    await gotoPage(page, '/parametres')
    await expect(page.getByText(/Paramètres/i).or(page.getByText(/Parametres/i))).toBeVisible()
    await expect(page.getByText(/Sécurité/i).or(page.getByText(/Securite/i))).toBeVisible()
    await captureFullPage(page, 'particulier', 'parametres')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
