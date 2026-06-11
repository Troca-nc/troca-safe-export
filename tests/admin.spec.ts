import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreAuthenticatedStore, restoreSessionStorage, storageStatePath } from './support/auth'
import { expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from './support/audit'

test.describe('admin', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'admin')
    await restoreSessionStorage(page, 'admin')
  })

  test('dashboard is accessible for admin', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/admin/dashboard')
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
  })

  test('particulier storage cannot access admin pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('particulier') })
    const page = await context.newPage()
    await restoreAuthenticatedStore(page, 'particulier')
    await restoreSessionStorage(page, 'particulier')
    await gotoPage(page, '/admin/dashboard')
    await expect(page).toHaveURL(/\/admin/i)
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/accès|access|non autorisé|non autorise|forbidden|erreur/i)
    await context.close()
  })
})
