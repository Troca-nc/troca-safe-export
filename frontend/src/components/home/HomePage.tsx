'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck } from 'lucide-react'

import Header from '@/components/layout/Header'
import { HomeSpotlightSection } from '@/components/home/HomeSpotlightSection'
import {
  BonPlanSection,
  FeaturedListingsSection,
  HomeHeroSection,
  SearchAlertsSection,
  HomeStatsSection,
} from '@/components/home/HomeSections'
import CategoryTreeSection from '@/components/home/CategoryTreeSection'
import ProCarousel from '@/components/pro/ProCarousel'
import Trocometer from '@/components/trocometer/Trocometer'
import { API_ORIGIN, proApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [promoBonPlans, setPromoBonPlans] = useState<any[]>([])
  const [eventBonPlans, setEventBonPlans] = useState<any[]>([])
  const [covoiturages, setCovoiturages] = useState<any[]>([])
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
    let alive = true

    const fetchBonPlans = async () => {
      try {
        const baseUrl = API_ORIGIN
        const [promoRes, eventRes, rideRes] = await Promise.all([
          fetch(`${baseUrl}/api/bon-plans?limit=3&kind=promo`, { credentials: 'include' }).then((res) => res.json()),
          fetch(`${baseUrl}/api/bon-plans?limit=3&kind=event,concert`, { credentials: 'include' }).then((res) => res.json()),
          fetch(`${baseUrl}/api/covoiturage?limit=3`, { credentials: 'include' }).then((res) => res.json()),
        ])
        if (!alive) return
        setPromoBonPlans(Array.isArray(promoRes?.data) ? promoRes.data : [])
        setEventBonPlans(Array.isArray(eventRes?.data) ? eventRes.data : [])
        setCovoiturages(Array.isArray(rideRes?.data) ? rideRes.data : [])
      } catch {
        if (!alive) return
        setPromoBonPlans([])
        setEventBonPlans([])
        setCovoiturages([])
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
        setListings(Array.isArray(json?.data) ? json.data : [])
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
    if (q.trim()) router.push(`/annonces?q=${encodeURIComponent(q.trim())}`)
    else router.push('/annonces')
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />

      <HomeHeroSection q={q} onQueryChange={setQ} onSubmit={handleSearch} />

      {hasHydrated && user?.is_pro && proSummary ? (
        <section className="mx-auto max-w-7xl px-4 pt-4">
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

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Pros locaux</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Nos professionnels recommandés</h2>
            <p className="mt-1 text-sm text-night/55">Des pros calédoniens vérifiés, à portée de message.</p>
          </div>
          <Link href="/pro" className="hidden items-center gap-1 text-sm font-semibold text-nc-emeraude hover:underline md:inline-flex">
            Devenir Pro <ArrowRight className="h-4 w-4" />
          </Link>
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
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        covoiturageItems={covoiturages}
        loading={bonPlansLoading}
      />

      <FeaturedListingsSection loading={loading} listings={featuredListings} />

      <SearchAlertsSection />

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Nouveau</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Le Trocômètre</h2>
          <p className="mt-1 text-sm text-night/55">Trouvez des objets de même valeur prêts à être échangés.</p>
        </div>
        <Trocometer />
      </section>

      <CategoryTreeSection />
    </main>
  )
}
