import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'

export class AppelsOffresPO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await super.open('/appels-offres')
  }

  async openFirstOffer() {
    const firstOffer = this.page.locator('main a[href^="/appels-offres/"]').first()
    if ((await firstOffer.count()) > 0) {
      await firstOffer.click()
      return true
    }
    return false
  }

  async expectDetailAction() {
    await expect(this.page.getByText(/Répondre avec un devis/i).or(this.page.getByRole('button', { name: /Répondre avec un devis/i }))).toBeVisible()
  }
}
