import { test, expect } from '@playwright/test'
import { createConsoleCollector, restoreAuthStore, restoreSessionStorage, assertNoForbiddenBodyText, storageStatePath } from '../support/auth'
import { captureFullPage, expectPageHealthy, expectNotOnConnexion } from '../support/audit'
import { ParticulierPO } from '../pom/particulier.po'

test.use({ storageState: storageStatePath('particulier') })
test.describe.configure({ mode: 'serial' })

const PARTICULIER_AUTH_STATE = {
  user: {
    id: 'demo-particulier',
    email: 'particulier@demo.troca.nc',
    first_name: 'Emma',
    last_name: 'Martin',
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.8,
    commune_name: 'Nouméa',
    demo_role: 'Particulier',
    account_type: 'personal',
  },
  isLoading: false,
  isAuthenticated: true,
  demoProfile: 'particulier',
  hasHydrated: true,
}

test.describe('smoke particulier', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthStore(page, PARTICULIER_AUTH_STATE)
    await restoreSessionStorage(page, 'particulier')
  })

  test('connected user can publish, read messages and access account pages', async ({ page }) => {
    const console = createConsoleCollector(page)
    const particulier = new ParticulierPO(page)

    await particulier.openPublishWizard()
    await expectNotOnConnexion(page)
    await particulier.expectPublishWizardReady()

    await particulier.openMessages()
    await expect(page).toHaveURL(/\/messages/)

    await particulier.openRdv()
    await expect(page.getByText(/Mes rendez-vous/i)).toBeVisible()

    await particulier.openProfile()
    await expect(page.getByRole('heading', { name: /Ajouter une photo de profil/i })).toBeVisible()

    await particulier.openSettings()
    await expect(page.getByRole('heading', { name: /^Paramètres$/i })).toBeVisible()

    await captureFullPage(page, 'smoke', 'particulier-journey')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })

  test('mobile nav and profile pages remain accessible', async ({ page }) => {
    const console = createConsoleCollector(page)
    const particulier = new ParticulierPO(page)

    await particulier.openProfile()
    await expect(page.getByRole('heading', { name: /Ajouter une photo de profil/i })).toBeVisible()
    await particulier.openSettings()
    await expect(page.getByRole('heading', { name: /^Paramètres$/i })).toBeVisible()

    await captureFullPage(page, 'smoke', 'particulier-account')
    await expectPageHealthy(page)
    await assertNoForbiddenBodyText(page)
    console.assertClean()
  })
})
