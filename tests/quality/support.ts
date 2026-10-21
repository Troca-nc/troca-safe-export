import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'
import { expect, type Page, type TestInfo } from '@playwright/test'

const MOJIBAKE_PATTERN = /(?:Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]|â(?:€|†|œ||”|š||˜)|ðŸ|ï¿½|\uFFFD|[\u0080-\u009f])/u
const CONTRAST_BASELINE_PATH = path.resolve(process.cwd(), 'tests', 'quality', 'known-contrast-violations.json')
type ContrastBaseline = Record<string, string[]>

function readContrastBaseline(): ContrastBaseline {
  if (!fs.existsSync(CONTRAST_BASELINE_PATH)) return {}
  return JSON.parse(fs.readFileSync(CONTRAST_BASELINE_PATH, 'utf8')) as ContrastBaseline
}

function fingerprint(rule: string, failureSummary: string | undefined) {
  const normalizedSummary = (failureSummary || 'sans résumé').replace(/\s+/g, ' ').trim()
  const colors = [...normalizedSummary.matchAll(/(?:foreground|background) color: (#[0-9a-f]{6})/gi)]
    .map((match) => match[1].toLowerCase())

  // Font metrics vary between Windows and Linux. The foreground/background pair
  // identifies the design token combination without making the gate OS-dependent.
  if (colors.length >= 2) return `${rule}::foreground:${colors[0]}::background:${colors[1]}`
  return `${rule}::${normalizedSummary}`
}

function normalizeStoredFingerprint(value: string) {
  const separator = value.indexOf('::')
  if (separator < 0) return value.replace(/\s+/g, ' ').trim()
  return fingerprint(value.slice(0, separator), value.slice(separator + 2))
}

export async function openStablePage(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('body')).toBeVisible()
  await page.waitForLoadState('networkidle').catch(() => {})
}

export async function expectNoVisibleMojibake(page: Page) {
  const visibleText = await page.locator('body').innerText()
  expect(visibleText, 'Le texte visible contient une signature de mojibake').not.toMatch(MOJIBAKE_PATTERN)
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))

  expect(
    overflow.content,
    `Débordement horizontal: contenu ${overflow.content}px, viewport ${overflow.viewport}px`,
  ).toBeLessThanOrEqual(overflow.viewport + 1)
}

export async function expectNoColorContrastViolation(page: Page, testInfo: TestInfo, label: string, scope?: string) {
  let builder = new AxeBuilder({ page }).withRules(['color-contrast'])
  if (scope) builder = builder.include(scope)
  const result = await builder.analyze()

  await testInfo.attach(`axe-color-contrast-${label}`, {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })

  const current = [...new Set(result.violations.flatMap((violation) =>
    violation.nodes.map((node) => fingerprint(violation.id, node.failureSummary)),
  ))].sort()

  if (process.env.QUALITY_UPDATE_CONTRAST_BASELINE === 'true') {
    const baseline = readContrastBaseline()
    baseline[label] = current
    fs.writeFileSync(CONTRAST_BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
    testInfo.annotations.push({ type: 'contraste connu enregistré', description: `${current.length} violation(s)` })
    return
  }

  const baseline = readContrastBaseline()
  const stateKnown = new Set((baseline[label] || []).map(normalizeStoredFingerprint))
  const known = new Set(Object.values(baseline).flat().map(normalizeStoredFingerprint))
  const regressions = current.filter((item) => !known.has(item))
  const resolvedCount = [...stateKnown].filter((item) => !current.includes(item)).length
  testInfo.annotations.push({
    type: 'dette contraste',
    description: `${current.length} connue(s), ${resolvedCount} résolue(s), ${regressions.length} nouvelle(s)`,
  })

  expect(regressions, `Nouveau contraste insuffisant dans l'état « ${label} »`).toEqual([])
}

export async function expectPageQuality(page: Page, testInfo: TestInfo, label: string) {
  await expectNoVisibleMojibake(page)
  await expectNoHorizontalOverflow(page)
  await expectNoColorContrastViolation(page, testInfo, label)
}
