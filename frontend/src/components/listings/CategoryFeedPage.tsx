'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'

import Header from '@/components/layout/Header'
import ListingCard from '@/components/listings/ListingCard'
import SearchAlertModal from '@/components/SearchAlertModal'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { metaApi } from '@/lib/api'
import { useInfiniteListings } from '@/hooks/useInfiniteListings'
import { useListingFilters } from '@/hooks/useListingFilters'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const SORT_OPTIONS = [
  { value: 'date', label: 'Plus récentes' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
]

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'Correct' },
  { value: 'for_parts', label: 'Pour pièces' },
]

const RADIUS_OPTIONS = [5, 10, 20, 50, 100]

const FALLBACK_PROVINCES = [
  {
    id: 1,
    name: 'Province Sud',
    code: 'S',
    communes: [
      { id: 101, name: 'Noumea' },
      { id: 102, name: 'Dumbea' },
      { id: 103, name: 'Paita' },
      { id: 104, name: 'Mont-Dore' },
      { id: 105, name: 'Bourail' },
    ],
  },
  {
    id: 2,
    name: 'Province Nord',
    code: 'N',
    communes: [
      { id: 201, name: 'Kone' },
      { id: 202, name: 'Koumac' },
      { id: 203, name: 'Poum' },
      { id: 204, name: 'Voh' },
      { id: 205, name: 'Houailou' },
    ],
  },
  {
    id: 3,
    name: 'Province Iles',
    code: 'I',
    communes: [
      { id: 301, name: 'Lifou' },
      { id: 302, name: 'Mare' },
      { id: 303, name: 'Ouvea' },
    ],
  },
]

type CategoryFeedPageProps = {
  title: string
  subtitle: string
  categorySlug: string
  accentLabel?: string
}

export default function CategoryFeedPage({ title, subtitle, categorySlug, accentLabel }: CategoryFeedPageProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [communes, setCommunes] = useState<any[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchAlertOpen, setSearchAlertOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { user } = useAuthStore()
  const { openAuthModal } = useAuthActionStore()
  const {
    filters,
    setFilter,
    setLocation,
    clearLocation,
    resetFilters,
    activeFilterCount,
  } = useListingFilters()

  const visibleCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES
  const listingFilters = useMemo(() => ({
    q: filters.q,
    category: categorySlug || filters.category,
    commune_id: filters.commune_id,
    province_id: filters.province_id,
    price_min: filters.price_min,
    price_max: filters.price_max,
    condition: filters.condition,
    troc: filters.troc,
    lat: filters.lat,
    lng: filters.lng,
    radius: filters.radius,
    sort: filters.sort,
    page: 1,
    limit: 24,
  }), [categorySlug, filters])

  const {
    listings,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
    isError,
  } = useInfiniteListings(listingFilters)

  const isInitialLoading = isLoading && listings.length === 0
  const isLoadingMore = isFetchingNextPage && listings.length > 0

  const selectedProvince = communes.find((province: any) => String(province.id) === String(filters.province_id))
  const selectedProvinceCommunes = selectedProvince?.communes || []

  useEffect(() => {
    Promise.all([metaApi.getCategories(), metaApi.getCommunes()])
      .then(([catRes, comRes]) => {
        setCategories(catRes.data?.data?.length ? catRes.data.data : FALLBACK_CATEGORIES)
        setCommunes(comRes.data?.data?.length ? comRes.data.data : FALLBACK_PROVINCES)
      })
      .catch(() => {
        setCategories(FALLBACK_CATEGORIES)
        setCommunes(FALLBACK_PROVINCES)
      })
  }, [])

  useEffect(() => {
    const pending = peekPendingAuthAction()
    if (pending?.type === 'search_alert') {
      setSearchAlertOpen(true)
      consumePendingAuthAction()
    }
  }, [])

  useEffect(() => {
    if (filters.category !== categorySlug) {
      setFilter('category', categorySlug)
    }
  }, [categorySlug, filters.category, setFilter])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const element = sentinelRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void fetchNextPage()
      }
    }, { rootMargin: '400px 0px' })

    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const updateFilter = (key: string, value: string | number) => {
    setFilter(key as never, value as never)
  }

  const clearFilters = () => {
    resetFilters()
    setFilter('category', categorySlug)
  }

  const handleUseLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      window.alert('La géolocalisation n’est pas disponible dans ce navigateur.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude.toFixed(6), position.coords.longitude.toFixed(6))
      },
      () => {
        window.alert('Impossible de récupérer votre position pour le moment.')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    )
  }

  const selectedCategoryLabel = useMemo(() => {
    const match = visibleCategories.find((cat: any) => cat.slug === categorySlug || (cat.subcategories || []).some((sub: any) => sub.slug === categorySlug))
    if (!match) return title
    const directMatch = match.subcategories?.find((sub: any) => sub.slug === categorySlug)
    return directMatch?.name ?? match.name
  }, [categorySlug, title, visibleCategories])

  const loadError = useMemo(() => {
    if (!isError) return ''
    return error instanceof Error && error.message === 'timeout'
      ? 'Le chargement des annonces prend trop de temps. Essayez de recharger la page.'
      : 'Les annonces sont temporairement indisponibles.'
  }, [error, isError])

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 rounded-[2rem] border border-night/8 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-night px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {accentLabel ?? 'Nouveau feed'}
            </div>
            <h1 className="font-display text-3xl font-bold text-night md:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-night/60 md:text-base">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-night/35 w-4 h-4" />
            <input
              type="text"
              value={filters.q}
              onChange={(event) => updateFilter('q', event.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher dans les annonces"
              className="input pl-9 text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={filters.sort}
              onChange={(event) => updateFilter('sort', event.target.value)}
              aria-label="Trier les annonces"
              className="input text-sm appearance-none pr-8 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-night/40 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden btn-secondary text-sm relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSearchAlertOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-coral/20 bg-coral/6 px-3 py-2 text-sm font-semibold text-coral transition hover:border-coral/30 hover:bg-coral/10"
          >
            <Bell className="h-4 w-4" />
            Créer une alerte
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="card p-5 sticky top-20 space-y-6">
              <div className="rounded-2xl border border-night/8 bg-sand/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">Catégorie</p>
                <p className="mt-1 text-sm font-semibold text-night">{selectedCategoryLabel}</p>
                <p className="mt-1 text-xs text-night/45">Ce feed est pré-filtré sur cette catégorie.</p>
              </div>

              <div>
                <h3 className="font-semibold text-night text-sm mb-3">Localisation</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateFilter('province_id', '')
                        updateFilter('commune_id', '')
                      }}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        !filters.province_id ? 'bg-night text-white border-night' : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                      }`}
                    >
                      Toute la NC
                    </button>
                    {communes.map((province: any) => (
                      <button
                        key={province.id}
                        type="button"
                        onClick={() => updateFilter('province_id', String(province.id))}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          String(filters.province_id) === String(province.id)
                            ? 'bg-coral text-white border-coral'
                            : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                        }`}
                      >
                        {province.name}
                      </button>
                    ))}
                  </div>

                  {selectedProvince ? (
                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-night/8 bg-white p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateFilter('commune_id', '')}
                          className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                            !filters.commune_id
                              ? 'bg-night text-white border-night'
                              : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                          }`}
                        >
                          Toutes les communes
                        </button>
                        {selectedProvinceCommunes.map((commune: any) => (
                          <button
                            key={commune.id}
                            type="button"
                            onClick={() => updateFilter('commune_id', String(commune.id))}
                            className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                              String(filters.commune_id) === String(commune.id)
                                ? 'bg-coral text-white border-coral'
                                : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                            }`}
                          >
                            {commune.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-night/15 bg-sand/30 px-3 py-3 text-sm text-night/45">
                      Choisissez une province pour voir les communes.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-night/8 bg-sand/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">
                      Rayon de recherche
                    </label>
                    <p className="mt-1 text-xs text-night/45">
                      Distance max autour de votre position partagée.
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night shadow-sm">
                    {filters.radius} km
                  </div>
                </div>
                <input
                  type="range"
                  min={RADIUS_OPTIONS[0]}
                  max={RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]}
                  step={1}
                  value={filters.radius}
                  onChange={(event) => updateFilter('radius', Number(event.target.value))}
                  className="w-full accent-coral"
                  aria-label="Rayon de recherche en kilomètres"
                />
                <div className="flex justify-between text-[10px] text-night/35">
                  {RADIUS_OPTIONS.map((value) => <span key={value}>{value} km</span>)}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    className="rounded-full bg-night px-3 py-2 text-xs font-medium text-white"
                  >
                    Utiliser ma position
                  </button>
                  {filters.lat && filters.lng && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="rounded-full border border-night/10 bg-white px-3 py-2 text-xs font-medium text-night/60 hover:bg-sand"
                    >
                      Effacer la position
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-night text-sm mb-3">Prix (XPF)</h3>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.price_min}
                    onChange={(event) => updateFilter('price_min', event.target.value)}
                    className="input text-sm w-full"
                  />
                  <span className="text-night/30 text-sm">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.price_max}
                    onChange={(event) => updateFilter('price_max', event.target.value)}
                    className="input text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-night text-sm mb-3">État</h3>
                <div className="space-y-1">
                  {CONDITION_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sand cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value={opt.value}
                        checked={filters.condition === opt.value}
                        onChange={() => updateFilter('condition', opt.value)}
                        className="accent-coral"
                      />
                      <span className="text-sm text-night/70">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-ghost text-sm text-red-500 w-full justify-center">
                  <X className="w-4 h-4" /> Réinitialiser les filtres ({activeFilterCount})
                </button>
              )}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-night/50">
                {isLoading ? 'Chargement...' : (<><span className="font-semibold text-night">{total}</span> annonce{total > 1 ? 's' : ''}</>)}
              </p>
              {filters.q && (
                <span className="text-sm text-night/50">
                  pour <span className="font-medium text-night">"{filters.q}"</span>
                </span>
              )}
            </div>

            {loadError ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Impossible de charger les annonces</p>
                <p className="mt-1">{loadError}</p>
                <button type="button" onClick={() => void refetch()} className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-night shadow-sm">
                  Réessayer
                </button>
              </div>
            ) : null}

            {isInitialLoading ? (
              <ListingSkeletonGrid count={6} className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" />
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="font-display text-xl font-bold text-night mb-2">
                  Aucune annonce trouvée
                </h3>
                <p className="text-night/50 text-sm mb-6">
                  Essayez d'élargir votre recherche ou de modifier les filtres.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={clearFilters} className="btn-secondary">
                    Effacer les filtres
                  </button>
                  {loadError ? (
                    <button onClick={() => void refetch()} className="btn-primary">
                      Réessayer
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map((listing) => (
                    <ListingCard
                      key={String((listing as { id?: string | number }).id ?? '')}
                      listing={listing as unknown as Parameters<typeof ListingCard>[0]['listing']}
                    />
                  ))}
                </div>

                {isLoadingMore ? (
                  <div className="mt-4">
                    <ListingSkeletonGrid count={2} className="grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-4" />
                  </div>
                ) : null}

                {hasNextPage ? <div ref={sentinelRef} aria-hidden="true" className="h-8" /> : null}
              </>
            )}
          </main>
        </div>
      </div>

      <SearchAlertModal
        open={searchAlertOpen}
        onClose={() => setSearchAlertOpen(false)}
        filters={filters}
        categoryLabel={selectedCategoryLabel}
        communeLabel={selectedProvince?.name ?? null}
      />
    </div>
  )
}
