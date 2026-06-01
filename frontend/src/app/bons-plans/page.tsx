'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, MapPin, Search, Sparkles, Users } from 'lucide-react'

import Header from '@/components/layout/Header'
import BonPlanCard, { type BonPlanCardModel } from '@/components/bon-plans/BonPlanCard'
import { bonPlansApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_TABS = [
  { value: '', label: 'Tout' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-Tech' },
  { value: 'auto_moto', label: 'Auto/Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
  { value: 'autre', label: 'Autre' },
] as const

const EVENT_TABS = [
  { value: 'all', label: 'Tout' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passés' },
] as const

type BusinessOption = {
  name: string
  slug?: string | null
  business_logo_url?: string | null
  business_badge?: string | null
}

type DirectoryItem = {
  id: number | string
  title: string
  description: string
  kind?: string
  target_audience?: string
  price_xpf?: number
  normal_price_xpf?: number | null
  promo_price_xpf?: number | null
  discount_pct?: number | null
  location_name?: string | null
  commune_name?: string | null
  category_name?: string | null
  event_date?: string | null
  expires_at?: string | null
  contact_name?: string | null
  author_prenom?: string | null
  website_url?: string | null
  link_url?: string | null
  view_count?: number | null
  share_count?: number | null
  is_free_included?: boolean
  author_is_pro?: boolean | null
}

function formatDateLabel(value?: string | null, fallback = 'Date libre') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatCurrency(value?: number | null) {
  if (value == null) return 'Sur devis'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function isPastEvent(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function EventCard({ item }: { item: DirectoryItem }) {
  const href = item.link_url || item.website_url || (item.contact_name ? `mailto:${item.contact_name}` : '#')
  const hasLink = href !== '#'

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-night/8 bg-[var(--color-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-l-4 border-l-nc-sable p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-sable">Événement</span>
          {item.author_is_pro ? <span className="badge badge-emeraude">Organisateur vérifié</span> : null}
        </div>
        <h3 className="mt-3 text-lg font-bold leading-tight text-night">{item.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-night/65">{item.description}</p>

        <div className="mt-4 grid gap-2 text-xs font-semibold text-night/65 sm:grid-cols-2">
          <span className="rounded-full bg-sand px-2.5 py-1">
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {item.commune_name || item.location_name || 'Nouvelle-Calédonie'}
          </span>
          <span className="rounded-full bg-sand px-2.5 py-1">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {formatDateLabel(item.event_date, 'Date à confirmer')}
          </span>
          <span className="rounded-full bg-sand px-2.5 py-1">
            <Users className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {item.share_count ?? 0} partages
          </span>
          <span className="rounded-full bg-sand px-2.5 py-1">
            <Clock3 className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {item.contact_name || 'Contact local'}
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-sand/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Info</p>
          <p className="mt-1 text-sm font-semibold text-night">
            {item.link_url ? 'Ouvert à la billetterie' : 'Informations à venir'}
          </p>
          <p className="mt-1 text-sm text-night/60">
            {item.link_url || item.website_url ? 'Consultez le lien de l’événement pour les détails.' : 'Suivez les mises à jour de l’agenda local.'}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasLink ? (
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              Ouvrir
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-night/10 px-4 py-2.5 text-sm font-semibold text-night/60">
              Bientôt disponible
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night">
            {isPastEvent(item.event_date) ? 'Passé' : 'À venir'}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function BonsPlansPage() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)

  const [promoItems, setPromoItems] = useState<BonPlanCardModel[]>([])
  const [eventItems, setEventItems] = useState<DirectoryItem[]>([])
  const [businesses, setBusinesses] = useState<BusinessOption[]>([])

  const [promoQuery, setPromoQuery] = useState('')
  const [promoCategory, setPromoCategory] = useState('')
  const [promoBusiness, setPromoBusiness] = useState('')

  const [eventQuery, setEventQuery] = useState('')
  const [eventTimeFilter, setEventTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  const [promoLoading, setPromoLoading] = useState(true)
  const [eventLoading, setEventLoading] = useState(true)
  const [savingFollow, setSavingFollow] = useState(false)

  useEffect(() => {
    let alive = true
    bonPlansApi
      .businesses()
      .then((res) => {
        if (!alive) return
        setBusinesses(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setBusinesses([])
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setPromoLoading(true)
    bonPlansApi
      .list({
        limit: 18,
        kind: 'promo',
        q: promoQuery.trim() || undefined,
        category: promoCategory || undefined,
        business_name: promoBusiness.trim() || undefined,
      })
      .then((res) => {
        if (!alive) return
        setPromoItems(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setPromoItems([])
      })
      .finally(() => {
        if (alive) setPromoLoading(false)
      })

    return () => {
      alive = false
    }
  }, [promoBusiness, promoCategory, promoQuery])

  useEffect(() => {
    let alive = true
    setEventLoading(true)
    bonPlansApi
      .list({
        limit: 18,
        kind: 'event,concert',
        q: eventQuery.trim() || undefined,
      })
      .then((res) => {
        if (!alive) return
        setEventItems(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setEventItems([])
      })
      .finally(() => {
        if (alive) setEventLoading(false)
      })

    return () => {
      alive = false
    }
  }, [eventQuery])

  const activeBusinessSuggestions = useMemo(
    () => businesses.filter((item) => item.name.toLowerCase().includes(promoBusiness.toLowerCase().trim())).slice(0, 6),
    [businesses, promoBusiness]
  )

  const visibleEvents = useMemo(() => {
    return eventItems.filter((item) => {
      if (eventTimeFilter === 'all') return true
      const past = isPastEvent(item.event_date)
      return eventTimeFilter === 'past' ? past : !past
    })
  }, [eventItems, eventTimeFilter])

  const handleFollowBusiness = async (business: string) => {
    if (!isAuthenticated) {
      openAuthModal({
        type: 'publish_listing',
        redirectTo: '/bons-plans',
      })
      return
    }

    setSavingFollow(true)
    try {
      const current = await bonPlansApi.getPrefs().catch(() => ({ data: { data: { notify_businesses: [] } } }))
      const prefs = current.data?.data || {}
      const nextBusinesses = Array.from(new Set([...(prefs.notify_businesses || []), business]))
      await bonPlansApi.savePrefs({
        ...prefs,
        notify_all: true,
        notify_businesses: nextBusinesses,
        via_push: true,
      })
      window.alert(`Vous suivez maintenant ${business}.`)
    } catch {
      window.alert("Impossible d'ajouter l'enseigne aux suivis.")
    } finally {
      setSavingFollow(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-night/8 border-b-4 border-b-nc-emeraude bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.14)] md:px-8 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-emeraude">
            <Sparkles className="h-3.5 w-3.5" />
            Bon plans & événements
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Les promos à gauche, les sorties à droite, dans une seule page locale.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
            Retrouvez les bons plans du moment et l’agenda culturel de la Nouvelle-Calédonie sans changer de navigation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#promos" className="btn-primary rounded-2xl px-4 py-3">
              Voir les promos
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#evenements" className="btn-secondary rounded-2xl px-4 py-3">
              Voir les événements
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-night/8 border-b-4 border-b-nc-emeraude bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-7 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-emeraude">
              <Sparkles className="h-3.5 w-3.5" />
              Bons plans & promotions
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Promos, ventes flash et coupons locaux
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
              Une vitrine moderne pour enseignes, commerçants, artisans, associations et particuliers. Chaque offre peut mettre en avant son prix initial, son prix promo et sa durée d’expiration.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/bons-plans/publier" className="btn-primary rounded-2xl px-4 py-3">
                Publier une promo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#evenements" className="btn-secondary rounded-2xl px-4 py-3">
                Explorer les événements
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-night/8 border-b-4 border-b-nc-sable bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(245,166,35,0.14))] px-6 py-7 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-sable">
              <Sparkles className="h-3.5 w-3.5" />
              Événements & culture
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Concerts, festivals et sorties locales
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
              Les rendez-vous à venir, les sorties culturelles et les événements communautaires visibles dans une seule section claire.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#evenements" className="btn-primary rounded-2xl px-4 py-3">
                Voir les événements
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#promos" className="btn-secondary rounded-2xl px-4 py-3">
                Voir les promos
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <section id="promos" className="rounded-[2rem] border border-night/8 bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="section-emeraude">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Promotions</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Les offres qui marchent maintenant</h2>
              </div>
              <a href="#evenements" className="hidden items-center gap-1 text-sm font-semibold text-nc-sable hover:underline md:inline-flex">
                Voir la culture <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-emeraude bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={promoQuery}
                    onChange={(e) => setPromoQuery(e.target.value)}
                    placeholder="Rechercher une promotion, une enseigne..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-nc-emeraude/35 focus:ring-4 focus:ring-nc-emeraude/10"
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={promoBusiness}
                    onChange={(e) => setPromoBusiness(e.target.value)}
                    placeholder="Filtrer par enseigne"
                    list="bon-plans-businesses"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-nc-emeraude/35 focus:ring-4 focus:ring-nc-emeraude/10"
                  />
                  <datalist id="bon-plans-businesses">
                    {activeBusinessSuggestions.map((business) => (
                      <option key={business.slug || business.name} value={business.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {CATEGORY_TABS.map((tab) => {
                  const active = tab.value === promoCategory
                  return (
                    <button
                      key={tab.value || 'all'}
                      type="button"
                      onClick={() => setPromoCategory(tab.value)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-nc-emeraude bg-nc-emeraude text-white'
                          : 'border-night/10 bg-transparent text-night/65 hover:bg-night/5 hover:text-night'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              {promoLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[420px] animate-pulse rounded-[1.5rem] border border-night/8 bg-white/70" />
                  ))}
                </div>
              ) : promoItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {promoItems.map((bonPlan) => (
                    <BonPlanCard
                      key={bonPlan.id}
                      bonPlan={bonPlan}
                      compact
                      onFollowBusiness={handleFollowBusiness}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-night/8 bg-white px-6 py-14 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Aucun bon plan actif pour le moment</p>
                  <p className="mt-2 text-sm">Essayez une autre catégorie ou une autre enseigne.</p>
                </div>
              )}
            </div>
          </section>

          <section id="evenements" className="rounded-[2rem] border border-night/8 bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="section-sable">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Culture</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Les rendez-vous à venir</h2>
              </div>
              <a href="#promos" className="hidden items-center gap-1 text-sm font-semibold text-nc-emeraude hover:underline md:inline-flex">
                Voir les promos <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-sable bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={eventQuery}
                    onChange={(e) => setEventQuery(e.target.value)}
                    placeholder="Rechercher un événement, une salle, un artiste..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-nc-sable/35 focus:ring-4 focus:ring-nc-sable/10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {EVENT_TABS.map((tab) => {
                    const active = tab.value === eventTimeFilter
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setEventTimeFilter(tab.value)}
                        className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-nc-sable bg-nc-sable text-white'
                            : 'border-night/10 bg-transparent text-night/65 hover:bg-night/5 hover:text-night'
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4">
              {eventLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[320px] animate-pulse rounded-[1.5rem] border border-night/8 bg-white/70" />
                  ))}
                </div>
              ) : visibleEvents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {visibleEvents.map((item) => (
                    <EventCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-night/8 bg-white px-6 py-14 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Aucun événement à venir pour l’instant</p>
                  <p className="mt-2 text-sm">Essayez une autre période ou laissez la section se remplir avec les prochaines sorties locales.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {savingFollow ? (
        <div className="fixed bottom-4 right-4 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white shadow-lg">
          Mise à jour en cours...
        </div>
      ) : null}
    </main>
  )
}
