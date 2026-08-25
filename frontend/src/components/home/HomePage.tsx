'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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
} from '@/components/home/HomeSections'
import CategoryGridSection from '@/components/home/CategoryGridSection'
import { API_ORIGIN } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

function cleanText(value: unknown, fallback = '') {
  const text = String(value ?? '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\s*$/, '')
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
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<any[]>([])

  const featuredListings = useMemo(() => listings.slice(0, 8), [listings])

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

      <RecentListingsSection />

      <TrustSection />

      <LocalProsSection />

      <AlertsCtaSection />
    </main>
  )
}
