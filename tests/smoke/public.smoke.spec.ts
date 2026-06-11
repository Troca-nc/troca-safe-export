import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector } from '../support/auth'
import { expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy } from '../support/audit'
import { HomePO } from '../pom/home.po'
import { ProsPO } from '../pom/pros.po'
import { AppelsOffresPO } from '../pom/appels-offres.po'

test.describe('smoke public', () => {
  test.describe.configure({ mode: 'serial' })

  test('homepage search and announcements discovery paths are visible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const home = new HomePO(page)

    await home.open()
    await expectNotOnConnexion(page)
    await home.expectHeroLoaded()
    await expect(page.getByLabel(/newsletter|e-mail/i).or(page.getByPlaceholder(/email|e-mail/i))).toBeVisible()
    await expect(page.getByRole('button', { name: /^Toyota Hilux$/i })).toBeVisible()

    await page.goto('/annonces?q=Toyota%20Hilux', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/annonces\?q=Toyota%20Hilux/i)
    await expect(page.getByText(/pour "Toyota Hilux"/i)).toBeVisible()
    await expect(page.locator('article')).toHaveCount(6)
    await expect(page.locator('article').first()).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('pros directory search remains available', async ({ page }) => {
    const console = createConsoleCollector(page)
    const pros = new ProsPO(page)

    await pros.open()
    await expectMainHeadingVisible(page)
    await pros.search('Entreprise Test NC')
    const proCard = page.locator('article').filter({
      has: page.getByRole('heading', { name: /^Entreprise Test NC$/i }),
    }).first()
    await expect(proCard).toBeVisible()
    await expect(proCard.getByRole('link', { name: /^Voir la vitrine$/i })).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('appels d offres entry point is reachable', async ({ page }) => {
    const console = createConsoleCollector(page)
    const appelsOffres = new AppelsOffresPO(page)

    await appelsOffres.open()
    await expectMainHeadingVisible(page)

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
