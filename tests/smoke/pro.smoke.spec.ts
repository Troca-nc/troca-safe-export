import { test, expect } from '@playwright/test'
import { assertNoForbiddenBodyText, createConsoleCollector, restoreAuthStore, restoreSessionStorage, storageStatePath } from '../support/auth'
import { captureFullPage, expectMainHeadingVisible, expectNotOnConnexion, expectPageHealthy, gotoPage } from '../support/audit'
import { ProPO } from '../pom/pro.po'

test.use({ storageState: storageStatePath('pro') })
test.describe.configure({ mode: 'serial' })

const PRO_AUTH_STATE = {
  user: {
    id: 'demo-pro',
    email: 'pro@demo.troca.nc',
    first_name: 'Atelier',
    last_name: 'Kalo',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 4.9,
    commune_name: 'Dumbéa',
    demo_role: 'Compte Pro',
    account_type: 'professional',
    pro_plan: 'pro',
  },
  isLoading: false,
  isAuthenticated: true,
  demoProfile: 'pro',
  hasHydrated: true,
}

test.describe('smoke pro', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthStore(page, PRO_AUTH_STATE)
    await restoreSessionStorage(page, 'pro')
  })

  test('dashboard core workflow is available', async ({ page }) => {
    const console = createConsoleCollector(page)
    const pro = new ProPO(page)

    await pro.openDashboard()
    await expectNotOnConnexion(page)
    await expectMainHeadingVisible(page)
    await pro.expectDashboardLoaded()

    await pro.openRdv()
    await expect(page.getByText(/Rendez-vous en ligne/i)).toBeVisible()

    await pro.openDevis()
    await expect(page.getByRole('button', { name: /Nouveau devis/i }).first()).toBeVisible()

    await pro.openCatalogue()
    await expect(page.getByText(/Catalogue produits/i)).toBeVisible()

    await pro.openPack()
    await expect(page.getByText(/Bienvenue,/i)).toBeVisible()
    await pro.dismissOnboarding()

    await gotoPage(page, '/pros')
    await page.getByPlaceholder(/Nom, entreprise, spécialité/i).fill('Entreprise Test NC')
    await expect(page.getByText('Entreprise Test NC').first()).toBeVisible()

    await captureFullPage(page, 'smoke', 'pro-journey')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
