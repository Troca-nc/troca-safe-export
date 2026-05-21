'use client'

// ============================================================
//  Troca — Hook messagerie (socket.io + API REST)
//  useConversations  — liste des conversations de l'utilisateur
//  useConversation   — messages d'une conversation + WS temps réel
// ============================================================

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io, Socket }  from 'socket.io-client'
import { api, messagesApi }         from '@/lib/api'
import type { Conversation, Message, MessageType, OfferStatus } from '@/types/messaging.types'

// ── Singleton socket ─────────────────────────────────────────

let _socket: Socket | null = null

function getSocket(): Socket {
  if (_socket?.connected) return _socket

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null

  _socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001', {
    auth:       { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  _socket.on('connect_error', (err) => {
    console.warn('[WS] Connexion impossible:', err.message)
  })

  return _socket
}

// ── Hook pro_activated (propagation web→mobile via WS) ──────────
// À appeler une seule fois dans le layout root
export function useProActivatedListener() {
  useEffect(() => {
    const socket = getSocket()
    const handler = (notif: { type: string; plan?: string }) => {
      if (notif?.type === 'pro_activated') {
        // Rafraîchir le profil pour mettre is_pro à jour dans le store
        import('@/lib/api').then(({ api }) => {
          api.get('/auth/me').then(({ data }: any) => {
            // Le store authStore doit exposer une action setUser
            // On dispatch un custom event pour les composants qui écoutent
            window.dispatchEvent(new CustomEvent('troca:pro_activated', { detail: data.data }))
          }).catch(() => {})
        })
      }
    }
    socket.on('notification', handler)
    return () => { socket.off('notification', handler) }
  }, [])
}

// ── useConversations ─────────────────────────────────────────

export function useConversations() {
  const [convs, setConvs]       = useState<Conversation[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [unreadTotal, setUnreadTotal] = useState(0)

  const fetchConvs = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await messagesApi.getConversations()
      const list: Conversation[] = data.data ?? []
      setConvs(list)
      setUnreadTotal(list.reduce((sum, c) => sum + (c.unread_count ?? 0), 0))
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConvs()

    // Rafraîchir la liste quand un nouveau message arrive
    const socket = getSocket()
    const onNotif = (notif: { type: string }) => {
      if (notif.type === 'new_message') fetchConvs()
    }
    socket.on('notification', onNotif)
    return () => { socket.off('notification', onNotif) }
  }, [fetchConvs])

  return { convs, loading, error, unreadTotal, refetch: fetchConvs }
}

// ── useConversation ──────────────────────────────────────────

export function useConversation(convId: number | null) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [loading, setLoading]     = useState(false)
  const [typing, setTyping]       = useState(false)
  const [connected, setConnected] = useState(false)
  const [hasMore, setHasMore]     = useState(false)
  const [page, setPage]           = useState(1)
  const socketRef                 = useRef<Socket | null>(null)
  const typingTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentUserId             = useRef<number | null>(null)
  const cursorRef                 = useRef<string | null>(null)
  const pageRef                   = useRef(1)

  // Récupérer l'id courant depuis le token
  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      currentUserId.current = payload.sub != null ? Number(payload.sub) : null
    } catch { /* ignore */ }
  }, [])

  // ── Charger les messages (REST) ────────────────────────────
  const fetchMessages = useCallback(async ({ reset = false } = {}) => {
    if (!convId) return
    setLoading(true)
    try {
      const pageToLoad = reset ? 1 : pageRef.current + 1
      const before = reset ? null : cursorRef.current
      const { data } = await messagesApi.getMessages(convId, pageToLoad, 30, before)
      const msgs: Message[] = data.data?.messages ?? []
      setMessages(prev => reset ? msgs : [...msgs, ...prev])
      setHasMore(Boolean(data.pagination?.has_more ?? msgs.length === 30))
      setPage(pageToLoad)
      pageRef.current = pageToLoad
      cursorRef.current = data.pagination?.before ?? null
    } catch (err: any) {
      console.error('[useConversation] fetchMessages:', err?.response?.data?.error)
    } finally {
      setLoading(false)
    }
  }, [convId])

  // ── Socket.io ──────────────────────────────────────────────
  useEffect(() => {
    if (!convId) return

    cursorRef.current = null
    pageRef.current = 1
    setPage(1)
    fetchMessages({ reset: true })

    const socket = getSocket()
    socketRef.current = socket

    socket.emit('join_conversation', convId)

    const onConnect    = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    const onNewMessage = (msg: Message) => {
      setMessages(prev => {
        // Dédupliquer : supprimer l'optimistic si même contenu
        const filtered = prev.filter(m => !(m.pending && m.content === msg.content))
        return [...filtered, msg]
      })
    }

    const onUserTyping = ({ userId, isTyping }: { userId: number; isTyping: boolean }) => {
      if (Number(userId) !== Number(currentUserId.current)) setTyping(isTyping)
    }

    const onMessagesRead = ({ byUserId }: { byUserId: number }) => {
      if (Number(byUserId) !== Number(currentUserId.current)) {
        setMessages(prev => prev.map(m => ({ ...m, read_at: m.read_at ?? new Date().toISOString() })))
      }
    }

    socket.on('connect',      onConnect)
    socket.on('disconnect',   onDisconnect)
    socket.on('new_message',  onNewMessage)
    socket.on('user_typing',  onUserTyping)
    socket.on('messages_read', onMessagesRead)

    setConnected(socket.connected)

    // Marquer comme lu à l'ouverture
    socket.emit('mark_read', convId)

    return () => {
      socket.emit('leave_conversation', convId)
      socket.off('connect',       onConnect)
      socket.off('disconnect',    onDisconnect)
      socket.off('new_message',   onNewMessage)
      socket.off('user_typing',   onUserTyping)
      socket.off('messages_read', onMessagesRead)
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [convId, fetchMessages])

  // ── Envoyer un message texte ───────────────────────────────
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!convId || !content.trim()) return

    // Optimistic update
      const optimistic: Message = {
        id:         Date.now(),
        conv_id:    convId,
        sender_id:  Number(currentUserId.current ?? 0),
        type:       'text',
        content,
        created_at: new Date().toISOString(),
      pending:    true,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await api.post(`/messages/conversations/${convId}`, { content })
    } catch {
      // Marquer le message comme échoué
      setMessages(prev =>
        prev.map(m => m.id === optimistic.id ? { ...m, pending: false, failed: true } : m)
      )
    }
  }, [convId])

  // ── Envoyer une photo ──────────────────────────────────────
  const sendPhoto = useCallback(async (url: string): Promise<void> => {
    if (!convId) return
      const optimistic: Message = {
        id:        Date.now(),
        conv_id:   convId,
        sender_id: Number(currentUserId.current ?? 0),
        type:      'photo',
        content:   null,
        photo_url: url,
      created_at: new Date().toISOString(),
      pending:   true,
    }
    setMessages(prev => [...prev, optimistic])
    try {
      await api.post(`/messages/conversations/${convId}`, { type: 'photo', photo_url: url })
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === optimistic.id ? { ...m, failed: true, pending: false } : m)
      )
    }
  }, [convId])

  // ── Faire une offre de prix ────────────────────────────────
  const makeOffer = useCallback(async (amount_xpf: number): Promise<void> => {
    if (!convId) return
      const optimistic: Message = {
        id:        Date.now(),
        conv_id:   convId,
        sender_id: Number(currentUserId.current ?? 0),
        type:      'offer',
        content:   null,
      created_at: new Date().toISOString(),
      pending:   true,
      offer: {
        id:          Date.now(),
        amount_xpf,
        status:      'pending' as OfferStatus,
        expires_at:  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    }
    setMessages(prev => [...prev, optimistic])
    try {
      const { data } = await api.post('/messages/offers', {
        conv_id: convId,
        amount_xpf,
      })
      const created = data?.data?.message
      const offer = data?.data?.offer
      if (created) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? {
          ...created,
          offer: offer ? {
            id: offer.id,
            amount_xpf: offer.amount_xpf,
            status: offer.status,
            expires_at: offer.expires_at,
          } : undefined,
        } : m))
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === optimistic.id ? { ...m, failed: true, pending: false } : m)
      )
    }
  }, [convId])

  // ── Répondre à une offre ───────────────────────────────────
  const respondOffer = useCallback(async (
    offerId: number,
    response: 'accepted' | 'declined' | 'countered',
    counter?: number
  ): Promise<void> => {
    await api.post(`/messages/offers/${offerId}/respond`, { response, counter_amount: counter })
    // Rafraîchir les messages pour refléter le statut mis à jour
    cursorRef.current = null
    await fetchMessages({ reset: true })
  }, [fetchMessages])

  // ── Indicateur de frappe ───────────────────────────────────
  const onTyping = useCallback((isTyping = true) => {
    if (!convId || !socketRef.current) return
    socketRef.current.emit('typing', { convId, isTyping })
    if (isTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit('typing', { convId, isTyping: false })
      }, 3000)
    }
  }, [convId])

  // ── Charger plus de messages ───────────────────────────────
  const loadMore = useCallback(async (): Promise<Message[]> => {
    if (!hasMore || loading) return []
    await fetchMessages({ reset: false })
    return []
  }, [hasMore, loading, fetchMessages])

  return useMemo(() => ({
    messages,
    loading,
    typing,
    connected,
    hasMore,
    sendMessage,
    sendPhoto,
    makeOffer,
    respondOffer,
    onTyping,
    loadMore,
  }), [messages, loading, typing, connected, hasMore, sendMessage, sendPhoto, makeOffer, respondOffer, onTyping, loadMore])
}
