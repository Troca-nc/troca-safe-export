import type { Page } from '@playwright/test'

export abstract class BasePO {
  constructor(protected readonly page: Page) {}

  async open(pathname: string) {
    await this.page.goto(pathname, { waitUntil: 'domcontentloaded' })
  }
}
