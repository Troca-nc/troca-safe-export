import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreAuthenticatedStore, restoreSessionStorage } from './support/auth'
import { expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from './support/audit'
import { ProPO } from './pom/pro.po'

test.describe('pro', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'pro')
    await restoreSessionStorage(page, 'pro')
  })

  test('dashboard and rendez-vous pages are accessible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const pro = new ProPO(page)

    await pro.openDashboard()
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/Bonjour/i)).toBeVisible()
    await expect(page.getByText(/Voici les performances de votre vitrine/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Ouvrir le pack/i })).toBeVisible()

    await pro.openRdv()
    await expect(page.getByText(/Rendez-vous en ligne/i)).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
