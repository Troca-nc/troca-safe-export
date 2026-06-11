import { expect, test, type Page } from '@playwright/test'
import { assertNoForbiddenBodyText, restoreAuthenticatedStore, restoreSessionStorage, storageStatePath } from '../support/auth'

const VIEWPORTS = [
  { width: 320, height: 740, label: '320px' },
  { width: 375, height: 740, label: '375px' },
]

async function setMobileViewport(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    function isInsideHorizontalScroller(element: Element | null) {
      let current: Element | null = element
      while (current && current !== document.body) {
        const style = getComputedStyle(current)
        const overflowX = style.overflowX
        const hasScrollableOverflow = overflowX === 'auto' || overflowX === 'scroll'
        if (hasScrollableOverflow && current.scrollWidth > current.clientWidth + 1) {
          return true
        }
        current = current.parentElement
      }
      return false
    }

    const sample = Array.from(document.querySelectorAll('body *'))
      .filter((el) => {
        const style = getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        if (!el.getClientRects().length) return false
        const rect = el.getBoundingClientRect()
        return (rect.left < -1 || rect.right > window.innerWidth + 1) && !isInsideHorizontalScroller(el)
      })
      .slice(0, 8)
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className : '',
          role: el.getAttribute('role') || '',
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        }
      })

    return {
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      overflowX: sample.length > 0,
      sample,
    }
  })

  expect(overflow.overflowX, `Horizontal overflow detected: ${JSON.stringify(overflow)}`).toBeFalsy()
}

async function expectMobileNav(page: Page) {
  await expect(page.getByRole('navigation', { name: /navigation principale/i })).toBeVisible()
}

test.describe.configure({ mode: 'serial' })
test.use({ storageState: storageStatePath('particulier') })

test.describe('mobile layout checks', () => {
  test.beforeEach(async ({ page }) => {
    await restoreAuthenticatedStore(page, 'particulier')
    await restoreSessionStorage(page, 'particulier')
  })

  for (const viewport of VIEWPORTS) {
    test(`home, annonces and pro are stable on ${viewport.label}`, async ({ page }) => {
      await setMobileViewport(page, viewport.width, viewport.height)

      await page.goto('/', { waitUntil: 'networkidle' })
      await expectMobileNav(page)
      await expectNoHorizontalOverflow(page)
      await assertNoForbiddenBodyText(page)

      await page.goto('/annonces/1', { waitUntil: 'networkidle' })
      await expectMobileNav(page)
      await expectNoHorizontalOverflow(page)
      await assertNoForbiddenBodyText(page)

      await page.goto('/pro', { waitUntil: 'networkidle' })
      await expectMobileNav(page)
      await expectNoHorizontalOverflow(page)
      await assertNoForbiddenBodyText(page)
    })

    test(`detail, publish and messages stay usable on ${viewport.label}`, async ({ page }) => {
      await setMobileViewport(page, viewport.width, viewport.height)

      await page.goto('/annonces/1', { waitUntil: 'networkidle' })
      await expectMobileNav(page)
      await expectNoHorizontalOverflow(page)
      await assertNoForbiddenBodyText(page)

      await page.goto('/annonces/nouvelle', { waitUntil: 'networkidle' })
      await expectMobileNav(page)
      await expectNoHorizontalOverflow(page)
      const publishField = page.locator('input, textarea, [contenteditable="true"]').first()
      await expect(publishField).toBeVisible({ timeout: 15_000 })
      await publishField.click({ force: true })
      await expectNoHorizontalOverflow(page)

      await page.goto('/messages', { waitUntil: 'networkidle' })
      await expectMobileNav(page)
      await expectNoHorizontalOverflow(page)
      const messageField = page.locator('textarea:visible, input:visible').first()
      if (await messageField.count()) {
        await messageField.click({ force: true })
        await expectNoHorizontalOverflow(page)
      }
    })
  }
})
