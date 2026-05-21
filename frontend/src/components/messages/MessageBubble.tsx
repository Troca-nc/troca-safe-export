// src/components/messages/MessageBubble.tsx
'use client'

import { useState } from 'react'
import { Check, CheckCheck, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Message } from '@/types/messaging.types'

interface MessageBubbleProps {
  message:  Message
  isMine:   boolean
  isSeller: boolean   // l'utilisateur courant est le vendeur
  onAcceptOffer:  (offer_id: number) => void
  onDeclineOffer: (offer_id: number) => void
  onCounterOffer: (offer_id: number) => void
}

// ── Bulle texte / photo ───────────────────────────────────────────────────────

function TextBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
      {/* Photo */}
      {message.type === 'photo' && message.photo_url && (
        <a href={message.photo_url} target="_blank" rel="noopener noreferrer">
          <img
            src={message.photo_url}
            alt="Photo partagée"
            className={`rounded-2xl max-w-[220px] max-h-[220px] object-cover cursor-pointer ${
              isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
            }`}
          />
        </a>
      )}

      {/* Texte */}
      {message.type === 'text' && message.content && (
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-coral text-white rounded-br-sm'
            : 'bg-white border border-night/8 text-night rounded-bl-sm'
        } ${message.pending ? 'opacity-60' : ''} ${message.failed ? 'border-red-200 bg-red-50 text-red-700' : ''}`}>
          {message.content}
        </div>
      )}

      {/* Méta : heure + statut lecture */}
      <div className={`flex items-center gap-1 text-[10px] text-night/35 ${isMine ? 'flex-row-reverse' : ''}`}>
        <span>{format(parseISO(message.created_at), 'HH:mm', { locale: fr })}</span>
        {isMine && (
          message.failed   ? <AlertCircle size={10} className="text-red-400" /> :
          message.pending  ? <Clock size={10} /> :
          message.read_at  ? <CheckCheck size={10} className="text-coral" /> :
                             <Check size={10} />
        )}
      </div>
    </div>
  )
}

// ── Carte offre de prix ───────────────────────────────────────────────────────

function OfferBubble({
  message, isMine, isSeller,
  onAccept, onDecline, onCounter,
}: {
  message:   Message
  isMine:    boolean
  isSeller:  boolean
  onAccept:  () => void
  onDecline: () => void
  onCounter: () => void
}) {
  const offer  = message.offer!
  const isPending  = offer.status === 'pending'
  const isExpired  = offer.status === 'expired'

  const statusConfig = {
    pending:   { label: 'En attente',      color: 'text-amber-600  bg-amber-50  border-amber-200' },
    accepted:  { label: '✅ Acceptée',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    declined:  { label: '❌ Refusée',      color: 'text-red-600    bg-red-50    border-red-200' },
    countered: { label: '🔄 Contre-offre', color: 'text-blue-600   bg-blue-50   border-blue-200' },
    expired:   { label: '⏱ Expirée',      color: 'text-night/40   bg-sand      border-night/10' },
  }
  const s = statusConfig[offer.status]

  return (
    <div className={`max-w-[280px] bg-white border-2 rounded-2xl overflow-hidden ${
      isPending ? 'border-coral/30' : 'border-night/10'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-coral/5 border-b border-coral/10">
        <TrendingUp size={16} className="text-coral" />
        <span className="text-sm font-semibold text-night">Offre de prix</span>
        <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
          {s.label}
        </span>
      </div>

      {/* Montant */}
      <div className="px-4 py-4 text-center">
        <p className="text-3xl font-bold text-coral">
          {offer.amount_xpf.toLocaleString('fr-FR')} XPF
        </p>
        {offer.expires_at && isPending && (
          <p className="text-[10px] text-night/40 mt-1">
            Expire le {format(parseISO(offer.expires_at), 'd MMM à HH:mm', { locale: fr })}
          </p>
        )}
      </div>

      {/* Actions — visibles uniquement pour le vendeur face à une offre pending */}
      {isPending && !isMine && isSeller && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 py-2 text-xs font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            ✅ Accepter
          </button>
          <button
            onClick={onCounter}
            className="flex-1 py-2 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            🔄 Contrer
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
          >
            ❌ Refuser
          </button>
        </div>
      )}
    </div>
  )
}

// ── Message système ───────────────────────────────────────────────────────────

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="text-center py-1">
      <span className="text-[11px] text-night/40 bg-sand px-3 py-1 rounded-full">
        {content}
      </span>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function MessageBubble({
  message, isMine, isSeller,
  onAcceptOffer, onDeclineOffer, onCounterOffer,
}: MessageBubbleProps) {
  if (message.type === 'system') {
    return <SystemMessage content={message.content ?? ''} />
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      {message.type === 'offer'
        ? <OfferBubble
            message={message}
            isMine={isMine}
            isSeller={isSeller}
            onAccept={() => onAcceptOffer(message.offer!.id)}
            onDecline={() => onDeclineOffer(message.offer!.id)}
            onCounter={() => onCounterOffer(message.offer!.id)}
          />
        : <TextBubble message={message} isMine={isMine} />
      }
    </div>
  )
}
