import fs from 'node:fs'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'

export type AuthRole = 'particulier' | 'vendeur' | 'pro' | 'conducteur' | 'admin'

export const AUTH_DIR = path.resolve(process.cwd(), 'playwright', '.auth')

export function storageStatePath(role: AuthRole) {
  return path.join(AUTH_DIR, `${role}.json`)
}

export function sessionStoragePath(role: AuthRole) {
  return path.join(AUTH_DIR, `${role}.session.json`)
}

export function readSessionStorage(role: AuthRole): Record<string, string> {
  const file = sessionStoragePath(role)
  if (!fs.existsSync(file)) return {}
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, string>
  } catch {
    return {}
  }
}

export async function restoreSessionStorage(page: Page, role: AuthRole) {
  const payload = readSessionStorage(role)
  if (!Object.keys(payload).length) return

  await page.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage as Record<string, string>)) {
      window.sessionStorage.setItem(key, value)
    }
  }, payload)
}

export async function captureSessionStorage(page: Page, role: AuthRole) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const payload = await page.evaluate(() => Object.fromEntries(Object.entries(window.sessionStorage)))
  fs.writeFileSync(sessionStoragePath(role), JSON.stringify(payload, null, 2), 'utf-8')
}

export async function assertNoForbiddenBodyText(page: Page) {
  const bodyText = await page.locator('body').innerText()
  const normalized = bodyText.replace(/\s+/g, ' ').trim()

  expect(normalized).not.toMatch(/\bNaN\b/)
  expect(normalized).not.toMatch(/\[object Object\]/i)
  expect(normalized).not.toMatch(/\bnull\b/i)
}

export function createConsoleCollector(page: Page) {
  const errors: string[] = []
  const pageErrors: string[] = []

  const ignoredConsolePatterns = [
    /ResizeObserver loop limit exceeded/i,
    /hydrated but some attributes of the server rendered HTML didn't match/i,
    /Cross origin request detected/i,
    /unable to verify the first certificate/i,
    /Connection terminated due to connection timeout/i,
    /Next\.js inferred your workspace root/i,
    /Detected additional lockfiles/i,
    /UNABLE_TO_VERIFY_LEAF_SIGNATURE/i,
  ]

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text()
      if (!ignoredConsolePatterns.some((pattern) => pattern.test(text))) {
        errors.push(text)
      }
    }
  })

  page.on('pageerror', (error) => {
    const message = error.message
    if (!ignoredConsolePatterns.some((pattern) => pattern.test(message))) {
      pageErrors.push(message)
    }
  })

  return {
    errors,
    pageErrors,
    assertClean() {
      const all = [...errors, ...pageErrors]
      expect(all, `Console/page errors: ${all.join(' | ')}`).toEqual([])
    },
  }
}
