'use client'
// src/app/annonces/page.tsx

import { Suspense, useState, useEffect, useCallback } from 'react'
import {
  ChevronDown,
  List,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import { listingsApi, metaApi } from '@/lib/api'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { getCategoryIcon } from '@/lib/categoryPresentation'
import { useListingFilters, type ListingFilters } from '@/hooks/useListingFilters'

const AnnoncesMap = dynamic(() => import('@/components/annonces/AnnoncesMap'), { ssr: false })

const SORT_OPTIONS = [
  { value: 'date',       label: 'Plus recentes' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix decroissant' },
]

const CONDITION_OPTIONS = [
  { value: 'new',       label: 'Neuf' },
  { value: 'like_new',  label: 'Comme neuf' },
  { value: 'good',      label: 'Bon etat' },
  { value: 'fair',      label: 'Correct' },
  { value: 'for_parts', label: 'Pour pieces' },
]

const FALLBACK_PROVINCES = [
  {
    id: 1,
    name: 'Province Sud',
    code: 'S',
    communes: [
      { id: 101, name: 'Noumea', latitude: null, longitude: null },
      { id: 102, name: 'Dumbea', latitude: null, longitude: null },
      { id: 103, name: 'Paita', latitude: null, longitude: null },
      { id: 104, name: 'Mont-Dore', latitude: null, longitude: null },
      { id: 105, name: 'Bourail', latitude: null, longitude: null },
    ],
  },
  {
    id: 2,
    name: 'Province Nord',
    code: 'N',
    communes: [
      { id: 201, name: 'Koné', latitude: null, longitude: null },
      { id: 202, name: 'Koumac', latitude: null, longitude: null },
      { id: 203, name: 'Poum', latitude: null, longitude: null },
      { id: 204, name: 'Voh', latitude: null, longitude: null },
      { id: 205, name: 'Houailou', latitude: null, longitude: null },
    ],
  },
  {
    id: 3,
    name: 'Province Iles',
    code: 'I',
    communes: [
      { id: 301, name: 'Lifou', latitude: null, longitude: null },
      { id: 302, name: 'Mare', latitude: null, longitude: null },
      { id: 303, name: 'Ouvea', latitude: null, longitude: null },
    ],
  },
]

function ListingsPageContent() {
  const [listings,    setListings]    = useState<any[]>([])
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, pages: 1 })
  const [categories,  setCategories]  = useState<any[]>([])
  const [communes,    setCommunes]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode,    setViewMode]    = useState<'list' | 'map'>('list')
  const [openFamilySlug, setOpenFamilySlug] = useState<string | null>(null)
  const {
    filters,
    setFilter,
    setPage,
    resetFilters,
    activeFilterCount,
  } = useListingFilters()
  const visibleCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES

  // Charger categories et communes une seule fois
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

  // Charger les annonces
  const fetchListings = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const params: Record<string, string | number> = { sort: filters.sort, page: filters.page, limit: 24 }
      if (filters.q)          params.q          = filters.q
      if (filters.commune_id) params.commune_id = filters.commune_id
      else if (filters.province_id) params.province_id = filters.province_id
      if (filters.price_min)  params.price_min  = filters.price_min
      if (filters.price_max)  params.price_max  = filters.price_max
      if (filters.condition)  params.condition  = filters.condition
      if (filters.troc === 'true') params.troc = 'true'
      // Resoudre category slug -> id
      if (filters.category) {
        const found = visibleCategories.flatMap((c: any) => [c, ...(c.subcategories || [])])
          .find((c: any) => c.slug === filters.category)
        if (found) params.category_id = found.id
      }

      const result = await Promise.race([
        listingsApi.search(params),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), 6000)
        }),
      ]) as any
      const { data } = result
      setListings(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setListings([])
      setPagination({ total: 0, page: 1, pages: 1 })
      setLoadError(
        err instanceof Error && err.message === 'timeout'
          ? 'Le chargement des annonces prend trop de temps. Essayez de recharger la page.'
          : 'Les annonces sont temporairement indisponibles.'
      )
    } finally {
      setLoading(false)
    }
  }, [filters, visibleCategories])

  useEffect(() => { fetchListings() }, [fetchListings])

  useEffect(() => {
    if (!filters.category) {
      setOpenFamilySlug(null)
      return
    }

    const family = visibleCategories.find((cat: any) =>
      cat.slug === filters.category ||
      (cat.subcategories || []).some((sub: any) => sub.slug === filters.category)
    )

    if (family) {
      setOpenFamilySlug(family.slug)
    }
  }, [filters.category, visibleCategories])

  useEffect(() => {
    if (!filters.commune_id || communes.length === 0) return

    const matchingProvince = communes.find((province: any) =>
      (province.communes || []).some((commune: any) => String(commune.id) === String(filters.commune_id))
    )

    if (matchingProvince && String(matchingProvince.id) !== String(filters.province_id)) {
      setFilter('province_id', String(matchingProvince.id))
    }
  }, [filters.commune_id, filters.province_id, communes, setFilter])

  const updateFilter = (key: keyof ListingFilters, value: string | number) => {
    if (key === 'category' && value === '') {
      setOpenFamilySlug(null)
    }

    if (key === 'page') {
      setPage(Number(value))
      return
    }

    setFilter(key, value as never)
  }

  const clearFilters = () => {
    setOpenFamilySlug(null)
    resetFilters()
  }

  const isCategoryActive = (slug: string) => filters.category === slug
  const isParentCategoryActive = (cat: any) =>
    filters.category === cat.slug || (cat.subcategories || []).some((sub: any) => sub.slug === filters.category)
  const selectedProvince = communes.find((province: any) => String(province.id) === String(filters.province_id))
  const selectedProvinceCommunes = selectedProvince?.communes || []
  const sortedProvinces = [...communes].sort((a: any, b: any) => {
    const order = (value: any) => {
      const code = String(value?.code || '').toUpperCase()
      if (code.startsWith('N')) return 1
      if (code.startsWith('I')) return 2
      if (code.startsWith('S')) return 3
      return 99
    }

    return order(a) - order(b)
  })

  const handleFamilyToggle = (cat: any) => {
    if (filters.category === cat.slug) {
      setOpenFamilySlug(null)
      updateFilter('category', '')
      return
    }

    setOpenFamilySlug(cat.slug)
    updateFilter('category', cat.slug)
  }

  // Sidebar filtres
  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Catégories */}
      <div>
        <h3 className="font-semibold text-night text-sm mb-3">Catégorie</h3>
        <div className="space-y-1 max-h-[32rem] overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              setOpenFamilySlug(null)
              updateFilter('category', '')
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              !filters.category ? 'bg-coral text-white' : 'hover:bg-sand text-night/70'
            }`}
          >
            Toutes les catégories
          </button>
          {visibleCategories.map((cat: any) => {
            const isOpen = openFamilySlug === cat.slug
            return (
              <div key={cat.id} className="rounded-2xl border border-night/8 bg-white/80 p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFamilyToggle(cat)}
                    className={`flex flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-colors ${
                      isParentCategoryActive(cat) ? 'bg-night text-white shadow-sm' : 'hover:bg-sand text-night/70'
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isParentCategoryActive(cat) ? 'bg-white/10' : 'bg-sand text-night'
                    }`}>
                      {(() => {
                        const Icon = getCategoryIcon(cat.slug)
                        return <Icon className="h-5 w-5" />
                      })()}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{cat.name}</span>
                      <span className={`block text-[11px] ${isParentCategoryActive(cat) ? 'text-white/65' : 'text-night/45'}`}>
                        {cat.subcategories?.length || 0} sous-catégorie{(cat.subcategories?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={isOpen ? `Fermer ${cat.name}` : `Ouvrir ${cat.name}`}
                    onClick={() => setOpenFamilySlug((current) => (current === cat.slug ? null : cat.slug))}
                    className="rounded-full p-2 text-current hover:bg-black/5"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {(cat.subcategories || []).length > 0 && isOpen && (
                  <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
                    <button
                      type="button"
                      onClick={() => updateFilter('category', cat.slug)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        filters.category === cat.slug
                          ? 'border-night bg-night text-white'
                          : 'border-night/10 bg-white text-night/65 hover:border-night/20 hover:bg-sand hover:text-night'
                      }`}
                    >
                      Toute la famille
                    </button>
                    {cat.subcategories.map((sub: any) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => updateFilter('category', sub.slug)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          isCategoryActive(sub.slug)
                            ? 'border-night bg-night text-white'
                            : 'border-night/10 bg-white text-night/65 hover:border-night/20 hover:bg-sand hover:text-night'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Localisation */}
      <div className="rounded-2xl border border-night/8 bg-white/80 p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="font-semibold text-night text-sm">Localisation</h3>
          <p className="mt-1 text-xs text-night/45">
            Choisissez d'abord une province, puis une commune.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">
              Province
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  updateFilter('province_id', '')
                  updateFilter('commune_id', '')
                }}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  !filters.province_id
                    ? 'bg-night text-white border-night'
                    : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                }`}
              >
                Toute la NC
              </button>
              {sortedProvinces.map((province: any) => {
                const isActiveProvince = String(filters.province_id) === String(province.id)
                return (
                  <button
                    key={province.id}
                    type="button"
                    onClick={() => updateFilter('province_id', String(province.id))}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      isActiveProvince
                        ? 'bg-coral text-white border-coral'
                        : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                    }`}
                  >
                    {province.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">
              Commune
            </label>
            {!selectedProvince ? (
              <div className="rounded-xl border border-dashed border-night/15 bg-sand/30 px-3 py-3 text-sm text-night/45">
                Choisissez une province pour voir les communes.
              </div>
            ) : (
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
                  {selectedProvinceCommunes.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => updateFilter('commune_id', String(c.id))}
                      className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                        String(filters.commune_id) === String(c.id)
                          ? 'bg-coral text-white border-coral'
                          : 'bg-white text-night/65 border-night/12 hover:bg-sand'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Prix */}
      <div>
        <h3 className="font-semibold text-night text-sm mb-3">Prix (XPF)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.price_min}
            onChange={(e) => updateFilter('price_min', e.target.value)}
            className="input text-sm w-full"
          />
          <span className="text-night/30 text-sm">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.price_max}
            onChange={(e) => updateFilter('price_max', e.target.value)}
            className="input text-sm w-full"
          />
        </div>
      </div>

      {/* Etat */}
      <div>
        <h3 className="font-semibold text-night text-sm mb-3">Etat</h3>
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
          {filters.condition && (
            <button onClick={() => updateFilter('condition', '')} className="text-xs text-coral hover:underline pl-3">
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Effacer tous les filtres */}
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="btn-ghost text-sm text-red-500 w-full justify-center">
          <X className="w-4 h-4" /> Réinitialiser les filtres ({activeFilterCount})
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Barre superieure */}
        <div className="flex items-center gap-3 mb-6">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-night/35 w-4 h-4" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher dans les annonces"
              className="input pl-9 text-sm"
            />
          </div>

          {/* Filtre Troc */}
          <button
            onClick={() => updateFilter('troc', filters.troc === 'true' ? '' : 'true')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors shrink-0 ${
              filters.troc === 'true'
                ? 'bg-night text-white border-night'
                : 'bg-white text-night/60 border-night/12 hover:text-night'
            }`}
            aria-pressed={filters.troc === 'true'}
            aria-label="Filtrer uniquement les annonces avec troc"
          >
            <span aria-hidden="true">↻</span>
            <span className="hidden sm:inline">Troc uniquement</span>
          </button>

          {/* Tri */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              aria-label="Trier les annonces"
              className="input text-sm appearance-none pr-8 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-night/40 pointer-events-none" />
          </div>

          {/* Bouton filtres mobile */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden btn-secondary text-sm relative"
            aria-expanded={filtersOpen}
            aria-controls="mobile-filters-drawer"
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="hidden lg:flex items-center rounded-xl border border-night/12 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                viewMode === 'list' ? 'bg-night text-white' : 'text-night/60 hover:text-night'
              }`}
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                viewMode === 'map' ? 'bg-night text-white' : 'text-night/60 hover:text-night'
              }`}
              aria-pressed={viewMode === 'map'}
            >
              <Map className="h-4 w-4" />
              Carte
            </button>
          </div>
        </div>

        <div className="flex gap-6">

          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="card p-5 sticky top-20">
              <FilterSidebar />
            </div>
          </aside>

          {/* Drawer filtres mobile */}
          {filtersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
              <div id="mobile-filters-drawer" role="dialog" aria-modal="true" aria-label="Filtres de recherche" className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-6 shadow-modal animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-lg">Filtres</h2>
                  <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Carte Leaflet */}
        {viewMode === 'map' && (
          <div className="mb-6">
            <AnnoncesMap
              listings={listings.map((a: any) => ({
                id:        a.id,
                titre:     a.titre,
                prix:      a.prix ?? a.prix_xpf,
                cover_url: a.cover_image ?? a.images?.[0]?.url,
                lat:       a.commune_lat  ?? a.lat,
                lng:       a.commune_lng  ?? a.lng,
                commune:   a.commune_name ?? a.commune ?? '',
              }))}
              onBoundsChange={(bounds) => {
                // Optionnel : filtrer par bounds de carte
              }}
            />
            <p className="text-xs text-night/40 text-center mt-2">
              Cliquez sur un marqueur pour voir l'annonce
            </p>
          </div>
        )}

        {/* Grille d'annonces */}
          <div className="flex-1 min-w-0">
            {/* Resultats */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-night/50">
                {loading ? 'Chargement...' : (
                  <><span className="font-semibold text-night">{pagination.total}</span> annonce{pagination.total > 1 ? 's' : ''}</>
                )}
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
                <button
                  type="button"
                  onClick={() => void fetchListings()}
                  className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-night shadow-sm"
                >
                  Réessayer
                </button>
              </div>
            ) : null}

            {/* TODO: test E2E sur le chargement initial et la pagination sans perte de contexte. */}
            {loading && listings.length === 0 ? (
              <ListingSkeletonGrid count={6} className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" />
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-6xl mb-4 block" aria-hidden="true">🔍</span>
                <h3 className="font-display text-xl font-bold text-night mb-2">
                  {loadError ? 'Flux d’annonces indisponible' : 'Aucune annonce trouvee'}
                </h3>
                <p className="text-night/50 text-sm mb-6">
                  {loadError
                    ? 'Le service des annonces ne répond pas pour le moment. Vous pouvez réessayer ou revenir plus tard.'
                    : "Essayez d'elargir votre recherche ou de modifier les filtres."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={clearFilters} className="btn-secondary">
                    Effacer les filtres
                  </button>
                  {loadError ? (
                    <button onClick={() => void fetchListings()} className="btn-primary">
                      Réessayer
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {loading && listings.length > 0 ? (
                  <div className="mt-4">
                    <ListingSkeletonGrid count={2} className="grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-4" />
                  </div>
                ) : null}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          pagination.page === i + 1
                            ? 'bg-coral text-white'
                            : 'bg-white text-night hover:bg-sand'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <ListingsPageContent />
    </Suspense>
  )
}

