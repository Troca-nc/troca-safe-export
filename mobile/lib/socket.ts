// ============================================================
//  Kalico Mobile — Client WebSocket fiable (socket.io)
// ============================================================

import NetInfo from '@react-native-community/netinfo'
import { io, Socket } from 'socket.io-client'

import { tokenStorage } from '@/lib/tokenStorage'

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

const WS_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api')
  .replace('/api', '')

class ReliableMessagingSocket {
  private socket: Socket | null = null
  private readonly listeners = new Map<string, Set<SocketHandler>>()
  private readonly statusListeners = new Set<StatusListener>()
  private readonly pendingMessages: QueuedEmit[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDeadline: number | null = null
  private reconnectCountdown: ReturnType<typeof setInterval> | null = null
  private reconnectDelayMs = DEFAULT_BACKOFF_MS
  private manualDisconnect = false
  private networkOnline = true
  private status: SocketConnectionState = 'offline'
  private initialised = false

  constructor() {
    void this.bootstrapNetworkListeners()
  }

  private async bootstrapNetworkListeners() {
    if (this.initialised) return
    this.initialised = true

    const state = await NetInfo.fetch()
    this.networkOnline = Boolean(state.isConnected)
    if (this.networkOnline) {
      void this.connect()
    } else {
      this.setStatus('offline')
    }

    NetInfo.addEventListener((nextState) => {
      const online = Boolean(nextState.isConnected)
      this.networkOnline = online
      if (online) {
        void this.connect()
      } else {
        this.clearReconnectTimer()
        this.setStatus('offline')
      }
    })
  }

  private createSocket(token: string) {
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
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
    const token = await tokenStorage.getAccess()
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
    if (!this.networkOnline) {
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
    if (!this.networkOnline) {
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
    this.setStatus(this.networkOnline ? 'reconnecting' : 'offline')
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

const messagingSocket = new ReliableMessagingSocket()

export { messagingSocket }

export function getSocket(): Promise<ReliableMessagingSocket> {
  void messagingSocket.connect()
  return Promise.resolve(messagingSocket)
}

export function disconnectSocket() {
  messagingSocket.disconnect(true)
}
