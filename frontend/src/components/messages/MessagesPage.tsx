'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Files, MessageCircle, PanelRightOpen, ShieldAlert, Tag, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useConversations, useConversation } from '@/hooks/useMessaging'
import ConversationList from '@/components/messages/ConversationList'
import MessageBubble from '@/components/messages/MessageBubble'
import ChatInput from '@/components/messages/ChatInput'
import { usersApi } from '@/lib/api'
import type { Conversation, Message } from '@/types/messaging.types'

type MobilePanel = 'chat' | 'media' | 'listing'
type AttachmentKind = 'image' | 'audio' | 'document'

type Attachment = {
  id: number
  kind: AttachmentKind
  title: string
  url: string
  createdAt: string
  isMine: boolean
}

function isListingInactive(status?: string | null) {
  if (!status) return false
  return !['active', 'published', 'online'].includes(status.toLowerCase())
}

function extractDocumentUrl(content: string | null | undefined) {
  if (!content) return null
  const match = content.match(/https?:\/\/[^\s]+/i)
  if (!match) return null
  const url = match[0]
  return /\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar)(\?|$)/i.test(url) ? url : null
}

function buildAttachments(messages: Message[], currentUserId: number | null): Attachment[] {
  return messages.reduce<Attachment[]>((acc, message) => {
    const isMine = Number(message.sender_id) === Number(currentUserId)

    const documentUrl = message.attachment_download_url || message.attachment_url
    if (message.type === 'document' && documentUrl) {
      acc.push({
        id: message.id,
        kind: 'document' as const,
        title: message.attachment_name || 'Document partagé',
        url: documentUrl,
        createdAt: message.created_at,
        isMine,
      })
      return acc
    }

    if (message.type === 'photo' && message.photo_url) {
      acc.push({
        id: message.id,
        kind: 'image' as const,
        title: 'Image partagée',
        url: message.photo_url,
        createdAt: message.created_at,
        isMine,
      })
      return acc
    }

    if (message.type === 'audio' && message.photo_url) {
      acc.push({
        id: message.id,
        kind: 'audio' as const,
        title: 'Message vocal',
        url: message.photo_url,
        createdAt: message.created_at,
        isMine,
      })
      return acc
    }

    const docUrl = extractDocumentUrl(message.content)
    if (docUrl) {
      acc.push({
        id: message.id,
        kind: 'document' as const,
        title: 'Document partagé',
        url: docUrl,
        createdAt: message.created_at,
        isMine,
      })
      return acc
    }

    return acc
  }, [])
}

function formatMoney(value?: number | null) {
  if (value == null) return null
  return `${value.toLocaleString('fr-FR')} XPF`
}

function ConversationDrawer({
  open,
  onClose,
  conversations,
  activeId,
  onSelect,
  loading,
}: {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  activeId?: number | null
  onSelect: (conversation: Conversation) => void
  loading: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Fermer la liste des conversations"
        className="absolute inset-0 bg-night/40"
        onClick={onClose}
      />
      <aside className="relative z-10 ml-auto flex h-full w-[min(92vw,380px)] flex-col border-l border-night/10 bg-surface shadow-modal">
        <div className="flex items-center justify-between border-b border-night/10 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-night/40">Discussions</p>
            <h2 className="font-semibold text-night">Toutes vos conversations</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost px-3 py-2 text-sm">
            Fermer
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeId={activeId ?? undefined}
            onSelect={(conversation) => {
              onSelect(conversation)
              onClose()
            }}
            loading={loading}
          />
        </div>
      </aside>
    </div>
  )
}

function MediaSidebar({
  attachments,
  onOpenConversations,
}: {
  attachments: Attachment[]
  onOpenConversations: () => void
}) {
  const imageCount = attachments.filter((item) => item.kind === 'image').length
  const audioCount = attachments.filter((item) => item.kind === 'audio').length
  const documentCount = attachments.filter((item) => item.kind === 'document').length

  return (
    <aside className="hidden flex-col gap-4 xl:flex">
      <div className="card sticky top-4 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-night/40">Accès rapide</p>
            <h2 className="font-semibold text-night">Médias partagés</h2>
          </div>
          <button type="button" onClick={onOpenConversations} className="btn-ghost px-3 py-2 text-xs">
            Discussions
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-sand px-3 py-3">
            <p className="text-lg font-semibold text-night">{imageCount}</p>
            <p className="text-[11px] text-night/50">Images</p>
          </div>
          <div className="rounded-2xl bg-sand px-3 py-3">
            <p className="text-lg font-semibold text-night">{audioCount}</p>
            <p className="text-[11px] text-night/50">Vocaux</p>
          </div>
          <div className="rounded-2xl bg-sand px-3 py-3">
            <p className="text-lg font-semibold text-night">{documentCount}</p>
            <p className="text-[11px] text-night/50">Docs</p>
          </div>
        </div>

        <div className="max-h-[calc(100vh-240px)] space-y-3 overflow-y-auto pr-1">
          {attachments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-night/10 bg-sand/50 px-4 py-6 text-center">
              <Files className="mx-auto mb-2 h-5 w-5 text-night/30" />
              <p className="text-sm font-medium text-night">Aucun média partagé</p>
              <p className="mt-1 text-xs text-night/40">Les images, documents et vocaux apparaîtront ici.</p>
            </div>
          ) : (
            attachments.slice().reverse().map((item) => (
              <a
                key={`${item.kind}-${item.id}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-night/10 bg-white px-3 py-3 transition-all hover:border-coral/30 hover:shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    item.kind === 'image'
                      ? 'bg-nc-lagonLight text-nc-lagonText'
                      : item.kind === 'audio'
                        ? 'bg-nc-corailLight text-nc-corailText'
                        : 'bg-nc-emeraudeLight text-nc-emeraudeText'
                  }`}
                >
                  {item.kind === 'image' ? (
                    <PanelRightOpen className="h-4 w-4" />
                  ) : item.kind === 'audio' ? (
                    <MessageCircle className="h-4 w-4" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-night">{item.title}</p>
                  <p className="truncate text-xs text-night/45">
                    {new Date(item.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}

function ListingSidebar({ conversation }: { conversation: Conversation | null }) {
  if (!conversation) {
    return (
      <aside className="hidden xl:flex">
        <div className="card sticky top-4 w-full p-5">
          <p className="text-sm text-night/50">Sélectionnez une conversation pour voir l’annonce liée.</p>
        </div>
      </aside>
    )
  }

  const inactive = isListingInactive(conversation.annonce.statut)

  return (
    <aside className="hidden flex-col gap-4 xl:flex">
      <div className="card sticky top-4 space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-night/40">Annonce liée</p>
            <h2 className="truncate font-semibold text-night">{conversation.annonce.titre}</h2>
          </div>
          <Link href={`/annonces/${conversation.annonce.id}`} className="btn-ghost px-3 py-2 text-xs">
            Ouvrir
          </Link>
        </div>

        {inactive && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4" />
              Cette annonce a expiré
            </div>
            <p className="mt-1 text-xs">
              Les échanges restent visibles, mais l’annonce n’est plus active.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-night/10 bg-sand">
          {conversation.annonce.image ? (
            <img
              src={conversation.annonce.image}
              alt={conversation.annonce.titre}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-nc-lagonLight to-nc-emeraudeLight">
              <MessageCircle className="h-10 w-10 text-night/25" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-night/8 bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">Prix</p>
            <p className="mt-1 text-xl font-semibold text-coral">
              {formatMoney(conversation.annonce.prix) ?? 'Prix non communiqué'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-night/8 bg-white px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">Statut</p>
              <p className={`mt-1 text-sm font-semibold ${inactive ? 'text-amber-700' : 'text-emerald-700'}`}>
                {inactive ? 'Expirée' : 'Active'}
              </p>
            </div>
            <div className="rounded-2xl border border-night/8 bg-white px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">ID</p>
              <p className="mt-1 text-sm font-semibold text-night">#{conversation.annonce.id}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MobileTabs({
  panel,
  setPanel,
  onOpenConversations,
}: {
  panel: MobilePanel
  setPanel: (panel: MobilePanel) => void
  onOpenConversations: () => void
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-night/10 bg-surface/95 backdrop-blur xl:hidden">
      <div className="flex items-center gap-2 px-3 py-3">
        <button type="button" onClick={onOpenConversations} className="btn-ghost px-3 py-2 text-xs">
          <Users className="mr-1 h-3.5 w-3.5" />
          Discussions
        </button>

        <div className="ml-auto flex items-center gap-1 rounded-full border border-night/10 bg-sand p-1">
          {[
            { id: 'chat', label: 'Chat' },
            { id: 'media', label: 'Médias' },
            { id: 'listing', label: 'Annonce' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id as MobilePanel)}
              className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                panel === item.id ? 'bg-coral text-white shadow-sm' : 'text-night/60 hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const initialConvId = searchParams.get('conv') ? Number(searchParams.get('conv')) : null

  const [activeConvId, setActiveConvId] = useState<number | null>(initialConvId)
  const [panel, setPanel] = useState<MobilePanel>('chat')
  const [conversationDrawerOpen, setConversationDrawerOpen] = useState(false)
  const [counterOffer, setCounterOffer] = useState<{ offer_id: number; amount: number } | null>(null)
  const [participantProfile, setParticipantProfile] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const suppressAutoScrollRef = useRef(false)

  const { convs, loading: convsLoading, refetch: refetchConversations } = useConversations()
  const activeConversation = useMemo(
    () => convs.find((conversation) => conversation.id === activeConvId) ?? null,
    [convs, activeConvId],
  )

  const {
    messages,
    loading: msgsLoading,
    typing,
    connected,
    connectionState,
    reconnectInMs,
    sendMessage,
    sendPhoto,
    sendDocument,
    sendAudio,
    makeOffer,
    respondOffer,
    onTyping,
    loadMore,
    hasMore,
  } = useConversation(activeConvId)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.push('/connexion')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!activeConvId && convs.length > 0) {
      setActiveConvId(convs[0].id)
      return
    }

    if (initialConvId && convs.length > 0) {
      const existing = convs.find((conversation) => conversation.id === initialConvId)
      if (existing) setActiveConvId(existing.id)
    }
  }, [convs, activeConvId, initialConvId])

  useEffect(() => {
    const participantId = activeConversation?.other_user?.id
    if (!participantId) {
      setParticipantProfile(null)
      return
    }

    let alive = true
    usersApi.getProfile(String(participantId))
      .then(({ data }) => {
        if (!alive) return
        setParticipantProfile(data.data ?? null)
      })
      .catch(() => {
        if (alive) setParticipantProfile(null)
      })

    return () => {
      alive = false
    }
  }, [activeConversation?.other_user?.id])

  useEffect(() => {
    if (msgsLoading || suppressAutoScrollRef.current) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, msgsLoading])

  const currentUserId = user ? Number(user.id) : null
  const isSeller = Number(activeConversation?.seller_id) === Number(currentUserId)
  const isBuyer = Number(activeConversation?.buyer_id) === Number(currentUserId)
  const attachments = useMemo(() => buildAttachments(messages, currentUserId), [messages, currentUserId])
  const inactiveListing = isListingInactive(activeConversation?.annonce.statut)
  const participantMeta = participantProfile ?? activeConversation?.other_user ?? null

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

  const handleRespondOffer = async (
    offerId: number,
    response: 'accepted' | 'declined' | 'countered',
    counter?: number,
  ) => {
    await respondOffer(offerId, response, counter)
    setCounterOffer(null)
    refetchConversations()
  }

  if (!hasHydrated || !isAuthenticated) {
    return <div className="min-h-screen bg-sand-light" />
  }

  const renderChat = () => {
    if (!activeConversation) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sand">
            <MessageCircle className="h-8 w-8 text-coral" />
          </div>
          <h2 className="font-semibold text-night">Sélectionnez une conversation</h2>
          <p className="mt-2 max-w-sm text-sm text-night/50">
            Ouvrez une discussion depuis le tiroir pour suivre vos échanges.
          </p>
          <button
            type="button"
            onClick={() => setConversationDrawerOpen(true)}
            className="btn-primary mt-5 px-4 py-2.5"
          >
            Ouvrir les conversations
          </button>
        </div>
      )
    }

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-night/10 bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-night/8 px-4 py-4">
          <button
            type="button"
            onClick={() => setConversationDrawerOpen(true)}
            className="btn-ghost hidden px-3 py-2 text-xs xl:inline-flex"
          >
            <Users className="mr-1 h-3.5 w-3.5" />
            Discussions
          </button>
          <button type="button" onClick={() => setPanel('chat')} className="btn-ghost p-1.5 xl:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral/10 font-bold text-coral">
            {activeConversation.other_user.avatar_url ? (
              <img src={activeConversation.other_user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              `${activeConversation.other_user.prenom[0]}${activeConversation.other_user.nom[0]}`
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-night">
                {activeConversation.other_user.prenom} {activeConversation.other_user.nom}
              </p>
              {typing && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">En train d’écrire</span>}
              {inactiveListing && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Annonce expirée</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-night/45">
              <span>{activeConversation.annonce.titre}</span>
              {activeConversation.annonce.prix != null && (
                <>
                  <span>•</span>
                  <span>{activeConversation.annonce.prix.toLocaleString('fr-FR')} XPF</span>
                </>
              )}
            </div>
            {participantMeta && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
                  participantMeta.is_online ? 'bg-emerald-50 text-emerald-700' : 'bg-sand text-night/45'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${participantMeta.is_online ? 'bg-emerald-500' : 'bg-night/25'}`} />
                  {participantMeta.is_online ? 'En ligne' : (participantMeta.last_seen_label ?? 'Hors ligne')}
                </span>
                {participantMeta.avg_response_time_label && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nc-lagonLight px-2.5 py-1 font-medium text-nc-lagonText">
                    Répond en moyenne en {participantMeta.avg_response_time_label}
                  </span>
                )}
                {participantMeta.note_moyenne != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nc-emeraudeLight px-2.5 py-1 font-medium text-nc-emeraudeText">
                    <span>★</span>
                    {Number(participantMeta.note_moyenne).toFixed(1)}/5
                    <span className="text-current/70">({participantMeta.nb_avis ?? 0})</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs ${connected ? 'text-emerald-600' : 'text-night/30'}`}>
              {connected
                ? 'Connecté'
                : connectionState === 'reconnecting'
                  ? `Reconnexion… ${Math.max(1, Math.ceil((reconnectInMs ?? 1000) / 1000))}s`
                  : 'Hors ligne'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {hasMore && (
            <div className="pb-3 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="text-xs font-medium text-coral hover:underline"
              >
                Charger les messages précédents
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {msgsLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={`flex ${index % 2 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-10 w-48 animate-pulse rounded-2xl bg-sand" />
                </div>
              ))
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={Number(msg.sender_id) === Number(currentUserId)}
                  isSeller={isSeller}
                  onAcceptOffer={(id) => handleRespondOffer(id, 'accepted')}
                  onDeclineOffer={(id) => handleRespondOffer(id, 'declined')}
                  onCounterOffer={(id) => {
                    const offer = messages.find((message) => message.offer?.id === id)?.offer
                    if (offer) setCounterOffer({ offer_id: id, amount: offer.amount_xpf })
                  }}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput
          onSendText={sendMessage}
          onSendPhoto={sendPhoto}
          onSendDocument={sendDocument}
          onSendAudio={sendAudio}
          onMakeOffer={makeOffer}
          onTyping={onTyping}
          isBuyer={isBuyer}
          annoncePrix={activeConversation.annonce.prix}
          disabled={false}
        />
      </div>
    )
  }

  const renderMobilePanel = () => {
    if (panel === 'media') {
      return (
        <div className="xl:hidden flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[28px] border border-night/10 bg-surface p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-night/40">Médias</p>
                <h3 className="font-semibold text-night">Partagés dans cette discussion</h3>
              </div>
              <button type="button" onClick={() => setPanel('chat')} className="btn-ghost px-3 py-2 text-xs">
                Retour au chat
              </button>
            </div>
            <div className="grid gap-3">
              {attachments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-night/10 bg-sand/50 px-4 py-6 text-center">
                  <Files className="mx-auto mb-2 h-5 w-5 text-night/30" />
                  <p className="text-sm font-medium text-night">Aucun média partagé</p>
                </div>
              ) : (
                attachments.slice().reverse().map((item) => (
                  <a
                    key={`${item.kind}-${item.id}`}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-night/10 bg-white px-3 py-3"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        item.kind === 'image'
                          ? 'bg-nc-lagonLight text-nc-lagonText'
                          : item.kind === 'audio'
                            ? 'bg-nc-corailLight text-nc-corailText'
                            : 'bg-nc-emeraudeLight text-nc-emeraudeText'
                      }`}
                    >
                      {item.kind === 'image' ? (
                        <PanelRightOpen className="h-4 w-4" />
                      ) : item.kind === 'audio' ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-night">{item.title}</p>
                      <p className="truncate text-xs text-night/45">
                        {new Date(item.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )
    }

    if (panel === 'listing') {
      return (
        <div className="xl:hidden flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[28px] border border-night/10 bg-surface p-4 shadow-card">
            {activeConversation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-night/40">Annonce liée</p>
                    <h3 className="truncate font-semibold text-night">{activeConversation.annonce.titre}</h3>
                  </div>
                  <Link href={`/annonces/${activeConversation.annonce.id}`} className="btn-ghost px-3 py-2 text-xs">
                    Ouvrir
                  </Link>
                </div>

                {inactiveListing && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
                    Cette annonce a expiré
                  </div>
                )}

                <div className="overflow-hidden rounded-3xl border border-night/10 bg-sand">
                  {activeConversation.annonce.image ? (
                    <img
                      src={activeConversation.annonce.image}
                      alt={activeConversation.annonce.titre}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-nc-lagonLight to-nc-emeraudeLight">
                      <MessageCircle className="h-10 w-10 text-night/25" />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-sand px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">Prix</p>
                  <p className="mt-1 text-xl font-semibold text-coral">
                    {formatMoney(activeConversation.annonce.prix) ?? 'Prix non communiqué'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-night/50">Sélectionnez une conversation pour voir l’annonce.</p>
            )}
          </div>
        </div>
      )
    }

    return <div className="xl:hidden flex-1 px-4 py-4">{renderChat()}</div>
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-sand-light">
      <ConversationDrawer
        open={conversationDrawerOpen}
        onClose={() => setConversationDrawerOpen(false)}
        conversations={convs}
        activeId={activeConvId}
        onSelect={(conversation) => {
          setActiveConvId(conversation.id)
          setPanel('chat')
        }}
        loading={convsLoading}
      />

      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1700px] gap-4 px-3 py-3 md:px-4">
        <MediaSidebar
          attachments={attachments}
          onOpenConversations={() => setConversationDrawerOpen(true)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <MobileTabs
            panel={panel}
            setPanel={setPanel}
            onOpenConversations={() => setConversationDrawerOpen(true)}
          />

          <div className="hidden xl:block">{renderChat()}</div>

          <div className="min-h-0 flex-1 xl:hidden">
            {panel === 'chat' && renderChat()}
            {panel !== 'chat' && renderMobilePanel()}
          </div>
        </main>

        <ListingSidebar conversation={activeConversation} />
      </div>

      {counterOffer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/50 px-4"
          onClick={() => setCounterOffer(null)}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-modal" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-1 text-lg font-semibold text-night">Faire une contre-offre</h3>
            <p className="mb-3 text-sm text-night/50">
              Offre reçue : {counterOffer.amount.toLocaleString('fr-FR')} XPF
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setCounterOffer(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center"
                onClick={() => handleRespondOffer(counterOffer.offer_id, 'countered', Math.round(counterOffer.amount * 1.1))}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
