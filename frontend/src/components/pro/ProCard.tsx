'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin, Quote, Store, ArrowRight } from 'lucide-react'

export type ProCardModel = {
  id: string | number
  prenom?: string | null
  nom?: string | null
  display_name?: string | null
  pro_company_name?: string | null
  pro_category?: string | null
  pro_logo_url?: string | null
  pro_banner_url?: string | null
  pro_description?: string | null
  pro_commune?: string | null
  pro_website?: string | null
  pro_phone?: string | null
  pro_hours?: string | null
  pro_quote_template?: unknown
  avg_rating?: number | null
  review_count?: number | null
  listing_count?: number | null
  is_pro?: boolean
  pro_verified?: boolean
  latest_review_comment?: string | null
  latest_review_rating?: number | null
  latest_review_prenom?: string | null
  latest_review_created_at?: string | null
}

function getDisplayName(pro: ProCardModel) {
  return (
    pro.display_name
    || pro.pro_company_name
    || [pro.prenom, pro.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Kalico'
  )
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'P'
}

function formatRating(value?: number | null) {
  const rating = Number(value ?? 0)
  if (!Number.isFinite(rating) || rating <= 0) return '0.0'
  return rating.toFixed(1)
}

export default function ProCard({ pro }: { pro: ProCardModel }) {
  const displayName = getDisplayName(pro)
  const initials = getInitials(displayName)
  const rating = Number(pro.avg_rating ?? 0)
  const reviewCount = Number(pro.review_count ?? 0)
  const listingCount = Number(pro.listing_count ?? 0)

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-20 overflow-hidden bg-[linear-gradient(135deg,_rgba(8,32,50,0.95),_rgba(10,126,164,0.45))]">
        {pro.pro_banner_url ? (
          <Image
            src={pro.pro_banner_url}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <div className="-mt-6 px-4 pb-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
              {pro.pro_logo_url ? (
                <Image
                  src={pro.pro_logo_url}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-[#0A7EA4]">{initials}</span>
              )}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Pro
          </span>
        </div>

        <h3 className="text-base font-semibold text-night">{displayName}</h3>
        <p className="mt-1 text-xs text-night/60">{pro.pro_category || 'Professionnel local'}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5 text-coral" />
            {pro.pro_commune || 'Nouvelle-Calédonie'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <BadgeCheck className="h-3.5 w-3.5 text-amber-500" />
            {formatRating(rating)} ({reviewCount} avis)
          </span>
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-night/45">
            <Store className="h-3.5 w-3.5 text-[#0A7EA4]" />
            Vitrine locale
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-night/65">
            {pro.pro_description || 'Découvrez ce professionnel local sur Kalico.'}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-night/55">
            <span>{listingCount} annonce{listingCount > 1 ? 's' : ''} active{listingCount > 1 ? 's' : ''}</span>
            <Link href={`/pro/${pro.id}`} className="inline-flex items-center gap-1 font-semibold text-[#0A7EA4] transition hover:underline">
              Voir la vitrine
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {pro.latest_review_comment ? (
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <Quote className="h-3.5 w-3.5" />
              Dernier avis
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-night/70">
              {pro.latest_review_comment}
            </p>
            <p className="mt-2 text-xs text-night/50">
              {pro.latest_review_prenom ? `Par ${pro.latest_review_prenom}` : 'Avis vérifié'}
              {pro.latest_review_rating ? ` · ${Number(pro.latest_review_rating).toFixed(1)}/5` : ''}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  )
}
