import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'

export class ProPO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async openDashboard() {
    await super.open('/pro/dashboard')
    await expect(this.page.getByText(/Vues totales/i)).toBeVisible({ timeout: 20_000 })
  }

  async openRdv() {
    await super.open('/pro/dashboard/rdv')
    await expect(this.page.getByRole('heading', { name: /Gérez vos créneaux et vos demandes/i })).toBeVisible({ timeout: 15_000 })
  }

  async openDevis() {
    await super.open('/pro/dashboard/devis')
  }

  async openCatalogue() {
    await super.open('/pro/dashboard/catalogue')
  }

  async openPack() {
    await super.open('/pro/dashboard/pack-lancement')
    await expect(this.page.getByText(/Bienvenue,/i)).toBeVisible({ timeout: 15_000 })
  }

  async dismissOnboarding() {
    const dismissButton = this.page.getByRole('button', { name: /Passer/i })
    if (await dismissButton.count()) {
      await dismissButton.first().evaluate((button) => {
        (button as HTMLElement).click()
      })
      await expect(this.page.getByText(/Bienvenue,/i)).toHaveCount(0, { timeout: 15_000 })
    }
  }

  async expectDashboardLoaded() {
    await expect(this.page.getByText(/Pack de lancement/i)).toBeVisible({ timeout: 15_000 })
    await expect(this.page.getByText(/Vues totales/i)).toBeVisible({ timeout: 15_000 })
    await expect(this.page.getByRole('link', { name: /Ouvrir le pack/i })).toBeVisible({ timeout: 15_000 })
  }
}
