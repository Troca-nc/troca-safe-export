import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'
import { navigateTo } from '../e2e/mobile/helpers'

export class AnnoncesPO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await super.open('/annonces')
  }

  async openFirstListing(title?: string) {
    const listingLink = title
      ? this.page.getByRole('link', { name: new RegExp(title, 'i') }).first()
      : this.page
          .locator('a[href^="/annonces/"]')
          .filter({ has: this.page.locator('h3') })
          .first()

    await expect(listingLink).toBeVisible({ timeout: 15_000 })

    if (title) {
      await listingLink.click()
      return
    }

    const href = await listingLink.getAttribute('href')
    expect(href, 'first listing href').toMatch(/^\/annonces\/\d+$/)
    await navigateTo(this.page, href!)
  }

  async expectDetailActions() {
    await expect(this.page.getByRole('button', { name: /Contacter le vendeur|Faire une offre|Troc possible/i })).toBeVisible()
  }
}
