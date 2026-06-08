import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'

export class ParticulierPO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async openPublishWizard() {
    await super.open('/annonces/nouvelle')
    await expect(this.page.getByText(/Publication guid/i)).toBeVisible({ timeout: 15_000 })
  }

  async openMessages() {
    await super.open('/messages')
  }

  async openRdv() {
    await super.open('/mes-rdv')
  }

  async openProfile() {
    await super.open('/profil')
    await expect(this.page.getByRole('heading', { name: /Ajouter une photo de profil/i })).toBeVisible({ timeout: 15_000 })
  }

  async openSettings() {
    await super.open('/parametres')
    await expect(this.page.getByRole('heading', { name: /^Paramètres$/i })).toBeVisible({ timeout: 15_000 })
  }

  async expectPublishWizardReady() {
    await expect(this.page.getByRole('heading', { name: /Décrivez votre annonce/i })).toBeVisible({ timeout: 15_000 })
    await expect(this.page.getByRole('button', { name: /^Suivant$/i })).toBeVisible({ timeout: 15_000 })
  }
}
