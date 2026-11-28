import { expect, test, type BrowserContext, type Route } from '@playwright/test'

const user = {
  id: 'session-test-user',
  email: 'session@kalico.nc',
  first_name: 'Session',
  last_name: 'Test',
  avatar_url: null,
  is_verified: true,
  is_pro: false,
  is_admin: false,
  rating: 0,
  tours_seen: [],
  pro_category: null,
}

function accessToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3_600 })).toString('base64url')
  return `session.${payload}.signature`
}

type RefreshReply = { status: number; code?: string; retryAfter?: string } | 'abort'

async function installSessionApi(context: BrowserContext, replies: RefreshReply[] = [{ status: 200 }]) {
  let refreshCount = 0
  let logoutCount = 0

  await context.route('**/api/**', async (route: Route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/auth/refresh/logout') {
      logoutCount += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) })
      return
    }
    if (url.pathname === '/api/auth/refresh') {
      const reply = replies[Math.min(refreshCount, replies.length - 1)]
      refreshCount += 1
      if (reply === 'abort') {
        await route.abort('connectionfailed')
        return
      }
      if (reply.status === 200) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { access_token: accessToken() } }) })
        return
      }
      await route.fulfill({
        status: reply.status,
        headers: reply.retryAfter ? { 'Retry-After': reply.retryAfter } : undefined,
        contentType: 'application/json',
        body: JSON.stringify({ code: reply.code || 'AUTH_DEPENDENCY_UNAVAILABLE' }),
      })
      return
    }
    if (url.pathname === '/api/users/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: user }) })
      return
    }
    if (url.pathname === '/api/messages/conversations') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
      return
    }
    if (url.pathname === '/api/users/notifications') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], unread: 0 }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
  })

  return {
    refreshCount: () => refreshCount,
    logoutCount: () => logoutCount,
  }
}

async function expectStatus(page: import('@playwright/test').Page, status: string) {
  await expect.poll(() => page.locator('html').getAttribute('data-session-status')).toBe(status)
}

test('dix onglets partagent un seul refresh et ne stockent aucun jeton', async ({ context }) => {
  const api = await installSessionApi(context)
  const pages = await Promise.all(Array.from({ length: 10 }, () => context.newPage()))
  await Promise.all(pages.map((page) => page.goto('/connexion')))
  await Promise.all(pages.map((page) => expectStatus(page, 'authenticated')))

  expect(api.refreshCount()).toBe(1)
  for (const page of pages) {
    const stored = await page.evaluate(() => ({
      sessionAccess: sessionStorage.getItem('access_token'),
      sessionRefresh: sessionStorage.getItem('refresh_token'),
      localAccess: localStorage.getItem('access_token'),
      localRefresh: localStorage.getItem('refresh_token'),
      authStore: localStorage.getItem('auth-store'),
    }))
    expect(stored.sessionAccess).toBeNull()
    expect(stored.sessionRefresh).toBeNull()
    expect(stored.localAccess).toBeNull()
    expect(stored.localRefresh).toBeNull()
    expect(stored.authStore ?? '').not.toContain('access_token')
    expect(stored.authStore ?? '').not.toContain('refresh_token')
  }
})

test('un nouvel onglet récupère la session depuis un onglet connecté', async ({ context }) => {
  const api = await installSessionApi(context)
  const first = await context.newPage()
  await first.goto('/connexion')
  await expectStatus(first, 'authenticated')

  const second = await context.newPage()
  await second.goto('/connexion')
  await expectStatus(second, 'authenticated')
  expect(api.refreshCount()).toBe(1)
})

test('un rechargement restaure la session sans stockage de jeton', async ({ context }) => {
  const api = await installSessionApi(context)
  const page = await context.newPage()
  await page.goto('/connexion')
  await expectStatus(page, 'authenticated')
  await page.reload()
  await expectStatus(page, 'authenticated')
  expect(api.refreshCount()).toBe(2)
  expect(await page.evaluate(() => sessionStorage.getItem('access_token'))).toBeNull()
})

test('un 429 conserve la session en récupération puis respecte Retry-After', async ({ context }) => {
  const api = await installSessionApi(context, [{ status: 429, retryAfter: '0' }, { status: 200 }])
  const page = await context.newPage()
  await page.goto('/')
  await expectStatus(page, 'recovering')
  await expect(page).not.toHaveURL(/\/connexion/)
  await expectStatus(page, 'authenticated')
  expect(api.refreshCount()).toBe(2)
})

test('une erreur réseau conserve la session puis récupère sans redirection', async ({ context }) => {
  const api = await installSessionApi(context, ['abort', { status: 200 }])
  const page = await context.newPage()
  await page.goto('/')
  await expectStatus(page, 'recovering')
  await expect(page).not.toHaveURL(/\/connexion/)
  await expectStatus(page, 'authenticated')
  expect(api.refreshCount()).toBe(2)
})

test('un 503 conserve la session puis récupère sans redirection', async ({ context }) => {
  const api = await installSessionApi(context, [{ status: 503 }, { status: 200 }])
  const page = await context.newPage()
  await page.goto('/')
  await expectStatus(page, 'recovering')
  await expect(page).not.toHaveURL(/\/connexion/)
  await expectStatus(page, 'authenticated')
  expect(api.refreshCount()).toBe(2)
})

test('un 403 ne termine jamais la session', async ({ context }) => {
  const api = await installSessionApi(context, [{ status: 403 }, { status: 200 }])
  const page = await context.newPage()
  await page.goto('/connexion')
  await expectStatus(page, 'recovering')
  await expectStatus(page, 'authenticated')
  expect(api.refreshCount()).toBe(2)
})

test('un 401 terminal rend visiteur sans rediriger une page publique', async ({ context }) => {
  const api = await installSessionApi(context, [{ status: 401, code: 'REFRESH_EXPIRED' }])
  const page = await context.newPage()
  await page.goto('/')
  await expectStatus(page, 'visitor')
  await expect(page).not.toHaveURL(/\/connexion/)
  expect(api.refreshCount()).toBe(1)
})

test('une garde membre conserve chemin, query et hash vers la connexion', async ({ context }) => {
  await installSessionApi(context, [{ status: 401, code: 'REFRESH_MISSING' }])
  const page = await context.newPage()
  await page.goto('/notifications?tab=securite#x')
  await expect(page).toHaveURL(/\/connexion\?/)
  const redirected = new URL(page.url())
  expect(redirected.searchParams.get('next')).toBe('/notifications?tab=securite#x')
})

test('la déconnexion est révoquée côté serveur et diffusée aux autres onglets', async ({ context }) => {
  const api = await installSessionApi(context)
  const first = await context.newPage()
  const second = await context.newPage()
  await Promise.all([first.goto('/'), second.goto('/')])
  await Promise.all([expectStatus(first, 'authenticated'), expectStatus(second, 'authenticated')])

  await first.getByRole('button', { name: /Session/ }).click()
  await first.getByRole('menuitem', { name: 'Déconnexion' }).click()
  await Promise.all([expectStatus(first, 'visitor'), expectStatus(second, 'visitor')])
  expect(api.logoutCount()).toBe(1)
})
