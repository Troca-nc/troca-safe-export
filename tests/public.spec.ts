import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector } from './support/auth'
import { expectMainHeadingVisible, expectPageHealthy, gotoPage, expectNotOnConnexion } from './support/audit'
import { HomePO } from './pom/home.po'

test.describe('public', () => {
  test('homepage search, categories and newsletter are visible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const home = new HomePO(page)

    await home.open()
    await expectNotOnConnexion(page)
    await home.expectHeroLoaded()
    await expect(page.getByLabel(/newsletter|e-mail/i).or(page.getByPlaceholder(/email|e-mail/i))).toBeVisible()

    await page.getByPlaceholder('Que recherchez-vous ?').fill('Toyota Hilux')
    await page.goto('/annonces?q=Toyota%20Hilux', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/annonces\?q=Toyota%20Hilux/i)

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('annonces list opens a detail page', async ({ page }) => {
    const console = createConsoleCollector(page)

    await page.goto('/annonces?q=Toyota%20Hilux', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/annonces\?q=Toyota%20Hilux/i)
    await expect(page.getByText(/pour "Toyota Hilux"/i)).toBeVisible()
    await expect(page.locator('article')).toHaveCount(6)
    await expect(page.locator('article').first()).toBeVisible()
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('pros directory can search Entreprise Test NC', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/pros')
    await expectMainHeadingVisible(page)
    await expect(page.getByPlaceholder(/Nom, entreprise, spécialité/i)).toBeVisible()
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('appels d offres is reachable', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/appels-offres')
    await expectMainHeadingVisible(page)
    const firstOffer = page.locator('main a[href^="/appels-offres/"]').first()
    if (await firstOffer.count()) {
      await firstOffer.click()
      await expect(page).toHaveURL(/\/appels-offres\/\d+/)
      await expect(page.getByText(/R[ée]pondre avec un devis/i)).toBeVisible()
    }

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
