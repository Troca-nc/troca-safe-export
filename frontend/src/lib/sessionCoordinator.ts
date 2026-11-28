'use client'

import { normalizeApiBase } from '@/lib/apiBase'
import { clearStoredTokens, getStoredAccessToken, saveStoredTokens } from '@/lib/tokenStorage'

export type SessionStatus = 'bootstrapping' | 'recovering' | 'visitor' | 'authenticated'

export type SessionSnapshot = {
  status: SessionStatus
  accessToken: string | null
  retryAt: number | null
}

type SessionMessage =
  | { type: 'token-request'; source: string }
  | { type: 'token-response'; source: string; target: string; accessToken: string }
  | { type: 'token-update'; source: string; accessToken: string }
  | { type: 'session-ended'; source: string }

type RefreshFailure = Error & {
  status?: number
  code?: string
  retryAfterMs?: number
  terminal?: boolean
}

const API_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'https://kalico.nc/api')
const CHANNEL_NAME = 'kalico-auth-session-v1'
const LOCK_NAME = 'kalico-auth-refresh-v1'
const LEASE_KEY = 'kalico-auth-refresh-lease-v1'
const LEASE_MS = 20_000
const PEER_WAIT_MS = 120
const REFRESH_TIMEOUT_MS = 15_000
const MAX_RETRY_MS = 60_000
const TERMINAL_CODES = new Set([
  'REFRESH_MISSING',
  'REFRESH_INVALID',
  'REFRESH_EXPIRED',
  'REFRESH_REUSED',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
  'USER_NOT_FOUND',
])

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function readCsrfToken() {
  if (typeof document === 'undefined') return ''
  const prefix = 'kalico_csrf='
  const value = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  return value ? decodeURIComponent(value.slice(prefix.length)) : ''
}

function parseRetryAfter(value: string | null) {
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}

function asRefreshFailure(error: unknown): RefreshFailure {
  return error instanceof Error ? error as RefreshFailure : Object.assign(new Error('Session recovery failed'), { cause: error })
}

class SessionCoordinator {
  private readonly tabId = randomId()
  private readonly listeners = new Set<(snapshot: SessionSnapshot) => void>()
  private readonly peerWaiters = new Set<(token: string | null) => void>()
  private channel: BroadcastChannel | null = null
  private status: SessionStatus = 'bootstrapping'
  private retryAt: number | null = null
  private refreshPromise: Promise<string> | null = null
  private bootstrapPromise: Promise<SessionSnapshot> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryAttempt = 0

  constructor() {
    if (typeof window === 'undefined') return

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.addEventListener('message', (event: MessageEvent<SessionMessage>) => {
        this.onMessage(event.data)
      })
    } catch {
      this.channel = null
    }

    window.addEventListener('online', () => {
      if (this.status === 'recovering') void this.recoverAccessToken().catch(() => {})
    })
  }

  getSnapshot = (): SessionSnapshot => ({
    status: this.status,
    accessToken: getStoredAccessToken() || null,
    retryAt: this.retryAt,
  })

  subscribe = (listener: (snapshot: SessionSnapshot) => void) => {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  getAccessToken() {
    return getStoredAccessToken() || null
  }

  setAuthenticated(accessToken: string, broadcast = true) {
    saveStoredTokens(accessToken)
    this.status = 'authenticated'
    this.retryAttempt = 0
    this.retryAt = null
    this.clearRetryTimer()
    this.notify()
    if (broadcast) {
      this.post({ type: 'token-update', source: this.tabId, accessToken })
    }
  }

  setDemoAuthenticated() {
    clearStoredTokens()
    this.status = 'authenticated'
    this.retryAt = null
    this.clearRetryTimer()
    this.notify()
  }

  setVisitor(broadcast = false) {
    clearStoredTokens()
    this.status = 'visitor'
    this.retryAt = null
    this.retryAttempt = 0
    this.clearRetryTimer()
    this.notify()
    if (broadcast) this.post({ type: 'session-ended', source: this.tabId })
  }

  bootstrap() {
    if (this.bootstrapPromise) return this.bootstrapPromise
    this.status = 'bootstrapping'
    this.notify()
    this.bootstrapPromise = this.recoverAccessToken()
      .catch(() => null)
      .then(() => this.getSnapshot())
    return this.bootstrapPromise
  }

  recoverAccessToken() {
    if (this.refreshPromise) return this.refreshPromise
    this.refreshPromise = this.recoverAcrossTabs().finally(() => {
      this.refreshPromise = null
    })
    return this.refreshPromise
  }

  async logout() {
    const token = this.getAccessToken()
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const csrf = readCsrfToken()
    if (csrf) headers['x-csrf-token'] = csrf

    try {
      await fetch(`${API_URL}/auth/refresh/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
        keepalive: true,
      })
    } finally {
      this.setVisitor(true)
    }
  }

  private async recoverAcrossTabs() {
    const peerToken = await this.requestPeerToken()
    if (peerToken) {
      this.setAuthenticated(peerToken, false)
      return peerToken
    }

    const lockManager = typeof navigator !== 'undefined' ? navigator.locks : undefined
    if (lockManager) {
      return lockManager.request(LOCK_NAME, async () => {
        const tokenAfterLock = this.getAccessToken() || await this.requestPeerToken()
        if (tokenAfterLock) {
          this.setAuthenticated(tokenAfterLock, false)
          return tokenAfterLock
        }
        return this.performRefresh()
      })
    }

    return this.withLocalStorageLease()
  }

  private async withLocalStorageLease(): Promise<string> {
    if (typeof window === 'undefined') return this.performRefresh()
    const deadline = Date.now() + LEASE_MS * 2

    while (Date.now() < deadline) {
      const peerToken = this.getAccessToken() || await this.requestPeerToken()
      if (peerToken) {
        this.setAuthenticated(peerToken, false)
        return peerToken
      }

      const now = Date.now()
      let current: { owner?: string; expiresAt?: number } = {}
      try {
        current = JSON.parse(window.localStorage.getItem(LEASE_KEY) || '{}')
      } catch {
        current = {}
      }

      if (!current.expiresAt || current.expiresAt <= now || current.owner === this.tabId) {
        const lease = { owner: this.tabId, expiresAt: now + LEASE_MS }
        window.localStorage.setItem(LEASE_KEY, JSON.stringify(lease))
        const confirmed = window.localStorage.getItem(LEASE_KEY)
        if (confirmed === JSON.stringify(lease)) {
          try {
            return await this.performRefresh()
          } finally {
            if (window.localStorage.getItem(LEASE_KEY) === JSON.stringify(lease)) {
              window.localStorage.removeItem(LEASE_KEY)
            }
          }
        }
      }

      await sleep(100 + Math.floor(Math.random() * 100))
    }

    return this.performRefresh()
  }

  private async performRefresh() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: '{}',
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => ({})) as {
        code?: string
        data?: { access_token?: string }
      }
      const code = typeof payload.code === 'string' ? payload.code : ''

      if (!response.ok) {
        const failure = Object.assign(new Error(code || `Refresh failed with ${response.status}`), {
          status: response.status,
          code,
          retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) ?? undefined,
          terminal: response.status === 401 && TERMINAL_CODES.has(code),
        }) as RefreshFailure
        throw failure
      }

      const accessToken = payload.data?.access_token?.trim()
      if (!accessToken) {
        throw Object.assign(new Error('Refresh response has no access token'), { status: 503 })
      }

      this.setAuthenticated(accessToken)
      return accessToken
    } catch (error) {
      const failure = asRefreshFailure(error)
      if (failure.terminal) {
        this.setVisitor(true)
      } else {
        this.markRecovering(failure.retryAfterMs)
      }
      throw failure
    } finally {
      clearTimeout(timeout)
    }
  }

  private markRecovering(retryAfterMs?: number) {
    this.status = 'recovering'
    const exponential = Math.min(1_000 * 2 ** this.retryAttempt, MAX_RETRY_MS)
    const jitter = Math.floor(exponential * (0.2 + Math.random() * 0.3))
    const delay = Math.max(retryAfterMs ?? 0, exponential + jitter)
    this.retryAttempt += 1
    this.retryAt = Date.now() + delay
    this.notify()
    this.clearRetryTimer()
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.recoverAccessToken().catch(() => {})
    }, delay)
  }

  private clearRetryTimer() {
    if (!this.retryTimer) return
    clearTimeout(this.retryTimer)
    this.retryTimer = null
  }

  private requestPeerToken() {
    if (!this.channel) return Promise.resolve<string | null>(null)
    return new Promise<string | null>((resolve) => {
      let settled = false
      const finish = (token: string | null) => {
        if (settled) return
        settled = true
        this.peerWaiters.delete(finish)
        resolve(token)
      }
      this.peerWaiters.add(finish)
      this.post({ type: 'token-request', source: this.tabId })
      setTimeout(() => finish(null), PEER_WAIT_MS)
    })
  }

  private onMessage(message: SessionMessage) {
    if (!message || message.source === this.tabId) return

    if (message.type === 'token-request') {
      const accessToken = this.getAccessToken()
      if (accessToken && this.status === 'authenticated') {
        this.post({ type: 'token-response', source: this.tabId, target: message.source, accessToken })
      }
      return
    }

    if (message.type === 'token-response' && message.target === this.tabId) {
      for (const waiter of [...this.peerWaiters]) waiter(message.accessToken)
      return
    }

    if (message.type === 'token-update') {
      this.setAuthenticated(message.accessToken, false)
      for (const waiter of [...this.peerWaiters]) waiter(message.accessToken)
      return
    }

    if (message.type === 'session-ended') {
      this.setVisitor(false)
    }
  }

  private post(message: SessionMessage) {
    this.channel?.postMessage(message)
  }

  private notify() {
    const snapshot = this.getSnapshot()
    for (const listener of this.listeners) listener(snapshot)
  }
}

export const sessionCoordinator = new SessionCoordinator()
