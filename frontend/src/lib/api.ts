// src/lib/api.ts
// Client HTTP centralise avec cache GET leger et refresh token automatique

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios'

import { rememberRedirectAfterLogin } from '@/lib/authRedirect'
import { requestDraftSave } from '@/lib/draftEvents'
import { isDemoMode, showDemoToast } from '@/lib/demoMode'
import { clearStoredTokens, getStoredAccessToken, getStoredRefreshToken, saveStoredTokens } from '@/lib/tokenStorage'
import { normalizeApiBase } from '@/lib/apiBase'

const API_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
export const API_ORIGIN = API_URL.replace(/\/api$/, '')

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
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

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return ''

  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!cookie) return ''
  return decodeURIComponent(cookie.slice(prefix.length))
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

    const method = String(config.method || 'get').toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCookieValue('kalico_csrf')
      if (csrfToken) {
        const headers = config.headers as Record<string, string> & { set?: (key: string, value: string) => void }
        if (typeof headers.set === 'function') {
          headers.set('x-csrf-token', csrfToken)
        } else {
          headers['x-csrf-token'] = csrfToken
        }
      }
    }
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

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          refreshToken ? { refresh_token: refreshToken } : undefined,
          { withCredentials: true }
        )
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
export const saveTokens = (access: string, refresh?: string | null) => {
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
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (identifier: string, turnstileToken?: string) =>
    api.post('/auth/forgot-password', {
      identifier,
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
  updateStatus: async (id: string | number, data: { status: 'active' | 'reserved' | 'sold' }) => {
    const res = await api.patch(`/listings/${id}/status`, data)
    invalidateApiCache('listings.')
    invalidateApiCache('messages.')
    return res
  },
  delete: async (id: string, reason = 'other') => {
    const res = await api.delete(`/listings/${id}`, { data: { reason } })
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  report: (id: string | number, data: object = {}) => api.post(`/listings/${id}/signaler`, data),
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
  uploadProductImages: (files: File[], config?: Pick<AxiosRequestConfig, 'onUploadProgress'>) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api.post('/upload/product', form, {
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
  uploadChatDocument: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload/chat/document', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadChatAudio: (audioBase64: string, mimeType: string) =>
    api.post('/upload/chat/audio', {
      audio_base64: audioBase64,
      mime_type: mimeType,
    }),
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
  makeOffer: (convId: string | number, amount_xpf: number) =>
    api.post('/messages/offers', { conv_id: Number(convId), amount_xpf }),
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
  sendDocument: (convId: string, attachment_url: string, attachment_name: string, attachment_mime_type: string, attachment_size_bytes?: number | null) => {
    if (isDemoMode()) {
      showDemoToast('DÃ©sactivÃ© en mode dÃ©mo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-doc-${Date.now()}`,
          conv_id: convId,
          type: 'document',
          attachment_url,
          attachment_name,
          attachment_mime_type,
          attachment_size_bytes: attachment_size_bytes ?? null,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, {
      type: 'document',
      attachment_url,
      attachment_name,
      attachment_mime_type,
      attachment_size_bytes,
    })
  },
  sendAudio: (convId: string, audio_url: string) => {
    if (isDemoMode()) {
      showDemoToast('DÃ©sactivÃ© en mode dÃ©mo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-audio-${Date.now()}`,
          conv_id: convId,
          type: 'audio',
          photo_url: audio_url,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, { type: 'audio', audio_url })
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
  getZones: (communeSlug: string) => cachedGet(
    buildCacheKey('meta.getZones', `/communes/${communeSlug}/zones`),
    () => api.get(`/communes/${communeSlug}/zones`),
    CACHE_TTL.static,
  ),
  getCategories: () => cachedGet(
    buildCacheKey('meta.getCategories', '/categories'),
    () => api.get('/categories'),
    CACHE_TTL.static,
  ),
}

export const searchApi = {
  suggestions: (params: { q?: string; limit?: number } = {}) => cachedGet(
    buildCacheKey('search.suggestions', '/search/suggestions', params),
    () => api.get('/search/suggestions', { params }),
    CACHE_TTL.short,
  ),
}

export const statsApi = {
  getHome: () => cachedGet(
    buildCacheKey('stats.getHome', '/stats/home'),
    () => api.get('/stats/home'),
    CACHE_TTL.long,
  ),
  getPlatform: () => cachedGet(
    buildCacheKey('stats.getPlatform', '/stats/platform'),
    () => api.get('/stats/platform'),
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

export const eventsApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('events.list', '/events', params),
    () => api.get('/events', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('events.getById', `/events/${id}`),
    () => api.get(`/events/${id}`),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/events', data)
    invalidateApiCache('events.')
    invalidateApiCache('bonPlans.')
    invalidateApiCache('stats.')
    return res
  },
  reserveTickets: async (id: string | number, data: object) => {
    const res = await api.post(`/events/${id}/reservations`, data)
    invalidateApiCache('events.')
    return res
  },
  getTicket: (token: string) => cachedGet(
    buildCacheKey('events.ticket', `/events/tickets/${token}`),
    () => api.get(`/events/tickets/${token}`),
    CACHE_TTL.short,
  ),
  scanTicket: async (token: string, data: object = {}) => {
    const res = await api.post(`/events/tickets/${token}/scan`, data)
    invalidateApiCache('events.ticket.')
    return res
  },
}

export const proApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('pro.list', '/pros', params),
    () => api.get('/pros', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('pro.getById', `/pros/${id}`),
    () => api.get(`/pros/${id}`),
    CACHE_TTL.short,
  ),
  requestQuote: async (id: string | number, data: object) => {
    const res = await api.post(`/pro/${id}/quote`, data)
    invalidateApiCache('pro.')
    invalidateApiCache('pro.quoteRequests.')
    return res
  },
  getQuoteRequestsReceived: (params: object = {}) => cachedGet(
    buildCacheKey('pro.quoteRequests.received', '/pro/quote-requests', params),
    () => api.get('/pro/quote-requests', { params }),
    CACHE_TTL.short,
  ),
  getQuoteRequestById: (id: string | number) => cachedGet(
    buildCacheKey('pro.quoteRequests.getById', `/pro/quote-requests/${id}`),
    () => api.get(`/pro/quote-requests/${id}`),
    CACHE_TTL.short,
  ),
  downloadQuoteRequestPdf: (id: string | number) => api.get(`/pro/quote-requests/${id}/pdf`, { responseType: 'blob' }),
  getQuoteRequestsMine: (params: object = {}) => cachedGet(
    buildCacheKey('pro.quoteRequests.mine', '/pro/quote-requests/mine', params),
    () => api.get('/pro/quote-requests/mine', { params }),
    CACHE_TTL.short,
  ),
  getReviews: (id: string | number, params: object = {}) => cachedGet(
    buildCacheKey('pro.getReviews', `/pros/${id}/reviews`, params),
    () => api.get(`/pros/${id}/reviews`, { params }),
    CACHE_TTL.short,
  ),
  apply: async (data: object) => {
    const res = await api.post('/pros/apply', data)
    invalidateApiCache('pro.')
    return res
  },
  addReview: async (id: string | number, data: object) => {
    const res = await api.post(`/pros/${id}/reviews`, data)
    invalidateApiCache('pro.')
    return res
  },
  getDashboard: () => cachedGet(
    buildCacheKey('pro.dashboard', '/pro/dashboard'),
    () => api.get('/pro/dashboard'),
    CACHE_TTL.short,
  ),
  getReferral: () => cachedGet(
    buildCacheKey('pro.referral', '/pro/referral'),
    () => api.get('/pro/referral'),
    CACHE_TTL.short,
  ),
  getListings: () => cachedGet(
    buildCacheKey('pro.listings', '/pro/listings'),
    () => api.get('/pro/listings'),
    CACHE_TTL.short,
  ),
  getProducts: () => cachedGet(
    buildCacheKey('pro.products', '/pro/products'),
    () => api.get('/pro/products'),
    CACHE_TTL.short,
  ),
  getCatalogCategories: () => cachedGet(
    buildCacheKey('pro.catalogCategories', '/pro/products/categories'),
    () => api.get('/pro/products/categories'),
    CACHE_TTL.short,
  ),
  createCatalogCategory: async (data: object) => {
    const res = await api.post('/pro/products/categories', data)
    invalidateApiCache('pro.')
    return res
  },
  updateCatalogCategory: async (id: string | number, data: object) => {
    const res = await api.put(`/pro/products/categories/${id}`, data)
    invalidateApiCache('pro.')
    return res
  },
  deleteCatalogCategory: async (id: string | number) => {
    const res = await api.delete(`/pro/products/categories/${id}`)
    invalidateApiCache('pro.')
    return res
  },
  createProduct: async (data: object) => {
    const res = await api.post('/pro/products', data)
    invalidateApiCache('pro.')
    return res
  },
  updateProduct: async (id: string | number, data: object) => {
    const res = await api.put(`/pro/products/${id}`, data)
    invalidateApiCache('pro.')
    return res
  },
  archiveProduct: async (id: string | number) => {
    const res = await api.patch(`/pro/products/${id}/archive`)
    invalidateApiCache('pro.')
    return res
  },
  publishProduct: async (id: string | number) => {
    const res = await api.post(`/pro/products/${id}/publish`)
    invalidateApiCache('pro.')
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  renewListing: async (id: string | number) => {
    const res = await api.post(`/pro/listings/${id}/renew`)
    invalidateApiCache('pro.')
    return res
  },
  getBoosts: () => cachedGet(
    buildCacheKey('pro.boosts', '/pro/boosts'),
    () => api.get('/pro/boosts'),
    CACHE_TTL.short,
  ),
  getInvoices: () => cachedGet(
    buildCacheKey('pro.invoices', '/pro/invoices'),
    () => api.get('/pro/invoices'),
    CACHE_TTL.short,
  ),
  updateProfile: async (data: object) => {
    const res = await api.patch('/pro/me', data)
    invalidateApiCache('pro.')
    return res
  },
  downloadInvoicePdf: (id: string | number) => api.get(`/pro/invoices/${id}/pdf`, { responseType: 'blob' }),
  getAutoReply: () => cachedGet(
    buildCacheKey('pro.autoReply.get', '/pro/auto-reply'),
    () => api.get('/pro/auto-reply'),
    CACHE_TTL.short,
  ),
  updateAutoReply: async (data: object) => {
    const res = await api.put('/pro/auto-reply', data)
    invalidateApiCache('pro.')
    return res
  },
}

export const importApi = {
  fields: () => cachedGet(
    buildCacheKey('import.fields', '/import/fields'),
    () => api.get('/import/fields'),
    CACHE_TTL.static,
  ),
  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/import/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    invalidateApiCache('import.')
    return res
  },
  saveMapping: async (jobId: string | number, mapping: Record<string, string>) => {
    const res = await api.post(`/import/${jobId}/mapping`, { mapping })
    invalidateApiCache('import.')
    invalidateApiCache('pro.')
    return res
  },
  status: (jobId: string | number) => api.get(`/import/${jobId}/status`),
  report: (jobId: string | number) => api.get(`/import/${jobId}/report`),
  history: () => cachedGet(
    buildCacheKey('import.history', '/import/history'),
    () => api.get('/import/history'),
    CACHE_TTL.short,
  ),
}

export const paymentApi = {
  getSavedCards: () => cachedGet(
    buildCacheKey('payment.savedCards', '/payment/saved-cards'),
    () => api.get('/payment/saved-cards'),
    CACHE_TTL.short,
  ),
  boostOneClick: async (data: object) => {
    const res = await api.post('/payment/boost-one-click', data)
    invalidateApiCache('payment.')
    invalidateApiCache('pro.')
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
}

export const proDocumentsApi = {
  list: () => cachedGet(
    buildCacheKey('proDocuments.list', '/pro/documents'),
    () => api.get('/pro/documents'),
    CACHE_TTL.short,
  ),
  upload: async (data: { file: File; document_type: string; label?: string }) => {
    const form = new FormData()
    form.append('file', data.file)
    form.append('document_type', data.document_type)
    if (data.label) {
      form.append('label', data.label)
    }
    const res = await api.post('/pro/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    invalidateApiCache('proDocuments.')
    invalidateApiCache('pro.')
    return res
  },
  delete: async (id: string | number) => {
    const res = await api.delete(`/pro/documents/${id}`)
    invalidateApiCache('proDocuments.')
    invalidateApiCache('pro.')
    return res
  },
}

export const fretApi = {
  estimate: (params: object = {}) => cachedGet(
    buildCacheKey('fret.estimate', '/fret/estimate', params),
    () => api.get('/fret/estimate', { params }),
    CACHE_TTL.short,
  ),
  createRequest: async (data: object) => {
    const res = await api.post('/fret/requests', data)
    invalidateApiCache('fret.')
    return res
  },
  getMine: () => cachedGet(
    buildCacheKey('fret.mine', '/fret/requests/mine'),
    () => api.get('/fret/requests/mine'),
    CACHE_TTL.short,
  ),
}

export const adminApi = {
  listProDocuments: () => cachedGet(
    buildCacheKey('admin.proDocuments.list', '/admin/pro-documents'),
    () => api.get('/admin/pro-documents'),
    CACHE_TTL.short,
  ),
  validateProDocument: async (id: string | number, data: { status: 'validated' | 'rejected'; rejection_reason?: string }) => {
    const res = await api.post(`/admin/pro-documents/${id}/validate`, data)
    invalidateApiCache('admin.proDocuments.')
    invalidateApiCache('proDocuments.')
    invalidateApiCache('pro.')
    return res
  },
}

export const proLaunchPackApi = {
  get: () => cachedGet(
    buildCacheKey('proLaunchPack.get', '/pro/launch-pack'),
    () => api.get('/pro/launch-pack'),
    CACHE_TTL.short,
  ),
  scheduleCall: async (data: object) => {
    const res = await api.post('/pro/launch-pack/schedule-call', data)
    invalidateApiCache('proLaunchPack.')
    invalidateApiCache('pro.')
    return res
  },
  completeStep: async (data: { step_key: string }) => {
    const res = await api.post('/pro/onboarding/complete-step', data)
    invalidateApiCache('proLaunchPack.')
    invalidateApiCache('pro.')
    return res
  },
}

export const proQuotesApi = {
  create: async (data: object) => {
    const res = await api.post('/pro-quotes', data)
    invalidateApiCache('proQuotes.')
    return res
  },
  list: (params: object = {}) => cachedGet(
    buildCacheKey('proQuotes.list', '/pro-quotes', params),
    () => api.get('/pro-quotes', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number, token?: string) => cachedGet(
    buildCacheKey('proQuotes.getById', `/pro-quotes/${id}`, { token: token || '' }),
    () => api.get(`/pro-quotes/${id}`, { params: token ? { token } : {} }),
    CACHE_TTL.short,
  ),
  update: async (id: string | number, data: object) => {
    const res = await api.put(`/pro-quotes/${id}`, data)
    invalidateApiCache('proQuotes.')
    return res
  },
  send: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/send`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    return res
  },
  accept: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/accept`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  refuse: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/refuse`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  convert: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/convert`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    return res
  },
  downloadPdf: (id: string | number, token?: string) => api.get(`/pro-quotes/${id}/pdf`, {
    responseType: 'blob',
    params: token ? { token } : {},
  }),
}

export const proBookingsApi = {
  getSlots: (proId: string | number) => cachedGet(
    buildCacheKey('proBookings.getSlots', `/pro/${proId}/booking-slots`),
    () => api.get(`/pro/${proId}/booking-slots`),
    CACHE_TTL.short,
  ),
  getCalendar: (proId: string | number, month?: string) => cachedGet(
    buildCacheKey('proBookings.getCalendar', `/pro/${proId}/booking-calendar`, { month: month || '' }),
    () => api.get(`/pro/${proId}/booking-calendar`, { params: month ? { month } : {} }),
    CACHE_TTL.short,
  ),
  book: async (proId: string | number, data: object) => {
    const res = await api.post(`/pro/${proId}/bookings`, data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  getMine: () => cachedGet(
    buildCacheKey('proBookings.mine', '/pro/bookings/mine'),
    () => api.get('/pro/bookings/mine'),
    CACHE_TTL.short,
  ),
  getById: (bookingId: string | number, token?: string) => cachedGet(
    buildCacheKey('proBookings.byId', `/pro/bookings/${bookingId}`, token ? { token } : {}),
    () => api.get(`/pro/bookings/${bookingId}`, { params: token ? { token } : {} }),
    CACHE_TTL.short,
  ),
  getDashboard: () => cachedGet(
    buildCacheKey('proBookings.dashboard', '/pro/dashboard/bookings'),
    () => api.get('/pro/dashboard/bookings'),
    CACHE_TTL.short,
  ),
  getSettings: () => cachedGet(
    buildCacheKey('proBookings.settings', '/pro/dashboard/booking-settings'),
    () => api.get('/pro/dashboard/booking-settings'),
    CACHE_TTL.short,
  ),
  updateSettings: async (data: object) => {
    const res = await api.put('/pro/dashboard/booking-settings', data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  createSlot: async (data: object) => {
    const res = await api.post('/pro/dashboard/booking-slots', data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  deleteSlot: async (slotId: string | number) => {
    const res = await api.delete(`/pro/dashboard/booking-slots/${slotId}`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  getExceptions: () => cachedGet(
    buildCacheKey('proBookings.exceptions', '/pro/dashboard/booking-exceptions'),
    () => api.get('/pro/dashboard/booking-exceptions'),
    CACHE_TTL.short,
  ),
  createException: async (data: object) => {
    const res = await api.post('/pro/dashboard/booking-exceptions', data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  deleteException: async (exceptionId: string | number) => {
    const res = await api.delete(`/pro/dashboard/booking-exceptions/${exceptionId}`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  confirm: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/confirm`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  decline: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/decline`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  cancel: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/cancel`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  complete: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/complete`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
}

export const reviewsApi = {
  getByPro: (proId: string | number, params: object = {}) => cachedGet(
    buildCacheKey('reviews.getByPro', `/reviews/pro/${proId}`, params),
    () => api.get(`/reviews/pro/${proId}`, { params }),
    CACHE_TTL.short,
  ),
  getInvite: (token: string) => cachedGet(
    buildCacheKey('reviews.getInvite', `/reviews/invite/${token}`),
    () => api.get(`/reviews/invite/${token}`),
    CACHE_TTL.short,
  ),
  createInvite: (data: object) => api.post('/reviews/invite', data),
  createReview: (data: object) => api.post('/reviews', data),
  reply: (reviewId: string | number, data: object) => api.post(`/reviews/${reviewId}/reply`, data),
  helpful: (reviewId: string | number, data: object = {}) => api.post(`/reviews/${reviewId}/helpful`, data),
  report: (reviewId: string | number, data: object = {}) => api.post(`/reviews/${reviewId}/report`, data),
}

export const newsletterApi = {
  getSubscription: () => cachedGet(
    buildCacheKey('newsletter.subscription.get', '/newsletter/subscription'),
    () => api.get('/newsletter/subscription'),
    CACHE_TTL.short,
  ),
  subscribe: async (data: object) => {
    const res = await api.post('/newsletter/subscribe', data)
    invalidateApiCache('newsletter.')
    return res
  },
  unsubscribe: async (data: object = {}) => {
    const res = await api.delete('/newsletter/unsubscribe', { data })
    invalidateApiCache('newsletter.')
    return res
  },
  preview: (userId: string | number) => cachedGet(
    buildCacheKey('newsletter.preview', `/newsletter/preview/${userId}`),
    () => api.get(`/newsletter/preview/${userId}`),
    CACHE_TTL.short,
  ),
  send: async (data: object = {}) => {
    const res = await api.post('/newsletter/send', data)
    invalidateApiCache('newsletter.')
    return res
  },
}

export const contactApi = {
  send: (data: object) => api.post('/contact', data),
}

export const rgpdApi = {
  exportData: () => api.get('/rgpd/exporter-donnees', { responseType: 'blob' }),
  deleteAccount: (data: { confirmation: string; password?: string }) => api.post('/rgpd/supprimer-compte', data),
  getLogs: () => cachedGet(
    buildCacheKey('rgpd.logs', '/rgpd/mes-logs'),
    () => api.get('/rgpd/mes-logs'),
    CACHE_TTL.short,
  ),
  setConsent: (data: { analytics?: boolean; marketing?: boolean }) => api.post('/rgpd/consentement', data),
}

export const proTransportApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('proTransport.list', '/pro-transport', params),
    () => api.get('/pro-transport', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('proTransport.getById', `/pro-transport/${id}`),
    () => api.get(`/pro-transport/${id}`),
    CACHE_TTL.short,
  ),
  getAvailability: (id: string | number, params: object = {}) => cachedGet(
    buildCacheKey('proTransport.getAvailability', `/pro-transport/${id}/availability`, params),
    () => api.get(`/pro-transport/${id}/availability`, { params }),
    CACHE_TTL.short,
  ),
  quote: (id: string | number, data: object) => api.post(`/pro-transport/${id}/quote`, data),
  apply: async (data: object) => {
    const res = await api.post('/pro-transport/apply', data)
    invalidateApiCache('proTransport.')
    return res
  },
  createRide: async (data: object) => {
    const res = await api.post('/pro-transport/rides', data)
    invalidateApiCache('proTransport.')
    return res
  },
  confirmRide: async (id: string | number) => {
    const res = await api.post(`/pro-transport/rides/${id}/confirm`)
    invalidateApiCache('proTransport.')
    return res
  },
  completeRide: async (id: string | number) => {
    const res = await api.post(`/pro-transport/rides/${id}/complete`)
    invalidateApiCache('proTransport.')
    return res
  },
  reviewRide: async (id: string | number, data: object) => {
    const res = await api.post(`/pro-transport/rides/${id}/review`, data)
    invalidateApiCache('proTransport.')
    return res
  },
  getMyRides: () => cachedGet(
    buildCacheKey('proTransport.myRides', '/pro-transport/rides/mine'),
    () => api.get('/pro-transport/rides/mine'),
    CACHE_TTL.short,
  ),
  getDashboard: () => cachedGet(
    buildCacheKey('proTransport.dashboard', '/pro-transport/dashboard'),
    () => api.get('/pro-transport/dashboard'),
    CACHE_TTL.short,
  ),
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
  getDriverProfile: (id: string | number) => cachedGet(
    buildCacheKey('covoiturage.driverProfile', `/covoiturage/drivers/${id}/profile`),
    () => api.get(`/covoiturage/drivers/${id}/profile`),
    CACHE_TTL.short,
  ),
  mine: () => cachedGet(
    buildCacheKey('covoiturage.mine', '/covoiturage/mine'),
    () => api.get('/covoiturage/mine'),
    CACHE_TTL.short,
  ),
  myReservations: () => cachedGet(
    buildCacheKey('covoiturage.myReservations', '/covoiturage/reservations/mine'),
    () => api.get('/covoiturage/reservations/mine'),
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
  acceptBooking: async (bookingId: string | number) => {
    const res = await api.post(`/covoiturage/bookings/${bookingId}/accept`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  refuseBooking: async (bookingId: string | number) => {
    const res = await api.post(`/covoiturage/bookings/${bookingId}/refuse`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  cancelBooking: async (bookingId: string | number) => {
    const res = await api.post(`/covoiturage/bookings/${bookingId}/cancel`)
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
  getPreferences: () => cachedGet(
    buildCacheKey('notifications.preferences.get', '/users/notifications/preferences'),
    () => api.get('/users/notifications/preferences'),
    CACHE_TTL.short,
  ),
  savePreferences: (data: object) => api.put('/users/notifications/preferences', data).finally(() => invalidateApiCache('notifications.preferences.')),
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
    buildCacheKey('users.getProfile', `/users/${id}/profile`),
    () => api.get(`/users/${id}/profile`),
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
