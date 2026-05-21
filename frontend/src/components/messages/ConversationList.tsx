// src/components/messages/ConversationList.tsx
'use client'

import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ShieldCheck, Star } from 'lucide-react'
import type { Conversation } from '@/types/messaging.types'

interface ConversationListProps {
  conversations:  Conversation[]
  activeId?:      number
  onSelect:       (conv: Conversation) => void
  loading:        boolean
}

function timeAgo(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: false, locale: fr })
}

export default function ConversationList({
  conversations, activeId, onSelect, loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 animate-pulse">
            <div className="w-11 h-11 bg-sand rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-sand rounded w-3/4" />
              <div className="h-2.5 bg-sand rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-2xl mb-2">💬</p>
        <p className="text-sm font-medium text-night/60">Aucun message</p>
        <p className="text-xs text-night/40 mt-1">
          Contactez un vendeur depuis une annonce
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-night/6">
      {conversations.map(conv => {
        const isActive  = conv.id === activeId
        const hasUnread = conv.unread_count > 0
        const u         = conv.other_user

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv)}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-sand/60 ${
              isActive ? 'bg-coral/8 border-l-2 border-coral' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-sm overflow-hidden">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : `${u.prenom[0]}${u.nom[0]}`
                }
              </div>
              {/* Indicateur en ligne */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-night' : 'font-medium text-night/80'}`}>
                  {u.prenom} {u.nom}
                </span>
                {u.telephone_verifie && <ShieldCheck size={11} className="text-emerald-500 shrink-0" />}
                {u.is_pro && <Star size={11} className="text-amber-500 shrink-0" />}
              </div>

              {/* Aperçu annonce */}
              <p className="text-[10px] text-night/40 truncate mb-1">
                📦 {conv.annonce.titre}
                {conv.annonce.prix && ` · ${conv.annonce.prix.toLocaleString('fr-FR')} XPF`}
              </p>

              {/* Dernier message */}
              {conv.last_message && (
                <p className={`text-xs truncate ${hasUnread ? 'text-night/70 font-medium' : 'text-night/40'}`}>
                  {conv.last_message.type === 'photo'  && '📷 Photo'}
                  {conv.last_message.type === 'offer'  && '💰 Offre de prix'}
                  {conv.last_message.type === 'text'   && conv.last_message.content}
                  {conv.last_message.type === 'system' && conv.last_message.content}
                </p>
              )}
            </div>

            {/* Méta droite */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {conv.last_message && (
                <span className="text-[10px] text-night/35">
                  {timeAgo(conv.last_message.created_at)}
                </span>
              )}
              {hasUnread && (
                <span className="w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
