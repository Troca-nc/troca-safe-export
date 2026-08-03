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
  { value: 'beaute', label: 'Beaut�' },
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
  { value: 'upcoming', label: '� venir' },
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'free', label: 'Gratuits' },
  { value: 'past', label: 'Pass�s' },
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

function isPastEvent(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function isWeekendEvent(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const day = date.getDay()
  return day === 5 || day === 6 || day === 0
}

function EventCard({ item }: { item: DirectoryItem }) {
  const href = item.link_url || item.website_url || (item.contact_name ? `mailto:${item.contact_name}` : '#')
  const hasLink = href !== '#'

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-night/8 bg-[var(--color-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-l-4 border-l-nc-sable p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-sable">�v�nement</span>
          {item.author_is_pro ? <span className="badge badge-emeraude">Organisateur v�rifi�</span> : null}
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
            {formatDateLabel(item.event_date, 'Date � confirmer')}
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
            {item.link_url ? 'Ouvert � la billetterie' : 'Informations � venir'}
          </p>
          <p className="mt-1 text-sm text-night/60">
            {item.link_url || item.website_url ? 'Consultez le lien de l�v�nement pour les d�tails.' : 'Suivez les mises � jour de lagenda local.'}
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
              Bient�t disponible
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night">
            {isPastEvent(item.event_date) ? 'Pass�' : '� venir'}
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
  const [eventTimeFilter, setEventTimeFilter] = useState<'all' | 'upcoming' | 'weekend' | 'free' | 'past'>('all')
  const [activeTab, setActiveTab] = useState<'promos' | 'evenements'>('promos')

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash === '#evenements') setActiveTab('evenements')
    if (hash === '#promos') setActiveTab('promos')
  }, [])

  const activeBusinessSuggestions = useMemo(
    () => businesses.filter((item) => item.name.toLowerCase().includes(promoBusiness.toLowerCase().trim())).slice(0, 6),
    [businesses, promoBusiness]
  )

  const visiblePromos = useMemo(() => promoItems, [promoItems])

  const visibleEvents = useMemo(() => {
    return eventItems.filter((item) => {
      if (eventTimeFilter === 'all') return true
      const past = isPastEvent(item.event_date)
      if (eventTimeFilter === 'past') return past
      if (eventTimeFilter === 'upcoming') return !past
      if (eventTimeFilter === 'weekend') return !past && isWeekendEvent(item.event_date)
      if (eventTimeFilter === 'free') return Boolean(item.is_free_included || Number(item.price_xpf || 0) === 0 || Number(item.promo_price_xpf || 0) === 0)
      return true
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
            Bons plans & Événements
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Promos locales et agenda culturel de Nouvelle-Calédonie, au m�me endroit.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
            Retrouvez les bons plans du moment et lagenda culturel de la Nouvelle-Calédonie sans changer de navigation.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'promos', label: '🎭 Promotions' },
            { id: 'evenements', label: '🎭 �v�nements' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'promos' | 'evenements')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#0A7EA4] text-white shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        {activeTab === 'promos' ? (
          <section id="promos" className="rounded-[2rem] border border-night/8 bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="section-emeraude">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Promotions</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Les offres qui marchent maintenant</h2>
              </div>
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

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] whitespace-nowrap">
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
              ) : visiblePromos.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {visiblePromos.map((bonPlan) => (
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
                  <p className="text-lg font-semibold text-night">Les premi�res promos arrivent bient�t</p>
                  <p className="mt-2 text-sm">
                    Commer�ants, artisans, associations - publiez votre offre et touchez des milliers de Cal�doniens.
                  </p>
                  <Link href="/bons-plans/publier" className="btn-primary mt-5 inline-flex items-center gap-2">
                    Publier une promo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section id="evenements" className="rounded-[2rem] border border-night/8 bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="section-sable">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Culture</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Les rendez-vous � venir</h2>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-sable bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={eventQuery}
                    onChange={(e) => setEventQuery(e.target.value)}
                    placeholder="Rechercher un �v�nement, une salle, un artiste..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-nc-sable/35 focus:ring-4 focus:ring-nc-sable/10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] whitespace-nowrap">
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
                  <p className="text-lg font-semibold text-night">Aucun �v�nement � venir pour le moment</p>
                  <p className="mt-2 text-sm">
                    Concerts, march�s, expos, conf�rences - ajoutez votre �v�nement pour le faire conna�tre.
                  </p>
                  <Link href="/bons-plans/publier" className="btn-primary mt-5 inline-flex items-center gap-2">
                    Créer un événement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {savingFollow ? (
        <div className="fixed bottom-4 right-4 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white shadow-lg">
          Mise � jour en cours...
        </div>
      ) : null}
    </main>
  )
}
