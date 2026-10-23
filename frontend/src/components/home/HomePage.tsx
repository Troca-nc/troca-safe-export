'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import Header from '@/components/layout/Header'
import WelcomeToast from '@/components/onboarding/WelcomeToast'
import OnboardingToast from '@/components/onboarding/OnboardingToast'
import {
  AlertsCtaSection,
  CommunesBarSection,
  HomeHeroSection,
  LocalProsSection,
  RecentListingsSection,
  TrustSection,
} from '@/components/home/HomeSectionsV2'
import CategoryGridSection from '@/components/home/CategoryGridSection'
import { trackEvent } from '@/lib/analytics'
import { getHomeCommunes, getHomeListings, getHomeNavigation, getHomePlatformStats, getHomePros } from '@/lib/data/home'
import type { HomeCommune, HomeListing, HomePlatformStats, HomePro } from '@/types/home'

const navigation = getHomeNavigation()

export default function HomePage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [communeSlug, setCommuneSlug] = useState('')
  const [communes, setCommunes] = useState<HomeCommune[]>([])
  const [platformStats, setPlatformStats] = useState<HomePlatformStats | null>(null)
  const [listings, setListings] = useState<HomeListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [listingsError, setListingsError] = useState(false)
  const [pros, setPros] = useState<HomePro[]>([])
  const [prosLoading, setProsLoading] = useState(true)
  const [prosError, setProsError] = useState(false)

  const quickCategories = useMemo(() => navigation.categories.slice(0, 5), [])

  const loadListings = useCallback(async () => {
    setListingsLoading(true)
    setListingsError(false)
    try {
      setListings(await getHomeListings())
    } catch {
      setListings([])
      setListingsError(true)
    } finally {
      setListingsLoading(false)
    }
  }, [])

  const loadPros = useCallback(async () => {
    setProsLoading(true)
    setProsError(false)
    try {
      setPros(await getHomePros())
    } catch {
      setPros([])
      setProsError(true)
    } finally {
      setProsLoading(false)
    }
  }, [])

  const loadPlatformStats = useCallback(async () => {
    try {
      setPlatformStats(await getHomePlatformStats())
    } catch {
      setPlatformStats(null)
    }
  }, [])

  const loadCommunes = useCallback(async () => {
    try {
      setCommunes(await getHomeCommunes())
    } catch {
      setCommunes([])
    }
  }, [])

  useEffect(() => {
    void loadListings()
    void loadPros()
    void loadPlatformStats()
    void loadCommunes()
  }, [loadCommunes, loadListings, loadPlatformStats, loadPros])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = q.trim()
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    if (communeSlug) params.set('commune', communeSlug)
    if (term) {
      void trackEvent('listing_search', {
        query: term,
        commune: communeSlug || null,
        source: 'home_hero_submit',
      })
    }
    router.push(params.size ? `/annonces?${params.toString()}` : '/annonces')
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <WelcomeToast />
      <OnboardingToast />

      <HomeHeroSection
        q={q}
        onQueryChange={setQ}
        communeSlug={communeSlug}
        onCommuneChange={setCommuneSlug}
        communes={communes}
        platformStats={platformStats}
        onSubmit={handleSearch}
        quickCategories={quickCategories}
      />

      <CommunesBarSection communes={communes} />

      <CategoryGridSection categories={navigation.categories} />

      <RecentListingsSection
        listings={listings}
        loading={listingsLoading}
        error={listingsError}
        onRetry={() => void loadListings()}
      />

      <TrustSection />

      <LocalProsSection
        pros={pros}
        loading={prosLoading}
        error={prosError}
        onRetry={() => void loadPros()}
      />

      <AlertsCtaSection />
    </main>
  )
}
