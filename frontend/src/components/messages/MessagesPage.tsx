// src/app/messages/page.tsx  (ou src/app/messages/[id]/page.tsx)
// ── Page messagerie complète — split-view desktop, plein écran mobile ─────────

'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useConversations, useConversation } from '@/hooks/useMessaging'
import ConversationList from '@/components/messages/ConversationList'
import MessageBubble from '@/components/messages/MessageBubble'
import ChatInput from '@/components/messages/ChatInput'
import type { Conversation } from '@/types/messaging.types'

function ConnectionBadge({
  state,
  reconnectInMs,
}: {
  state: 'connected' | 'reconnecting' | 'offline'
  reconnectInMs: number | null
}) {
  if (state === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-500/85">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
        Connecté
      </span>
    )
  }

  if (state === 'reconnecting') {
    const seconds = Math.max(1, Math.ceil((reconnectInMs ?? 1000) / 1000))
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-500 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Reconnexion… {seconds}s
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-rose-500">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      Hors ligne
    </span>
  )
}

// ── Header de conversation ────────────────────────────────────────────────────

function ConvHeader({
  conv, typing, connected, connectionState, reconnectInMs, onBack,
}: {
  conv:      Conversation
  typing:    boolean
  connected: boolean
  connectionState: 'connected' | 'reconnecting' | 'offline'
  reconnectInMs: number | null
  onBack:    () => void
}) {
  const u = conv.other_user
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-night/8">
      <button onClick={onBack} className="md:hidden p-1 text-night/40 hover:text-night">
        ←
      </button>
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-coral/10 flex items-center justify-center text-coral text-sm font-bold overflow-hidden">
          {u.avatar_url
            ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
            : `${u.prenom[0]}${u.nom[0]}`
          }
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-night">{u.prenom} {u.nom}</p>
        <p className="text-[10px] text-night/40 truncate">
          {typing ? (
            <span className="text-emerald-500 animate-pulse">En train d'écrire…</span>
          ) : (
            `📦 ${conv.annonce.titre}`
          )}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Annonce miniature */}
        {conv.annonce.image && (
          <img src={conv.annonce.image} alt="" className="w-9 h-9 rounded-lg object-cover" />
        )}
        {conv.annonce.prix && (
          <span className="text-xs font-bold text-coral">
            {conv.annonce.prix.toLocaleString('fr-FR')} XPF
          </span>
        )}
        <ConnectionBadge state={connectionState} reconnectInMs={reconnectInMs} />
        <span className={connected ? 'text-emerald-500' : 'text-night/20'}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
        </span>
      </div>
    </div>
  )
}

// ── Modale contre-offre ───────────────────────────────────────────────────────

function CounterOfferModal({
  offer_id,
  original_amount,
  onConfirm,
  onClose,
}: {
  offer_id:        number
  original_amount: number
  onConfirm:       (amount: number) => void
  onClose:         () => void
}) {
  const [amount, setAmount] = useState(String(Math.round(original_amount * 1.1)))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/50"
         onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-night mb-4">Faire une contre-offre</h3>
        <p className="text-xs text-night/50 mb-3">
          Offre reçue : {original_amount.toLocaleString('fr-FR')} XPF
        </p>
        <div className="relative mb-4">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input w-full pr-12"
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night/40">XPF</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button
            onClick={() => onConfirm(parseInt(amount))}
            disabled={!amount || parseInt(amount) <= 0}
            className="btn-primary flex-1 justify-center disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get('conv') ? Number(searchParams.get('conv')) : null

  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [counterOffer, setCounterOffer] = useState<{ offer_id: number; amount: number } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const suppressAutoScrollRef = useRef(false)

  const { convs, loading: convsLoading, refetch } = useConversations()

  const convId = activeConv?.id ?? null
  const {
    messages, loading: msgsLoading, typing, connected, connectionState, reconnectInMs,
    sendMessage, sendPhoto, makeOffer, respondOffer, onTyping, loadMore, hasMore,
  } = useConversation(convId)

  const handleLoadMore = async () => {
    suppressAutoScrollRef.current = true
    try {
      await loadMore()
    } finally {
      window.setTimeout(() => {
        suppressAutoScrollRef.current = false
      }, 0)
    }
  }

  // Ouvrir la conversation depuis l'URL
  useEffect(() => {
    if (initialConvId && convs.length > 0) {
      const conv = convs.find(c => c.id === initialConvId)
      if (conv) setActiveConv(conv)
    }
  }, [initialConvId, convs])

  // Scroll vers le bas uniquement hors chargement d'historique
  useEffect(() => {
    if (msgsLoading || suppressAutoScrollRef.current) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, msgsLoading])

  const currentUserId = user ? Number(user.id) : null
  const isSeller = Number(activeConv?.seller_id) === Number(currentUserId)
  const isBuyer  = Number(activeConv?.buyer_id)  === Number(currentUserId)

  const handleRespondOffer = async (offer_id: number, response: 'accepted' | 'declined' | 'countered', counter?: number) => {
    await respondOffer(offer_id, response, counter)
    setCounterOffer(null)
    refetch()
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-sand-light overflow-hidden">

      {/* ── Sidebar conversations ─────────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-night/8 flex flex-col shrink-0 ${
        activeConv ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="px-4 py-3.5 border-b border-night/8">
          <h1 className="font-semibold text-night">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={convs}
            activeId={activeConv?.id}
            onSelect={setActiveConv}
            loading={convsLoading}
          />
        </div>
      </div>

      {/* ── Zone de chat ──────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        activeConv ? 'flex' : 'hidden md:flex'
      }`}>
        {activeConv ? (
          <>
            {/* Header */}
            <ConvHeader
              conv={activeConv}
              typing={typing}
              connected={connected}
              connectionState={connectionState}
              reconnectInMs={reconnectInMs}
              onBack={() => setActiveConv(null)}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {/* Bouton "charger plus" */}
              {hasMore && (
                <div className="text-center pb-2">
                  <button
                    onClick={handleLoadMore}
                    className="text-xs text-coral hover:underline"
                  >
                    Charger les messages précédents
                  </button>
                </div>
              )}

              {msgsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                      <div className="h-10 w-48 bg-sand rounded-2xl animate-pulse" />
                    </div>
                  ))
                : messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMine={Number(msg.sender_id) === Number(currentUserId)}
                      isSeller={isSeller}
                      onAcceptOffer={id => handleRespondOffer(id, 'accepted')}
                      onDeclineOffer={id => handleRespondOffer(id, 'declined')}
                      onCounterOffer={id => {
                        const offer = messages.find(m => m.offer?.id === id)?.offer
                        if (offer) setCounterOffer({ offer_id: id, amount: offer.amount_xpf })
                      }}
                    />
                  ))
              }
              <div ref={bottomRef} />
            </div>

            {/* Saisie */}
            <ChatInput
              onSendText={sendMessage}
              onSendPhoto={sendPhoto}
              onMakeOffer={makeOffer}
              onTyping={onTyping}
              isBuyer={isBuyer}
              annoncePrix={activeConv.annonce.prix}
              disabled={false}
            />
          </>
        ) : (
          // État vide desktop
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-sand rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h2 className="font-semibold text-night mb-2">Vos messages</h2>
            <p className="text-sm text-night/50 max-w-xs">
              Sélectionnez une conversation ou contactez un vendeur depuis une annonce.
            </p>
          </div>
        )}
      </div>

      {/* Modale contre-offre */}
      {counterOffer && (
        <CounterOfferModal
          offer_id={counterOffer.offer_id}
          original_amount={counterOffer.amount}
          onConfirm={amount => handleRespondOffer(counterOffer.offer_id, 'countered', amount)}
          onClose={() => setCounterOffer(null)}
        />
      )}
    </div>
  )
}
