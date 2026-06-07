import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreSessionStorage } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectPageHealthy, gotoPage } from './support/audit'

test.describe('conducteur', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSessionStorage(page, 'conducteur')
  })

  test('publishing a ride exposes all reservation mode fields', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/covoiturage')
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/Proposer un trajet/i)).toBeVisible()
    await expect(page.getByText(/Mode de réservation/i)).toBeVisible()
    await expect(page.getByLabel(/Départ/i).or(page.getByPlaceholder(/Départ/i))).toBeVisible()
    await expect(page.getByLabel(/Destination/i).or(page.getByPlaceholder(/Destination/i))).toBeVisible()
    await expect(page.getByLabel(/Date/i).or(page.getByPlaceholder(/Date/i))).toBeVisible()
    await expect(page.getByLabel(/Heure/i).or(page.getByPlaceholder(/Heure/i))).toBeVisible()
    await expect(page.getByLabel(/Places/i).or(page.getByPlaceholder(/Places/i))).toBeVisible()
    await expect(page.getByLabel(/Prix/i).or(page.getByPlaceholder(/Prix/i))).toBeVisible()
    await captureFullPage(page, 'conducteur', 'publication-trajet')

    await gotoPage(page, '/covoiturage/reservations')
    await expect(page.getByText(/En tant que passager/i).or(page.getByText(/passager/i))).toBeVisible()
    await expect(page.getByText(/En tant que conducteur/i).or(page.getByText(/conducteur/i))).toBeVisible()
    await expect(page.getByText(/Confirmé/i).or(page.getByText(/En attente/i)).or(page.getByText(/Annulé/i)).or(page.getByText(/Terminé/i))).toBeVisible()
    await captureFullPage(page, 'conducteur', 'reservations')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
