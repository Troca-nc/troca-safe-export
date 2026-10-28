'use client'

import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftRight, ImageIcon, MessageCircle } from 'lucide-react'
import type { Conversation } from '@/types/messaging.types'

interface ConversationRailProps {
  conversations: Conversation[]
  activeId?: number
  currentUserId?: number | null
  onSelect: (conversation: Conversation) => void
  loading: boolean
  emptyLabel?: string
}

function timeAgo(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: false, locale: fr })
}

function getPreview(conversation: Conversation) {
  const last = conversation.last_message
  if (!last) return 'Nouvelle conversation'
  if (last.type === 'photo') return 'Photo partagée'
  if (last.type === 'audio') return 'Message vocal'
  if (last.type === 'document') return last.attachment_name || 'Document partagé'
  if (last.type === 'offer') return 'Offre de prix'
  if (last.type === 'troc_proposal') return 'Proposition de troc'
  return last.content ?? 'Message'
}

export function isTrocConversation(conversation: Conversation) {
  const conversationType = conversation.conversation_type || 'listing_chat'
  return conversationType !== 'listing_chat'
    || conversation.last_message?.type === 'troc_proposal'
    || Boolean(conversation.last_message?.metadata?.proposer_listing_id)
}

function getLabel(conversation: Conversation, currentUserId?: number | null) {
  if (isTrocConversation(conversation)) return 'Troc'
  if (currentUserId && Number(conversation.seller_id) === Number(currentUserId)) return 'Ma vente'
  return 'Mon achat'
}

export default function ConversationRail({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  loading,
  emptyLabel,
}: ConversationRailProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3" aria-label="Chargement des discussions">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex animate-pulse gap-3 rounded-card p-3">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-cream-sunken" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-2/3 rounded bg-cream-sunken" />
              <div className="h-3 w-full rounded bg-cream-sunken" />
              <div className="h-3 w-1/2 rounded bg-cream-sunken" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-block bg-cream-sunken text-info-text">
          <MessageCircle aria-hidden="true" size={24} />
        </span>
        <p className="mt-4 font-semibold text-ink">{emptyLabel ?? 'Aucune discussion pour l’instant'}</p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-ink/65">Les échanges avec les acheteurs et les vendeurs apparaîtront ici.</p>
        {!emptyLabel && (
          <Link href="/annonces" className="mt-5 inline-flex min-h-11 items-center rounded-control bg-accent-strong px-4 text-sm font-semibold text-cream-surface">
            Parcourir les annonces
          </Link>
        )}
      </div>
    )
  }

  return (
    <ul className="space-y-1 p-2" aria-label="Discussions">
      {conversations.map((conversation) => {
        const user = conversation.other_user
        const isActive = conversation.id === activeId
        const hasUnread = conversation.unread_count > 0
        const troc = isTrocConversation(conversation)

        return (
          <li key={conversation.id}>
            <button
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onSelect(conversation)}
              className={`grid w-full grid-cols-[56px_minmax(0,1fr)_auto] gap-3 rounded-card border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
                isActive ? 'border-ink bg-cream-surface' : 'border-transparent hover:border-warm-border hover:bg-cream-surface/70'
              }`}
            >
              <span className="relative h-14 w-14 shrink-0">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-cream-sunken text-ink/40">
                  {conversation.annonce.image ? (
                    <Image src={conversation.annonce.image} alt="" width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon aria-hidden="true" size={20} />
                  )}
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-cream bg-info text-mono-xs font-bold text-cream-surface">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt="" width={28} height={28} className="h-full w-full object-cover" />
                  ) : (
                    `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`
                  )}
                </span>
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`truncate text-sm text-ink ${hasUnread ? 'font-bold' : 'font-semibold'}`}>{user.prenom} {user.nom}</span>
                  {troc && <ArrowLeftRight aria-hidden="true" size={13} className="shrink-0 text-accent-text" />}
                </span>
                <span className="mt-0.5 block truncate text-xs font-medium text-info-text">{conversation.annonce.titre}</span>
                <span className={`mt-1 block truncate text-sm ${hasUnread ? 'font-semibold text-ink' : 'text-ink/65'}`}>{getPreview(conversation)}</span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-pill px-2 py-1 text-caption font-semibold ${troc ? 'bg-ink-deep text-cream-surface' : 'bg-cream-sunken text-ink/70'}`}>
                    {getLabel(conversation, currentUserId)}
                  </span>
                  {conversation.last_message?.type === 'offer' && (
                    <span className="rounded-pill bg-accent/10 px-2 py-1 text-caption font-semibold text-accent-text">Offre reçue</span>
                  )}
                </span>
              </span>

              <span className="flex min-w-8 flex-col items-end gap-2 text-right">
                {conversation.last_message && <span className="whitespace-nowrap text-caption text-ink/55">{timeAgo(conversation.last_message.created_at)}</span>}
                {hasUnread && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent-strong px-1.5 text-caption font-bold text-cream-surface">
                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
