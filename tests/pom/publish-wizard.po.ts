import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'

const SAMPLE_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+8V8AAAAASUVORK5CYII=',
  'base64',
)

export class PublishWizardPO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async dismissAuthModalIfPresent() {
    const closeButton = this.page.getByRole('button', { name: /^Fermer$/i })
    if (await closeButton.count()) {
      await closeButton.first().click()
      await expect(this.page.getByText(/Connexion rapide|On vous remet au bon endroit/i)).toHaveCount(0, { timeout: 15_000 })
    }
  }

  async open() {
    await super.open('/annonces/nouvelle')
    await expect(this.page.getByText(/Publication guid[ée]e/i)).toBeVisible({ timeout: 15_000 })
    await this.dismissAuthModalIfPresent()
  }

  async fillStepOne(title: string, description: string) {
    await this.page.getByLabel(/Titre/i).fill(title)
    await this.page.getByLabel(/Description/i).fill(description)
  }

  async chooseFirstLeafCategory(maxSteps = 6) {
    const nextButton = this.page.getByRole('button', { name: /^Suivant$/i })

    for (let i = 0; i < maxSteps; i += 1) {
      if (await nextButton.isEnabled()) return

      const clicked = await this.page.locator('main section').first().evaluate((section) => {
        const buttons = Array.from(section.querySelectorAll('button'))
        const target = buttons.find((button) => {
          const label = (button.textContent || '').replace(/\s+/g, ' ').trim()
          return /(sous-cat[ée]gorie|Cat[ée]gorie finale)/i.test(label) && !/^(Retour|Racine)$/i.test(label)
        }) as HTMLButtonElement | undefined

        if (!target) return false
        target.click()
        return true
      })

      if (!clicked) {
        throw new Error('Impossible de trouver une catégorie à sélectionner.')
      }

      await this.page.waitForTimeout(150)
    }

    await expect(nextButton).toBeEnabled({ timeout: 15_000 })
  }

  async uploadOnePhoto(filename = 'listing.png') {
    const fileInput = this.page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached({ timeout: 15_000 })
    await fileInput.setInputFiles({ name: filename, mimeType: 'image/png', buffer: SAMPLE_IMAGE })
  }

  async goToStep2() {
    await this.dismissAuthModalIfPresent()
    await this.page.getByRole('button', { name: /^Suivant$/i }).click()
    await expect(this.page.getByText(/Ajoutez 1 à 8 photos/i)).toBeVisible({ timeout: 15_000 })
  }

  async goToStep3() {
    await this.dismissAuthModalIfPresent()
    await this.page.getByRole('button', { name: /^Suivant$/i }).click()
    await expect(this.page.getByRole('spinbutton', { name: /Prix/i })).toBeVisible({ timeout: 15_000 })
  }

  async fillStepThree(price: string, communeIndex = 1) {
    await this.page.getByRole('spinbutton', { name: /Prix/i }).fill(price)
    const commune = this.page.getByLabel(/Localisation/i)
    await expect(commune).toBeVisible({ timeout: 15_000 })
    await commune.selectOption({ index: communeIndex })
  }

  async submit() {
    await this.dismissAuthModalIfPresent()
    await this.page.getByRole('button', { name: /Publier.*annonce/i }).click()
    await expect(this.page).toHaveURL(/\/annonces\/\d+\?published=1/, { timeout: 30_000 })
  }
}
