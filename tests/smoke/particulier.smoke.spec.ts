import { test, expect } from '@playwright/test'
import { createConsoleCollector, restoreAuthenticatedStore, restoreSessionStorage, assertNoForbiddenBodyText, storageStatePath } from '../support/auth'
import { expectPageHealthy, expectNotOnConnexion } from '../support/audit'
import { ParticulierPO } from '../pom/particulier.po'

test.use({ storageState: storageStatePath('particulier') })
test.describe.configure({ mode: 'serial' })

test.describe('smoke particulier', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'particulier')
    await restoreSessionStorage(page, 'particulier')
  })

  test('connected user can read messages and access account pages', async ({ page }) => {
    const console = createConsoleCollector(page)
    const particulier = new ParticulierPO(page)

    await particulier.openMessages()
    await expectNotOnConnexion(page)
    await expect(page).toHaveURL(/\/messages/)

    await particulier.openRdv()
    await expect(page.getByText(/Mes rendez-vous/i)).toBeVisible()

    await particulier.openProfile()
    await expect(page.getByText(/Mon compte particulier/i)).toBeVisible()

    await particulier.openSettings()
    await expect(page.getByRole('heading', { name: /Param[eè]tres/i })).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('mobile nav and profile pages remain accessible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const particulier = new ParticulierPO(page)

    await particulier.openProfile()
    await expect(page.getByText(/Mon compte particulier/i)).toBeVisible()
    await particulier.openSettings()
    await expect(page.getByRole('heading', { name: /Param[eè]tres/i })).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
