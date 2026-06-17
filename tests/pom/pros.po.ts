import { expect, type Page } from '@playwright/test'
import { BasePO } from './base.po'
import { navigateTo } from '../e2e/mobile/helpers'

export class ProsPO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await super.open('/pros')
  }

  async search(term: string) {
    const input = this.page.getByLabel(/^Recherche$/i)
    await expect(input).toBeVisible()
    await input.fill(term)
  }

  async selectResult(term: string) {
    const card = this.page.locator('article').filter({
      has: this.page.getByRole('heading', { name: new RegExp(`^${term}$`, 'i') }),
    }).first()
    await expect(card).toBeVisible()
    const openStorefront = card.getByRole('link', { name: /^Voir la vitrine$/i })
    await expect(openStorefront).toBeVisible()
    const href = await openStorefront.getAttribute('href')
    expect(href, 'storefront href').toMatch(/^\/pro\/\d+$/)
    await navigateTo(this.page, href!)
  }

  async expectStorefrontTabs() {
    await expect(
      this.page.getByRole('button', { name: /^Annonces$/i })
        .or(this.page.getByRole('tab', { name: /^Annonces$/i }))
    ).toBeVisible()
    await expect(
      this.page.getByRole('button', { name: /^Catalogue$/i })
        .or(this.page.getByRole('tab', { name: /^Catalogue$/i }))
    ).toBeVisible()
    await expect(
      this.page.getByRole('button', { name: /^Avis$/i })
        .or(this.page.getByRole('tab', { name: /^Avis$/i }))
    ).toBeVisible()
  }
}
