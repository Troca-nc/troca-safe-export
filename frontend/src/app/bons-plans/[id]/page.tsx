'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, FileText, Image as ImageIcon, MapPin, Store } from 'lucide-react'

import Header from '@/components/layout/Header'
import { bonPlansApi } from '@/lib/api'

type BonPlanDetail = {
  id: string | number
  title: string
  description: string
  business_name: string
  business_slug?: string | null
  image_url?: string | null
  catalog_pdf_url?: string | null
  promo_label?: string | null
  original_price_xpf?: number | null
  promo_price_xpf?: number | null
  category?: string | null
  promo_valid_from?: string | null
  promo_valid_until?: string | null
  location_name?: string | null
  commune_name?: string | null
  conditions?: string | null
  cta_label?: string | null
  cta_url?: string | null
}

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const formatPrice = (value?: number | null) => value == null ? null : `${money.format(value)} F`
const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('fr-FR', { timeZone: 'Pacific/Noumea', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
  : null

export default function BonPlanDetailPage() {
  const params = useParams<{ id: string }>()
  const id = String(params?.id || '')
  const [bonPlan, setBonPlan] = useState<BonPlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    bonPlansApi.getById(id)
      .then((response) => { if (alive) setBonPlan(response.data?.data || null) })
      .catch((reason) => { if (alive) setError(reason?.response?.status === 404 ? 'Ce bon plan n’est plus disponible.' : 'Impossible de charger ce bon plan.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  return <><Header /><main className="min-h-screen bg-cream text-ink"><div className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
    <Link href="/bons-plans" className="inline-flex min-h-11 items-center gap-2 text-label font-semibold text-accent-text hover:underline"><ArrowLeft className="h-4 w-4" />Retour aux bons plans</Link>
    {loading ? <div className="mt-7 grid animate-pulse gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"><div className="h-[30rem] rounded-block bg-cream-sunken" /><div className="h-[30rem] rounded-block bg-cream-sunken" /></div> : error || !bonPlan ? <section className="mt-7 rounded-block border border-warm-border bg-cream-surface p-10 text-center"><h1 className="font-display text-h2">Bon plan indisponible</h1><p className="mt-3 text-body text-ink/65">{error || 'Cette offre est introuvable.'}</p><Link href="/bons-plans" className="k-button k-button-primary mt-6">Voir les offres en cours</Link></section> : <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
      <section className="overflow-hidden rounded-block border border-warm-border bg-cream-surface shadow-panel">
        <div className="flex min-h-72 items-center justify-center bg-cream-sunken text-ink/35 sm:min-h-[30rem]">{bonPlan.image_url ? <img src={bonPlan.image_url} alt={bonPlan.title} className="h-full max-h-[38rem] w-full object-cover" /> : <ImageIcon className="h-14 w-14" />}</div>
        <div className="p-5 sm:p-7"><div className="flex flex-wrap gap-2">{bonPlan.category ? <span className="rounded-pill bg-accent/15 px-3 py-1 text-label-sm font-semibold text-accent-text">{bonPlan.category}</span> : null}{bonPlan.promo_label ? <span className="rounded-pill bg-reef/15 px-3 py-1 text-label-sm font-semibold text-reef-text">{bonPlan.promo_label}</span> : null}</div><h1 className="mt-5 font-display text-h1-form leading-none">{bonPlan.title}</h1><p className="mt-5 whitespace-pre-line text-body leading-relaxed text-ink/75">{bonPlan.description}</p>{bonPlan.conditions && bonPlan.conditions !== bonPlan.description ? <div className="mt-6 rounded-card bg-cream-sunken p-5"><h2 className="font-display text-h4">Conditions de l’offre</h2><p className="mt-2 whitespace-pre-line text-body-sm text-ink/70">{bonPlan.conditions}</p></div> : null}</div>
      </section>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-block bg-ink p-6 text-cream shadow-panel"><p className="text-eyebrow uppercase text-reef-onDeep">L’offre</p>{bonPlan.original_price_xpf != null ? <p className="mt-5 text-body text-cream/55 line-through">{formatPrice(bonPlan.original_price_xpf)}</p> : null}<p className="mt-1 font-display text-price-lg">{formatPrice(bonPlan.promo_price_xpf) || 'Offre à découvrir'}</p>{bonPlan.cta_url ? <a href={bonPlan.cta_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-accent px-4 text-label font-semibold text-ink">{bonPlan.cta_label || 'Voir l’offre'}<ExternalLink className="h-4 w-4" /></a> : <p className="mt-5 rounded-control bg-cream/10 p-4 text-body-sm text-cream/75">Présentez ce bon plan directement dans le commerce.</p>}</section>
        <section className="rounded-block border border-warm-border bg-cream-surface p-6 shadow-card"><Store className="h-6 w-6 text-accent-text" /><h2 className="mt-3 font-display text-h3">{bonPlan.business_name}</h2>{bonPlan.business_slug ? <Link href={`/bons-plans/enseigne/${bonPlan.business_slug}`} className="mt-3 inline-flex items-center gap-2 text-label font-semibold text-accent-text hover:underline">Voir l’enseigne<ArrowRight className="h-4 w-4" /></Link> : null}<div className="mt-5 space-y-3 text-body-sm text-ink/65">{bonPlan.location_name || bonPlan.commune_name ? <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />{[bonPlan.location_name, bonPlan.commune_name].filter(Boolean).join(' · ')}</p> : null}{bonPlan.promo_valid_from || bonPlan.promo_valid_until ? <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />{bonPlan.promo_valid_from ? `Du ${formatDate(bonPlan.promo_valid_from)}` : 'Disponible maintenant'}{bonPlan.promo_valid_until ? ` au ${formatDate(bonPlan.promo_valid_until)}` : ''}</p> : null}</div>{bonPlan.catalog_pdf_url ? <a href={bonPlan.catalog_pdf_url} target="_blank" rel="noreferrer" className="k-button k-button-secondary mt-5 inline-flex w-full items-center justify-center gap-2"><FileText className="h-4 w-4" />Consulter le catalogue PDF</a> : null}</section>
      </aside>
    </div>}
  </div></main></>
}
