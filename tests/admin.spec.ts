import { test, expect, type Page } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreSessionStorage, readSessionStorage, storageStatePath } from './support/auth'
import { captureFullPage, expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from './support/audit'

async function applyRoleStorage(page: Page, role: 'particulier' | 'admin') {
  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage as Record<string, string>)) {
      window.sessionStorage.setItem(key, value)
    }
  }, readSessionStorage(role))
}

test.describe('admin', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSessionStorage(page, 'admin')
  })

  test('dashboard and moderation pages are accessible for admin', async ({ page }) => {
    const console = createConsoleCollector(page)

    for (const route of ['/admin/dashboard', '/admin/users', '/admin/annonces', '/admin/signalements', '/admin/enseignes']) {
      await gotoPage(page, route)
      await expectNotOnConnexion(page)
      await expectMainHeadingVisible(page)
      await expectPageHealthy(page)
      await assertNoForbiddenBodyText(page)
    }

    await gotoPage(page, '/admin/dashboard')
    await expect(page.getByText(/Annonces actives/i)).toBeVisible()
    await expect(page.getByText(/Utilisateurs inscrits/i)).toBeVisible()
    await expect(page.getByText(/Signalements en attente/i)).toBeVisible()
    await expect(page.getByText(/Messages échangés/i).or(page.getByText(/Messages echanges/i))).toBeVisible()
    await expect(page.getByText(/API opérationnelle/i).or(page.getByText(/API operationnelle/i))).toBeVisible()
    await captureFullPage(page, 'admin', 'dashboard')

    await gotoPage(page, '/admin/users')
    await expect(page.getByText(/Utilisateurs/i)).toBeVisible()
    await expect(page.getByText(/Aucun utilisateur trouvé/i).or(page.getByText(/inscrits/i))).toBeVisible()
    await captureFullPage(page, 'admin', 'users')

    await gotoPage(page, '/admin/annonces')
    await expect(page.getByText(/Annonces/i)).toBeVisible()
    await captureFullPage(page, 'admin', 'annonces')

    await gotoPage(page, '/admin/signalements')
    await expect(page.getByText(/Signalements/i)).toBeVisible()
    await captureFullPage(page, 'admin', 'signalements')

    await gotoPage(page, '/admin/enseignes')
    await expect(page.getByText(/Enseignes/i).or(page.getByText(/Business/i))).toBeVisible()
    await captureFullPage(page, 'admin', 'enseignes')

    console.assertClean()
  })

  test('particulier storage cannot access admin pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('particulier') })
    const page = await context.newPage()
    await applyRoleStorage(page, 'particulier')
    await gotoPage(page, '/admin/dashboard')
    await expect(page).toHaveURL(/\/admin/i)
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/accès|access|non autorisé|non autorise|forbidden|erreur/i)
    await context.close()
  })
})
