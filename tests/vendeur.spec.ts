import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreSessionStorage } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectPageHealthy, gotoPage } from './support/audit'

const SELLER_LISTINGS = [
  'Toyota Hilux 2019 4x4 diesel',
  'MacBook Air M2 15 pouces',
  'Bon plan week-end musique live',
]

test.describe('vendeur', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSessionStorage(page, 'vendeur')
  })

  test('own profile lists the three seeded listings', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/profil?tab=listings')
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/Mes annonces/i)).toBeVisible()

    for (const title of SELLER_LISTINGS) {
      await expect(page.getByText(title).first()).toBeVisible()
    }

    await expect(page.getByRole('button', { name: /Modifier/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Supprimer/i }).first()).toBeVisible()
    await captureFullPage(page, 'vendeur', 'mes-annonces')

    await page.getByText('Toyota Hilux 2019 4x4 diesel').click()
    await expect(page).toHaveURL(/\/annonces\/\d+/)
    await expect(page.getByText(/Troc possible/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Modifier/i }).or(page.getByText(/Modifier/i))).toBeVisible()
    await captureFullPage(page, 'vendeur', 'annonce-troc')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('seller can still navigate to messages and settings', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/messages')
    await expect(page.getByText(/Messages/i)).toBeVisible()
    await captureFullPage(page, 'vendeur', 'messages')

    await gotoPage(page, '/parametres')
    await expect(page.getByText(/Paramètres/i).or(page.getByText(/Parametres/i))).toBeVisible()
    await captureFullPage(page, 'vendeur', 'parametres')

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
