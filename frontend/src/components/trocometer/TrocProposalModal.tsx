'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, CheckCircle2, Loader2 } from 'lucide-react'

import ListingImage from '@/components/ListingImage'
import { messagesApi, trocApi } from '@/lib/api'
import type { TrocometerListing } from '@/components/trocometer/TrocometerCard'

type TrocProposalModalProps = {
  open: boolean
  selectedListing: TrocometerListing | null
  targetListing: TrocometerListing | null
  onClose: () => void
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XPF`
}

function getListingPrice(listing: TrocometerListing | null) {
  if (!listing) return 0
  const raw = listing.price ?? listing.price_xpf ?? 0
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : 0
}

function getTitle(listing: TrocometerListing | null) {
  return listing?.title || listing?.titre || 'Annonce'
}

function getRecipientName(listing: TrocometerListing | null) {
  return [listing?.seller_prenom, listing?.seller_nom].filter(Boolean).join(' ').trim() || 'le vendeur'
}

function buildProposalMessage(selectedListing: TrocometerListing, targetListing: TrocometerListing) {
  const selectedTitle = getTitle(selectedListing)
  const targetTitle = getTitle(targetListing)
  const selectedPrice = formatPrice(getListingPrice(selectedListing))
  const targetPrice = formatPrice(getListingPrice(targetListing))

  return `Bonjour, je serais intéressé(e) par un échange de mon ${selectedTitle} (prix : ${selectedPrice}) contre votre ${targetTitle} (prix : ${targetPrice}). Êtes-vous d'accord pour un troc ?`
}

function encodeTrocProposalMessage(payload: {
  content: string
  metadata: Record<string, unknown>
}) {
  return `__TROC_PROPOSAL__::${JSON.stringify({
    type: 'troc_proposal',
    content: payload.content,
    metadata: payload.metadata,
  })}`
}

export default function TrocProposalModal({
  open,
  selectedListing,
  targetListing,
  onClose,
}: TrocProposalModalProps) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPrice = useMemo(() => getListingPrice(selectedListing), [selectedListing])
  const targetPrice = useMemo(() => getListingPrice(targetListing), [targetListing])
  const recipientName = useMemo(() => getRecipientName(targetListing), [targetListing])

  useEffect(() => {
    if (!open || !selectedListing || !targetListing) return
    setMessage(buildProposalMessage(selectedListing, targetListing))
    setError(null)
    setSubmitting(false)
    setSuccess(false)
  }, [open, selectedListing, targetListing])

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => {
      onClose()
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [onClose, success])

  if (!open || !selectedListing || !targetListing) return null

  const selectedImage = selectedListing.cover_image ?? selectedListing.photos?.[0] ?? null
  const targetImage = targetListing.cover_image ?? targetListing.photos?.[0] ?? null

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const proposalResponse = await trocApi.sendProposal(targetListing.id, {
        offered_listing_ids: [selectedListing.id],
        offered_description: `${getTitle(selectedListing)} — ${formatPrice(selectedPrice)}`,
        offered_photos: selectedImage ? [selectedImage] : [],
        complement_xpf: 0,
        complement_direction: 'none',
        message: message.trim(),
      })
      const proposal = proposalResponse?.data?.data ?? proposalResponse?.data ?? null

      await messagesApi.startConversation({
        listing_id: targetListing.id,
        message: encodeTrocProposalMessage({
          content: message.trim(),
          metadata: {
            proposal_id: proposal?.id ?? null,
            proposer_listing_id: selectedListing.id,
            target_listing_id: targetListing.id,
            proposer_listing_title: getTitle(selectedListing),
            target_listing_title: getTitle(targetListing),
            proposer_listing_price: selectedPrice,
            target_listing_price: targetPrice,
            proposer_listing_image: selectedImage,
            target_listing_image: targetImage,
            proposer_prenom: selectedListing.seller_prenom ?? null,
            target_prenom: targetListing.seller_prenom ?? null,
          },
        }),
      })

      setSuccess(true)
    } catch (err) {
      const fallback = 'Impossible d’envoyer la proposition pour le moment.'
      setError(err instanceof Error ? err.message || fallback : fallback)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={`w-full max-w-lg rounded-3xl bg-[var(--color-surface)] p-6 shadow-2xl transition-all duration-200 ${
          success ? 'scale-100 opacity-100' : 'scale-95 opacity-100'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-night">Proposition envoyée !</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              Vous serez notifié(e) dès que {recipientName} répondra à votre proposition.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary mt-6 inline-flex rounded-2xl px-5 py-3 text-sm"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Troc</p>
                <h3 className="text-2xl font-bold text-night">Proposer un troc</h3>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <div className="rounded-2xl border border-[var(--color-border)] p-3">
                <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-sand">
                  <ListingImage
                    src={selectedImage}
                    alt={getTitle(selectedListing)}
                    fallbackIcon="📦"
                    className="h-full w-full"
                    imgClassName="h-full w-full"
                  />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Mon annonce</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-night">{getTitle(selectedListing)}</p>
                <p className="mt-1 text-sm font-bold text-[#0A7EA4]">{formatPrice(selectedPrice)}</p>
              </div>

              <div className="flex items-center justify-center py-4 sm:py-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-coral/10 text-coral">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] p-3">
                <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-sand">
                  <ListingImage
                    src={targetImage}
                    alt={getTitle(targetListing)}
                    fallbackIcon="🔄"
                    className="h-full w-full"
                    imgClassName="h-full w-full"
                  />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Annonce cible</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-night">{getTitle(targetListing)}</p>
                <p className="mt-1 text-sm font-bold text-[#0A7EA4]">{formatPrice(targetPrice)}</p>
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-night">Message proposé</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
              />
            </label>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night transition hover:border-coral/25 hover:text-coral"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                {submitting ? 'Envoi en cours…' : 'Envoyer la proposition'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
