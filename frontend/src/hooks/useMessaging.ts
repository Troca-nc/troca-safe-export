'use client'

// ============================================================
//  Troca — Hook messagerie (socket.io + API REST)
//  useConversations  — liste des conversations de l'utilisateur
//  useConversation   — messages d'une conversation + WS temps réel
// ============================================================

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { api, messagesApi } from '@/lib/api'
import { getMessagingSocket, messagingSocket, type SocketConnectionState } from '@/lib/socket'
import { isDemoMode, showDemoToast } from '@/lib/demoMode'
import type { Conversation, Message, OfferStatus } from '@/types/messaging.types'

function parseCurrentUserId() {
  if (typeof window === 'undefined') return null
  const token = window.localStorage.getItem('access_token')
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string | number }
    return payload.sub != null ? Number(payload.sub) : null
  } catch {
    return null
  }
}

function getErrorMessage(err: unknown, fallback: string) {
  if (isAxiosError(err)) {
    return (err.response?.data as { error?: string } | undefined)?.error ?? fallback
  }
  return fallback
}

// ————————————————————————————————————————————————————————————
//  Hook pro_activated (propagation web→mobile via WS)
// ————————————————————————————————————————————————————————————
// TODO: test E2E sur le flux pro_activated et la reprise de session.
export function useProActivatedListener() {
  useEffect(() => {
    const socket = getMessagingSocket()
    const handler = (notif: { type: string; plan?: string }) => {
      if (notif?.type === 'pro_activated') {
        api.get('/auth/me').then(({ data }) => {
          const detail = data?.data ?? data
          window.dispatchEvent(new CustomEvent('troca:pro_activated', { detail }))
        }).catch(() => {})
      }
    }

    socket.on('notification', handler)
    return () => {
      socket.off('notification', handler)
    }
  }, [])
}

// ————————————————————————————————————————————————————————————
//  useConversations
// ————————————————————————————————————————————————————————————

export function useConversations() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadTotal, setUnreadTotal] = useState(0)

  const fetchConvs = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await messagesApi.getConversations()
      const list: Conversation[] = data.data ?? []
      setConvs(list)
      setUnreadTotal(list.reduce((sum, c) => sum + (c.unread_count ?? 0), 0))
      setError(null)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Impossible de charger les conversations'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConvs()

    const socket = getMessagingSocket()
    const onNotif = (notif: { type: string }) => {
      if (notif.type === 'new_message' || notif.type === 'message_read') fetchConvs()
    }

    socket.on('notification', onNotif)
    return () => {
      socket.off('notification', onNotif)
    }
  }, [fetchConvs])

  return { convs, loading, error, unreadTotal, refetch: fetchConvs }
}

// ————————————————————————————————————————————————————————————
//  useConversation
// ————————————————————————————————————————————————————————————

export function useConversation(convId: number | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(
    messagingSocket.getSnapshot().state
  )
  const [reconnectInMs, setReconnectInMs] = useState<number | null>(
    messagingSocket.getSnapshot().reconnectInMs
  )
  const socketRef = useRef(messagingSocket)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentUserId = useRef<number | null>(null)
  const cursorRef = useRef<string | null>(null)
  const pageRef = useRef(1)

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!convId) return
      await api.post(`/messages/conversations/${convId}`, { content })
    },
    onMutate: async (content) => {
      if (!convId) return null
      const optimistic: Message = {
        id: Date.now(),
        conv_id: convId,
        sender_id: Number(currentUserId.current ?? 0),
        type: 'text',
        content,
        created_at: new Date().toISOString(),
        pending: true,
      }
      setMessages((prev) => [...prev, optimistic])
      return { optimistic }
    },
    onError: (_err, _content, context) => {
      if (!context?.optimistic) return
      setMessages((prev) =>
        prev.map((m) => m.id === context.optimistic.id ? { ...m, pending: false, failed: true } : m)
      )
    },
  })

  const sendPhotoMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!convId) return
      await api.post(`/messages/conversations/${convId}`, { type: 'photo', photo_url: url })
    },
    onMutate: async (url) => {
      if (!convId) return null
      const optimistic: Message = {
        id: Date.now(),
        conv_id: convId,
        sender_id: Number(currentUserId.current ?? 0),
        type: 'photo',
        content: null,
        photo_url: url,
        created_at: new Date().toISOString(),
        pending: true,
      }
      setMessages((prev) => [...prev, optimistic])
      return { optimistic }
    },
    onError: (_err, _url, context) => {
      if (!context?.optimistic) return
      setMessages((prev) =>
        prev.map((m) => m.id === context.optimistic.id ? { ...m, pending: false, failed: true } : m)
      )
    },
  })

  useEffect(() => {
    currentUserId.current = parseCurrentUserId()
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    return socket.subscribeStatus((snapshot) => {
      setConnectionState(snapshot.state)
      setReconnectInMs(snapshot.reconnectInMs)
    })
  }, [])

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
    } catch (err: unknown) {
      console.error('[useConversation] fetchMessages:', getErrorMessage(err, 'Impossible de charger les messages'))
    } finally {
      setLoading(false)
    }
  }, [convId])

  useEffect(() => {
    if (!convId) return

    cursorRef.current = null
    pageRef.current = 1
    setPage(1)
    fetchMessages({ reset: true })

    const socket = socketRef.current
    // TODO: test E2E sur la reconnexion WS, la file pending et le join/leave conversation.
    socket.emit('join_conversation', convId)
    void messagesApi.markConversationRead(convId)

    const onNewMessage = (msg: Message) => {
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.pending && m.content === msg.content))
        return [...filtered, msg]
      })
    }

    const onUserTyping = ({ userId, isTyping }: { userId: number; isTyping: boolean }) => {
      if (Number(userId) !== Number(currentUserId.current)) setTyping(isTyping)
    }

    const onMessagesRead = ({ byUserId }: { byUserId: number }) => {
      if (Number(byUserId) !== Number(currentUserId.current)) {
        setMessages(prev => prev.map((m) => (
          Number(m.sender_id) === Number(currentUserId.current)
            ? { ...m, read_at: m.read_at ?? new Date().toISOString() }
            : m
        )))
      }
    }

    socket.on('new_message', onNewMessage)
    socket.on('user_typing', onUserTyping)
    socket.on('message_read', onMessagesRead)
    socket.on('messages_read', onMessagesRead)

    void socket.connect()

    return () => {
      socket.emit('leave_conversation', convId)
      socket.off('new_message', onNewMessage)
      socket.off('user_typing', onUserTyping)
      socket.off('message_read', onMessagesRead)
      socket.off('messages_read', onMessagesRead)
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [convId, fetchMessages])

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!convId || !content.trim()) return
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return
    }
    await sendMessageMutation.mutateAsync(content)
  }, [convId, sendMessageMutation])

  const sendPhoto = useCallback(async (url: string): Promise<void> => {
    if (!convId) return
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return
    }
    await sendPhotoMutation.mutateAsync(url)
  }, [convId, sendPhotoMutation])

  const makeOffer = useCallback(async (amount_xpf: number): Promise<void> => {
    if (!convId) return

    const optimistic: Message = {
      id: Date.now(),
      conv_id: convId,
      sender_id: Number(currentUserId.current ?? 0),
      type: 'offer',
      content: null,
      created_at: new Date().toISOString(),
      pending: true,
      offer: {
        id: Date.now(),
        amount_xpf,
        status: 'pending' as OfferStatus,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

  const respondOffer = useCallback(async (
    offerId: number,
    response: 'accepted' | 'declined' | 'countered',
    counter?: number
  ): Promise<void> => {
    await api.post(`/messages/offers/${offerId}/respond`, { response, counter_amount: counter })
    cursorRef.current = null
    await fetchMessages({ reset: true })
  }, [fetchMessages])

  const onTyping = useCallback((isTyping = true) => {
    if (!convId) return
    socketRef.current.emit('typing', { convId, isTyping })
    if (isTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socketRef.current.emit('typing', { convId, isTyping: false })
      }, 3_000)
    }
  }, [convId])

  const loadMore = useCallback(async (): Promise<Message[]> => {
    if (!hasMore || loading) return []
    await fetchMessages({ reset: false })
    return []
  }, [hasMore, loading, fetchMessages])

  return useMemo(() => ({
    messages,
    loading,
    typing,
    connected: connectionState === 'connected',
    connectionState,
    reconnectInMs,
    hasMore,
    sendMessage,
    sendPhoto,
    makeOffer,
    respondOffer,
    onTyping,
    loadMore,
  }), [messages, loading, typing, connectionState, reconnectInMs, hasMore, sendMessage, sendPhoto, makeOffer, respondOffer, onTyping, loadMore])
}
