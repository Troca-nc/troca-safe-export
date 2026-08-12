'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeftRight, HeartHandshake, MapPin } from 'lucide-react'

import ListingImage from '@/components/ListingImage'

export type TrocometerListing = {
  id: string | number
  title: string
  titre?: string | null
  price?: number | string | null
  price_xpf?: number | string | null
  commune_name?: string | null
  location_name?: string | null
  cover_image?: string | null
  photos?: string[] | null
  troc_status?: string | null
  seller_prenom?: string | null
  seller_nom?: string | null
}

type TrocometerCardProps = {
  listing: TrocometerListing
  delayMs?: number
  fadeOut?: boolean
  onPropose?: (listing: TrocometerListing) => void
}

function getListingPrice(listing: TrocometerListing) {
  const rawPrice = listing.price ?? listing.price_xpf ?? 0
  const numeric = Number(rawPrice)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat('fr-FR').format(price)} XPF`
}

export default function TrocometerCard({ listing, delayMs = 0, fadeOut = false, onPropose }: TrocometerCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (fadeOut) {
      setVisible(false)
      return
    }

    const timer = window.setTimeout(() => {
      setVisible(true)
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [delayMs, fadeOut, listing.id])

  const price = getListingPrice(listing)
  const locationLabel = listing.commune_name || listing.location_name || 'Nouvelle-CalÃ©donie'
  const image = listing.cover_image ?? listing.photos?.[0] ?? null

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        visible && !fadeOut ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <ListingImage
          src={image}
          alt={listing.title}
          fallbackIcon="="
          className="h-full w-full"
          imgClassName="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
          Troc possible
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-night group-hover:text-kalico-blue">
            {listing.title}
          </h3>
          <p className="mt-2 text-sm font-bold text-nc-lagon">
            {formatPrice(price)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-night/60">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onPropose?.(listing)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-kalico-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-kalico-blue/90"
          >
            Proposer un troc
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <Link
            href={`/annonces/${listing.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night transition hover:border-kalico-blue/30 hover:text-kalico-blue"
          >
            Contacter
            <HeartHandshake className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
