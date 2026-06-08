import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectPageHealthy, gotoPage, expectNotOnConnexion } from './support/audit'
import { PUBLIC_PAGES, PUBLIC_SCREENSHOT_GROUP } from './support/routes'
import { HomePO } from './pom/home.po'
import { AnnoncesPO } from './pom/annonces.po'

test.describe('public', () => {
  test('homepage search chips, categories and newsletter are visible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const home = new HomePO(page)

    await home.open()
    await expectNotOnConnexion(page)
    await home.expectHeroLoaded()
    await expect(page.getByLabel(/newsletter|e-mail/i).or(page.getByPlaceholder(/email|e-mail/i))).toBeVisible()

    const chip = page.getByRole('button', { name: /Toyota Hilux/i }).first()
    await expect(chip).toBeVisible()
    await Promise.all([
      page.waitForURL(/\/annonces\?q=Toyota%20Hilux/i),
      home.clickPopularSearch('Toyota Hilux'),
    ])
    await expect(page).toHaveURL(/\/annonces\?q=Toyota%20Hilux/i)
    await captureFullPage(page, PUBLIC_SCREENSHOT_GROUP, 'homepage')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  for (const route of PUBLIC_PAGES) {
    test(`${route} loads without 404 or 500`, async ({ page }) => {
      const console = createConsoleCollector(page)
      await gotoPage(page, route)
      await expect(page).not.toHaveURL(/\/connexion/i)
      await expect(page.locator('body')).toBeVisible()
      await expectMainHeadingVisible(page)
      await expectPageHealthy(page)
      await assertNoForbiddenBodyText(page)
      await captureFullPage(page, PUBLIC_SCREENSHOT_GROUP, route === '/' ? 'home-quick-check' : route.slice(1).replace(/\//g, '-'))
      console.assertClean()
    })
  }

  test('annonces list opens a detail page', async ({ page }) => {
    const console = createConsoleCollector(page)
    const annonces = new AnnoncesPO(page)

    await annonces.open()
    await annonces.openFirstListing()
    await expect(page).toHaveURL(/\/annonces\/\d+/)
    await expectMainHeadingVisible(page)
    await annonces.expectDetailActions()
    await captureFullPage(page, PUBLIC_SCREENSHOT_GROUP, 'annonces-detail')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('pros directory can search Entreprise Test NC', async ({ page }) => {
    const console = createConsoleCollector(page)
    await gotoPage(page, '/pros')
    const search = page.getByPlaceholder(/Nom, entreprise, spécialité/i)
    await search.fill('Entreprise Test NC')
    await expect(page.getByText('Entreprise Test NC').first()).toBeVisible()
    await page.getByText('Entreprise Test NC').first().click()
    await expect(page).toHaveURL(/\/pro\/|\/pros/i)
    await expect(page.getByRole('tab', { name: /Annonces/i }).or(page.getByText(/Annonces/i))).toBeVisible()
    await expect(page.getByRole('tab', { name: /Avis/i }).or(page.getByText(/Avis/i))).toBeVisible()
    await expect(page.getByText(/Catalogue/i)).toBeVisible()
    await captureFullPage(page, PUBLIC_SCREENSHOT_GROUP, 'pros-directory')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('appels d offres opens and detail page is reachable', async ({ page }) => {
    const console = createConsoleCollector(page)
    await gotoPage(page, '/appels-offres')
    await expectMainHeadingVisible(page)
    const firstOffer = page.locator('main a[href^="/appels-offres/"]').first()
    if (await firstOffer.count()) {
      await firstOffer.click()
      await expect(page).toHaveURL(/\/appels-offres\/\d+/)
      await expect(page.getByText(/Répondre avec un devis/i)).toBeVisible()
    }
    await captureFullPage(page, PUBLIC_SCREENSHOT_GROUP, 'appels-offres')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('bon plans, covoiturage and troc public entry points are visible', async ({ page }) => {
    const console = createConsoleCollector(page)
    await gotoPage(page, '/bons-plans')
    await expectMainHeadingVisible(page)
    await expect(page.getByRole('button', { name: /Promotions/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Événements/i }).first()).toBeVisible()

    await gotoPage(page, '/covoiturage')
    await expect(page.getByText(/Rechercher/i)).toBeVisible()
    await expect(page.getByText(/Proposer/i)).toBeVisible()
    await expect(page.getByLabel(/Date/i).or(page.getByPlaceholder(/Date/i))).toBeVisible()

    await gotoPage(page, '/troc')
    await expect(page.getByText(/Trocômètre/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Trouver des trocs/i })).toBeVisible()

    await captureFullPage(page, PUBLIC_SCREENSHOT_GROUP, 'bon-plans-covoiturage-troc')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
