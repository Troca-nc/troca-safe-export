import type { Page } from '@playwright/test'
import { navigateTo } from '../e2e/mobile/helpers'

export abstract class BasePO {
  constructor(protected readonly page: Page) {}

  async open(pathname: string) {
    await navigateTo(this.page, pathname)
  }
}
