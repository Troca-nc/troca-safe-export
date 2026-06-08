import fs from 'node:fs'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

export function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export function screenshotPath(group: string, name: string) {
  const dir = path.resolve(process.cwd(), 'screenshots', group)
  ensureDir(dir)
  return path.join(dir, `${sanitizeFileName(name)}.png`)
}

export async function expectMainHeadingVisible(page: Page) {
  const heading = page.locator('h1, h2').first()
  await expect(heading).toBeVisible()
}

export async function captureFullPage(page: Page, group: string, name: string) {
  const file = screenshotPath(group, name)
  await page.screenshot({
    path: file,
    fullPage: false,
    animations: 'disabled',
    timeout: 20_000,
  })
  return file
}

export async function gotoPage(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
}

export async function expectPageHealthy(page: Page) {
  await expect(page.locator('body')).not.toContainText(/\bundefined\b|\bNaN\b|\[object Object\]/i)
}

export async function expectNotOnConnexion(page: Page) {
  await expect(page).not.toHaveURL(/\/connexion/i)
}

export async function maybeClickFirstLink(page: Page, selector = 'main a[href^="/"]') {
  const link = page.locator(selector).first()
  if (await link.count()) {
    await link.click()
    return true
  }
  return false
}
