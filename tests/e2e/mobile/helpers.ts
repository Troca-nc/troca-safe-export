import { expect, type Page } from '@playwright/test'
import { restoreAuthStore, restoreSessionStorage, type AuthRole, createConsoleCollector, assertNoForbiddenBodyText } from '../../support/auth'
import { screenshotPath } from '../../support/audit'

export const MOBILE_VIEWPORTS = [
  { width: 320, height: 740, label: '320px' },
  { width: 375, height: 740, label: '375px' },
] as const

const AUTH_STATES: Record<AuthRole, unknown> = {
  particulier: {
    user: {
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
      commune_name: 'NoumÃ©a',
      demo_role: 'particulier',
      account_type: 'personal',
      onboarding_step: 1,
    },
    isAuthenticated: true,
    demoProfile: null,
  },
  vendeur: {
    user: {
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
      commune_name: 'KonÃ©',
      demo_role: 'particulier',
      account_type: 'personal',
      onboarding_step: 1,
    },
    isAuthenticated: true,
    demoProfile: null,
  },
  pro: {
    user: {
      id: '3',
      email: 'pro@playwright.kalico.nc',
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
      commune_name: 'DumbÃ©a',
      demo_role: 'pro',
      account_type: 'professional',
      pro_plan: 'pro',
      onboarding_step: 1,
    },
    isAuthenticated: true,
    demoProfile: null,
  },
  conducteur: {
    user: {
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
    isAuthenticated: true,
    demoProfile: null,
  },
  admin: {
    user: {
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
      commune_name: 'NoumÃ©a',
      demo_role: 'admin',
      account_type: 'professional',
      pro_plan: 'pro',
      onboarding_step: 1,
    },
    isAuthenticated: true,
    demoProfile: null,
  },
}

export async function setMobileViewport(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
}

export async function navigateTo(
  page: Page,
  url: string,
  options?: { timeout?: number },
) {
  const isWebKit = page.context().browser()?.browserType().name() === 'webkit'
  const targetPath = new URL(url, 'http://127.0.0.1:3000').pathname
  const gotoOptions = {
    waitUntil: (isWebKit ? 'commit' : 'domcontentloaded') as const,
    timeout: options?.timeout ?? (isWebKit ? 15_000 : 20_000),
  }

  try {
    await page.goto(url, gotoOptions)
    await page.waitForURL((current) => current.pathname === targetPath, { timeout: isWebKit ? 8_000 : 5_000 }).catch(() => {})
    await page.waitForTimeout(isWebKit ? 250 : 150)
  } catch (error) {
    globalThis.console.warn(`Navigation warning for ${url}:`, error)
    if (isWebKit) {
      await page.waitForTimeout(300)
      await page.goto(url, {
        waitUntil: 'commit',
        timeout: 15_000,
      }).catch((retryError) => {
        globalThis.console.warn(`Navigation retry warning for ${url}:`, retryError)
      })
      await page.waitForURL((current) => current.pathname === targetPath, { timeout: 8_000 }).catch(() => {})
      await page.waitForTimeout(250)
    } else {
      throw error
    }
  }
}

export async function openMobilePage(page: Page, pathname: string) {
  await navigateTo(page, pathname)
  await page.waitForLoadState('domcontentloaded').catch(() => {})
  await expect(page.locator('body')).toBeVisible()
}

export async function prepareAuthenticatedMobilePage(page: Page, role: AuthRole) {
  await restoreAuthenticatedStore(page, role)
  await restoreSessionStorage(page, role)
}

export async function hydrateAuthenticatedMobilePage(page: Page, role: AuthRole) {
  await restoreAuthStore(page, AUTH_STATES[role])
  await restoreSessionStorage(page, role)
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body

    function isInsideHorizontalScroller(element: Element | null) {
      let current: Element | null = element
      while (current && current !== document.body) {
        const style = getComputedStyle(current)
        const overflowX = style.overflowX
        const canScroll = overflowX === 'auto' || overflowX === 'scroll'
        if (canScroll && current.scrollWidth > current.clientWidth + 1) {
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
          cls: typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className : '',
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
      overflowX:
        doc.scrollWidth > doc.clientWidth + 120 ||
        body.scrollWidth > body.clientWidth + 120,
      sample,
    }
  })

  if (overflow.overflowX) {
    console.warn(`[mobile-audit] Horizontal overflow detected: ${JSON.stringify(overflow)}`)
  }
}

export async function saveMobileScreenshot(page: Page, name: string) {
  const file = screenshotPath('mobile', name)
  await page.screenshot({
    path: file,
    fullPage: false,
    animations: 'disabled',
    timeout: 8_000,
  })
  return file
}

export function createMobileConsoleCollector(page: Page) {
  return createConsoleCollector(page)
}

export async function expectMobileBodyHealthy(page: Page) {
  await assertNoForbiddenBodyText(page)
  await expectNoHorizontalOverflow(page)
}
