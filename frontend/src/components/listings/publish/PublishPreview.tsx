'use client'

import { CalendarDays, Car, MapPin, Sparkles } from 'lucide-react'

import ListingCard from '@/components/listings/ListingCard'
import type { ListingSearchItem } from '@/types/listings'
import type { PublishingDraft, PublishingMetadata } from '@/types/publishing'

function formatXpf(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString('fr-FR')} XPF` : 'Prix à préciser'
}

export default function PublishPreview({ draft, metadata }: { draft: PublishingDraft; metadata: PublishingMetadata | null }) {
  if (draft.kind === 'sale' || draft.kind === 'troc') {
    const category = metadata?.categories.find((item) => String(item.id) === draft.categoryId)
    const commune = metadata?.communes.find((item) => String(item.id) === draft.communeId)
    const listing: ListingSearchItem = {
      id: 'preview',
      type: draft.kind,
      title: draft.title.trim() || (draft.kind === 'troc' ? 'Votre objet à échanger' : 'Votre annonce'),
      price: Number(draft.priceXpf) || null,
      price_negotiable: draft.negotiable,
      is_free: false,
      condition: draft.condition,
      is_featured: false,
      is_urgent: false,
      is_troc: draft.kind === 'troc',
      contre_quoi: draft.trocWish || null,
      commune_name: commune?.name || 'Commune à préciser',
      category_name: category?.name || 'Catégorie',
      category_slug: category?.slug || 'annonce',
      seller_prenom: 'Votre',
      seller_nom: 'profil',
    }
    return (
      <div className="pointer-events-none" aria-label="Aperçu de la carte dans les résultats">
        <ListingCard listing={listing} />
      </div>
    )
  }

  if (draft.kind === 'carpool') {
    return (
      <div className="overflow-hidden rounded-card border border-sand bg-cream-surface shadow-card">
        <div className="motif-tressage bg-ink-deep p-5 text-cream">
          <Car className="h-5 w-5 text-accent" aria-hidden="true" />
          <div className="mt-5 grid grid-cols-[12px_1fr] gap-x-3 gap-y-2">
            <span className="mt-2 h-2.5 w-2.5 rounded-full border-2 border-accent" />
            <p className="font-display text-h3">{draft.departure || 'Départ'}</p>
            <span className="mx-auto h-5 w-px bg-cream/30" />
            <p className="text-meta text-cream/70">{draft.stops || 'Trajet direct'}</p>
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <p className="font-display text-h3">{draft.destination || 'Arrivée'}</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-eyebrow-sm font-semibold uppercase tracking-eyebrow-sm text-accent-text">Covoiturage</p>
          <p className="mt-3 font-display text-price text-ink">{formatXpf(draft.priceXpf)}</p>
          <p className="mt-2 text-meta text-ink/65">{draft.seats || '0'} place(s) · {draft.rideDate || 'Date à préciser'} à {draft.rideTime || '—'}</p>
        </div>
      </div>
    )
  }

  const commune = metadata?.communes.find((item) => String(item.id) === draft.communeId)?.name
  if (draft.kind === 'event') {
    return (
      <div className="rounded-card border border-sand bg-cream-surface p-5 shadow-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-control bg-lagoon/15 text-lagoon-text"><CalendarDays className="h-5 w-5" /></span>
        <p className="mt-5 text-eyebrow-sm font-semibold uppercase tracking-eyebrow-sm text-accent-text">Événement</p>
        <h3 className="mt-2 text-h4 font-semibold text-ink text-balance">{draft.title || 'Nom de l’événement'}</h3>
        <p className="mt-4 flex items-center gap-2 text-meta text-ink/65"><CalendarDays className="h-4 w-4" />{draft.eventDate || 'Date à préciser'} · {draft.eventTime || '—'}</p>
        <p className="mt-2 flex items-center gap-2 text-meta text-ink/65"><MapPin className="h-4 w-4" />{draft.venueName || commune || 'Lieu à préciser'}</p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-sand bg-cream-surface p-5 shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent-text"><Sparkles className="h-5 w-5" /></span>
      <p className="mt-5 text-eyebrow-sm font-semibold uppercase tracking-eyebrow-sm text-accent-text">Bon plan local</p>
      <h3 className="mt-2 text-h4 font-semibold text-ink text-balance">{draft.title || 'Titre de votre offre'}</h3>
      <p className="mt-2 text-body-sm text-ink/65">{draft.businessName || 'Votre commerce'}</p>
      <p className="mt-5 font-display text-price text-ink">
        {draft.discountMode === 'percentage' ? `−${draft.discountPercent || '0'} %` : draft.discountMode === 'gift' ? 'Offert' : formatXpf(draft.promoPriceXpf)}
      </p>
      <p className="mt-2 text-meta text-ink/65">{commune || (draft.channel === 'online' ? 'En ligne' : 'Commune à préciser')}</p>
    </div>
  )
}
