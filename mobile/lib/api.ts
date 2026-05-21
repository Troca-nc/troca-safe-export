// ============================================================
//  Troca Mobile - Client API
//  Cache GET leger + gestion automatique du token JWT
// ============================================================

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { tokenStorage } from '@/lib/tokenStorage'

export { tokenStorage } from '@/lib/tokenStorage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

type CacheMatcher = string | RegExp | ((key: string) => boolean)

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

type CachedResponse<T> = Pick<AxiosResponse<T>, 'data' | 'status' | 'statusText' | 'headers' | 'config'>

const requestCache = new Map<string, CacheEntry<unknown>>()
const inflightCache = new Map<string, Promise<unknown>>()

const CACHE_TTL = {
  short: 5_000,
  medium: 30_000,
  long: 5 * 60_000,
  static: 24 * 60 * 60_000,
}

function stableSerialize(value: unknown): string {
  if (value == null) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}:${stableSerialize(val)}`)
  return `{${entries.join(',')}}`
}

function getRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

async function getAuthToken() {
  return tokenStorage.getAccess().catch(() => null)
}

function toCachedResponse<T>(response: AxiosResponse<T>): CachedResponse<T> {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config: response.config,
  }
}

async function buildCacheKey(scope: string, url: string, params?: unknown, extra?: unknown) {
  const token = await getAuthToken()
  return [scope, url, stableSerialize(params), stableSerialize(extra), token ?? ''].join('|')
}

async function cachedGet<T>(scope: string, url: string, fetcher: () => Promise<AxiosResponse<T>>, params?: unknown, ttlMs = CACHE_TTL.medium, extra?: unknown) {
  const key = await buildCacheKey(scope, url, params, extra)
  const now = Date.now()
  const cached = requestCache.get(key) as CacheEntry<CachedResponse<T>> | undefined
  if (cached && cached.expiresAt > now) return cached.value

  const pending = inflightCache.get(key) as Promise<CachedResponse<T>> | undefined
  if (pending) return pending

  const promise = fetcher()
    .then((response) => {
      const value = toCachedResponse(response)
      requestCache.set(key, { expiresAt: Date.now() + ttlMs, value })
      inflightCache.delete(key)
      return value
    })
    .catch((error) => {
      inflightCache.delete(key)
      throw error
    })

  inflightCache.set(key, promise)
  return promise
}

export function invalidateApiCache(match?: CacheMatcher) {
  if (!match) {
    requestCache.clear()
    inflightCache.clear()
    return
  }

  const tester = typeof match === 'function'
    ? match
    : match instanceof RegExp
      ? (key: string) => match.test(key)
      : (key: string) => key.startsWith(match)

  for (const key of requestCache.keys()) {
    if (tester(key)) requestCache.delete(key)
  }

  for (const key of inflightCache.keys()) {
    if (tester(key)) inflightCache.delete(key)
  }
}

export function clearApiCache() {
  requestCache.clear()
  inflightCache.clear()
}

export const authApi = {
  me: () => api.get('/auth/me'),
}

export const metaApi = {
  getCommunes: () => cachedGet('meta.getCommunes', '/communes', () => api.get('/communes'), undefined, CACHE_TTL.static),
  getCategories: () => cachedGet('meta.getCategories', '/categories', () => api.get('/categories'), undefined, CACHE_TTL.static),
}

export const listingsApi = {
  search: (params: object = {}) => cachedGet('listings.search', '/listings', () => api.get('/listings', { params }), params, CACHE_TTL.medium),
  getById: (id: string) => cachedGet('listings.getById', `/listings/${id}`, () => api.get(`/listings/${id}`), undefined, CACHE_TTL.short),
  getUserListings: (id: string, params: object = {}) => cachedGet('listings.getUserListings', `/listings/user/${id}`, () => api.get(`/listings/user/${id}`, { params }), params, CACHE_TTL.short),
  create: async (data: object) => {
    const res = await api.post('/listings', data)
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  update: async (id: string, data: object) => {
    const res = await api.put(`/listings/${id}`, data)
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  delete: async (id: string) => {
    const res = await api.delete(`/listings/${id}`)
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
}

export const messagesApi = {
  getConversations: () => cachedGet('messages.getConversations', '/messages/conversations', () => api.get('/messages/conversations'), undefined, CACHE_TTL.short),
  getMessages: (convId: string | number, page = 1, limit = 30) => cachedGet(
    'messages.getMessages',
    `/messages/conversations/${convId}`,
    () => api.get(`/messages/conversations/${convId}?page=${page}&limit=${limit}`),
    { page, limit },
    CACHE_TTL.short,
  ),
  startConversation: (data: object) => api.post('/messages/conversations', data),
  sendMessage: (convId: string, content: string) => api.post(`/messages/conversations/${convId}`, { content }),
  sendPhoto: (convId: string, photo_url: string) => api.post(`/messages/conversations/${convId}`, { type: 'photo', photo_url }),
}

export const statsApi = {
  getSeller: () => cachedGet('stats.getSeller', '/stats/seller', () => api.get('/stats/seller'), undefined, CACHE_TTL.short),
}

export const bonPlansApi = {
  list: (params: object = {}) => cachedGet(
    'bonPlans.list',
    '/bon-plans',
    () => api.get('/bon-plans', { params }),
    params,
    CACHE_TTL.short,
  ),
  create: (data: object) => api.post('/bon-plans', data).finally(() => invalidateApiCache('bonPlans.')),
}

export const covoiturageApi = {
  list: (params: object = {}) => cachedGet(
    'covoiturage.list',
    '/covoiturage',
    () => api.get('/covoiturage', { params }),
    params,
    CACHE_TTL.short,
  ),
  mine: () => cachedGet('covoiturage.mine', '/covoiturage/mine', () => api.get('/covoiturage/mine'), undefined, CACHE_TTL.short),
  create: (data: object) => api.post('/covoiturage', data).finally(() => invalidateApiCache('covoiturage.')),
  book: (id: string | number, data: object = {}) => api.post(`/covoiturage/${id}/book`, data).finally(() => invalidateApiCache('covoiturage.')),
}

export const notificationsApi = {
  getNotifications: (limit = 20) => cachedGet(
    'notifications.get',
    '/users/notifications',
    () => api.get('/users/notifications', { params: { limit } }),
    { limit },
    CACHE_TTL.short,
  ),
  markAllRead: () => api.post('/users/notifications/read-all').finally(() => invalidateApiCache('notifications.')),
  markRead: (id: number) => api.post(`/users/notifications/${id}/read`).finally(() => invalidateApiCache('notifications.')),
}

export const favoritesApi = {
  getFavorites: () => cachedGet('favorites.get', '/users/me/favoris', () => api.get('/users/me/favoris'), undefined, CACHE_TTL.short),
  toggleFavorite: (id: string) => api.post(`/listings/${id}/favoris`).finally(() => invalidateApiCache('favorites.')),
}

export const alertsApi = {
  getAlerts: () => cachedGet('alerts.get', '/alerts', () => api.get('/alerts'), undefined, CACHE_TTL.short),
  toggleAlert: (id: number, status: 'active' | 'paused') =>
    api.patch(`/alerts/${id}`, { status }).finally(() => invalidateApiCache('alerts.')),
  deleteAlert: (id: number) => api.delete(`/alerts/${id}`).finally(() => invalidateApiCache('alerts.')),
}

export const usersApi = {
  getProfile: (id: string) => cachedGet('users.getProfile', `/users/${id}`, () => api.get(`/users/${id}`), undefined, CACHE_TTL.short),
  getUserListings: (id: string, params: object = {}) => cachedGet('users.getUserListings', `/listings/user/${id}`, () => api.get(`/listings/user/${id}`, { params }), params, CACHE_TTL.short),
  getReviews: (id: string) => cachedGet('users.getReviews', `/users/${id}/reviews`, () => api.get(`/users/${id}/reviews`), undefined, CACHE_TTL.short),
  addReview: (id: string, data: object) => api.post(`/users/${id}/reviews`, data).finally(() => invalidateApiCache('users.')),
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['x-request-id'] = config.headers['x-request-id'] ?? getRequestId()
  return config
})

let isRefreshing = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requestId = error.response?.headers?.['x-request-id'] ?? original?.headers?.['x-request-id']

    if (__DEV__) {
      console.warn('[api] request failed', {
        request_id: requestId,
        status: error.response?.status ?? null,
        url: original?.url ?? null,
      })
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    isRefreshing = true

    try {
      const refresh = await tokenStorage.getRefresh()
      if (!refresh) throw new Error('No refresh token')

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
      const newAccess: string = data.data.access_token

      await tokenStorage.setAccess(newAccess)
      if (data.data.refresh_token) await tokenStorage.setRefresh(data.data.refresh_token)

      queue.forEach((q) => q.resolve(newAccess))
      queue = []

      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (err) {
      queue.forEach((q) => q.reject(err))
      queue = []
      await tokenStorage.clear()
      clearApiCache()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)
