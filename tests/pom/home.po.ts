import { expect, type Locator, type Page } from '@playwright/test'
import { BasePO } from './base.po'

export class HomePO extends BasePO {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await super.open('/')
  }

  async expectHeroLoaded() {
    await expect(this.page.getByRole('heading', { name: /Achetez, vendez, troquez en NC/i })).toBeVisible()
    await expect(this.page.getByPlaceholder('Que recherchez-vous ?')).toBeVisible()
    await expect(this.page.getByText('Recherches populaires')).toBeVisible()
  }

  heroRegion(): Locator {
    return this.page.locator('section').filter({
      has: this.page.getByRole('heading', { name: /Achetez, vendez, troquez en NC/i }),
    }).first()
  }

  async clickPopularSearch(term: string) {
    await this.page.getByRole('button', { name: new RegExp(term, 'i') }).click()
  }

  async openSearchDrawer() {
    await this.page.getByRole('button', { name: /Plus/i }).click()
  }
}
