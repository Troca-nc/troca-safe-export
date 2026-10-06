'use client'

import { Check } from 'lucide-react'

import type { TrocListing } from '@/types/troc-page'

type Props = {
  listing: TrocListing
  selected: boolean
  onSelect: () => void
}

const formatXpf = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} F`

export default function TrocListingCardV2({ listing, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex min-w-0 flex-col overflow-hidden rounded-card border bg-cream-surface text-left text-ink transition duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected ? 'border-ink shadow-raised' : 'border-warm-border hover:border-ink'}`}
    >
      <span className="relative flex h-[150px] items-center justify-center overflow-hidden bg-cream-sunken">
        <span className="absolute inset-0 bg-tressage text-ink opacity-[0.045]" aria-hidden="true" />
        <span className="relative font-mono text-mono-xs text-ink/55">{listing.category}</span>
        {listing.compatibilityScore && listing.compatibilityScore > 0 ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-pill border border-reef/30 bg-cream-surface px-3 py-1 text-caption font-semibold text-reef-text">
            <Check className="h-3 w-3" strokeWidth={2.5} />
            {listing.compatibilityScore}% compatible
          </span>
        ) : null}
      </span>
      <span className="block w-full p-4 sm:px-[18px] sm:pb-[18px]">
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-h5">{listing.title}</span>
          <span className="shrink-0 font-display text-price-sm">{formatXpf(listing.valueXpf)}</span>
        </span>
        <span className="mt-1.5 block text-meta text-ink/65">{listing.sellerName} · {listing.commune}</span>
        <span className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-warm-border-inner pt-3">
          <span className="text-caption font-semibold text-ink/65">Cherche</span>
          {(listing.wants.length ? listing.wants : ['Propositions']).slice(0, 3).map((want) => (
            <span key={want} className="rounded-pill border border-warm-border bg-cream-sunken px-2.5 py-1 text-caption text-ink">{want}</span>
          ))}
        </span>
      </span>
    </button>
  )
}
