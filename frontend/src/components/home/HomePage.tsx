'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import Header from '@/components/layout/Header'
import { HomeSpotlightSection } from '@/components/home/HomeSpotlightSection'
import {
  BonPlanSection,
  FeaturedListingsSection,
  HomeHeroSection,
  PopularCategoriesSection,
  SearchAlertsSection,
} from '@/components/home/HomeSections'
import { FALLBACK_CATEGORIES, type CategoryNode } from '@/lib/categoryCatalog'
import { getFeaturedCategories, mergeCategories } from '@/lib/categoryPresentation'
import { bonPlansApi, covoiturageApi, listingsApi, metaApi, statsApi } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeCount, setActiveCount] = useState<number | null>(null)
  const [bonPlansCount, setBonPlansCount] = useState<number | null>(null)
  const [rideCount, setRideCount] = useState<number | null>(null)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [promoBonPlans, setPromoBonPlans] = useState<any[]>([])
  const [eventBonPlans, setEventBonPlans] = useState<any[]>([])
  const [covoiturages, setCovoiturages] = useState<any[]>([])
  const [bonPlansLoading, setBonPlansLoading] = useState(true)

  const visibleCategories = useMemo(
    () => mergeCategories(FALLBACK_CATEGORIES, categories),
    [categories]
  )

  const featuredCategories = useMemo(
    () => getFeaturedCategories(visibleCategories),
    [visibleCategories]
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

    const fetchHeroStats = async () => {
      try {
        const [listingsRes, statsRes] = await Promise.all([
          listingsApi.search({ limit: 1, sort: 'date' }),
          statsApi.getHome(),
        ])
        if (!alive) return
        setActiveCount(Number(listingsRes.data?.pagination?.total ?? 0))
        setBonPlansCount(Number(statsRes.data?.data?.total_bon_plans ?? 0))
        setRideCount(Number(statsRes.data?.data?.total_covoiturages ?? 0))
      } catch {
        if (!alive) return
        setActiveCount(0)
        setBonPlansCount(0)
      } finally {
        if (alive) setStatsLoading(false)
      }
    }

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
        const [promoRes, eventRes, rideRes] = await Promise.all([
          bonPlansApi.list({ limit: 3, kind: 'promo' }),
          bonPlansApi.list({ limit: 3, kind: 'event,concert' }),
          covoiturageApi.list({ limit: 3 }),
        ])
        if (!alive) return
        setPromoBonPlans(promoRes.data?.data ?? [])
        setEventBonPlans(eventRes.data?.data ?? [])
        setCovoiturages(rideRes.data?.data ?? [])
      } catch {
        if (!alive) return
        setPromoBonPlans([])
        setEventBonPlans([])
        setCovoiturages([])
      } finally {
        if (alive) setBonPlansLoading(false)
      }
    }

    fetchHeroStats()
    fetchCategories()
    fetchBonPlans()

    const intervalId = window.setInterval(fetchHeroStats, 60 * 60 * 1000)
    return () => {
      alive = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    listingsApi
      .search({ limit: 8, sort: 'date' })
      .then((r) => setListings(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
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
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <HomeHeroSection
        q={q}
        onQueryChange={setQ}
        onSubmit={handleSearch}
        onBrowse={browseCategory}
        activeCount={activeCount}
        bonPlansCount={bonPlansCount}
        rideCount={rideCount}
        statsLoading={statsLoading}
      />

      <HomeSpotlightSection
        latestListings={featuredListings}
        premiumListings={premiumListings}
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        rideItems={covoiturages}
      />

      <BonPlanSection
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        covoiturageItems={covoiturages}
        loading={bonPlansLoading}
      />
      <FeaturedListingsSection loading={loading} listings={featuredListings} />
      <SearchAlertsSection />
      <PopularCategoriesSection categories={featuredCategories} onBrowse={browseCategory} />
    </main>
  )
}
