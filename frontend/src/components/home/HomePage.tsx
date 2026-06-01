'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import Header from '@/components/layout/Header'
import { HomeSpotlightSection } from '@/components/home/HomeSpotlightSection'
import BonPlanCard from '@/components/bon-plans/BonPlanCard'
import {
  BonPlanSection,
  FeaturedListingsSection,
  HomeHeroSection,
  ExpandedCategoriesSection,
  SearchAlertsSection,
  HomeStatsSection,
} from '@/components/home/HomeSections'
import { FALLBACK_CATEGORIES, hasNestedCategoryTree, type CategoryNode } from '@/lib/categoryCatalog'
import { mergeCategories } from '@/lib/categoryPresentation'
import { metaApi } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [promoBonPlans, setPromoBonPlans] = useState<any[]>([])
  const [eventBonPlans, setEventBonPlans] = useState<any[]>([])
  const [covoiturages, setCovoiturages] = useState<any[]>([])
  const [bonPlansLoading, setBonPlansLoading] = useState(true)

  const visibleCategories = useMemo(
    () => {
      const merged = isDemoMode ? FALLBACK_CATEGORIES : mergeCategories(FALLBACK_CATEGORIES, categories)
      return hasNestedCategoryTree(merged) ? merged : FALLBACK_CATEGORIES
    },
    [categories, isDemoMode]
  )

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

    const fetchCategories = async () => {
      try {
        const res = await metaApi.getCategories()
        if (!alive) return
        setCategories(res.data?.data?.length ? res.data.data : FALLBACK_CATEGORIES)
      } catch {
        if (!alive) return
        setCategories(FALLBACK_CATEGORIES)
      }
    }

    const fetchBonPlans = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
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

    fetchCategories()
    fetchBonPlans()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
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

  const browseCategory = (slug: string) => {
    router.push(`/annonces/categorie/${slug}`)
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />

      <HomeHeroSection
        q={q}
        onQueryChange={setQ}
        onSubmit={handleSearch}
      />

      <HomeStatsSection />

      <HomeSpotlightSection
        latestListings={featuredListings}
        premiumListings={premiumListings}
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        rideItems={covoiturages}
      />

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5 flex items-end justify-between gap-4 rounded-[2rem] border border-[var(--color-border)] border-l-4 border-l-nc-emeraude bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="section-emeraude">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Bons Plans du moment</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Les dernières promos actives sur Troca</h2>
          </div>
          <Link href="/bons-plans" className="hidden items-center gap-1 text-sm font-semibold text-nc-emeraude hover:underline md:inline-flex">
            Voir tous les bons plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(promoBonPlans.length > 0 ? promoBonPlans : eventBonPlans).slice(0, 4).map((item) => (
            <BonPlanCard key={item.id} bonPlan={item} compact />
          ))}
        </div>
      </section>

      <BonPlanSection
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        covoiturageItems={covoiturages}
        loading={bonPlansLoading}
      />
      <FeaturedListingsSection loading={loading} listings={featuredListings} />
      <SearchAlertsSection />
      <ExpandedCategoriesSection categories={visibleCategories} onBrowse={browseCategory} />
    </main>
  )
}
