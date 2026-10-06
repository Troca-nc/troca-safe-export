'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, MessageSquareQuote, Star } from 'lucide-react'

import { ProBadge } from '@/components/ui/Badge'
import type { ProSummary } from '@/types/pro-public'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('fr-FR')).join('') || 'P'

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
  pro_quote_template?: unknown
  avg_rating?: number | null
  review_count?: number | null
  listing_count?: number | null
  latest_review_comment?: string | null
}

function cardModel(pro: ProSummary | ProCardModel): ProSummary {
  if ('name' in pro) return pro
  const name = pro.display_name || pro.pro_company_name || [pro.prenom, pro.nom].filter(Boolean).join(' ') || 'Professionnel Kalico'
  return {
    id: Number(pro.id), name, firstName: pro.prenom || '', lastName: pro.nom || '', companyName: pro.pro_company_name || '',
    category: pro.pro_category || 'Professionnel local', commune: pro.pro_commune || 'Nouvelle-Calédonie', description: pro.pro_description || '',
    logoUrl: pro.pro_logo_url || null, bannerUrl: pro.pro_banner_url || null, rating: Number(pro.avg_rating || 0), reviewCount: Number(pro.review_count || 0),
    listingCount: Number(pro.listing_count || 0), latestReview: pro.latest_review_comment || null, verified: true, quoteTemplate: pro.pro_quote_template,
  }
}

export default function ProCard({ pro }: { pro: ProSummary | ProCardModel }) {
  const model = cardModel(pro)
  return (
    <article className="group min-w-0 overflow-hidden rounded-card border border-sand bg-cream-surface shadow-card transition hover:-translate-y-0.5 hover:border-ink">
      <div className="relative h-[88px] overflow-hidden bg-ink">
        <div className="motif-tressage absolute inset-0 opacity-30" aria-hidden="true" />
        {model.bannerUrl ? <Image src={model.bannerUrl} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-70" /> : null}
      </div>
      <div className="relative p-5 pt-0">
        <div className="flex items-end justify-between gap-3">
          <div className="flex h-[60px] w-[60px] -translate-y-5 items-center justify-center overflow-hidden rounded-full border-4 border-cream-surface bg-cream-sunken text-h5 font-semibold text-lagoon-text shadow-card">
            {model.logoUrl ? <Image src={model.logoUrl} alt={model.name} width={60} height={60} className="h-full w-full object-cover" /> : initials(model.name)}
          </div>
          <ProBadge />
        </div>

        <div className="-mt-3">
          <h2 className="font-display text-h5 font-semibold text-ink">{model.name}</h2>
          <p className="mt-1 text-body-sm font-semibold text-lagoon-text">{model.category}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-body-sm text-ink/70">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{model.commune}</span>
            {model.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />{model.rating.toFixed(1)} · {model.reviewCount} avis</span>
            ) : <span>Aucun avis</span>}
          </div>
          <p className="mt-4 line-clamp-3 min-h-[66px] text-body-sm leading-relaxed text-ink/70">{model.description || 'Découvrez les services et les annonces de ce professionnel local.'}</p>
          {model.latestReview ? (
            <p className="mt-4 line-clamp-2 rounded-control bg-cream-sunken p-3 text-caption italic text-ink/70">« {model.latestReview} »</p>
          ) : null}
          <p className="mt-4 text-caption text-ink/60">{model.listingCount} annonce{model.listingCount > 1 ? 's' : ''} active{model.listingCount > 1 ? 's' : ''}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link href={`/pro/${model.id}`} className="k-button k-button-secondary"><span className="flex items-center justify-center gap-2">Voir la vitrine<ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link>
            <Link href={`/pro/${model.id}?action=devis`} className="k-button k-button-primary"><span className="flex items-center justify-center gap-2"><MessageSquareQuote className="h-4 w-4" aria-hidden="true" />Demander un devis</span></Link>
          </div>
        </div>
      </div>
    </article>
  )
}
