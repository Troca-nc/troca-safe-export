'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ExternalLink, Check } from 'lucide-react'

type BonPlanBusiness = {
  id?: string | number | null
  name?: string | null
  slug?: string | null
  logo_url?: string | null
  badge?: 'none' | 'active' | 'verified' | string | null
  review_avg?: number | null
  review_count?: number | null
}

export type BonPlanCardModel = {
  id: string | number
  title: string
  description: string
  image_url?: string | null
  promo_label?: string | null
  original_price_xpf?: number | null
  promo_price_xpf?: number | null
  cta_label?: string | null
  cta_url?: string | null
  category?: string | null
  published_until?: string | null
  business_name?: string | null
  business_logo_url?: string | null
  business_badge?: string | null
  business_review_avg?: number | null
  business_review_count?: number | null
  business?: BonPlanBusiness | null
}

type Props = {
  bonPlan: BonPlanCardModel
  compact?: boolean
  onFollowBusiness?: (businessName: string) => void
}

function formatPrice(value?: number | null) {
  if (value == null) return null
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function daysLeftLabel(value?: string | null) {
  if (!value) return 'Bientôt fini'
  const end = new Date(value)
  if (Number.isNaN(end.getTime())) return 'Bientôt fini'
  const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000))
  return days <= 0 ? 'Terminé' : `Plus que ${days} jour${days > 1 ? 's' : ''}`
}

export default function BonPlanCard({ bonPlan, compact = false, onFollowBusiness }: Props) {
  const business = bonPlan.business || {
    name: bonPlan.business_name,
    slug: bonPlan.business_name ? bonPlan.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null,
    logo_url: bonPlan.business_logo_url,
    badge: bonPlan.business_badge ?? 'none',
    review_avg: bonPlan.business_review_avg ?? 0,
    review_count: bonPlan.business_review_count ?? 0,
  }

  const priceBefore = formatPrice(bonPlan.original_price_xpf)
  const priceAfter = formatPrice(bonPlan.promo_price_xpf)
  const isEndedSoon = bonPlan.published_until ? daysLeftLabel(bonPlan.published_until) : 'Disponible'
  const targetHref = bonPlan.cta_url || `/bons-plans/${bonPlan.id}`

  return (
    <article className={`overflow-hidden rounded-[1.5rem] border border-night/8 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${compact ? 'h-full' : ''}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-sand">
        {bonPlan.image_url ? (
          <Image src={bonPlan.image_url} alt={bonPlan.title} fill className="object-cover" sizes="(max-width: 640px) 90vw, 33vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">🏷️</div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {bonPlan.category ? (
            <span className="rounded-full bg-night/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {bonPlan.category.replace('_', ' ')}
            </span>
          ) : null}
          <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
            {isEndedSoon}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-end gap-2">
          {business?.logo_url ? (
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
              <Image src={business.logo_url} alt={business.name || 'Enseigne'} fill className="object-cover" sizes="44px" />
            </div>
          ) : null}
          {business?.badge === 'verified' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-coral shadow-sm">
              <Check className="h-3 w-3" />
              Vérifié Troca
            </span>
          ) : business?.badge === 'active' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-ocean/15 bg-ocean/10 px-2.5 py-1 text-[11px] font-semibold text-ocean shadow-sm">
              🔵 Actif
            </span>
          ) : null}
        </div>
      </div>

      <div className={`p-4 ${compact ? 'space-y-3' : 'space-y-3'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {business?.slug ? (
              <Link href={`/bons-plans/enseigne/${business.slug}`} className="block text-sm font-semibold text-night/75 hover:text-coral">
                {business?.name || bonPlan.business_name || 'Enseigne locale'}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-night/75">{business?.name || bonPlan.business_name || 'Enseigne locale'}</p>
            )}
            <h3 className="mt-1 line-clamp-2 text-base font-bold leading-tight text-night">{bonPlan.title}</h3>
          </div>
          {onFollowBusiness && business?.name ? (
            <button
              type="button"
              onClick={() => onFollowBusiness(business.name || '')}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-night/10 bg-white text-night/65 transition hover:border-coral/30 hover:text-coral"
              aria-label="Suivre cette enseigne"
            >
              <Heart className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-night/65">{bonPlan.description}</p>

        <div className="flex items-baseline gap-2">
          {priceBefore ? <span className="text-sm text-night/45 line-through">{priceBefore}</span> : null}
          {priceAfter ? <span className="text-lg font-bold text-night">{priceAfter}</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-night/55">
          {business?.review_count ? (
            <span className="rounded-full bg-sand px-2.5 py-1 font-medium">
              ⭐ {Number(business.review_avg || 0).toFixed(1)} ({Number(business.review_count)})
            </span>
          ) : null}
          {bonPlan.promo_label ? (
            <span className="rounded-full bg-sand px-2.5 py-1 font-medium">{bonPlan.promo_label}</span>
          ) : null}
        </div>

        <a
          href={targetHref}
          target={bonPlan.cta_url ? '_blank' : undefined}
          rel={bonPlan.cta_url ? 'noreferrer' : undefined}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          {bonPlan.cta_label || 'En profiter'}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  )
}
