import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium, type FullConfig } from '@playwright/test'
import { AUTH_DIR, captureSessionStorage, storageStatePath, type AuthRole } from './support/auth'

const ROOT = path.resolve(process.cwd())
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const BACKEND_HEALTH_URL = process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001/api/health'
const BACKEND_BASE_URL = BACKEND_HEALTH_URL.replace(/\/api\/health$/, '')
const SERVER_STATE_FILE = path.join(ROOT, 'playwright', '.server.json')

const AUTH_ACCOUNTS: Array<{ role: AuthRole; email: string; password: string }> = [
  { role: 'particulier', email: 'particulier@playwright.troca.nc', password: 'Playwright123!' },
  { role: 'vendeur', email: 'vendeur@playwright.troca.nc', password: 'Playwright123!' },
  { role: 'pro', email: 'pro@playwright.troca.nc', password: 'Playwright123!' },
  { role: 'conducteur', email: 'conducteur@playwright.troca.nc', password: 'Playwright123!' },
  { role: 'admin', email: 'admin@playwright.troca.nc', password: 'Playwright123!' },
]

async function waitForHealthy(url: string, timeoutMs = 120_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      if (response.ok) return
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function ensureDevServerStarted() {
  const frontendHealthy = await fetch(PLAYWRIGHT_BASE_URL, { cache: 'no-store' }).then((res) => res.ok).catch(() => false)
  const backendHealthy = await fetch(BACKEND_HEALTH_URL, { cache: 'no-store' }).then((res) => res.ok).catch(() => false)
  if (frontendHealthy && backendHealthy) {
    return
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000',
      FRONTEND_PORT: process.env.FRONTEND_PORT || '3000',
      BACKEND_PORT: process.env.BACKEND_PORT || '3001',
      ADMIN_PORT: process.env.ADMIN_PORT || '3002',
    },
  })

  child.unref()

  fs.mkdirSync(path.dirname(SERVER_STATE_FILE), { recursive: true })
  fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify({ pid: child.pid, startedAt: new Date().toISOString() }, null, 2), 'utf-8')

  await waitForHealthy(PLAYWRIGHT_BASE_URL)
  await waitForHealthy(BACKEND_HEALTH_URL)
}

async function loginRole(page: import('@playwright/test').Page, role: AuthRole, email: string, password: string) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`Login failed for ${role} (${email}): ${payload?.error || response.statusText}`)
  }

  const accessToken = payload?.data?.access_token
  if (!accessToken) {
    throw new Error(`Login failed for ${role} (${email}): access token missing`)
  }

  await page.goto(`${PLAYWRIGHT_BASE_URL}/`)
  await page.evaluate((tokens) => {
    window.sessionStorage.setItem('access_token', tokens.accessToken)
    if (tokens.refreshToken) {
      window.sessionStorage.setItem('refresh_token', tokens.refreshToken)
    } else {
      window.sessionStorage.removeItem('refresh_token')
    }
  }, {
    accessToken,
    refreshToken: payload?.refresh_token || null,
  })
  await captureSessionStorage(page, role)
  await page.context().storageState({ path: storageStatePath(role) })
}

export default async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  fs.mkdirSync(path.join(ROOT, 'screenshots'), { recursive: true })

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  await new Promise<void>((resolve, reject) => {
    const seed = spawn(npmCmd, ['run', 'seed:playwright'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    })
    seed.on('error', reject)
    seed.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`seed:playwright failed with code ${code}`))
    })
  })

  await ensureDevServerStarted()

  const browser = await chromium.launch({ headless: true })
  try {
    for (const account of AUTH_ACCOUNTS) {
      const context = await browser.newContext({ baseURL: PLAYWRIGHT_BASE_URL })
      const page = await context.newPage()
      await loginRole(page, account.role, account.email, account.password)
      await context.close()
    }
  } finally {
    await browser.close()
  }
}
