'use client'

import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeftRight, BadgeCheck, FileText, MessageCircle, ShieldCheck } from 'lucide-react'
import type { Conversation } from '@/types/messaging.types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: number
  onSelect: (conv: Conversation) => void
  loading: boolean
}

function timeAgo(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: false, locale: fr })
}

function isImageMime(mime?: string | null) {
  return !!mime && mime.startsWith('image/')
}

function getAttachmentPreview(conv: Conversation) {
  const last = conv.last_message
  if (!last) return null

  if (last.type === 'photo') {
    const url = last.photo_url || last.attachment_download_url || last.attachment_url || ''
    if (!url) return null

    return {
      kind: 'image' as const,
      url,
      label: last.attachment_name || 'Photo partagée',
    }
  }

  if (last.type === 'document') {
    const url = last.attachment_download_url || last.attachment_url || ''
    if (!url) return null

    if (isImageMime(last.attachment_mime_type)) {
      return {
        kind: 'image' as const,
        url,
        label: last.attachment_name || 'Image partagée',
      }
    }

    return {
      kind: 'document' as const,
      url,
      label: last.attachment_name || 'Document partagé',
      mime: last.attachment_mime_type || '',
    }
  }

  return null
}

function getLastMessagePreview(conv: Conversation) {
  const last = conv.last_message
  if (!last) return 'Nouvelle conversation'
  if (last.type === 'photo') return 'Photo'
  if (last.type === 'audio') return 'Message vocal'
  if (last.type === 'document') return last.attachment_name || 'Document partagé'
  if (last.type === 'offer') return 'Offre de prix'
  if (last.type === 'system') return last.content ?? 'Message système'
  return last.content ?? 'Message'
}

function isTrocConversation(conv: Conversation) {
  const conversationType = conv.conversation_type || 'listing_chat'
  return conversationType !== 'listing_chat'
    || conv.last_message?.type === 'troc_proposal'
    || Boolean(conv.last_message?.metadata?.proposer_listing_id)
}

export default function ConversationList({ conversations, activeId, onSelect, loading }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex gap-3 rounded-2xl p-3 animate-pulse">
            <div className="h-11 w-11 shrink-0 rounded-full bg-sand" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-sand" />
              <div className="h-2.5 w-1/2 rounded bg-sand" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center px-5 py-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-nc-lagonLight to-nc-emeraudeLight text-nc-lagonText shadow-sm">
          <MessageCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-night">Votre messagerie est vide</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-night/50">
          Dès qu’un acheteur ou un vendeur vous contacte depuis une annonce, la conversation apparaîtra ici.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-sand px-3 py-1 text-[11px] font-medium text-night/60">Réponses rapides</span>
          <span className="rounded-full bg-sand px-3 py-1 text-[11px] font-medium text-night/60">Pièces jointes</span>
          <span className="rounded-full bg-sand px-3 py-1 text-[11px] font-medium text-night/60">Offres de prix</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-night/6">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId
        const hasUnread = conv.unread_count > 0
        const u = conv.other_user
        const attachment = getAttachmentPreview(conv)
        const trocConversation = isTrocConversation(conv)

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv)}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-sand/60 ${
              trocConversation
                ? 'border-l-2 border-nc-emeraude/35 bg-nc-emeraudeLight/40'
                : ''
            } ${
              isActive
                ? 'border-l-2 border-coral bg-coral/8'
                : ''
            }`}
          >
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-coral/10 text-sm font-bold text-coral">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                  : `${u.prenom[0]}${u.nom[0]}`
                }
              </div>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  u.is_online ? 'bg-emerald-400' : 'bg-night/25'
                }`}
                title={u.is_online ? 'En ligne' : (u.last_seen_label ?? 'Hors ligne')}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className={`truncate text-sm ${hasUnread ? 'font-semibold text-night' : 'font-medium text-night/80'}`}>
                  {u.prenom} {u.nom}
                </span>
                {u.telephone_verifie && <ShieldCheck size={11} className="shrink-0 text-emerald-500" />}
                {u.is_pro && <BadgeCheck size={11} className="shrink-0 text-amber-500" />}
              </div>

              <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className={`rounded-full px-2 py-0.5 font-medium ${u.is_online ? 'bg-emerald-50 text-emerald-700' : 'bg-sand text-night/45'}`}>
                  {u.is_online ? 'En ligne' : (u.last_seen_label ?? 'Hors ligne')}
                </span>
                {typeof u.note_moyenne === 'number' && (
                  <span className="rounded-full bg-nc-lagonLight px-2 py-0.5 font-medium text-nc-lagonText">
                    Note {u.note_moyenne.toFixed(1)}/5
                  </span>
                )}
                {u.avg_response_time_label && (
                  <span className="rounded-full bg-nc-emeraudeLight px-2 py-0.5 font-medium text-nc-emeraudeText">
                    Répond en {u.avg_response_time_label}
                  </span>
                )}
                {trocConversation && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    <ArrowLeftRight size={10} />
                    Troc
                  </span>
                )}
              </div>

              <p className="mb-1 truncate text-[10px] text-night/40">
                📦 {conv.annonce.titre}
                {conv.annonce.prix && ` · ${conv.annonce.prix.toLocaleString('fr-FR')} XPF`}
              </p>

              {conv.last_message && (
                <p className={`truncate text-xs ${hasUnread ? 'font-medium text-night/70' : 'text-night/40'}`}>
                  {getLastMessagePreview(conv)}
                </p>
              )}

              {attachment && (
                <div className="mt-1 flex items-center gap-2">
                  {attachment.kind === 'image' ? (
                    <img
                      src={attachment.url}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded-lg object-cover ring-1 ring-night/10"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-nc-emeraudeLight text-nc-emeraudeText">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <p className="min-w-0 truncate text-[11px] text-night/45">
                    {attachment.kind === 'document' && attachment.mime
                      ? `${attachment.label} · ${attachment.mime.split('/').pop()?.toUpperCase() ?? 'DOC'}`
                      : attachment.label}
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {conv.last_message && (
                <span className="text-[10px] text-night/35">
                  {timeAgo(conv.last_message.created_at)}
                </span>
              )}
              {hasUnread && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
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
