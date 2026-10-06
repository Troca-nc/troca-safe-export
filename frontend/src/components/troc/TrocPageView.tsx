'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'

import Header from '@/components/layout/Header'
import TrocListingCardV2 from '@/components/troc/TrocListingCardV2'
import TrocometerPanel from '@/components/troc/TrocometerPanel'
import { getTrocPageData, sendTrocProposal } from '@/lib/data/troc'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { TrocListing, TrocPageData } from '@/types/troc-page'

const EMPTY_DATA: TrocPageData = { listings: [], myListings: [], total: 0 }

export default function TrocPageView() {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [data, setData] = useState<TrocPageData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [compatibleOnly, setCompatibleOnly] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const load = useCallback(async () => {
    if (!hasHydrated) return
    setLoading(true)
    setError(null)
    try {
      const result = await getTrocPageData(isAuthenticated)
      const next = isAuthenticated ? result : { ...result, myListings: [] }
      setData(next)
      setSelectedId((current) => next.listings.some((listing) => listing.id === current) ? current : (next.listings[0]?.id ?? ''))
    } catch {
      setData(EMPTY_DATA)
      setError('Impossible de charger les annonces de troc pour le moment.')
    } finally {
      setLoading(false)
    }
  }, [hasHydrated, isAuthenticated])

  useEffect(() => { void load() }, [load])

  const categories = useMemo(() => Array.from(new Map(data.listings.map((listing) => [listing.categorySlug, listing.category])).entries()), [data.listings])
  const visibleListings = useMemo(() => data.listings.filter((listing) => {
    if (category && listing.categorySlug !== category) return false
    if (compatibleOnly && !(listing.compatibilityScore && listing.compatibilityScore > 0)) return false
    return true
  }), [category, compatibleOnly, data.listings])
  const selected = data.listings.find((listing) => listing.id === selectedId) ?? visibleListings[0] ?? data.listings[0] ?? null

  useEffect(() => {
    if (visibleListings.length && !visibleListings.some((listing) => listing.id === selectedId)) setSelectedId(visibleListings[0].id)
  }, [selectedId, visibleListings])

  const requireAuth = () => {
    if (!selected) return
    openAuthModal({ type: 'troc_proposal', listingId: selected.id, redirectTo: '/troc' })
  }

  const propose = async (mine: TrocListing, complement: number) => {
    if (!selected) return
    await sendTrocProposal({
      targetListingId: selected.id,
      offeredListingId: mine.id,
      complementXpf: Math.abs(complement),
      complementDirection: complement > 0 ? 'i_pay' : complement < 0 ? 'they_pay' : 'none',
      message: `Proposition d’échange : ${mine.title} contre ${selected.title}.`,
    })
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream text-ink">
        <section className="relative overflow-hidden border-b border-warm-border">
          <div className="pointer-events-none absolute inset-0 bg-tressage text-ink opacity-[0.045]" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-container flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12 lg:py-12 xl:flex-row xl:items-end xl:justify-between xl:gap-12">
            <div className="max-w-[760px]">
              <p className="text-eyebrow uppercase text-accent-text">Troc · {data.total} annonce{data.total > 1 ? 's' : ''}</p>
              <h1 className="mt-4 max-w-title font-display text-[48px] leading-[1] tracking-[-0.015em] sm:text-h1">Échangez ce qui dort chez vous.</h1>
              <p className="mt-4 max-w-[620px] text-body-sm text-ink/70 sm:mt-[18px] sm:text-body-lg">Choisissez une annonce : le trocomètre la pèse face aux vôtres et calcule le complément qui rend l’échange juste.</p>
            </div>
            <div className="flex max-w-[620px] flex-col items-start gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <button type="button" onClick={() => setCategory('')} className={`k-filter ${category === '' ? 'k-filter-selected' : ''}`}>Tout voir</button>
                {categories.slice(0, 7).map(([slug, label]) => <button key={slug} type="button" onClick={() => setCategory(slug)} className={`k-filter ${category === slug ? 'k-filter-selected' : ''}`}>{label}</button>)}
              </div>
              {data.myListings.length > 0 ? (
                <label className="k-choice">
                  <input type="checkbox" checked={compatibleOnly} onChange={(event) => setCompatibleOnly(event.target.checked)} className="k-choice-input k-switch" />
                  <span>Seulement celles compatibles avec mes annonces</span>
                </label>
              ) : (
                <Link href="/deposer?type=troc" className="k-button k-button-primary"><Plus className="h-4 w-4" />Proposer un troc</Link>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-container items-start gap-8 px-4 py-8 sm:px-6 lg:px-12 xl:grid-cols-[minmax(0,1fr)_600px]">
          <div className="min-w-0">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2" aria-label="Chargement des annonces">
                {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[296px] animate-pulse rounded-card border border-warm-border bg-cream-surface" />)}
              </div>
            ) : error ? (
              <div className="rounded-card border border-alert-error/30 bg-cream-surface p-8 text-center">
                <p role="alert" className="text-h5">{error}</p>
                <button type="button" onClick={() => void load()} className="k-button k-button-secondary mt-4"><RefreshCw className="h-4 w-4" />Réessayer</button>
              </div>
            ) : visibleListings.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleListings.map((listing) => <TrocListingCardV2 key={listing.id} listing={listing} selected={listing.id === selected?.id} onSelect={() => setSelectedId(listing.id)} />)}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-warm-border p-10 text-center">
                <p className="text-h5">Aucune annonce compatible dans cette catégorie.</p>
                <p className="mt-2 text-body-sm text-ink/65">Désactivez le filtre de compatibilité pour tout voir.</p>
                {compatibleOnly ? <button type="button" onClick={() => setCompatibleOnly(false)} className="k-button k-button-secondary mt-4">Voir toutes les annonces</button> : null}
              </div>
            )}
          </div>

          {loading ? <div className="h-[780px] animate-pulse rounded-block border border-warm-border bg-cream-surface" /> : selected ? (
            <TrocometerPanel target={selected} myListings={data.myListings} isAuthenticated={isAuthenticated} onRequireAuth={requireAuth} onPropose={propose} />
          ) : !error ? (
            <div className="rounded-block border border-warm-border bg-cream-surface p-7 shadow-panel">
              <p className="text-eyebrow uppercase text-accent-text">Trocomètre</p>
              <h2 className="mt-2 font-display text-h3">Aucune annonce à peser</h2>
              <p className="mt-3 text-body-sm text-ink/70">Revenez bientôt ou déposez votre propre annonce de troc.</p>
              <Link href="/deposer?type=troc" className="k-button k-button-primary mt-5">Déposer une annonce</Link>
            </div>
          ) : null}
        </section>
      </main>
    </>
  )
}
