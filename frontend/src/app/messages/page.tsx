'use client'
// src/app/messages/page.tsx

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import Header from '@/components/layout/Header'
import { messagesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

const formatMsgTime = (date: string) => {
  const d = new Date(date)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Hier'
  return format(d, 'dd/MM/yy')
}

function MessagesPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()

  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv,    setActiveConv]    = useState<string>(searchParams.get('conv') || '')
  const [messages,      setMessages]      = useState<any[]>([])
  const [content,       setContent]       = useState('')
  const [sending,       setSending]       = useState(false)
  const [convData,      setConvData]      = useState<any>(null)
  const [loading,       setLoading]       = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/connexion'); return }
    loadConversations()
  }, [isAuthenticated])

  useEffect(() => {
    if (activeConv) loadMessages(activeConv)
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const { data } = await messagesApi.getConversations()
      setConversations(data.data)
      // Auto-sélectionner la première si aucune active
      if (!activeConv && data.data[0]) setActiveConv(data.data[0].id)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    try {
      const { data } = await messagesApi.getMessages(convId)
      setMessages(data.data.messages)
      setConvData(data.data.conversation)
      // Marquer les non-lus comme lus localement
      setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c))
    } catch {}
  }

  const sendMessage = async () => {
    if (!content.trim() || !activeConv || sending) return
    const text = content.trim()
    setContent('')
    setSending(true)
    try {
      const { data } = await messagesApi.sendMessage(activeConv, text)
      setMessages((prev) => [...prev, { ...data.data, first_name: user?.first_name, last_name: user?.last_name }])
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const activeConvData = conversations.find((c) => c.id === activeConv)
  const totalUnread    = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 py-4 gap-4" style={{ height: 'calc(100vh - 72px)' }}>

        {/* ── Liste conversations ──────────────────── */}
        <div className={`w-full md:w-80 shrink-0 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="card flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-night/8">
              <h1 className="font-display font-bold text-lg text-night flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-coral" />
                Messages
                {totalUnread > 0 && (
                  <span className="badge bg-coral text-white">{totalUnread}</span>
                )}
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3.5 w-3/4" />
                        <div className="skeleton h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-night/40">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv.id)}
                    className={`w-full text-left p-4 flex gap-3 hover:bg-sand transition-colors border-b border-night/5 ${activeConv === conv.id ? 'bg-sand' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-coral/15 flex items-center justify-center text-coral font-bold text-sm shrink-0">
                      {conv.other_avatar
                        ? <img src={conv.other_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        : `${conv.other_first_name?.[0]}${conv.other_last_name?.[0]}`
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-night truncate">
                          {conv.other_first_name} {conv.other_last_name}
                        </p>
                        <span className="text-xs text-night/35 shrink-0">
                          {conv.last_message_at ? formatMsgTime(conv.last_message_at) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-night/50 truncate">{conv.listing_title}</p>
                      <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'font-semibold text-night' : 'text-night/40'}`}>
                        {conv.last_message || 'Démarrez la conversation'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Fenêtre de conversation ──────────────── */}
        <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="card flex-1 flex items-center justify-center text-center text-night/40">
              <div>
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <div className="card flex-1 flex flex-col overflow-hidden">

              {/* En-tête conversation */}
              <div className="p-4 border-b border-night/8 flex items-center gap-3">
                <button onClick={() => setActiveConv('')} className="md:hidden btn-ghost p-1.5">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-coral/15 flex items-center justify-center text-coral font-bold text-sm shrink-0">
                  {activeConvData?.other_first_name?.[0]}{activeConvData?.other_last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-night text-sm">
                    {activeConvData?.other_first_name} {activeConvData?.other_last_name}
                  </p>
                  {activeConvData?.listing_title && (
                    <Link
                      href={`/annonces/${activeConvData.listing_id}`}
                      className="text-xs text-coral hover:underline truncate block"
                    >
                      Re: {activeConvData.listing_title}
                    </Link>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-night/30 text-sm py-8">Démarrez la conversation…</div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id
                    const showDate = i === 0 || new Date(messages[i-1].created_at).toDateString() !== new Date(msg.created_at).toDateString()
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center text-xs text-night/30 my-3">
                            {isToday(new Date(msg.created_at)) ? 'Aujourd\'hui' :
                             isYesterday(new Date(msg.created_at)) ? 'Hier' :
                             format(new Date(msg.created_at), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-coral text-white rounded-br-md'
                              : 'bg-sand text-night rounded-bl-md'
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-night/40'} text-right`}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-night/8">
                <div className="flex gap-2">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Écrivez votre message…"
                    rows={1}
                    className="input flex-1 resize-none text-sm py-2.5"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!content.trim() || sending}
                    className="btn-primary px-4 py-2.5 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-night/30 mt-1.5 text-center">Entrée pour envoyer · Maj+Entrée pour sauter une ligne</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <MessagesPageContent />
    </Suspense>
  )
}
