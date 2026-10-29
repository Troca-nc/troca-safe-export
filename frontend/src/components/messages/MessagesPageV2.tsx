'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowLeftRight,
  BadgeCheck,
  Files,
  ImageIcon,
  Info,
  MapPin,
  MessageCircle,
  PanelRightOpen,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import ChatInput from '@/components/messages/ChatInput'
import ConversationRail, { isTrocConversation } from '@/components/messages/ConversationRail'
import MessageBubble from '@/components/messages/MessageBubble'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'
import { useConversation, useConversations } from '@/hooks/useMessaging'
import { openPrivateAttachment } from '@/hooks/usePrivateAttachment'
import { trocApi, usersApi } from '@/lib/api'
import type { Conversation, Message } from '@/types/messaging.types'

type ConversationFilter = 'all' | 'unread' | 'buy' | 'sell' | 'troc'
type AttachmentKind = 'image' | 'audio' | 'document'

type Attachment = {
  id: number
  kind: AttachmentKind
  title: string
  url: string
  createdAt: string
}

function isListingInactive(status?: string | null) {
  if (!status) return false
  return !['active', 'published', 'online'].includes(status.toLowerCase())
}

function formatMoney(value?: number | null) {
  return value == null ? 'Prix non communiqué' : `${value.toLocaleString('fr-FR')} XPF`
}

function dayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const key = date.toDateString()
  if (key === today.toDateString()) return 'Aujourd’hui'
  if (key === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function buildAttachments(messages: Message[]): Attachment[] {
  return messages.reduce<Attachment[]>((items, message) => {
    const documentUrl = message.attachment_download_url || message.attachment_url
    if (message.type === 'document' && documentUrl) {
      items.push({ id: message.id, kind: 'document', title: message.attachment_name || 'Document partagé', url: documentUrl, createdAt: message.created_at })
    } else if (message.type === 'photo' && message.photo_url) {
      items.push({ id: message.id, kind: 'image', title: 'Photo partagée', url: message.photo_url, createdAt: message.created_at })
    } else if (message.type === 'audio' && message.photo_url) {
      items.push({ id: message.id, kind: 'audio', title: 'Message vocal', url: message.photo_url, createdAt: message.created_at })
    }
    return items
  }, [])
}

function conversationRole(conversation: Conversation, currentUserId: number | null) {
  if (isTrocConversation(conversation)) return 'Ton annonce de troc'
  return Number(conversation.seller_id) === Number(currentUserId) ? 'Ton annonce' : 'Ton achat'
}

function ContextPanel({
  conversation,
  participant,
  attachments,
  onClose,
}: {
  conversation: Conversation | null
  participant: Record<string, any> | null
  attachments: Attachment[]
  onClose?: () => void
}) {
  if (!conversation) {
    return <div className="p-6 text-sm leading-6 text-ink/65">Sélectionnez une discussion pour afficher son contexte.</div>
  }

  const inactive = isListingInactive(conversation.annonce.statut)
  const commune = participant?.commune ?? participant?.ville ?? null
  const memberSince = participant?.created_at
    ? new Date(participant.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-cream">
      {onClose && (
        <div className="flex items-center justify-between border-b border-warm-border px-5 py-4">
          <p className="font-semibold text-ink">Contexte de la discussion</p>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-control text-ink/65 hover:bg-cream-sunken" aria-label="Fermer le contexte">
            <X aria-hidden="true" size={19} />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <section className="shrink-0 overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-xs">
          <div className="flex h-36 items-center justify-center bg-cream-sunken text-ink/35">
            {conversation.annonce.image ? (
              <Image src={conversation.annonce.image} alt={conversation.annonce.titre} width={344} height={144} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon aria-hidden="true" size={38} />
            )}
          </div>
          <div className="p-4">
            <p className="text-eyebrow text-accent-text">Annonce liée</p>
            <h2 className="mt-2 text-lg font-semibold leading-6 text-ink">{conversation.annonce.titre}</h2>
            <p className="mt-2 font-display text-3xl text-ink">{formatMoney(conversation.annonce.prix)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${inactive ? 'bg-alert-warn/10 text-alert-warn' : 'bg-reef/10 text-reef-text'}`}>
                {inactive ? 'Annonce terminée' : 'En ligne'}
              </span>
              {commune && <span className="rounded-pill bg-cream-sunken px-2.5 py-1 text-xs font-semibold text-ink/70">{commune}</span>}
            </div>
            <Link href={`/annonces/${conversation.annonce.id}`} className="mt-4 flex min-h-11 items-center justify-center rounded-control border border-ink px-4 text-sm font-semibold text-ink hover:bg-cream-sunken">
              Ouvrir l’annonce
            </Link>
          </div>
        </section>

        <section className="shrink-0 rounded-card border border-warm-border bg-cream-surface p-4">
          <p className="text-eyebrow text-ink/60">{conversation.other_user.prenom} {conversation.other_user.nom}</p>
          <dl className="mt-4 space-y-3 text-sm">
            {memberSince && <div className="flex justify-between gap-3"><dt className="text-ink/60">Membre depuis</dt><dd className="font-semibold text-ink">{memberSince}</dd></div>}
            {participant?.avg_response_time_label && <div className="flex justify-between gap-3"><dt className="text-ink/60">Réponse</dt><dd className="font-semibold text-info-text">{participant.avg_response_time_label}</dd></div>}
            {commune && <div className="flex justify-between gap-3"><dt className="text-ink/60">Commune</dt><dd className="font-semibold text-ink">{commune}</dd></div>}
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-warm-border pt-4">
            <Link href={`/profil/${conversation.other_user.id}`} className="flex min-h-11 items-center justify-center rounded-control bg-cream-sunken px-2 text-center text-sm font-semibold text-ink">Voir le profil</Link>
            <Link href={`/annonces?user=${conversation.other_user.id}`} className="flex min-h-11 items-center justify-center rounded-control bg-cream-sunken px-2 text-center text-sm font-semibold text-ink">Ses annonces</Link>
          </div>
        </section>

        <section className="shrink-0 rounded-card border border-dashed border-warm-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-eyebrow text-ink/60">Médias partagés</p>
            <span className="text-xs font-semibold text-ink/55">{attachments.length}</span>
          </div>
          {attachments.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-ink/60">Les photos et documents échangés apparaîtront ici.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {attachments.slice(-6).map((item) => (
                <button key={`${item.kind}-${item.id}`} type="button" onClick={() => void openPrivateAttachment(item.url)} className="flex aspect-square items-center justify-center overflow-hidden rounded-control bg-cream-sunken text-info-text" aria-label={`Ouvrir ${item.title}`}>
                  {item.kind === 'image' ? <ImageIcon aria-hidden="true" size={19} /> : item.kind === 'audio' ? <MessageCircle aria-hidden="true" size={19} /> : <Files aria-hidden="true" size={19} />}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="shrink-0 rounded-card bg-ink-deep p-4 text-cream-surface">
          <div className="flex items-center gap-2 text-accent"><ShieldCheck aria-hidden="true" size={18} /><p className="text-eyebrow">Reste en sécurité</p></div>
          <p className="mt-3 text-sm leading-6 text-cream-surface/75">Pas d’acompte avant d’avoir vu l’objet. Privilégiez un lieu public. Votre numéro reste masqué sur Kalico.</p>
          <Link href={`/contact?objet=signalement&annonce=${conversation.annonce.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-cream-surface underline">Signaler un problème</Link>
        </section>
      </div>
    </div>
  )
}

export default function MessagesPageV2() {
  const searchParams = useSearchParams()
  const { user, isAuthenticated, authReady } = useAuthSessionSync()
  const initialConvId = searchParams.get('conv') ? Number(searchParams.get('conv')) : null
  const targetUserId = searchParams.get('user') || searchParams.get('listing_user')
  const [activeConvId, setActiveConvId] = useState<number | null>(initialConvId)
  const [threadOpen, setThreadOpen] = useState(Boolean(initialConvId || targetUserId))
  const [contextOpen, setContextOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const [counterOffer, setCounterOffer] = useState<{ offer_id: number; amount: number } | null>(null)
  const [participantProfile, setParticipantProfile] = useState<Record<string, any> | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const suppressAutoScrollRef = useRef(false)
  const { convs, loading: convsLoading, error: convsError, refetch: refetchConversations } = useConversations()
  const activeConversation = useMemo(() => convs.find((conversation) => conversation.id === activeConvId) ?? null, [convs, activeConvId])
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
    refetchMessages,
    hasMore,
  } = useConversation(activeConvId)

  useEffect(() => {
    if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id)
  }, [activeConvId, convs])

  useEffect(() => {
    if (!targetUserId || convs.length === 0 || initialConvId) return
    const existing = convs.find((conversation) => Number(conversation.other_user.id) === Number(targetUserId))
    if (existing) {
      setActiveConvId(existing.id)
      setThreadOpen(true)
    }
  }, [convs, initialConvId, targetUserId])

  useEffect(() => {
    const participantId = activeConversation?.other_user.id
    if (!participantId) return setParticipantProfile(null)
    let alive = true
    usersApi.getProfile(String(participantId))
      .then(({ data }) => { if (alive) setParticipantProfile(data.data ?? null) })
      .catch(() => { if (alive) setParticipantProfile(null) })
    return () => { alive = false }
  }, [activeConversation?.other_user.id])

  useEffect(() => {
    if (msgsLoading || suppressAutoScrollRef.current) return
    const messageList = messageListRef.current
    if (!messageList) return
    messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' })
  }, [messages.length, msgsLoading])

  const currentUserId = user ? Number(user.id) : null
  const isSeller = Number(activeConversation?.seller_id) === Number(currentUserId)
  const isBuyer = Number(activeConversation?.buyer_id) === Number(currentUserId)
  const inactiveListing = isListingInactive(activeConversation?.annonce.statut)
  const participant = participantProfile ?? activeConversation?.other_user ?? null
  const attachments = useMemo(() => buildAttachments(messages), [messages])
  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr')
    return convs.filter((conversation) => {
      const searchable = `${conversation.other_user.prenom} ${conversation.other_user.nom} ${conversation.annonce.titre}`.toLocaleLowerCase('fr')
      if (needle && !searchable.includes(needle)) return false
      if (filter === 'unread') return conversation.unread_count > 0
      if (filter === 'buy') return Number(conversation.buyer_id) === Number(currentUserId) && !isTrocConversation(conversation)
      if (filter === 'sell') return Number(conversation.seller_id) === Number(currentUserId) && !isTrocConversation(conversation)
      if (filter === 'troc') return isTrocConversation(conversation)
      return true
    })
  }, [convs, currentUserId, filter, search])

  const handleLoadMore = async () => {
    suppressAutoScrollRef.current = true
    try { await loadMore() } finally { window.setTimeout(() => { suppressAutoScrollRef.current = false }, 0) }
  }
  const handleRespondOffer = async (offerId: number, response: 'accepted' | 'declined' | 'countered', counter?: number) => {
    await respondOffer(offerId, response, counter)
    setCounterOffer(null)
    refetchConversations()
  }
  const handleAcceptTrocProposal = async (proposalId: number) => {
    await trocApi.acceptProposal(proposalId)
    await Promise.all([refetchMessages(), refetchConversations()])
  }
  const handleDeclineTrocProposal = async (proposalId: number) => {
    await trocApi.declineProposal(proposalId)
    await Promise.all([refetchMessages(), refetchConversations()])
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="h-[calc(100dvh-88px)] min-h-[540px] animate-pulse bg-cream" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
          <MessageCircle className="text-info-text" size={34} />
          <h1 className="mt-5 font-display text-4xl text-ink">Connectez-vous pour consulter vos discussions</h1>
          <p className="mt-4 text-ink/65">Retrouvez vos messages, offres et pièces jointes depuis votre espace sécurisé.</p>
          <Link href="/connexion?next=/messages" className="mt-6 inline-flex min-h-11 items-center rounded-control bg-accent-strong px-5 font-semibold text-cream-surface">Se connecter</Link>
        </main>
      </div>
    )
  }

  const renderThread = () => {
    if (!activeConversation) {
      return (
        <div className="flex h-full items-center justify-center bg-cream-surface p-8 text-center">
          <div className="max-w-sm"><MessageCircle className="mx-auto text-info-text" size={34} /><h2 className="mt-4 font-display text-3xl text-ink">Sélectionnez une discussion</h2><p className="mt-3 text-sm leading-6 text-ink/65">Choisissez un échange dans la liste pour afficher les messages.</p></div>
        </div>
      )
    }

    const blocked = activeConversation.status === 'blocked'
    const trocConversation = isTrocConversation(activeConversation)

    return (
      <div className="flex h-full min-h-0 flex-col bg-cream-surface">
        <header className="flex shrink-0 items-center gap-3 border-b border-warm-border px-4 py-3 sm:px-5">
          <button type="button" onClick={() => setThreadOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-control text-ink lg:hidden" aria-label="Retour aux discussions"><ArrowLeft aria-hidden="true" size={20} /></button>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-info text-sm font-bold text-cream-surface">
            {activeConversation.other_user.avatar_url ? <Image src={activeConversation.other_user.avatar_url} alt="" width={44} height={44} className="h-full w-full object-cover" /> : `${activeConversation.other_user.prenom[0] ?? ''}${activeConversation.other_user.nom[0] ?? ''}`}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="truncate font-semibold text-ink">{activeConversation.other_user.prenom} {activeConversation.other_user.nom}</p>{activeConversation.other_user.telephone_verifie && <BadgeCheck aria-label="Numéro vérifié" size={16} className="shrink-0 text-info-text" />}</div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/60"><span className={`h-2 w-2 rounded-full ${participant?.is_online ? 'bg-reef' : 'bg-ink/25'}`} />{participant?.is_online ? 'En ligne' : participant?.last_seen_label ?? 'Hors ligne'}{typing && ' · écrit…'}</p>
          </div>
          <span className="hidden text-xs text-ink/50 sm:block">{connected ? 'Connecté' : connectionState === 'reconnecting' ? `Reconnexion ${Math.max(1, Math.ceil((reconnectInMs ?? 1000) / 1000))} s` : 'Hors ligne'}</span>
          <button type="button" onClick={() => setContextOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-control border border-warm-border text-ink xl:hidden" aria-label="Afficher le contexte"><PanelRightOpen aria-hidden="true" size={19} /></button>
        </header>

        <div className="flex shrink-0 items-center gap-3 border-b border-warm-border bg-cream px-4 py-3 sm:px-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-control bg-cream-sunken text-ink/35">
            {activeConversation.annonce.image ? <Image src={activeConversation.annonce.image} alt="" width={44} height={44} className="h-full w-full object-cover" /> : <ImageIcon aria-hidden="true" size={18} />}
          </span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-ink/55">{conversationRole(activeConversation, currentUserId)}</p><p className="truncate font-semibold text-ink">{activeConversation.annonce.titre}</p></div>
          <p className="hidden shrink-0 font-display text-2xl text-ink sm:block">{formatMoney(activeConversation.annonce.prix)}</p>
          <Link href={`/annonces/${activeConversation.annonce.id}`} className="shrink-0 px-2 py-2 text-sm font-semibold text-ink underline">Voir l’annonce</Link>
        </div>

        {trocConversation && <div className="flex shrink-0 items-center gap-2 border-b border-warm-border bg-accent/10 px-5 py-2 text-sm font-semibold text-accent-text"><ArrowLeftRight aria-hidden="true" size={16} />Discussion liée à une proposition de troc</div>}
        {inactiveListing && <div className="shrink-0 border-b border-warm-border bg-alert-warn/10 px-5 py-2 text-sm text-alert-warn">L’annonce n’est plus active. La discussion reste disponible.</div>}

        <div ref={messageListRef} role="log" aria-live="polite" aria-label="Messages de la discussion" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
          {hasMore && <div className="mb-4 text-center"><button type="button" onClick={handleLoadMore} className="min-h-11 px-4 text-sm font-semibold text-info-text">Charger les messages précédents</button></div>}
          {msgsLoading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className={`h-11 animate-pulse rounded-card bg-cream-sunken ${index % 2 ? 'ml-auto w-2/5' : 'w-1/2'}`} />)}</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center"><div><p className="font-semibold text-ink">Aucun message pour l’instant</p><p className="mt-2 text-sm text-ink/60">Écrivez votre premier message.</p></div></div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => {
                const currentDay = new Date(message.created_at).toDateString()
                const previousDay = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null
                return <div key={message.id}>{currentDay !== previousDay && <div className="my-4 flex justify-center"><span className="rounded-pill bg-cream-sunken px-3 py-1 text-xs font-semibold text-ink/60">{dayLabel(message.created_at)}</span></div>}<MessageBubble message={message} isMine={Number(message.sender_id) === Number(currentUserId)} isSeller={isSeller} onAcceptOffer={(id) => handleRespondOffer(id, 'accepted')} onDeclineOffer={(id) => handleRespondOffer(id, 'declined')} onCounterOffer={(id) => { const offer = messages.find((item) => item.offer?.id === id)?.offer; if (offer) setCounterOffer({ offer_id: id, amount: offer.amount_xpf }) }} onAcceptTrocProposal={handleAcceptTrocProposal} onDeclineTrocProposal={handleDeclineTrocProposal} /></div>
              })}
            </div>
          )}
        </div>

        {blocked ? (
          <div className="shrink-0 border-t border-warm-border bg-cream px-5 py-4 text-center text-sm font-semibold text-ink">Vous avez bloqué cette personne.</div>
        ) : (
          <ChatInput onSendText={sendMessage} onSendPhoto={sendPhoto} onSendDocument={sendDocument} onSendAudio={sendAudio} onMakeOffer={makeOffer} onTyping={onTyping} isBuyer={isBuyer} annoncePrix={activeConversation.annonce.prix} disabled={false} />
        )}
      </div>
    )
  }

  const filters: Array<{ id: ConversationFilter; label: string }> = [
    { id: 'all', label: 'Tous' }, { id: 'unread', label: 'Non lus' }, { id: 'buy', label: 'Achats' }, { id: 'sell', label: 'Ventes' }, { id: 'troc', label: 'Troc' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="h-[calc(100dvh-88px)] min-h-[540px] overflow-hidden bg-cream">
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[392px_minmax(0,1fr)_344px]">
        <aside className={`${threadOpen ? 'hidden' : 'flex'} min-h-0 flex-col border-r border-warm-border bg-cream lg:flex`}>
          <div className="shrink-0 px-5 pb-3 pt-5">
            <p className="text-eyebrow text-accent-text">Messagerie</p>
            <div className="mt-1 flex items-end justify-between gap-3"><h1 className="font-display text-3xl text-ink">Mes discussions</h1><span className="text-sm font-semibold text-ink/55">{convs.reduce((sum, item) => sum + item.unread_count, 0)} non lus</span></div>
            <label className="mt-4 flex min-h-11 items-center gap-2 rounded-control border border-warm-border bg-cream-surface px-3 text-ink">
              <Search aria-hidden="true" size={17} className="text-ink/45" /><span className="sr-only">Rechercher une discussion</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Personne ou annonce" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink/40" />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filtres de discussions">
              {filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`h-9 shrink-0 rounded-pill border px-3 text-sm font-semibold ${filter === item.id ? 'border-ink-deep bg-ink-deep text-cream-surface' : 'border-warm-border text-ink hover:bg-cream-sunken'}`}>{item.label}</button>)}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-warm-border">
            {convsError ? <div className="p-6 text-center"><Info className="mx-auto text-alert-error" size={22} /><p className="mt-3 text-sm font-semibold text-ink">Impossible de charger les discussions.</p><button type="button" onClick={() => refetchConversations()} className="mt-3 min-h-11 px-4 text-sm font-semibold text-info-text">Réessayer</button></div> : <ConversationRail conversations={filteredConversations} activeId={activeConvId ?? undefined} currentUserId={currentUserId} loading={convsLoading} emptyLabel={convs.length > 0 ? 'Aucune discussion ne correspond.' : undefined} onSelect={(conversation) => { setActiveConvId(conversation.id); setThreadOpen(true) }} />}
          </div>
        </aside>

        <main className={`${threadOpen ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col lg:flex`}>{renderThread()}</main>
        <aside className="hidden min-h-0 border-l border-warm-border xl:block"><ContextPanel conversation={activeConversation} participant={participant} attachments={attachments} /></aside>
        </div>

        {contextOpen && <div className="fixed inset-0 z-50 xl:hidden"><button type="button" className="absolute inset-0 bg-ink-deep/40" onClick={() => setContextOpen(false)} aria-label="Fermer le contexte" /><aside className="absolute bottom-0 right-0 top-0 w-[min(92vw,360px)] border-l border-warm-border shadow-modal"><ContextPanel conversation={activeConversation} participant={participant} attachments={attachments} onClose={() => setContextOpen(false)} /></aside></div>}

        {counterOffer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/45 px-4" onClick={() => setCounterOffer(null)}><div className="w-full max-w-sm rounded-block bg-cream-surface p-6 shadow-modal" onClick={(event) => event.stopPropagation()}><h3 className="font-display text-2xl text-ink">Faire une contre-offre</h3><p className="mt-2 text-sm text-ink/60">Offre reçue : {counterOffer.amount.toLocaleString('fr-FR')} XPF</p><div className="mt-5 flex gap-2"><button type="button" className="min-h-11 flex-1 rounded-control bg-cream-sunken font-semibold text-ink" onClick={() => setCounterOffer(null)}>Annuler</button><button type="button" className="min-h-11 flex-1 rounded-control bg-accent-strong font-semibold text-cream-surface" onClick={() => handleRespondOffer(counterOffer.offer_id, 'countered', Math.round(counterOffer.amount * 1.1))}>Envoyer</button></div></div></div>}
      </div>
    </div>
  )
}
