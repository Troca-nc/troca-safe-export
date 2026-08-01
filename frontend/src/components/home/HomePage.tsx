'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck } from 'lucide-react'

import Header from '@/components/layout/Header'
import OnboardingToast from '@/components/onboarding/OnboardingToast'
import { HomeSpotlightSection } from '@/components/home/HomeSpotlightSection'
import {
  BonPlanSection,
  FeaturedListingsSection,
  HomeHeroSection,
  SearchAlertsSection,
  HomeStatsSection,
} from '@/components/home/HomeSections'
import CategoryGridSection from '@/components/home/CategoryGridSection'
import ProCarousel from '@/components/pro/ProCarousel'
import TrocListingsPreview from '@/components/home/TrocListingsPreview'
import { API_ORIGIN, campaignsApi, proApi } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { useAuthStore } from '@/store/authStore'

function cleanText(value: unknown, fallback = '') {
  const text = String(value ?? '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+—\s*$/, '')
    .trim()
  return text.length > 0 ? text : fallback
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        if (typeof entry === 'string') {
          return [key, cleanText(entry, '')]
        }
        return [key, sanitizeValue(entry)]
      })
    )
  }
  return value
}

export default function HomePage() {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  const [q, setQ] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [promoBonPlans, setPromoBonPlans] = useState<any[]>([])
  const [eventBonPlans, setEventBonPlans] = useState<any[]>([])
  const [covoiturages, setCovoiturages] = useState<any[]>([])
  const [sponsoredBonPlans, setSponsoredBonPlans] = useState<any[]>([])
  const [bonPlansLoading, setBonPlansLoading] = useState(true)
  const [proSummary, setProSummary] = useState<{
    listings?: { active?: number; total?: number }
    stats?: { views_7d?: number }
  } | null>(null)

  const featuredListings = useMemo(() => listings.slice(0, 8), [listings])
  const premiumListings = useMemo(
    () =>
      listings
        .filter((listing) => listing.is_featured || Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date()))
        .slice(0, 4),
    [listings]
  )

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kalico_search_history')
      const parsed = raw ? JSON.parse(raw) : []
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5).filter((value) => typeof value === 'string' && value.trim()) : [])
    } catch {
      setRecentSearches([])
    }
  }, [])

  useEffect(() => {
    let alive = true

    const fetchBonPlans = async () => {
      try {
        const baseUrl = API_ORIGIN
        const [promoRes, eventRes, rideRes, campaignRes] = await Promise.all([
          fetch(`${baseUrl}/api/bon-plans?limit=3&kind=promo`, { credentials: 'include' }).then((res) => res.json()),
          fetch(`${baseUrl}/api/bon-plans?limit=3&kind=event,concert`, { credentials: 'include' }).then((res) => res.json()),
          fetch(`${baseUrl}/api/covoiturage?limit=3`, { credentials: 'include' }).then((res) => res.json()),
          campaignsApi.getHome(),
        ])
        if (!alive) return
        setPromoBonPlans(Array.isArray(promoRes?.data) ? promoRes.data.map((item: any) => sanitizeValue(item)) : [])
        setEventBonPlans(Array.isArray(eventRes?.data) ? eventRes.data.map((item: any) => sanitizeValue(item)) : [])
        setCovoiturages(Array.isArray(rideRes?.data) ? rideRes.data.map((item: any) => sanitizeValue(item)) : [])
        setSponsoredBonPlans(Array.isArray(campaignRes.data?.data?.bon_plans) ? campaignRes.data.data.bon_plans.map((item: any) => sanitizeValue(item)) : [])
      } catch {
        if (!alive) return
        setPromoBonPlans([])
        setEventBonPlans([])
        setCovoiturages([])
        setSponsoredBonPlans([])
      } finally {
        if (alive) setBonPlansLoading(false)
      }
    }

    void fetchBonPlans()
    return () => {
      alive = false
    }
  }, [])


  useEffect(() => {
    let alive = true

    const loadProSummary = async () => {
      if (!hasHydrated || !user?.is_pro) {
        if (alive) setProSummary(null)
        return
      }

      try {
        const response = await proApi.getDashboard()
        if (!alive) return
        setProSummary(response.data?.data ?? null)
      } catch {
        if (!alive) return
        setProSummary(null)
      }
    }

    void loadProSummary()
    return () => {
      alive = false
    }
  }, [hasHydrated, user?.is_pro])

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const baseUrl = API_ORIGIN
        const response = await fetch(`${baseUrl}/api/listings?limit=8&sort=date`, { credentials: 'include' })
        const json = await response.json()
        if (!alive) return
        setListings(Array.isArray(json?.data) ? json.data.map((item: any) => sanitizeValue(item)) : [])
      } catch {
        if (!alive) return
        setListings([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = q.trim()
    if (term) {
      void trackEvent('listing_search', {
        query: term,
        source: 'home_hero_submit',
      })
      router.push(`/annonces?q=${encodeURIComponent(term)}`)
    }
    else router.push('/annonces')
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <OnboardingToast />

      <HomeHeroSection q={q} onQueryChange={setQ} onSubmit={handleSearch} listings={featuredListings} />

      {recentSearches.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 pt-4" data-reveal="true">
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-night/40">
                Recherches récentes
              </p>
              <span className="text-xs text-night/40">
                5 dernières recherches
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {recentSearches.map((term) => (
                <Link
                  key={term}
                  href={`/annonces?q=${encodeURIComponent(term)}`}
                  className="whitespace-nowrap rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-night transition hover:-translate-y-0.5 hover:border-nc-lagon/30 hover:text-nc-lagon"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasHydrated && user?.is_pro && proSummary ? (
      <section className="mx-auto max-w-7xl px-4 pt-4" data-reveal="true">
          <Link
            href="/pro/dashboard"
            className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-nc-lagon/20 bg-nc-lagonLight px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-nc-lagon" />
              <span className="text-sm font-semibold text-nc-lagon">Espace Pro</span>
              <span className="truncate text-sm text-night/60">
                · {Number(proSummary.listings?.active ?? 0).toLocaleString('fr-FR')} annonces actives ·{' '}
                {Number(proSummary.stats?.views_7d ?? 0).toLocaleString('fr-FR')} vues cette semaine
              </span>
            </div>
            <span className="text-sm font-semibold text-nc-lagon hover:underline">Tableau de bord →</span>
          </Link>
        </section>
      ) : null}

      <HomeStatsSection />

      <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Pros locaux</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Nos professionnels recommandés</h2>
            <p className="mt-1 text-sm text-night/55">Des pros calédoniens vérifiés, à portée de message.</p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/pros" className="inline-flex items-center gap-1 text-sm font-semibold text-nc-emeraude hover:underline">
              Voir l'annuaire <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pro" className="inline-flex items-center gap-1 text-sm font-semibold text-night/60 hover:text-night">
              Devenir Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <ProCarousel />
      </section>

      <HomeSpotlightSection
        latestListings={featuredListings}
        premiumListings={premiumListings}
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        rideItems={covoiturages}
        loading={loading || bonPlansLoading}
      />

      <BonPlanSection
        sponsoredItems={sponsoredBonPlans}
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        covoiturageItems={covoiturages}
        loading={bonPlansLoading}
      />

      <FeaturedListingsSection loading={loading} listings={featuredListings} />

      <SearchAlertsSection />

      <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
        <div className="rounded-[2rem] border border-nc-emeraude/15 border-l-4 border-l-nc-emeraude bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <span className="badge badge-emeraude inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm">
              PRO
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
                Appels d'offres
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">
                Vous cherchez un professionnel ?
              </h2>
              <p className="mt-1 text-sm text-night/55">
                Publiez votre besoin en 2 minutes - les pros de votre commune vous répondent.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/appels-offres?action=publish" className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
              Publier un besoin
            </Link>
            <Link href="/appels-offres" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
              Voir les demandes
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">
              Annonces troc
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">
              Annonces disponibles au troc
            </h2>
            <p className="mt-1 text-sm text-night/55">
              Ces calédoniens acceptent les échanges — trouvez votre bonheur.
            </p>
          </div>
          <Link href="/troc" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex">
            Voir toutes les annonces troc
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TrocListingsPreview />
      </section>

      <div data-reveal="true">
        <CategoryGridSection />
      </div>
    </main>
  )
}
