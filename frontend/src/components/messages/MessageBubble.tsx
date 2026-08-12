'use client'

import ListingImage from '@/components/ListingImage'
import { Check, CheckCheck, Clock, AlertCircle, TrendingUp, Play, FileText, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Message, MessageMetadata } from '@/types/messaging.types'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  isSeller: boolean
  onAcceptOffer: (offer_id: number) => void
  onDeclineOffer: (offer_id: number) => void
  onCounterOffer: (offer_id: number) => void
  onAcceptTrocProposal?: (proposal_id: number) => void
  onDeclineTrocProposal?: (proposal_id: number) => void
}

function getProposalMetadata(message: Message) {
  return (message.metadata ?? {}) as MessageMetadata
}

function TextBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const receivedClass = 'bg-nc-lagonLight border border-nc-lagonBorder text-nc-lagonText'
  const sentClass = 'bg-kalico-blue text-white'
  const documentLabel = message.attachment_name || 'Document partagï¿½'
  const documentUrl = message.attachment_download_url || message.attachment_url || '#'
  const documentMime = (message.attachment_mime_type || '').toLowerCase()
  const documentIsImage = documentMime.startsWith('image/')
  const documentIsPdf = documentMime === 'application/pdf'

  return (
    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
      {message.type === 'document' && (message.attachment_download_url || message.attachment_url) && (
        <div className={`overflow-hidden rounded-2xl border ${isMine ? 'border-kalico-blue/30 bg-kalico-blue text-white' : 'border-nc-lagonBorder bg-white text-night'}`}>
          {(documentIsImage || documentIsPdf) && (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block ${documentIsImage ? 'bg-black/5' : 'bg-sand/50'}`}
            >
              {documentIsImage ? (
                <img
                  src={documentUrl}
                  alt={documentLabel}
                  className="max-h-[220px] w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center">
                  <div className={`rounded-2xl border px-4 py-3 ${isMine ? 'border-white/20 bg-white/10' : 'border-night/10 bg-white'}`}>
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                      <FileText size={16} />
                      Aperï¿½u PDF
                    </div>
                    <p className={`mt-1 text-[11px] ${isMine ? 'text-white/75' : 'text-night/50'}`}>
                      Ouvrez pour consulter le document
                    </p>
                  </div>
                </div>
              )}
            </a>
          )}

          <div className="border-t border-current/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isMine ? 'bg-white/15 text-white' : 'bg-nc-emeraudeLight text-nc-emeraudeText'}`}>
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{documentLabel}</p>
                <p className={`truncate text-[11px] ${isMine ? 'text-white/70' : 'text-night/45'}`}>
                  {message.attachment_mime_type || 'Document'}
                </p>
              </div>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  isMine ? 'border-white/20 bg-white/10 text-white hover:bg-white/15' : 'border-night/10 bg-white text-night/50 hover:text-kalico-blue'
                }`}
                aria-label={`Ouvrir ${documentLabel}`}
                title={`Ouvrir ${documentLabel}`}
              >
                <ExternalLink size={15} />
              </a>
            </div>

            <a
              href={documentUrl}
              download
              className={`mt-3 inline-flex items-center gap-2 text-xs font-medium transition-colors ${
                isMine ? 'text-white/90 hover:text-white' : 'text-kalico-blue hover:text-kalico-blue-dark'
              }`}
            >
              <ExternalLink size={13} />
              Tï¿½lï¿½charger le fichier
            </a>
          </div>
        </div>
      )}

      {message.type === 'photo' && message.photo_url && (
        <a href={message.photo_url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={message.photo_url}
            alt="Photo partagï¿½e"
            className={`max-h-[240px] max-w-[240px] cursor-pointer rounded-2xl object-cover ${
              isMine ? 'rounded-br-sm' : 'rounded-bl-sm border border-nc-lagonBorder'
            }`}
          />
        </a>
      )}

      {message.type === 'audio' && message.photo_url && (
        <div className={`w-full min-w-[240px] rounded-2xl px-3.5 py-3 ${isMine ? sentClass : receivedClass} ${message.pending ? 'opacity-60' : ''}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${isMine ? 'bg-white/15 text-white' : 'bg-white text-nc-lagonText'}`}>
              <Play size={14} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Message vocal</p>
              <p className={`text-[10px] ${isMine ? 'text-white/65' : 'text-nc-lagonText/70'}`}>Appuyez sur lecture</p>
            </div>
          </div>
          <audio controls src={message.photo_url} className="w-full" />
        </div>
      )}

      {message.type === 'text' && message.content && (
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isMine ? `${sentClass} rounded-br-sm` : `${receivedClass} rounded-bl-sm`
        } ${message.pending ? 'opacity-60' : ''} ${message.failed ? 'border border-red-200 bg-red-50 text-red-700' : ''}`}>
          {message.content}
        </div>
      )}

      <div className={`flex items-center gap-1 text-[10px] text-night/35 ${isMine ? 'flex-row-reverse' : ''}`}>
        <span>{format(parseISO(message.created_at), 'HH:mm', { locale: fr })}</span>
        {isMine && (
          message.failed ? <AlertCircle size={10} className="text-red-400" /> :
          message.pending ? <Clock size={10} /> :
          message.read_at ? <CheckCheck size={10} className="text-sky-500" /> :
          <Check size={10} />
        )}
      </div>
    </div>
  )
}

function OfferBubble({
  message,
  isMine,
  isSeller,
  onAccept,
  onDecline,
  onCounter,
}: {
  message: Message
  isMine: boolean
  isSeller: boolean
  onAccept: () => void
  onDecline: () => void
  onCounter: () => void
}) {
  const offer = message.offer!
  const isPending = offer.status === 'pending'

  const statusConfig = {
    pending: { label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    accepted: { label: 'Acceptï¿½e', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    declined: { label: 'Refusï¿½e', color: 'text-red-600 bg-red-50 border-red-200' },
    countered: { label: 'Contre-offre', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    expired: { label: 'Expirï¿½e', color: 'text-night/40 bg-sand border-night/10' },
  } as const
  const s = statusConfig[offer.status]

  return (
    <div className={`max-w-[280px] overflow-hidden rounded-2xl border-2 bg-white ${isPending ? 'border-kalico-blue/30' : 'border-night/10'}`}>
      <div className="flex items-center gap-2 border-b border-kalico-blue/10 bg-kalico-blue/5 px-4 py-3">
        <TrendingUp size={16} className="text-kalico-blue" />
        <span className="text-sm font-semibold text-night">Offre de prix</span>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.color}`}>
          {s.label}
        </span>
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-3xl font-bold text-kalico-blue">
          {offer.amount_xpf.toLocaleString('fr-FR')} XPF
        </p>
        {offer.expires_at && isPending && (
          <p className="mt-1 text-[10px] text-night/40">
            Expire le {format(parseISO(offer.expires_at), 'd MMM ï¿½ HH:mm', { locale: fr })}
          </p>
        )}
      </div>

      {isPending && !isMine && isSeller && (
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onAccept} className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600">
            Accepter
          </button>
          <button onClick={onCounter} className="flex-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100">
            Contrer
          </button>
          <button onClick={onDecline} className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100">
            Refuser
          </button>
        </div>
      )}
    </div>
  )
}

function TrocProposalBubble({
  message,
  isMine,
  isSeller,
  onAccept,
  onDecline,
}: {
  message: Message
  isMine: boolean
  isSeller: boolean
  onAccept?: () => void
  onDecline?: () => void
}) {
  const metadata = getProposalMetadata(message)
  const proposalId = Number(metadata.proposal_id ?? metadata.troc_proposal_id ?? 0) || null
  const proposerTitle = String(metadata.proposer_listing_title ?? 'Mon annonce')
  const targetTitle = String(metadata.target_listing_title ?? 'Annonce cible')
  const proposerPrice = metadata.proposer_listing_price != null ? Number(metadata.proposer_listing_price) : null
  const targetPrice = metadata.target_listing_price != null ? Number(metadata.target_listing_price) : null
  const proposerImage = String(metadata.proposer_listing_image ?? '')
  const targetImage = String(metadata.target_listing_image ?? '')
  const status = String(metadata.status ?? 'pending')
  const isPending = status === 'pending' || status === 'seen'
  const statusConfig = {
    pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
    seen: { label: 'Vue', className: 'bg-sand text-night/55' },
    accepted: { label: 'Troc acceptï¿½', className: 'bg-emerald-50 text-emerald-700' },
    declined: { label: 'Proposition dï¿½clinï¿½e', className: 'bg-red-50 text-red-700' },
    countered: { label: 'Contre-proposition', className: 'bg-blue-50 text-blue-700' },
    completed: { label: 'Troc finalisï¿½', className: 'bg-jungle/10 text-jungle' },
  } as const
  const statusMeta = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-kalico-blue/15 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-kalico-blue/10 bg-kalico-blue/5 px-4 py-3">
        <TrendingUp size={16} className="text-kalico-blue" />
        <span className="text-sm font-semibold text-night">Proposition de troc</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.className}`}>
          {isMine && isPending ? 'En attente de rï¿½ponse&' : statusMeta.label}
        </span>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-2xl border border-night/10 bg-sand/30 p-2">
          <div className="relative h-24 overflow-hidden rounded-2xl bg-sand">
            <ListingImage
              src={proposerImage || null}
              alt={proposerTitle}
              fallbackIcon="=ï¿½"
              className="h-full w-full"
            />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-night">{proposerTitle}</p>
          <p className="mt-1 text-sm font-bold text-[#0A7EA4]">
            {proposerPrice != null ? `${proposerPrice.toLocaleString('fr-FR')} XPF` : 'Prix non communiquï¿½'}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-kalico-blue/10 text-kalico-blue">
            ï¿½
          </div>
        </div>

        <div className="rounded-2xl border border-night/10 bg-sand/30 p-2">
          <div className="relative h-24 overflow-hidden rounded-2xl bg-sand">
            <ListingImage
              src={targetImage || null}
              alt={targetTitle}
              fallbackIcon="="
              className="h-full w-full"
            />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-night">{targetTitle}</p>
          <p className="mt-1 text-sm font-bold text-[#0A7EA4]">
            {targetPrice != null ? `${targetPrice.toLocaleString('fr-FR')} XPF` : 'Prix non communiquï¿½'}
          </p>
        </div>
      </div>

      {message.content ? (
        <div className="px-4 pb-4">
          <div className="rounded-2xl bg-sand/40 px-3 py-2 text-sm leading-relaxed text-night/70">
            {message.content}
          </div>
        </div>
      ) : null}

      {!isMine && isSeller && proposalId && isPending ? (
        <div className="flex gap-2 border-t border-night/8 px-4 py-4">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
             Accepter
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-2xl border border-night/10 bg-white px-3 py-2.5 text-sm font-semibold text-night transition hover:border-kalico-blue/25 hover:text-kalico-blue"
          >
             Refuser
          </button>
        </div>
      ) : (
        <div className="border-t border-night/8 px-4 py-3 text-sm text-night/55">
          {status === 'accepted'
            ? ' Troc acceptï¿½'
            : status === 'declined'
              ? 'L Proposition dï¿½clinï¿½e'
              : isMine
                ? 'En attente de rï¿½ponse&'
                : 'Rï¿½ponse traitï¿½e'}
        </div>
      )}
    </div>
  )
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="py-1 text-center">
      <span className="rounded-full bg-sand px-3 py-1 text-[11px] text-night/40">
        {content}
      </span>
    </div>
  )
}

export default function MessageBubble({
  message,
  isMine,
  isSeller,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  onAcceptTrocProposal,
  onDeclineTrocProposal,
}: MessageBubbleProps) {
  if (message.type === 'system') {
    return <SystemMessage content={message.content ?? ''} />
  }

  return (
    <div className={`mb-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'offer'
        ? (
          <OfferBubble
            message={message}
            isMine={isMine}
            isSeller={isSeller}
            onAccept={() => onAcceptOffer(message.offer!.id)}
            onDecline={() => onDeclineOffer(message.offer!.id)}
            onCounter={() => onCounterOffer(message.offer!.id)}
          />
        )
        : (message.type === 'troc_proposal' || Boolean(message.metadata?.proposer_listing_id))
          ? (
            <TrocProposalBubble
              message={message}
              isMine={isMine}
              isSeller={isSeller}
              onAccept={() => {
                const proposalId = Number(message.metadata?.proposal_id ?? message.metadata?.troc_proposal_id ?? 0)
                if (proposalId && onAcceptTrocProposal) onAcceptTrocProposal(proposalId)
              }}
              onDecline={() => {
                const proposalId = Number(message.metadata?.proposal_id ?? message.metadata?.troc_proposal_id ?? 0)
                if (proposalId && onDeclineTrocProposal) onDeclineTrocProposal(proposalId)
              }}
            />
          )
        : <TextBubble message={message} isMine={isMine} />
      }
    </div>
  )
}
