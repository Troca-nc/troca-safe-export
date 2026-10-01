'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import SearchAlertModal from '@/components/SearchAlertModal'
import Header from '@/components/layout/Header'
import ListingCard from '@/components/listings/ListingCard'
import ListingsFiltersPanel from '@/components/listings/ListingsFiltersPanel'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import { ErrorState } from '@/components/ui/Skeleton'
import { useListingFilters, type ListingFilters } from '@/hooks/useListingFilters'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { FALLBACK_CATEGORIES, findCategoryNode, type CategoryNode } from '@/lib/categoryCatalog'
import { getListingsMetadata, getListingsPage, getListingZones } from '@/lib/data/listings'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const SORT_OPTIONS = [
  { value: 'date', label: 'Plus récentes' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'relevance', label: 'Pertinence' },
] as const

type Props = {
  title?: string
  subtitle?: string
  categorySlug?: string
  accentLabel?: string
}

function categoryChildren(category: CategoryNode) {
  return category.children || category.subcategories || []
}

function findCategoryPath(categories: CategoryNode[], slug: string): CategoryNode[] {
  for (const category of categories) {
    if (category.slug === slug) return [category]
    const childPath = findCategoryPath(categoryChildren(category), slug)
    if (childPath.length > 0) return [category, ...childPath]
  }
  return []
}

function CategoryMenu({
  categories,
  selectedSlug,
  disabled,
  onSelect,
}: {
  categories: CategoryNode[]
  selectedSlug: string
  disabled: boolean
  onSelect: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [hoveredSlug, setHoveredSlug] = useState(categories[0]?.slug ?? '')
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = selectedSlug ? findCategoryNode(selectedSlug, categories) : null
  const hovered = categories.find((category) => category.slug === hoveredSlug) ?? categories[0]

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-0 sm:min-w-[220px]">
      <button
        type="button"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        className="inline-flex h-[54px] w-full items-center gap-3 rounded-control border border-warm-border bg-cream-surface px-4 text-left text-base font-semibold text-ink disabled:cursor-default"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{selected?.name ?? 'Toutes les catégories'}</span>
        {!disabled ? <ChevronDown className={`h-4 w-4 shrink-0 text-ink/45 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div className="absolute left-0 top-[62px] z-50 grid w-[min(568px,calc(100vw-32px))] overflow-hidden rounded-card border border-ink bg-cream-surface shadow-modal sm:grid-cols-[minmax(0,268px)_minmax(0,300px)]" role="menu">
          <div className="max-h-[436px] overflow-y-auto border-warm-border p-2 sm:border-r">
            <button
              type="button"
              role="menuitem"
              onClick={() => { onSelect(''); setOpen(false) }}
              className={`flex min-h-11 w-full items-center rounded-control px-3 text-left text-body-sm ${selectedSlug ? 'hover:bg-cream-sunken' : 'bg-cream-sunken font-semibold'}`}
            >
              Toutes les catégories
            </button>
            {categories.map((category) => (
              <button
                type="button"
                role="menuitem"
                key={category.slug}
                onMouseEnter={() => setHoveredSlug(category.slug)}
                onFocus={() => setHoveredSlug(category.slug)}
                onClick={() => { onSelect(category.slug); setOpen(false) }}
                className={`flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left ${category.slug === hovered?.slug ? 'bg-cream-sunken' : ''}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent/15 font-display text-accent-text">
                  {category.name.charAt(0)}
                </span>
                <span className="truncate text-body-sm font-medium text-ink">{category.name}</span>
              </button>
            ))}
          </div>
          <div className="hidden max-h-[436px] overflow-y-auto bg-cream-sunken p-5 sm:block">
            <p className="m-0 text-eyebrow-sm uppercase text-ink/55">{hovered?.name ?? 'Catégories'}</p>
            <div className="mt-3 flex flex-col gap-1">
              {hovered && categoryChildren(hovered).length > 0 ? categoryChildren(hovered).map((subcategory) => (
                <button
                  type="button"
                  role="menuitem"
                  key={subcategory.slug}
                  onClick={() => { onSelect(subcategory.slug); setOpen(false) }}
                  className="min-h-11 rounded-control px-3 text-left text-body-sm text-ink/80 hover:bg-cream-surface"
                >
                  {subcategory.name}
                </button>
              )) : <p className="text-body-sm text-ink/55">Voir toutes les annonces de cette catégorie.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function ListingsPageView({ title, subtitle, categorySlug = '', accentLabel }: Props) {
  const searchParams = useSearchParams()
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
  const [queryDraft, setQueryDraft] = useState(filters.q)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [searchAlertOpen, setSearchAlertOpen] = useState(false)
  const closeFiltersRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const filtersTriggerRef = useRef<HTMLButtonElement>(null)

  const metadataQuery = useQuery({
    queryKey: ['listings.metadata'],
    queryFn: getListingsMetadata,
    staleTime: 5 * 60_000,
  })
  const categories = metadataQuery.data?.categories ?? FALLBACK_CATEGORIES
  const provinces = metadataQuery.data?.provinces ?? []

  useEffect(() => setQueryDraft(filters.q), [filters.q])

  useEffect(() => {
    if (categorySlug && filters.category !== categorySlug) setFilter('category', categorySlug)
  }, [categorySlug, filters.category, setFilter])

  useEffect(() => {
    const pending = peekPendingAuthAction()
    if (pending?.type !== 'search_alert') return
    setSearchAlertOpen(true)
    consumePendingAuthAction()
  }, [])

  useEffect(() => {
    if (!metadataQuery.data) return
    const categoryAlias = searchParams.get('sous_categorie') || searchParams.get('categorie')
    if (!categorySlug && categoryAlias && filters.category !== categoryAlias) {
      setFilter('category', categoryAlias)
      return
    }
    const communeAlias = searchParams.get('commune')
    if (!communeAlias || filters.commune_id) return
    for (const province of provinces) {
      const commune = province.communes.find((item) => item.slug === communeAlias)
      if (commune) {
        setFilter('province_id', province.id)
        window.setTimeout(() => setFilter('commune_id', commune.id), 0)
        break
      }
    }
  }, [categorySlug, filters.category, filters.commune_id, metadataQuery.data, provinces, searchParams, setFilter])

  const selectedCommune = useMemo(
    () => provinces.flatMap((province) => province.communes).find((commune) => commune.id === filters.commune_id) ?? null,
    [filters.commune_id, provinces],
  )
  const zonesQuery = useQuery({
    queryKey: ['listings.zones', selectedCommune?.slug],
    queryFn: () => getListingZones(selectedCommune?.slug ?? ''),
    enabled: Boolean(selectedCommune?.slug),
    staleTime: 5 * 60_000,
  })

  const listingParams = useMemo(() => ({
    q: filters.q,
    category: categorySlug || filters.category,
    commune_id: filters.commune_id,
    province_id: filters.province_id,
    quartier_zone: filters.quartier_zone,
    price_min: filters.price_min,
    price_max: filters.price_max,
    condition: filters.condition,
    troc: filters.troc,
    lat: filters.lat,
    lng: filters.lng,
    radius: filters.radius,
    sort: filters.sort,
    page: 1,
    limit: 9,
  }), [categorySlug, filters])

  const listingsQuery = useInfiniteQuery({
    queryKey: ['listings.v2', listingParams],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getListingsPage(listingParams, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: 1,
  })
  const listings = useMemo(() => listingsQuery.data?.pages.flatMap((page) => page.data) ?? [], [listingsQuery.data])
  const total = listingsQuery.data?.pages[0]?.pagination.total ?? 0

  const updateFilter = useCallback((key: keyof ListingFilters, value: string | number) => {
    setFilter(key, value as never)
  }, [setFilter])

  const selectedCategoryPath = useMemo(
    () => findCategoryPath(categories, categorySlug || filters.category),
    [categories, categorySlug, filters.category],
  )
  const selectedCategory = selectedCategoryPath.at(-1) ?? null
  const selectedProvince = provinces.find((province) => province.id === filters.province_id) ?? null
  const locationLabel = selectedCommune?.name ?? selectedProvince?.name ?? (filters.lat && filters.lng ? `rayon ${filters.radius} km` : 'Nouvelle-Calédonie')
  const heading = title ?? selectedCategory?.name ?? (filters.troc === 'true' ? 'Annonces disponibles en troc' : 'Toutes les annonces')

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; remove: () => void }> = []
    if (!categorySlug && selectedCategory) chips.push({ key: 'category', label: selectedCategory.name, remove: () => updateFilter('category', '') })
    if (filters.troc === 'true') chips.push({ key: 'troc', label: 'Troc', remove: () => updateFilter('troc', '') })
    if (selectedProvince) chips.push({ key: 'province', label: selectedProvince.name, remove: () => updateFilter('province_id', '') })
    if (selectedCommune) chips.push({ key: 'commune', label: selectedCommune.name, remove: () => updateFilter('commune_id', '') })
    if (filters.quartier_zone) chips.push({ key: 'zone', label: filters.quartier_zone, remove: () => updateFilter('quartier_zone', '') })
    if (filters.price_min || filters.price_max) chips.push({ key: 'price', label: `${filters.price_min || '0'} – ${filters.price_max || '∞'} XPF`, remove: () => { updateFilter('price_min', ''); updateFilter('price_max', '') } })
    if (filters.condition) chips.push({ key: 'condition', label: filters.condition.replaceAll('_', ' '), remove: () => updateFilter('condition', '') })
    if (filters.lat && filters.lng) chips.push({ key: 'geo', label: `À moins de ${filters.radius} km`, remove: clearLocation })
    return chips
  }, [categorySlug, clearLocation, filters, selectedCategory, selectedCommune, selectedProvince, updateFilter])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateFilter('q', queryDraft.trim())
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(coords.latitude.toFixed(6), coords.longitude.toFixed(6))
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    )
  }

  const handleCreateAlert = () => {
    if (!user) {
      openAuthModal({ type: 'search_alert', redirectTo: `${window.location.pathname}${window.location.search}` })
      return
    }
    setSearchAlertOpen(true)
  }

  useEffect(() => {
    if (!filtersOpen) return
    const previous = document.activeElement as HTMLElement | null
    closeFiltersRef.current?.focus()
    const handleDrawerKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [])
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleDrawerKeys)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleDrawerKeys)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [filtersOpen])

  const resetAll = () => {
    resetFilters()
    if (categorySlug) window.setTimeout(() => setFilter('category', categorySlug), 0)
  }

  const filtersPanel = (
    <ListingsFiltersPanel
      filters={filters}
      provinces={provinces}
      zones={zonesQuery.data ?? []}
      listings={listings}
      metadataLoading={metadataQuery.isPending}
      metadataError={metadataQuery.isError}
      zonesLoading={zonesQuery.isFetching}
      geoLoading={geoLoading}
      activeFilterCount={activeFilterCount}
      updateFilter={updateFilter}
      useLocation={handleUseLocation}
      clearLocation={clearLocation}
      resetFilters={resetAll}
    />
  )

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />

      <section className="sticky top-[149px] z-30 border-b border-warm-border bg-cream/95 px-4 py-4 backdrop-blur sm:px-6 lg:top-[89px] lg:px-12" aria-label="Recherche et tri des annonces">
        <div className="mx-auto flex max-w-container flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <CategoryMenu
              categories={categories}
              selectedSlug={categorySlug || filters.category}
              disabled={Boolean(categorySlug)}
              onSelect={(slug) => updateFilter('category', slug)}
            />
            <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center rounded-card border border-ink bg-cream-surface p-1.5 shadow-card" role="search">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Rechercher dans les annonces</span>
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/45" aria-hidden="true" />
                <input
                  value={queryDraft}
                  onChange={(event) => setQueryDraft(event.target.value)}
                  placeholder="Mot-clé, marque, modèle…"
                  className="h-11 w-full bg-transparent pl-10 pr-3 text-base text-ink outline-none placeholder:text-ink/40"
                />
              </label>
              <button type="submit" className="inline-flex h-11 shrink-0 items-center rounded-control bg-accent-strong px-4 text-label text-cream hover:bg-accent-strongHover sm:px-6">
                Rechercher
              </button>
            </form>
            <button type="button" onClick={handleCreateAlert} className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-control border border-ink px-4 text-label text-ink">
              <Bell className="h-4 w-4" aria-hidden="true" /> Créer une alerte
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-control border border-warm-border bg-cream-sunken p-1">
              <button type="button" onClick={() => updateFilter('troc', '')} className={`min-h-11 flex-1 rounded-control px-4 text-label sm:flex-none ${filters.troc !== 'true' ? 'bg-cream-surface shadow-card' : 'text-ink/65'}`} aria-pressed={filters.troc !== 'true'}>Annonces</button>
              <button type="button" onClick={() => updateFilter('troc', 'true')} className={`min-h-11 flex-1 rounded-control px-4 text-label sm:flex-none ${filters.troc === 'true' ? 'bg-cream-surface shadow-card' : 'text-ink/65'}`} aria-pressed={filters.troc === 'true'}>Troc</button>
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 ? <button type="button" onClick={resetAll} className="hidden min-h-11 items-center gap-2 text-label text-[var(--color-error)] md:inline-flex"><X className="h-4 w-4" /> Réinitialiser ({activeFilterCount})</button> : null}
              <label className="flex flex-1 items-center gap-2 text-body-sm text-ink/60 sm:flex-none">
                <span className="hidden sm:inline">Trier par</span>
                <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="h-11 flex-1 rounded-control border border-warm-border bg-cream-surface px-3 text-base text-ink outline-none focus:border-ink sm:flex-none">
                  {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container px-4 pb-24 pt-7 sm:px-6 md:grid md:grid-cols-[296px_minmax(0,1fr)] md:items-start md:gap-7 lg:px-12">
        <aside className="sticky top-[212px] hidden max-h-[calc(100vh-236px)] overflow-y-auto pr-1 md:block" aria-label="Filtres des annonces">
          {filtersPanel}
        </aside>

        <section className="min-w-0" aria-labelledby="listings-results-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {accentLabel ? <p className="m-0 text-eyebrow uppercase text-accent-text">{accentLabel}</p> : null}
              <h1 id="listings-results-title" className="m-0 font-display text-h1 font-normal text-ink">{heading}</h1>
              <p className="mb-0 mt-2 text-body text-ink/65">
                {listingsQuery.isPending ? 'Chargement des annonces…' : `${total.toLocaleString('fr-FR')} annonce${total > 1 ? 's' : ''} · ${locationLabel}`}
              </p>
              {subtitle ? <p className="mb-0 mt-2 max-w-3xl text-body-sm text-ink/60">{subtitle}</p> : null}
            </div>
            <button
              ref={filtersTriggerRef}
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-ink px-4 text-label text-ink md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filtrer{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>

          {activeChips.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtres actifs">
              {activeChips.map((chip) => (
                <button type="button" key={chip.key} onClick={chip.remove} className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-ink bg-cream-surface px-3 text-body-sm font-medium text-ink">
                  {chip.label}<X className="h-3.5 w-3.5 text-ink/55" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            {listingsQuery.isPending ? <ListingSkeletonGrid count={9} className="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" /> : null}
            {listingsQuery.isError ? <ErrorState message="Impossible de charger les annonces." onRetry={() => void listingsQuery.refetch()} /> : null}
            {!listingsQuery.isPending && !listingsQuery.isError && listings.length === 0 ? (
              <div className="rounded-block border border-warm-border bg-cream-surface px-6 py-16 text-center shadow-card">
                <Search className="mx-auto h-8 w-8 text-info-text" aria-hidden="true" />
                <h2 className="mb-0 mt-5 font-display text-h3 font-normal text-ink">Aucune annonce ne correspond à vos critères.</h2>
                <p className="mx-auto mb-0 mt-3 max-w-xl text-body text-ink/60">Essayez d&apos;élargir votre recherche ou de retirer un filtre.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={resetAll} className="inline-flex min-h-12 items-center rounded-control border border-ink px-5 text-label text-ink">Effacer les filtres</button>
                  <a href="/annonces/nouvelle" className="inline-flex min-h-12 items-center rounded-control bg-accent-strong px-5 text-label text-cream">Déposer une annonce</a>
                </div>
              </div>
            ) : null}
            {!listingsQuery.isPending && !listingsQuery.isError && listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                </div>
                {listingsQuery.isFetchingNextPage ? <div className="mt-4"><ListingSkeletonGrid count={3} className="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" /></div> : null}
                <div className="mt-8 flex flex-col items-center gap-3">
                  <p className="m-0 text-body-sm text-ink/60">{listings.length.toLocaleString('fr-FR')} annonces sur {total.toLocaleString('fr-FR')}</p>
                  <div className="h-1 w-52 overflow-hidden rounded-pill bg-warm-border" aria-hidden="true">
                    <div className="h-full rounded-pill bg-accent-strong" style={{ width: `${total > 0 ? Math.min(100, (listings.length / total) * 100) : 0}%` }} />
                  </div>
                  {listingsQuery.hasNextPage ? (
                    <button type="button" onClick={() => void listingsQuery.fetchNextPage()} disabled={listingsQuery.isFetchingNextPage} className="inline-flex min-h-12 items-center rounded-control border border-ink px-6 text-label text-ink disabled:border-warm-border disabled:text-ink/45">
                      {listingsQuery.isFetchingNextPage ? 'Chargement…' : "Charger plus d'annonces"}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>

      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        className="fixed inset-x-4 bottom-4 z-30 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-ink px-5 text-label text-cream shadow-modal md:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filtrer{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </button>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end md:hidden" role="presentation">
          <button type="button" aria-label="Fermer les filtres" className="absolute inset-0 bg-ink-deep/65" onClick={() => setFiltersOpen(false)} />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title" className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-block bg-cream px-5 pb-28 pt-4 shadow-modal">
            <div className="mx-auto h-1 w-10 rounded-pill bg-warm-border" aria-hidden="true" />
            <div className="my-4 flex items-center justify-between gap-4">
              <h2 id="mobile-filters-title" className="m-0 font-display text-h3 font-normal text-ink">Filtres</h2>
              <button ref={closeFiltersRef} type="button" onClick={() => setFiltersOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-sunken" aria-label="Fermer les filtres"><X className="h-5 w-5" /></button>
            </div>
            {filtersPanel}
            <div className="fixed inset-x-0 bottom-0 z-10 flex gap-3 border-t border-warm-border bg-cream p-4">
              <button type="button" onClick={resetAll} className="min-h-12 flex-1 rounded-control border border-warm-border px-4 text-label text-ink">Réinitialiser</button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="min-h-12 flex-1 rounded-control bg-accent-strong px-4 text-label text-cream">Voir {total.toLocaleString('fr-FR')} résultats</button>
            </div>
          </div>
        </div>
      ) : null}

      <SearchAlertModal
        open={searchAlertOpen}
        onClose={() => setSearchAlertOpen(false)}
        filters={filters}
        categoryLabel={selectedCategory?.name ?? null}
        communeLabel={selectedCommune?.name ?? null}
      />
    </div>
  )
}
