import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreAuthenticatedStore, restoreSessionStorage, storageStatePath } from '../support/auth'
import { expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from '../support/audit'
import { ProPO } from '../pom/pro.po'
import { ProsPO } from '../pom/pros.po'

test.use({ storageState: storageStatePath('pro') })
test.describe.configure({ mode: 'serial' })

test.describe('smoke pro', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'pro')
    await restoreSessionStorage(page, 'pro')
  })

  test('dashboard and launch pack are available', async ({ page }) => {
    const console = createConsoleCollector(page)
    const pro = new ProPO(page)

    await pro.openDashboard()
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await expect(page.getByText(/Pack de lancement/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Ouvrir le pack/i })).toBeVisible()

    await pro.openRdv()
    await expect(page.getByText(/Rendez-vous en ligne/i)).toBeVisible()

    const pros = new ProsPO(page)
    await pros.open()
    await expect(page.getByText('Annuaire des pros', { exact: true }).first()).toBeVisible()
    await pros.search('Entreprise Test NC')
    await expect(page.getByRole('heading', { name: /^Entreprise Test NC$/i }).first()).toBeVisible()

    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
