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
import { getHomeListings, getHomeNavigation, getHomePros } from '@/lib/data/home'
import type { HomeListing, HomePro } from '@/types/home'

const navigation = getHomeNavigation()

export default function HomePage() {
  const router = useRouter()
  const [q, setQ] = useState('')
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

  useEffect(() => {
    void loadListings()
    void loadPros()
  }, [loadListings, loadPros])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
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

      <HomeHeroSection q={q} onQueryChange={setQ} onSubmit={handleSearch} quickCategories={quickCategories} />

      <CommunesBarSection communes={navigation.communes} />

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
