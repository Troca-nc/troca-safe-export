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

  test('publication: limites photo et aperçu final restent explicites', async ({ page }, testInfo) => {
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

    const title = 'Vélo de ville pour aperçu'
    await page.getByLabel('Titre', { exact: true }).fill(title)
    await page.getByLabel('Catégorie', { exact: true }).selectOption({ index: 1 })
    await page.getByLabel('Description', { exact: true }).fill('Vélo entretenu avec quelques marques clairement indiquées.')
    await page.getByRole('button', { name: 'Continuer' }).click()

    await expect(page.getByText('0 / 6 photos', { exact: true })).toBeVisible()
    await expect(page.getByText(/10 Mo maximum par photo/i)).toBeVisible()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'velo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    })
    await expect(page.getByText('1 / 6 photos', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Aperçu de la carte dans les résultats').getByRole('img', { name: title })).toBeVisible()
    await page.getByRole('button', { name: 'Continuer' }).click()

    await page.getByLabel('Prix', { exact: true }).fill('25000')
    await expect(page.getByText('Envoi postal ou par transporteur', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Continuer' }).click()

    await page.getByLabel('Commune', { exact: true }).selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Continuer' }).click()

    await expect(page.getByRole('heading', { name: 'Voici ce que les visiteurs verront' })).toBeVisible()
    await expect(page.getByText('Modes de remise', { exact: true })).toBeVisible()
    await expectPageQuality(page, testInfo, 'publication-apercu-final')
  })
})
