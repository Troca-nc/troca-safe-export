'use client'

import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Grid2x2, RotateCw, Sparkles, SwatchBook } from 'lucide-react'
import Header from '@/components/layout/Header'
import TrocCard from '@/components/troc/TrocCard'
import TrocCompatibilityMeter from '@/components/troc/TrocCompatibilityMeter'
import TrocProposalsPanel from '@/components/troc/TrocProposalsPanel'
import { ListingSkeletonGrid, ListingSkeletonRail } from '@/components/ListingSkeleton'
import { trocApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import { useInfiniteTrocListings } from '@/hooks/useInfiniteTrocListings'

type TrocCycleItem = {
  id: string
  participant_ids: number[]
  listing_ids: number[]
  status: string
  confirmations: number[]
  detected_at: string
  expires_at: string
}

type TrocCardListing = ComponentProps<typeof TrocCard>['listing']

function TrocSwipeDeck() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [index, setIndex] = useState(0)
  const {
    listings,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTrocListings({ limit: 25 }, 'swipe')

  const current = listings[index] as TrocCardListing | undefined

  useEffect(() => {
    if (hasNextPage && listings.length - index < 5 && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, index, isFetchingNextPage, listings.length])

  const goNext = () => setIndex((value) => value + 1)
  const handlePass = async () => {
    if (!current) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'troc_swipe',
        listingId: String(current.id),
        redirectTo: '/troc?mode=swipe',
      })
      return
    }
    await trocApi.swipe({ listing_id: current.id, direction: 'left' }).catch(() => {})
    goNext()
  }
  const handlePropose = () => {
    if (!current) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'troc_proposal',
        listingId: String(current.id),
        redirectTo: `/troc/${current.id}`,
      })
      return
    }
    router.push(`/troc/${current.id}`)
  }

  if (isLoading && listings.length === 0) {
    return <ListingSkeletonRail count={1} className="mx-auto max-w-2xl" />
  }

  if (!current) {
    return (
      <div className="rounded-[2rem] border border-night/8 bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/70">Swipe</p>
        <h2 className="mt-3 text-2xl font-bold text-night">Vous avez tout vu !</h2>
        <p className="mt-2 text-sm leading-6 text-night/60">
          Revenez demain ou publiez votre propre annonce troc pour remettre la boucle en mouvement.
        </p>
        <Link href="/annonces/nouvelle?mode=troc" className="btn-primary mt-6 inline-flex px-4 py-2.5 text-sm">
          Publier une annonce troc
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-night/55">{index + 1} / {Math.max(listings.length, 1)}</p>
        <button
          type="button"
          onClick={() => setIndex(0)}
          className="inline-flex items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-2 text-xs font-semibold text-night/70 transition hover:border-coral/30 hover:text-coral"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Recommencer
        </button>
      </div>

      <TrocCard listing={current} mode="swipe" />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handlePass}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night/65 transition hover:border-night/20 hover:text-night"
        >
          ✗ Passer
        </button>
        <button
          type="button"
          onClick={handlePropose}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          ♥ Proposer
        </button>
      </div>
    </div>
  )
}

function TrocPageContent() {
  // TODO: test E2E sur le feed Troc, le toggle liste/swipe et les notifications de cycle.
  const [mode, setMode] = useState<'list' | 'swipe'>('list')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { isAuthenticated } = useAuthStore()
  const [cycles, setCycles] = useState<TrocCycleItem[]>([])

  const listingFilters = useMemo(() => ({
    limit: mode === 'swipe' ? 25 : 24,
    troc: true,
  }), [mode])

  const {
    listings,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTrocListings(listingFilters, mode)

  const { data: cyclesData } = useQuery({
    queryKey: ['troc', 'cycles'],
    queryFn: async () => {
      const response = await trocApi.getCycles()
      return response.data as { data?: TrocCycleItem[] }
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 30_000,
    retry: 0,
  })

  useEffect(() => {
    if (Array.isArray(cyclesData?.data)) {
      setCycles(cyclesData.data)
    }
  }, [cyclesData])

  useEffect(() => {
    if (mode !== 'list') return
    if (!hasNextPage || isFetchingNextPage) return
    const element = sentinelRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void fetchNextPage()
      }
    }, { rootMargin: '350px 0px' })

    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, mode])

  const isInitialLoading = isLoading && listings.length === 0

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-night/8 bg-night px-6 py-8 text-white shadow-[0_18px_70px_rgba(8,32,50,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
                <Sparkles className="h-3.5 w-3.5" />
                Troc
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Échangez vos objets, sans dépenser
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                Explorez les annonces compatibles, comparez votre Troc-o-mètre et démarrez une proposition structurée avant le chat.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode('swipe')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'swipe'
                    ? 'bg-white text-night'
                    : 'border border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <SwatchBook className="h-4 w-4" />
                Swipe
              </button>
              <button
                type="button"
                onClick={() => setMode('list')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'list'
                    ? 'bg-white text-night'
                    : 'border border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <Grid2x2 className="h-4 w-4" />
                Liste
              </button>
              <Link href="/annonces/nouvelle?mode=troc" className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90">
                Publier une annonce troc
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {isAuthenticated && cycles.length > 0 ? (
          <section className="mt-6 rounded-[1.75rem] border border-ocean/15 bg-ocean/8 p-4 text-ocean shadow-sm">
            <p className="text-sm font-semibold">
              🔄 Un troc en 3 est possible ! Vous avez des cycles détectés en attente de confirmation.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cycles.slice(0, 3).map((cycle) => (
                <Link
                  key={cycle.id}
                  href={`/troc/cycles/${cycle.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-night transition hover:text-coral"
                >
                  Voir le cycle
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-6">
          <TrocProposalsPanel />
        </div>

        <section className="mt-8">
          {mode === 'list' ? (
            <>
              {isInitialLoading ? (
                <ListingSkeletonGrid count={6} />
              ) : listings.length === 0 ? (
                <div className="rounded-[2rem] border border-night/8 bg-white p-8 text-center shadow-card">
                  <h2 className="text-2xl font-bold text-night">Aucune annonce troc pour le moment</h2>
                  <p className="mt-2 text-sm leading-6 text-night/60">
                    Publiez une annonce troc pour lancer les premiers échanges.
                  </p>
                  <Link href="/annonces/nouvelle?mode=troc" className="btn-primary mt-6 inline-flex px-4 py-2.5 text-sm">
                    Publier une annonce troc
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing) => (
                    <TrocCard key={String(listing.id)} listing={listing as TrocCardListing} mode="grid" />
                  ))}
                </div>
              )}

              {isFetchingNextPage ? (
                <div className="mt-6">
                  <ListingSkeletonRail count={2} />
                </div>
              ) : null}

              <div ref={sentinelRef} className="h-8" aria-hidden="true" />

              {total > 0 ? (
                <p className="mt-4 text-center text-xs text-night/45">
                  {total.toLocaleString('fr-FR')} annonce{total > 1 ? 's' : ''} troc trouvée{total > 1 ? 's' : ''}
                </p>
              ) : null}
            </>
          ) : (
            <TrocSwipeDeck />
          )}
        </section>
      </main>
    </div>
  )
}

export default function TrocPage() {
  return <TrocPageContent />
}
