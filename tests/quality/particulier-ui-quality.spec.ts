import { expect, test } from '@playwright/test'

import { restoreAuthenticatedStore, restoreSessionStorage } from '../support/auth'
import {
  expectNoColorContrastViolation,
  expectPageQuality,
  openStablePage,
} from './support'

test.describe('qualité UI et contenu du compte particulier', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'particulier')
    await restoreSessionStorage(page, 'particulier')
  })

  test('paramètres: état normal et survols restent lisibles', async ({ page }, testInfo) => {
    await openStablePage(page, '/parametres')
    await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible()
    await expectPageQuality(page, testInfo, 'parametres-normal')

    for (const label of [
      'Sécurité et connexion',
      'Notifications',
      'Confidentialité',
      'Cookies',
      'Mes données (RGPD)',
    ]) {
      const link = page.getByRole('link', { name: label, exact: true }).first()
      await expect(link).toBeVisible()
      await link.hover()
      await expectNoColorContrastViolation(page, testInfo, `parametres-survol-${label}`)
    }
  })

  test('publication: première étape lisible sans photo obligatoire', async ({ page }, testInfo) => {
    await openStablePage(page, '/deposer')
    await expect(page.getByRole('heading', { name: 'Que souhaitez-vous publier ?' })).toBeVisible()

    const closeAuthModal = page.getByRole('button', { name: /^Fermer$/i }).first()
    await closeAuthModal.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
    if (await closeAuthModal.isVisible()) {
      await closeAuthModal.click()
      await expect(closeAuthModal).toBeHidden()
    }

    await page.getByRole('button', { name: /^Vente\b/i }).click()
    await expect(page.getByLabel('Description', { exact: true })).toBeVisible()
    await expect(page.locator('input[type="file"]')).toHaveCount(0)
    await expectPageQuality(page, testInfo, 'publication-etape-description')
  })
})
