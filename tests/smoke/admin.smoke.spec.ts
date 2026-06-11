import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreAuthenticatedStore, restoreSessionStorage, storageStatePath } from '../support/auth'
import { expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from '../support/audit'

test.use({ storageState: storageStatePath('admin') })
test.describe.configure({ mode: 'serial' })

test.describe('smoke admin', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'admin')
    await restoreSessionStorage(page, 'admin')
  })

  test('dashboard and key admin pages are accessible', async ({ page }) => {
    const console = createConsoleCollector(page)

    await gotoPage(page, '/admin/dashboard')
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/API operationnelle/i)).toBeVisible()
    await expect(page.getByText(/Alertes en direct/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Rafraichir/i })).toBeVisible()
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)

    await gotoPage(page, '/admin/users')
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)

    await gotoPage(page, '/admin/annonces')
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)

    console.assertClean()
  })
})
