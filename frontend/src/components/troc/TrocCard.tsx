'use client'

import Link from 'next/link'
import { ArrowRight, BadgeCheck, HeartHandshake, MoveRight } from 'lucide-react'
import ListingImage from '@/components/ListingImage'
import type { TrocCompatibility } from '@/types/troc'
import TrocCompatibilityMeter from '@/components/troc/TrocCompatibilityMeter'

type TrocCardListing = {
  id: number | string
  title: string
  troc_wants: string[]
  troc_accepts_complement_xpf: boolean
  troc_complement_max_xpf: number
  troc_status?: string
  cover_image?: string | null
  photos?: string[] | null
  category_name?: string | null
  category_icon?: string | null
  seller_prenom?: string | null
  seller_nom?: string | null
  is_pro?: boolean
  seller_email_verified?: boolean
  seller_phone_verified?: boolean
  seller_trust_score?: number | null
  seller_troc_badges?: string[] | null
  user?: {
    prenom?: string | null
    nom?: string | null
    troc_badges?: string[] | null
  }
  compatibility?: TrocCompatibility | null
}

type Props = {
  listing: TrocCardListing & {
    commune_name?: string | null
  }
  compatibility?: TrocCompatibility | null
  mode?: 'grid' | 'swipe'
}

function formatComplement(listing: Props['listing']) {
  if (!listing.troc_accepts_complement_xpf || !listing.troc_complement_max_xpf) return null
  return `Jusqu’à ${Number(listing.troc_complement_max_xpf).toLocaleString('fr-FR')} XPF de complément`
}

function formatWants(values: string[]) {
  if (!Array.isArray(values) || values.length === 0) return []
  return values.slice(0, 3)
}

export default function TrocCard({ listing, compatibility = listing.compatibility ?? null, mode = 'grid' }: Props) {
  const wants = formatWants(listing.troc_wants)
  const complement = formatComplement(listing)
  const ownerName = [listing.user?.prenom, listing.user?.nom, listing.seller_prenom, listing.seller_nom]
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
    .trim() || 'Troceur'
  const trocBadges = listing.user?.troc_badges ?? listing.seller_troc_badges ?? []
  const href = `/troc/${listing.id}`

  return (
    <article className={`group overflow-hidden rounded-[1.5rem] border border-night/8 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${mode === 'swipe' ? 'max-w-2xl' : ''}`}>
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand">
          <ListingImage
            src={listing.cover_image ?? listing.photos?.[0] ?? null}
            alt={listing.title}
            fallbackIcon="🔄"
            sizes="(max-width: 640px) 100vw, 50vw"
            imgClassName="group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-night/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              🔄 Troc
            </span>
            {listing.category_name ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/70">
                {listing.category_name}
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <TrocCompatibilityMeter compatibility={compatibility} emptyLabel="Connectez-vous pour voir votre compatibilité" />
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral/80">{ownerName}</p>
              <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-night group-hover:text-coral">
                {listing.title}
              </h3>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-night/10 bg-sand text-night/60">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-night/60">
            {wants.map((want) => (
              <span key={want} className="rounded-full bg-night/5 px-2.5 py-1 font-medium">
                {want}
              </span>
            ))}
            {listing.troc_wants.length > wants.length ? (
              <span className="rounded-full bg-night/5 px-2.5 py-1 font-medium">
                +{listing.troc_wants.length - wants.length} autre{listing.troc_wants.length - wants.length > 1 ? 's' : ''}
              </span>
            ) : null}
          </div>

          {complement ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              <MoveRight className="h-4 w-4" />
              {complement}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-night/55">
            {trocBadges.length ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-ocean/15 bg-ocean/10 px-2.5 py-1 font-medium text-ocean">
                <BadgeCheck className="h-3.5 w-3.5" />
                Troceur
              </span>
            ) : null}
            {listing.troc_status !== 'open' ? (
              <span className="rounded-full bg-night/5 px-2.5 py-1 font-medium text-night/50">
                {listing.troc_status}
              </span>
            ) : null}
          </div>

          <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-coral/90">
            Proposer un échange
            <HeartHandshake className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </article>
  )
}
