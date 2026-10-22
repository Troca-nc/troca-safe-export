import { expect, test } from '@playwright/test'

import { restoreAuthenticatedStore, restoreSessionStorage } from '../support/auth'
import {
  expectNoColorContrastViolation,
  expectNoHorizontalOverflow,
  expectNoVisibleMojibake,
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

  test('annonces: la modale de création d’alerte reste claire et lisible', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'light')
      window.localStorage.setItem('kalico-theme', 'light')
    })

    await openStablePage(page, '/annonces')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByRole('button', { name: 'Créer une alerte', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Créer une alerte' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Immédiat')
    await expect(dialog).toContainText('Dès qu’une annonce correspond')
    await expect(dialog).toContainText('Résumé chaque matin à 8 h')
    await expect(dialog).toContainText('Résumé chaque lundi matin')

    const colors = await dialog.evaluate((element) => {
      const probe = document.createElement('span')
      probe.className = 'bg-cream-surface text-ink'
      document.body.appendChild(probe)
      const actual = window.getComputedStyle(element)
      const expected = window.getComputedStyle(probe)
      const result = {
        actual: { color: actual.color, backgroundColor: actual.backgroundColor },
        expected: { color: expected.color, backgroundColor: expected.backgroundColor },
      }
      probe.remove()
      return result
    })

    expect(colors.actual).toEqual(colors.expected)
    await expectNoVisibleMojibake(page)
    await expectNoHorizontalOverflow(page)
    await expectNoColorContrastViolation(page, testInfo, 'annonces-alerte-clair', '#search-alert-dialog')
  })

  test('annonces: le bouton de thème reste visible dans l’en-tête desktop', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'light')
      window.localStorage.setItem('kalico-theme', 'light')
    })

    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 768 })
      await openStablePage(page, '/annonces')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

      const themeToggle = page.getByRole('button', { name: 'Passer en mode sombre' })
      await expect(themeToggle).toBeVisible()

      const bounds = await themeToggle.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds?.width).toBe(44)
      expect(bounds?.x).toBeGreaterThanOrEqual(0)
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width)

      await themeToggle.click()
      await expect.poll(() => page.evaluate(() => window.localStorage.getItem('theme'))).toBe('dark')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(page.getByRole('button', { name: 'Passer en mode clair' })).toBeVisible()
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
    await page.getByLabel('Catégorie principale', { exact: true }).selectOption({ index: 1 })
    const subcategory = page.getByLabel('Sous-catégorie (facultative)', { exact: true })
    await expect(subcategory).toBeEnabled()
    await subcategory.selectOption({ index: 1 })
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
    const pickup = page.getByRole('radio', { name: 'Remise en main propre', exact: true })
    const shipping = page.getByRole('radio', { name: 'Envoi possible', exact: true })
    await expect(pickup).toBeChecked()
    await expect(shipping).not.toBeChecked()
    await shipping.locator('..').click()
    await expect(shipping).toBeChecked()
    await expect(pickup).not.toBeChecked()
    await page.getByRole('button', { name: 'Continuer' }).click()

    await page.getByLabel('Commune', { exact: true }).selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Continuer' }).click()

    await expect(page.getByRole('heading', { name: 'Voici ce que les visiteurs verront' })).toBeVisible()
    await expect(page.getByText('Mode de remise', { exact: true })).toBeVisible()
    await expect(page.getByText('Envoi possible', { exact: true })).toBeVisible()
    await expectPageQuality(page, testInfo, 'publication-apercu-final')
  })

  test('publication: bon plan sans étincelles et covoiturage intra-communal', async ({ page }) => {
    await openStablePage(page, '/deposer?type=bonplan')
    await expect(page.getByText('Bon plan local', { exact: true })).toBeVisible()
    await expect(page.locator('.lucide-sparkles')).toHaveCount(0)

    await openStablePage(page, '/deposer?type=carpool')
    const closeAuthModal = page.getByRole('button', { name: /^Fermer$/i }).first()
    await closeAuthModal.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
    if (await closeAuthModal.isVisible()) await closeAuthModal.click()

    const departure = page.getByLabel('Départ', { exact: true })
    const destination = page.getByLabel('Arrivée', { exact: true })
    await departure.selectOption({ index: 1 })
    await destination.selectOption(await departure.inputValue())
    await page.getByRole('button', { name: 'Continuer' }).click()

    await expect(page.getByRole('heading', { name: 'Quand partez-vous ?' })).toBeVisible()
  })
})
