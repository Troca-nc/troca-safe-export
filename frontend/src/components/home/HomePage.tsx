'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import Header from '@/components/layout/Header'
import WelcomeToast from '@/components/onboarding/WelcomeToast'
import OnboardingToast from '@/components/onboarding/OnboardingToast'
import {
  BonPlanSection,
  CommunesBarSection,
  FeaturedListingsSection,
  CovoiturageSection,
  HomeHeroSection,
  SearchAlertsSection,
} from '@/components/home/HomeSections'
import CategoryGridSection from '@/components/home/CategoryGridSection'
import ProCarousel from '@/components/pro/ProCarousel'
import { API_ORIGIN, campaignsApi, proApi } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { useAuthStore } from '@/store/authStore'

function cleanText(value: unknown, fallback = '') {
  const text = String(value ?? '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\s*$/, '')
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
      <WelcomeToast />
      <OnboardingToast />

      <HomeHeroSection q={q} onQueryChange={setQ} onSubmit={handleSearch} listings={featuredListings} />

      <CommunesBarSection />

      <CategoryGridSection />

      <FeaturedListingsSection loading={loading} listings={featuredListings} />

      <SearchAlertsSection />

      <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Pros locaux</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)]">Nos professionnels recommandés</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Des pros calédoniens vérifiés, à portée de message.</p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/pros" className="inline-flex items-center gap-1 text-sm font-semibold text-nc-emeraude hover:underline">
              Voir l'annuaire <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pro" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-night">
              Devenir Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <ProCarousel />
      </section>

      <BonPlanSection
        sponsoredItems={sponsoredBonPlans}
        loading={bonPlansLoading}
      />

      <CovoiturageSection covoiturageItems={covoiturages} loading={bonPlansLoading} />
    </main>
  )
}
