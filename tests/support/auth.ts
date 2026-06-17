import fs from 'node:fs'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'

export type AuthRole = 'particulier' | 'vendeur' | 'pro' | 'conducteur' | 'admin'

export const AUTH_DIR = path.resolve(process.cwd(), 'playwright', '.auth')

type AuthUserState = {
  id: string
  email: string
  first_name: string
  last_name: string
  prenom?: string
  nom?: string
  telephone?: string | null
  phone_verified?: boolean
  avatar_url: string | null
  is_verified: boolean
  is_pro: boolean
  is_admin: boolean
  rating: number
  commune_name?: string
  demo_role?: string
  account_type?: 'personal' | 'professional'
  pro_plan?: 'pro'
  onboarding_step?: number
}

const AUTH_USERS: Record<AuthRole, AuthUserState> = {
  particulier: {
    id: '2',
    email: 'particulier@demo.kalico',
    first_name: 'Emma',
    last_name: 'Martin',
    prenom: 'Emma',
    nom: 'Martin',
    telephone: '+687700001',
    phone_verified: true,
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.8,
    commune_name: 'Nouméa',
    demo_role: 'particulier',
    account_type: 'personal',
    onboarding_step: 1,
  },
  vendeur: {
    id: '5',
    email: 'loueur@demo.kalico',
    first_name: 'Lucas',
    last_name: 'Bernier',
    prenom: 'Lucas',
    nom: 'Bernier',
    telephone: '+687700004',
    phone_verified: false,
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.6,
    commune_name: 'Koné',
    demo_role: 'particulier',
    account_type: 'personal',
    onboarding_step: 1,
  },
  pro: {
    id: '3',
    email: 'pro@demo.kalico',
    first_name: 'Entreprise',
    last_name: 'Test NC',
    prenom: 'Entreprise',
    nom: 'Test NC',
    telephone: '+687700003',
    phone_verified: true,
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 4.9,
    commune_name: 'Dumbéa',
    demo_role: 'pro',
    account_type: 'professional',
    pro_plan: 'pro',
    onboarding_step: 1,
  },
  conducteur: {
    id: '6',
    email: 'marine@demo.kalico',
    first_name: 'Marine',
    last_name: 'Dupont',
    prenom: 'Marine',
    nom: 'Dupont',
    telephone: '+687700006',
    phone_verified: true,
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.7,
    commune_name: 'Lifou',
    demo_role: 'visitor',
    account_type: 'personal',
    onboarding_step: 1,
  },
  admin: {
    id: '1',
    email: 'admin@demo.kalico',
    first_name: 'Ada',
    last_name: 'Admin',
    prenom: 'Ada',
    nom: 'Admin',
    telephone: '+687700005',
    phone_verified: true,
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: true,
    rating: 5,
    commune_name: 'Nouméa',
    demo_role: 'admin',
    account_type: 'professional',
    pro_plan: 'pro',
    onboarding_step: 1,
  },
}

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

export async function restoreAuthStore(page: Page, state: unknown) {
  await page.addInitScript((payload) => {
    window.localStorage.setItem('auth-store', JSON.stringify({
      state: payload,
      version: 0,
    }))
  }, state)
}

export async function restoreAuthenticatedStore(page: Page, role: AuthRole) {
  const session = readSessionStorage(role)
  const accessToken = session.access_token || session.accessToken
  if (!accessToken) {
    throw new Error(`No access token found for ${role}`)
  }

  const user = AUTH_USERS[role]
  const refreshToken = session.refresh_token || session.refreshToken || null

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ state, tokens }) => {
    window.localStorage.setItem('auth-store', JSON.stringify({
      state,
      version: 0,
    }))
    window.sessionStorage.removeItem('pending_auth_action')
    window.sessionStorage.removeItem('redirect_after_login')
    window.sessionStorage.setItem('access_token', tokens.accessToken)
    if (tokens.refreshToken) {
      window.sessionStorage.setItem('refresh_token', tokens.refreshToken)
    } else {
      window.sessionStorage.removeItem('refresh_token')
    }
  }, {
    state: {
      user,
      isAuthenticated: true,
      demoProfile: null,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  })
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

export async function dismissOnboardingWizard(page: Page) {
  const dismissButton = page.getByRole('button', { name: /^Passer$/i })
  if (await dismissButton.count()) {
    await dismissButton.first().click()
    await expect(dismissButton.first()).toBeHidden({ timeout: 15_000 })
  }
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
    /Failed to load resource: the server responded with a status of 404/i,
    /Request failed with status code 404/i,
    /WebSocket connection to 'ws:\/\/localhost:3001\/socket\.io\/\?EIO=4&transport=websocket' failed/i,
    /socket\.io\/\?EIO=4&transport=websocket/i,
    /\[platform-stats\] load failed: AxiosError: timeout of 15000ms exceeded/i,
    /\[platform-stats\] load failed: AxiosError: Network Error/i,
    /due to access control checks\./i,
    /ChunkLoadError:/i,
    /Loading chunk .* failed/i,
    /__nextjs_original-stack-frames/i,
    /_next\/static\/webpack\/.*hot-update\.json/i,
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
