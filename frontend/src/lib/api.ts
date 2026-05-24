// src/lib/api.ts
// Client HTTP centralise avec cache GET leger et refresh token automatique

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios'

import { rememberRedirectAfterLogin } from '@/lib/authRedirect'
import { requestDraftSave } from '@/lib/draftEvents'
import { isDemoMode, showDemoToast } from '@/lib/demoMode'
import { clearStoredTokens, getStoredAccessToken, getStoredRefreshToken, saveStoredTokens } from '@/lib/tokenStorage'

function normalizeApiBase(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!trimmed) return 'http://localhost:3001/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const API_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
export const API_ORIGIN = API_URL.replace(/\/api$/, '')

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

function getAuthToken() {
  if (typeof window === 'undefined') return ''
  return getStoredAccessToken()
}

function getRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function redirectToLoginAfterAuthFailure() {
  if (typeof window === 'undefined') return

  // TODO: test E2E for auth expiry redirect and draft save flow.
  requestDraftSave()
  rememberRedirectAfterLogin()
  clearTokens()
  window.location.assign('/connexion')
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

function createDemoResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosRequestConfig,
  } as AxiosResponse<T>
}

function buildCacheKey(scope: string, url: string, params?: unknown, extra?: unknown) {
  return [scope, url, stableSerialize(params), stableSerialize(extra), getAuthToken()].join('|')
}

async function cachedGet<T>(key: string, fetcher: () => Promise<AxiosResponse<T>>, ttlMs = CACHE_TTL.medium) {
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

// Intercepteur requete : ajoute le Bearer token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = getStoredAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['x-request-id'] = config.headers['x-request-id'] ?? getRequestId()
  return config
})

// Intercepteur reponse : refresh automatique
let isRefreshing = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requestId = error.response?.headers?.['x-request-id'] ?? original?.headers?.['x-request-id']

    if (process.env.NODE_ENV === 'development') {
      console.warn('[api] request failed', {
        request_id: requestId,
        status: error.response?.status ?? null,
        url: original?.url ?? null,
      })
    }

    if (error.response?.status === 401 && !original._retry) {
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
      const refreshToken = getStoredRefreshToken()

      if (!refreshToken) {
        redirectToLoginAfterAuthFailure()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const { access_token, refresh_token } = data.data
        saveTokens(access_token, refresh_token)

        queue.forEach((p) => p.resolve(access_token))
        queue = []

        original.headers.Authorization = `Bearer ${access_token}`
        return api(original)
      } catch {
        queue.forEach((p) => p.reject(error))
        queue = []
        redirectToLoginAfterAuthFailure()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Helpers tokens
export const saveTokens = (access: string, refresh: string) => {
  saveStoredTokens(access, refresh)
}

export const clearTokens = () => {
  clearStoredTokens()
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('user')
  }
  clearApiCache()
}

// Fonctions API

// Auth
export const authApi = {
  register: (data: object, turnstileToken?: string) =>
    api.post('/auth/register', {
      ...data,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  login: (data: object, turnstileToken?: string) =>
    api.post('/auth/login', {
      ...data,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refresh_token: refreshToken }),
  me: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string, turnstileToken?: string) =>
    api.post('/auth/forgot-password', {
      email,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  resendVerification: (email: string, turnstileToken?: string) => api.post('/auth/resend-verification', { email, turnstile_token: turnstileToken }),
}

export const phoneApi = {
  send: (telephone: string) => api.post('/phone/send', { telephone }),
  verify: (telephone: string, code: string) => api.post('/phone/verify', { telephone, code }),
  resend: (telephone: string, channel: 'sms' | 'email' = 'sms') => api.post('/auth/otp/resend', { telephone, channel }),
}

// Listings
export const listingsApi = {
  search: (params: object = {}) => cachedGet(
    buildCacheKey('listings.search', '/listings', params),
    () => api.get('/listings', { params }),
    CACHE_TTL.medium,
  ),
  getById: (id: string) => cachedGet(
    buildCacheKey('listings.getById', `/listings/${id}`),
    () => api.get(`/listings/${id}`),
    CACHE_TTL.short,
  ),
  getUserListings: (userId: string, params: object = {}) => cachedGet(
    buildCacheKey('listings.getUserListings', `/listings/user/${userId}`, params),
    () => api.get(`/listings/user/${userId}`, { params }),
    CACHE_TTL.short,
  ),
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
  delete: async (id: string, reason = 'other') => {
    const res = await api.delete(`/listings/${id}`, { data: { reason } })
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
}

export const trocApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('troc.list', '/troc', params),
    () => api.get('/troc', { params }),
    CACHE_TTL.short,
  ),
  swipeFeed: (params: object = {}) => cachedGet(
    buildCacheKey('troc.swipeFeed', '/troc/swipe-feed', params),
    () => api.get('/troc/swipe-feed', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('troc.getById', `/troc/${id}`),
    () => api.get(`/troc/${id}`),
    CACHE_TTL.short,
  ),
  getProposalsReceived: () => api.get('/troc/proposals/received'),
  getProposalsSent: () => api.get('/troc/proposals/sent'),
  getCycles: () => api.get('/troc/cycles'),
  sendProposal: (id: string | number, data: object) => api.post(`/troc/${id}/proposals`, data),
  swipe: (data: { listing_id: string | number; direction: 'left' | 'right' }) => api.post('/troc/swipes', data),
  acceptProposal: (id: string | number) => api.patch(`/troc/proposals/${id}/accept`),
  declineProposal: (id: string | number) => api.patch(`/troc/proposals/${id}/decline`),
  counterProposal: (id: string | number, data: object) => api.patch(`/troc/proposals/${id}/counter`, data),
  completeProposal: (id: string | number) => api.patch(`/troc/proposals/${id}/complete`),
  confirmCycle: (id: string | number) => api.patch(`/troc/cycles/${id}/confirm`),
  getUserBadges: (id: string | number) => api.get(`/users/${id}/troc-badges`),
}

// Upload
export const uploadApi = {
  uploadImages: (listingId: string, files: File[], config?: Pick<AxiosRequestConfig, 'onUploadProgress'>) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api.post(`/upload/listing/${listingId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },
  uploadChatPhoto: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/upload/chat', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage: (imageId: string) => api.delete(`/upload/image/${imageId}`),
  setCover: (imageId: string) => api.put(`/upload/image/${imageId}/cover`),
}

// Messages
export const messagesApi = {
  getConversations: () => cachedGet(
    buildCacheKey('messages.getConversations', '/messages/conversations'),
    () => api.get('/messages/conversations'),
    CACHE_TTL.short,
  ),
  getMessages: (convId: string | number, page = 1, limit = 30, before?: string | null) => cachedGet(
    buildCacheKey('messages.getMessages', `/messages/conversations/${convId}`, { page, limit, before: before || '' }),
    () => api.get(`/messages/conversations/${convId}`, { params: { page, limit, before: before || undefined } }),
    CACHE_TTL.short,
  ),
  startConversation: (data: object) => {
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return Promise.resolve(createDemoResponse({ data: { id: 'demo-conversation', ...data } }))
    }
    return api.post('/messages/conversations', data)
  },
  sendMessage: (convId: string, content: string) => {
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-message-${Date.now()}`,
          conv_id: convId,
          content,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, { content })
  },
  sendPhoto: (convId: string, photo_url: string) => {
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-photo-${Date.now()}`,
          conv_id: convId,
          type: 'photo',
          photo_url,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, { type: 'photo', photo_url })
  },
  markConversationRead: (convId: string | number) =>
    api.patch(`/messages/conversations/${convId}/read`),
}

// Communes and categories
export const metaApi = {
  getCommunes: () => cachedGet(
    buildCacheKey('meta.getCommunes', '/communes'),
    () => api.get('/communes'),
    CACHE_TTL.static,
  ),
  getCategories: () => cachedGet(
    buildCacheKey('meta.getCategories', '/categories'),
    () => api.get('/categories'),
    CACHE_TTL.static,
  ),
}

export const statsApi = {
  getHome: () => cachedGet(
    buildCacheKey('stats.getHome', '/stats/home'),
    () => api.get('/stats/home'),
    CACHE_TTL.long,
  ),
  getSeller: () => cachedGet(
    buildCacheKey('stats.getSeller', '/stats/seller'),
    () => api.get('/stats/seller'),
    CACHE_TTL.short,
  ),
}

export const bonPlansApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('bonPlans.list', '/bon-plans', params),
    () => api.get('/bon-plans', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('bonPlans.getById', `/bon-plans/${id}`),
    () => api.get(`/bon-plans/${id}`),
    CACHE_TTL.short,
  ),
  businesses: (params: object = {}) => cachedGet(
    buildCacheKey('bonPlans.businesses', '/bon-plans/businesses', params),
    () => api.get('/bon-plans/businesses', { params }),
    CACHE_TTL.static,
  ),
  getPrefs: () => api.get('/bon-plans/notifications/prefs'),
  savePrefs: (data: object) => api.put('/bon-plans/notifications/prefs', data).finally(() => invalidateApiCache('bonPlans.')),
  create: async (data: object) => {
    const res = await api.post('/bon-plans', data)
    invalidateApiCache('bonPlans.')
    invalidateApiCache('stats.')
    return res
  },
}

export const businessesApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('businesses.list', '/businesses', params),
    () => api.get('/businesses', { params }),
    CACHE_TTL.short,
  ),
  getBySlug: (slug: string) => cachedGet(
    buildCacheKey('businesses.getBySlug', `/businesses/${slug}`),
    () => api.get(`/businesses/${slug}`),
    CACHE_TTL.short,
  ),
  getReviews: (slug: string, params: object = {}) => cachedGet(
    buildCacheKey('businesses.getReviews', `/businesses/${slug}/reviews`, params),
    () => api.get(`/businesses/${slug}/reviews`, { params }),
    CACHE_TTL.short,
  ),
  addReview: (slug: string, data: object) => api.post(`/businesses/${slug}/reviews`, data),
  updateReview: (slug: string, reviewId: string | number, data: object) => api.put(`/businesses/${slug}/reviews/${reviewId}`, data),
  reportReview: (slug: string, reviewId: string | number, data: object = {}) => api.post(`/businesses/${slug}/reviews/${reviewId}/report`, data),
  replyReview: (slug: string, reviewId: string | number, data: object) => api.post(`/businesses/${slug}/reviews/${reviewId}/reply`, data),
}

export const adminBusinessesApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('adminBusinesses.list', '/admin/businesses', params),
    () => api.get('/admin/businesses', { params }),
    CACHE_TTL.short,
  ),
  verify: (id: string | number) => api.patch(`/admin/businesses/${id}/verify`).finally(() => invalidateApiCache('adminBusinesses.')),
  unverify: (id: string | number) => api.patch(`/admin/businesses/${id}/unverify`).finally(() => invalidateApiCache('adminBusinesses.')),
  reportedReviews: () => cachedGet(
    buildCacheKey('adminBusinesses.reportedReviews', '/admin/businesses/reviews/reported'),
    () => api.get('/admin/businesses/reviews/reported'),
    CACHE_TTL.short,
  ),
  keepReview: (id: string | number) => api.patch(`/admin/businesses/reviews/${id}/keep`).finally(() => invalidateApiCache('adminBusinesses.')),
  deleteReview: (id: string | number) => api.delete(`/admin/businesses/reviews/${id}`).finally(() => invalidateApiCache('adminBusinesses.')),
}

export const covoiturageApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('covoiturage.list', '/covoiturage', params),
    () => api.get('/covoiturage', { params }),
    CACHE_TTL.short,
  ),
  mine: () => cachedGet(
    buildCacheKey('covoiturage.mine', '/covoiturage/mine'),
    () => api.get('/covoiturage/mine'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/covoiturage', data)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  book: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/covoiturage/${id}/book`, data)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  cancel: async (id: string | number) => {
    const res = await api.patch(`/covoiturage/${id}/cancel`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  review: async (id: string | number, data: object) => {
    const res = await api.post(`/covoiturage/${id}/reviews`, data)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
}

export const notificationsApi = {
  getNotifications: (limit = 20) => cachedGet(
    buildCacheKey('notifications.get', '/users/notifications', { limit }),
    () => api.get('/users/notifications', { params: { limit } }),
    CACHE_TTL.short,
  ),
  markAllRead: () => api.post('/users/notifications/read-all').finally(() => invalidateApiCache('notifications.')),
  markRead: (id: number) => api.post(`/users/notifications/${id}/read`).finally(() => invalidateApiCache('notifications.')),
}

export const subscriptionsApi = {
  getStatus: () => cachedGet(
    buildCacheKey('subscriptions.getStatus', '/subscriptions/status'),
    () => api.get('/subscriptions/status'),
    CACHE_TTL.short,
  ),
  getPlans: () => cachedGet(
    buildCacheKey('subscriptions.getPlans', '/subscriptions/plans'),
    () => api.get('/subscriptions/plans'),
    CACHE_TTL.medium,
  ),
}

export const alertsApi = {
  list: () => cachedGet(
    buildCacheKey('alerts.list', '/alerts'),
    () => api.get('/alerts'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/alerts', data)
    invalidateApiCache('alerts.')
    return res
  },
  update: async (id: number | string, data: object) => {
    const res = await api.patch(`/alerts/${id}`, data)
    invalidateApiCache('alerts.')
    return res
  },
  delete: async (id: number | string) => {
    const res = await api.delete(`/alerts/${id}`)
    invalidateApiCache('alerts.')
    return res
  },
}

export const covoitAlertsApi = {
  list: () => cachedGet(
    buildCacheKey('covoitAlerts.list', '/covoiturage/alerts'),
    () => api.get('/covoiturage/alerts'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/covoiturage/alerts', data)
    invalidateApiCache('covoitAlerts.')
    return res
  },
  update: async (id: number | string, data: object) => {
    const res = await api.patch(`/covoiturage/alerts/${id}`, data)
    invalidateApiCache('covoitAlerts.')
    return res
  },
  delete: async (id: number | string) => {
    const res = await api.delete(`/covoiturage/alerts/${id}`)
    invalidateApiCache('covoitAlerts.')
    return res
  },
}

// Users
export const usersApi = {
  getProfile: (id: string) => cachedGet(
    buildCacheKey('users.getProfile', `/users/${id}`),
    () => api.get(`/users/${id}`),
    CACHE_TTL.short,
  ),
  updateProfile: async (data: object) => {
    const res = await api.put('/users/me', data)
    invalidateApiCache('users.')
    invalidateApiCache('stats.')
    return res
  },
  getUserListings: (id: string, params: object = {}) => listingsApi.getUserListings(id, params),
  getReviews: (id: string) => cachedGet(
    buildCacheKey('users.getReviews', `/users/${id}/reviews`),
    () => api.get(`/users/${id}/reviews`),
    CACHE_TTL.short,
  ),
  addReview: async (id: string, data: object) => {
    const res = await api.post(`/users/${id}/reviews`, data)
    invalidateApiCache('users.')
    invalidateApiCache('stats.')
    return res
  },
}
