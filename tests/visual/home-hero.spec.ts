import { expect, test } from '@playwright/test'

import { HomePO } from '../pom/home.po'

test.describe('homepage hero visual', () => {
  test('matches the hero layout', async ({ page }) => {
    const home = new HomePO(page)

    await home.open()
    await home.expectHeroLoaded()
    await expect(home.heroRegion()).toHaveScreenshot('home-hero.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02,
    })
  })
})
