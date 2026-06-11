import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { storageStatePath, restoreAuthenticatedStore, restoreSessionStorage } from '../support/auth'
import { MessagesPO } from '../pom/messages.po'
import { PublishWizardPO } from '../pom/publish-wizard.po'

type RouteCase = {
  name: string
  path: string
  role?: 'particulier' | 'pro'
}

const VIEWPORTS = [
  { width: 320, height: 740 },
  { width: 375, height: 740 },
]

const ROUTES: RouteCase[] = [
  { name: 'home', path: '/' },
  { name: 'annonces', path: '/annonces' },
  { name: 'annonce-detail', path: '/annonces/1' },
  { name: 'publier', path: '/annonces/nouvelle', role: 'particulier' },
  { name: 'messages', path: '/messages', role: 'particulier' },
  { name: 'pro', path: '/pro' },
  { name: 'pro-dashboard', path: '/pro/dashboard', role: 'pro' },
]

const OUTPUT_DIR = path.resolve(process.cwd(), 'screenshots', 'mobile-visual')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

async function prepareRole(page, role?: RouteCase['role']) {
  if (!role) return
  await restoreAuthenticatedStore(page, role)
  await restoreSessionStorage(page, role)
}

async function waitForStable(page) {
  await expect(page.locator('body')).toBeVisible()
  await page.waitForTimeout(1200)
}

test.describe.configure({ mode: 'serial' })
test.use({ storageState: storageStatePath('particulier') })

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    const fileName = `${route.name}-${viewport.width}.png`

    test(`${route.name} at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      if (route.role) {
        await prepareRole(page, route.role)
      }

      if (route.name === 'annonce-detail') {
        const listingId = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/listings?limit=1', { credentials: 'include' })
            const payload = await response.json()
            return payload?.data?.[0]?.id ?? null
          } catch {
            return null
          }
        })
        await page.goto(listingId ? `/annonces/${listingId}` : '/annonces/1', { waitUntil: 'domcontentloaded' })
      } else if (route.name === 'publier') {
        const wizard = new PublishWizardPO(page)
        await wizard.open()
      } else if (route.name === 'messages') {
        const messages = new MessagesPO(page)
        await messages.openConversationByListingText('Toyota Hilux 2019 4x4 diesel')
      } else {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      }

      await waitForStable(page)
      await page.screenshot({
        path: path.join(OUTPUT_DIR, fileName),
        fullPage: true,
        animations: 'disabled',
      })
    })
  }
}
