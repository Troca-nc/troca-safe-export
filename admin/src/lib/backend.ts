import { getBackendUrl } from './auth'
import { requireAdminSession } from './session'

function normalizeBackendUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export function getAdminApiBase() {
  return normalizeBackendUrl(getBackendUrl())
}

export async function adminBackendFetch(pathname: string, init: RequestInit = {}) {
  if (!await requireAdminSession()) {
    return Response.json({ error: 'Authentification administrateur requise.' }, { status: 401 })
  }
  const url = `${getAdminApiBase()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
  const token = process.env.ADMIN_API_TOKEN?.trim() || ''
  const hdrs = new Headers(init.headers)
  if (token) hdrs.set('x-admin-token', token)

  hdrs.set('accept', hdrs.get('accept') || 'application/json')

  const response = await fetch(url, {
    ...init,
    headers: hdrs,
    cache: 'no-store',
  })

  return response
}

export async function adminBackendJson<T = unknown>(path: string, init: RequestInit = {}) {
  const response = await adminBackendFetch(path, init)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || `Erreur backend ${response.status}`)
  }
  return (payload?.data ?? payload) as T
}

export function getForwardedIp(headersList: Headers) {
  return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || '127.0.0.1'
}
