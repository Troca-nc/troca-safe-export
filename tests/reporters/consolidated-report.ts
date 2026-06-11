import fs from 'node:fs'
import path from 'node:path'
import type { Reporter, FullResult, TestCase, TestResult } from '@playwright/test/reporter'

type RecordedResult = {
  project: string
  file: string
  title: string
  status: TestResult['status']
  duration: number
  error: string | null
}

function simplifyError(error: unknown) {
  if (!error) return null
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message ?? error)
  }
  return String(error)
}

function countFiles(dir: string) {
  try {
    return fs.readdirSync(dir).length
  } catch {
    return 0
  }
}

export default class ConsolidatedReport implements Reporter {
  private readonly results: RecordedResult[] = []
  private discoveredTests = 0

  onBegin(_config: unknown, suite: { allTests(): Array<unknown> }) {
    this.discoveredTests = suite.allTests().length
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      project: test.parent.project()?.name || 'unknown',
      file: path.relative(process.cwd(), test.location.file),
      title: test.titlePath().slice(1).join(' > '),
      status: result.status,
      duration: result.duration,
      error: simplifyError(result.errors[0]?.message || result.error),
    })
  }

  async onEnd(result: FullResult) {
    if (this.results.length === 0) {
      return
    }

    const reportDir = path.resolve(process.cwd(), 'playwright-report')
    fs.mkdirSync(reportDir, { recursive: true })

    const grouped = new Map<string, RecordedResult[]>()
    for (const item of this.results) {
      const list = grouped.get(item.project) || []
      list.push(item)
      grouped.set(item.project, list)
    }

    const lines: string[] = []
    lines.push('# Troca Playwright Consolidated Report')
    lines.push('')
    lines.push(`- Status global: **${result.status}**`)
    lines.push(`- Tests découverts: **${this.discoveredTests}**`)
    lines.push(`- Tests exécutés: **${this.results.length}**`)
    lines.push(`- Total tests: **${this.results.length}**`)
    lines.push(`- Passed: **${this.results.filter((r) => r.status === 'passed').length}**`)
    lines.push(`- Failed: **${this.results.filter((r) => r.status === 'failed').length}**`)
    lines.push(`- Skipped: **${this.results.filter((r) => r.status === 'skipped').length}**`)
    lines.push(`- Timed out: **${this.results.filter((r) => r.status === 'timedOut').length}**`)
    lines.push('')

    lines.push('## Screenshots')
    const screenshotRoot = path.resolve(process.cwd(), 'screenshots')
    const groups = ['public', 'particulier', 'vendeur', 'pro', 'conducteur', 'admin']
    for (const group of groups) {
      lines.push(`- ${group}: ${countFiles(path.join(screenshotRoot, group))} fichier(s)`)
    }
    lines.push('')

    for (const [project, items] of grouped.entries()) {
      lines.push(`## ${project}`)
      lines.push('| Test | Statut | Durée (ms) | Fichier | Erreur |')
      lines.push('|---|---:|---:|---|---|')
      for (const item of items) {
        lines.push(`| ${item.title.replace(/\|/g, '\\|')} | ${item.status} | ${item.duration} | ${item.file.replace(/\|/g, '\\|')} | ${(item.error || '').replace(/\|/g, '\\|')} |`)
      }
      lines.push('')
    }

    fs.writeFileSync(path.join(reportDir, 'summary.md'), lines.join('\n'), 'utf-8')
    fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify({
      status: result.status,
      total: this.results.length,
      results: this.results,
    }, null, 2), 'utf-8')
  }
}
