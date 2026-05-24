import { io, Socket } from 'socket.io-client'
import { getStoredAccessToken } from './tokenStorage'

export type SocketConnectionState = 'connected' | 'reconnecting' | 'offline'

export interface SocketStatusSnapshot {
  state: SocketConnectionState
  reconnectInMs: number | null
  queuedCount: number
}

type SocketHandler = Parameters<Socket['on']>[1]
type StatusListener = (snapshot: SocketStatusSnapshot) => void

interface QueuedEmit {
  event: string
  args: unknown[]
}

const DEFAULT_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000

function normalizeApiBase(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!trimmed) return 'http://localhost:3001'
  return trimmed.endsWith('/api') ? trimmed.replace(/\/api$/, '') : trimmed
}

class ReliableMessagingSocket {
  private readonly url: string
  private readonly tokenProvider: () => string | null | Promise<string | null>
  private socket: Socket | null = null
  private readonly listeners = new Map<string, Set<SocketHandler>>()
  private readonly statusListeners = new Set<StatusListener>()
  private readonly pendingMessages: QueuedEmit[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDeadline: number | null = null
  private reconnectDelayMs = DEFAULT_BACKOFF_MS
  private reconnectCountdown: ReturnType<typeof setInterval> | null = null
  private manualDisconnect = false
  private browserOnline = true
  private status: SocketConnectionState = 'offline'

  constructor(url: string, tokenProvider: () => string | null | Promise<string | null>) {
    this.url = normalizeApiBase(url)
    this.tokenProvider = tokenProvider

    if (typeof window !== 'undefined') {
      this.browserOnline = window.navigator.onLine
      window.addEventListener('online', this.handleBrowserOnline)
      window.addEventListener('offline', this.handleBrowserOffline)
    }
  }

  private handleBrowserOnline = () => {
    this.browserOnline = true
    void this.connect()
  }

  private handleBrowserOffline = () => {
    this.browserOnline = false
    this.clearReconnectTimer()
    this.setStatus('offline')
  }

  private createSocket(token: string) {
    const socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: false,
    })

    socket.on('connect', this.handleConnect)
    socket.on('disconnect', this.handleDisconnect)
    socket.on('connect_error', this.handleConnectError)
    return socket
  }

  private ensureSocket(token: string) {
    if (!this.socket) {
      this.socket = this.createSocket(token)
      this.bindStoredListeners()
      return
    }

    this.socket.auth = { token }
  }

  private bindStoredListeners() {
    if (!this.socket) return
    for (const [event, handlers] of this.listeners.entries()) {
      for (const handler of handlers) {
        this.socket.on(event, handler)
      }
    }
  }

  private handleConnect = () => {
    this.manualDisconnect = false
    this.reconnectDelayMs = DEFAULT_BACKOFF_MS
    this.clearReconnectTimer()
    this.setStatus('connected')
    this.flushQueue()
  }

  private handleDisconnect = (reason: string) => {
    if (this.manualDisconnect) return
    if (reason === 'io client disconnect') return
    void this.scheduleReconnect()
  }

  private handleConnectError = () => {
    if (this.manualDisconnect) return
    void this.scheduleReconnect()
  }

  private async resolveToken() {
    const token = await this.tokenProvider()
    return token?.trim() || null
  }

  private setStatus(state: SocketConnectionState) {
    this.status = state
    this.notifyStatus()
  }

  private notifyStatus() {
    const snapshot = this.getSnapshot()
    for (const listener of this.statusListeners) {
      listener(snapshot)
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.reconnectCountdown) {
      clearInterval(this.reconnectCountdown)
      this.reconnectCountdown = null
    }
    this.reconnectDeadline = null
  }

  private startCountdownTicker() {
    if (this.reconnectCountdown) return
    this.reconnectCountdown = setInterval(() => {
      this.notifyStatus()
    }, 1_000)
  }

  private async scheduleReconnect() {
    if (!this.browserOnline) {
      this.setStatus('offline')
      return
    }

    if (this.reconnectTimer) return

    this.setStatus('reconnecting')
    this.reconnectDeadline = Date.now() + this.reconnectDelayMs
    this.startCountdownTicker()

    const delay = this.reconnectDelayMs
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDeadline = null
      this.clearReconnectTimer()
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_BACKOFF_MS)
      void this.connect()
    }, delay)
  }

  private flushQueue() {
    if (!this.socket?.connected || !this.pendingMessages.length) return

    const queued = [...this.pendingMessages]
    this.pendingMessages.length = 0

    for (const item of queued) {
      this.socket.emit(item.event, ...item.args)
    }
  }

  async connect() {
    if (this.manualDisconnect) return
    if (!this.browserOnline) {
      this.setStatus('offline')
      return
    }

    const token = await this.resolveToken()
    if (!token) {
      this.setStatus('offline')
      return
    }

    this.ensureSocket(token)

    if (!this.socket) {
      this.setStatus('offline')
      return
    }

    if (this.socket.connected) {
      this.setStatus('connected')
      this.flushQueue()
      return
    }

    this.socket.connect()
  }

  emit(event: string, ...args: unknown[]) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args)
      return
    }

    this.pendingMessages.push({ event, args })
    this.setStatus(this.browserOnline ? 'reconnecting' : 'offline')
    void this.connect()
    this.notifyStatus()
  }

  on(event: string, handler: SocketHandler) {
    const handlers = this.listeners.get(event) ?? new Set<SocketHandler>()
    handlers.add(handler)
    this.listeners.set(event, handlers)
    this.socket?.on(event, handler)
    return this
  }

  off(event: string, handler: SocketHandler) {
    const handlers = this.listeners.get(event)
    handlers?.delete(handler)
    if (handlers && handlers.size === 0) {
      this.listeners.delete(event)
    }
    this.socket?.off(event, handler)
    return this
  }

  subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  disconnect(clearQueue = false) {
    this.manualDisconnect = true
    this.clearReconnectTimer()
    if (clearQueue) {
      this.pendingMessages.length = 0
    }
    this.socket?.disconnect()
    this.setStatus('offline')
  }

  getSnapshot(): SocketStatusSnapshot {
    return {
      state: this.status,
      reconnectInMs: this.reconnectDeadline ? Math.max(0, this.reconnectDeadline - Date.now()) : null,
      queuedCount: this.pendingMessages.length,
    }
  }
}

const API_ORIGIN = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')

const accessTokenProvider = () => {
  if (typeof window === 'undefined') return null
  return getStoredAccessToken()
}

export const messagingSocket = new ReliableMessagingSocket(API_ORIGIN, accessTokenProvider)

export function getMessagingSocket() {
  void messagingSocket.connect()
  return messagingSocket
}
