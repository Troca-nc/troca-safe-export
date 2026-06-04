'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Handshake,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  Target,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import SearchAlertModal from '@/components/SearchAlertModal'
import ListingCard from '@/components/listings/ListingCard'
import TrocometerCard, { type TrocometerListing } from '@/components/trocometer/TrocometerCard'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { listingsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { ListingFilters } from '@/hooks/useListingFilters'

const PAGE_SIZE = 3

const COMMUNES = [
  'Nouméa',
  'Mont-Dore',
  'Dumbéa',
  'Païta',
  'Boulouparis',
  'La Foa',
  'Bourail',
  'Koné',
  'Koumac',
  'Poindimié',
  'Lifou',
  'Maré',
  'Ouvéa',
  'Autre',
] as const

const steps = [
  {
    icon: Target,
    title: 'Choisissez votre annonce',
    description: 'Sélectionnez l’objet que vous voulez troquer parmi vos propres annonces actives.',
  },
  {
    icon: Scale,
    title: 'On trouve les équivalents',
    description: 'Le Trocômètre recherche 3 annonces de valeur comparable dans une fourchette de ±30%.',
  },
  {
    icon: Handshake,
    title: 'Contactez et troquez',
    description: 'Ouvrez l’annonce qui vous plaît et démarrez la discussion directement avec le vendeur.',
  },
]

type ListingLike = TrocometerListing & {
  price_negotiable?: boolean
  is_free?: boolean
  is_featured?: boolean
  is_urgent?: boolean
  category?: string | null
  category_name?: string | null
  category_slug?: string | null
  author_id?: string | number | null
  seller_id?: string | number | null
  owner_id?: string | number | null
  commune_name?: string | null
  location_name?: string | null
}

type ListingCardListing = React.ComponentProps<typeof ListingCard>['listing']

function extractListings(payload: unknown): ListingLike[] {
  if (Array.isArray(payload)) return payload as ListingLike[]

  if (payload && typeof payload === 'object') {
    const candidate = payload as {
      data?: ListingLike[] | { data?: ListingLike[] }
      rows?: ListingLike[]
      items?: ListingLike[]
    }

    if (Array.isArray(candidate.data)) return candidate.data
    if (candidate.data && typeof candidate.data === 'object' && Array.isArray(candidate.data.data)) return candidate.data.data
    if (Array.isArray(candidate.rows)) return candidate.rows
    if (Array.isArray(candidate.items)) return candidate.items
  }

  return []
}

function getListingPrice(listing: ListingLike | null | undefined) {
  const raw = listing?.price ?? listing?.price_xpf ?? 0
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : 0
}

function getListingCategoryLabel(listing: ListingLike | null | undefined) {
  return listing?.category_name || listing?.category || listing?.category_slug || ''
}

function isOwnListing(listing: ListingLike, userId?: string | number | null) {
  if (!userId) return false
  return [listing.author_id, listing.owner_id, listing.seller_id].some((value) => String(value ?? '') === String(userId))
}

function chunkListings(listings: ListingLike[]) {
  const groups: ListingLike[][] = []
  for (let index = 0; index < listings.length; index += PAGE_SIZE) {
    groups.push(listings.slice(index, index + PAGE_SIZE))
  }
  return groups
}

function toListingCardListing(listing: ListingLike): ListingCardListing {
  return {
    ...listing,
    id: String(listing.id),
    price_negotiable: Boolean(listing.price_negotiable),
    is_free: Boolean(listing.is_free),
    is_featured: Boolean(listing.is_featured),
    is_urgent: Boolean(listing.is_urgent),
  } as ListingCardListing
}

export default function TrocPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [marketListings, setMarketListings] = useState<ListingLike[]>([])
  const [marketLoading, setMarketLoading] = useState(true)
  const [marketCategory, setMarketCategory] = useState('')
  const [marketCommune, setMarketCommune] = useState('')
  const [marketPriceMax, setMarketPriceMax] = useState('')
  const [marketAlertOpen, setMarketAlertOpen] = useState(false)

  const [ownListings, setOwnListings] = useState<ListingLike[]>([])
  const [selectedOwnListingId, setSelectedOwnListingId] = useState('')
  const [trocTab, setTrocTab] = useState<'mine' | 'free'>('mine')
  const [freePrice, setFreePrice] = useState('')
  const [freeCategory, setFreeCategory] = useState('')
  const [trocResults, setTrocResults] = useState<ListingLike[]>([])
  const [trocLoading, setTrocLoading] = useState(false)
  const [trocPage, setTrocPage] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const categoryOptions = useMemo(
    () =>
      FALLBACK_CATEGORIES.map((category) => ({
        value: category.slug,
        label: category.name,
      })),
    []
  )

  const marketAlertFilters: ListingFilters = useMemo(
    () => ({
      q: '',
      category: marketCategory,
      commune_id: marketCommune,
      province_id: '',
      price_min: '',
      price_max: marketPriceMax,
      condition: '',
      troc: 'true',
      lat: '',
      lng: '',
      radius: 20,
      sort: 'date',
      page: 1,
    }),
    [marketCategory, marketCommune, marketPriceMax],
  )

  const marketCategoryLabel = useMemo(
    () => categoryOptions.find((category) => category.value === marketCategory)?.label ?? null,
    [categoryOptions, marketCategory],
  )

  const loadMarketListings = async () => {
    setMarketLoading(true)
    try {
      const response = await listingsApi.search({
        troc: true,
        limit: 24,
        category: marketCategory || undefined,
        commune: marketCommune || undefined,
        price_max: marketPriceMax ? Number(marketPriceMax) : undefined,
      })
      const items = extractListings(response.data)
      setMarketListings(items)
    } catch {
      setMarketListings([])
    } finally {
      setMarketLoading(false)
    }
  }

  useEffect(() => {
    void loadMarketListings()
  }, [])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated || !user?.id) {
      setOwnListings([])
      setSelectedOwnListingId('')
      setTrocTab('free')
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const response = await listingsApi.getUserListings(String(user.id), { limit: 50 })
        const items = extractListings(response.data).filter((listing) => getListingPrice(listing) > 0)
        if (cancelled) return
        setOwnListings(items)
        setSelectedOwnListingId((current) => {
          if (current && items.some((item) => String(item.id) === current)) return current
          return items[0] ? String(items[0].id) : ''
        })
      } catch {
        if (cancelled) return
        setOwnListings([])
        setSelectedOwnListingId('')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [hasHydrated, isAuthenticated, user?.id])

  const selectedOwnListing = useMemo(
    () => ownListings.find((listing) => String(listing.id) === selectedOwnListingId) || null,
    [ownListings, selectedOwnListingId]
  )

  const visibleTrocGroups = useMemo(() => chunkListings(trocResults), [trocResults])
  const currentTrocGroup = visibleTrocGroups[trocPage] || []
  const totalTrocGroups = visibleTrocGroups.length

  const handleMarketSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await loadMarketListings()
  }

  const handleFindTrocs = async () => {
    setStatusMessage('')

    const selectedPrice = trocTab === 'mine' ? getListingPrice(selectedOwnListing) : Number(freePrice)
    const selectedCategory = trocTab === 'mine' ? getListingCategoryLabel(selectedOwnListing) : freeCategory

    if (!Number.isFinite(selectedPrice) || selectedPrice <= 0) {
      setStatusMessage('Sélectionnez une annonce avec un prix valide ou saisissez un prix de référence.')
      return
    }

    setTrocLoading(true)
    setTrocResults([])
    setTrocPage(0)

    try {
      const response = await listingsApi.search({
        troc: true,
        price_min: Math.floor(selectedPrice * 0.7),
        price_max: Math.ceil(selectedPrice * 1.3),
        limit: 9,
        category: selectedCategory || undefined,
      })

      const items = extractListings(response.data).filter((listing) => {
        if (selectedOwnListing && String(listing.id) === String(selectedOwnListing.id)) return false
        if (isOwnListing(listing, user?.id)) return false
        if (selectedCategory) {
          const candidate = `${getListingCategoryLabel(listing)} ${listing.title ?? ''}`.toLowerCase()
          if (!candidate.includes(selectedCategory.toLowerCase())) return false
        }
        return true
      })

      setTrocResults(items)

      if (items.length === 0) {
        setStatusMessage('Aucun troc disponible dans cette gamme — revenez bientôt !')
      } else if (items.length < 3) {
        setStatusMessage(`Seulement ${items.length} troc(s) disponible(s) dans cette gamme de prix.`)
      }
    } catch {
      setTrocResults([])
      setStatusMessage('Aucun troc disponible dans cette gamme — revenez bientôt !')
    } finally {
      setTrocLoading(false)
    }
  }

  const handleNextTrocs = () => {
    if (totalTrocGroups <= 1) return
    setTrocPage((current) => (current + 1) % totalTrocGroups)
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />

      <section className="relative overflow-hidden px-4 py-10 text-white md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#0A7EA4_0%,_#065f7a_100%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 1200 520" aria-hidden="true">
          <defs>
            <pattern id="troc-dots" width="56" height="56" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="2.5" fill="white" />
            </pattern>
          </defs>
          <rect width="1200" height="520" fill="url(#troc-dots)" />
        </svg>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            🔄 Troc entre Calédoniens
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            Troc
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
            Échangez vos objets entre Calédoniens. Parcourez les annonces troc disponibles ou publiez la vôtre.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/annonces/nouvelle"
              className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Publier une annonce troc
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/70">
            Cochez &apos;Troc possible&apos; lors de la publication.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Annonces disponibles au troc</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Annonces disponibles au troc</h2>
          <p className="mt-1 text-sm text-night/55">
            Ces Calédoniens acceptent les échanges — trouvez votre bonheur.
          </p>
        </div>

        <form onSubmit={handleMarketSearch} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.8fr_auto]">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/50">Catégorie</span>
              <select
                value={marketCategory}
                onChange={(e) => setMarketCategory(e.target.value)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
              >
                <option value="">Toutes les catégories</option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/50">Commune</span>
              <select
                value={marketCommune}
                onChange={(e) => setMarketCommune(e.target.value)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
              >
                <option value="">Toutes les communes</option>
                {COMMUNES.map((commune) => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/50">Prix max</span>
              <input
                type="number"
                min="0"
                value={marketPriceMax}
                onChange={(e) => setMarketPriceMax(e.target.value)}
                placeholder="Ex. 20000"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
            >
              <Search className="h-4 w-4" />
              Filtrer
            </button>

            <button
              type="button"
              onClick={() => setMarketAlertOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-[#0A7EA4]/5 px-4 py-3 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
            >
              <Bell className="h-4 w-4" />
              Alerte
            </button>
          </div>
        </form>

        <SearchAlertModal
          open={marketAlertOpen}
          onClose={() => setMarketAlertOpen(false)}
          filters={marketAlertFilters}
          categoryLabel={marketCategoryLabel}
          communeLabel={marketCommune || undefined}
        />

        {marketLoading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-[1.75rem] bg-sand/70" />
            ))}
          </div>
        ) : marketListings.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {marketListings.map((listing) => (
              <ListingCard key={String(listing.id)} listing={toListingCardListing(listing)} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center text-night/45">
            <p className="text-sm font-semibold text-night">Aucune annonce troc trouv?e pour le moment</p>
            <p className="mt-2 text-sm text-night/65">Essayez une autre cat?gorie, une autre commune ou un prix diff?rent.</p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Trocômètre</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">⚖️ Trocômètre — Trouvez un équivalent</h2>
          <p className="mt-1 text-sm text-night/55">
            Vous avez posté une annonce troc ? Entrez son prix et découvrez 3 annonces de valeur équivalente prêtes à l&apos;échange.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-5 flex gap-2 rounded-2xl bg-[var(--color-background-secondary)] p-1">
            <button
              type="button"
              onClick={() => setTrocTab('mine')}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                trocTab === 'mine' ? 'bg-[#0A7EA4] text-white shadow-sm' : 'text-night/60 hover:text-night'
              }`}
            >
              Mes annonces
            </button>
            <button
              type="button"
              onClick={() => setTrocTab('free')}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                trocTab === 'free' ? 'bg-[#0A7EA4] text-white shadow-sm' : 'text-night/60 hover:text-night'
              }`}
            >
              Saisie libre
            </button>
          </div>

          {isAuthenticated && trocTab === 'mine' ? (
            ownListings.length > 0 ? (
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/50">Choisissez votre annonce</span>
                <select
                  value={selectedOwnListingId}
                  onChange={(e) => setSelectedOwnListingId(e.target.value)}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
                >
                  {ownListings.map((listing) => (
                    <option key={listing.id} value={String(listing.id)}>
                      {listing.title} — {new Intl.NumberFormat('fr-FR').format(getListingPrice(listing))} XPF
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-4 text-sm text-night/65">
                Vous n&apos;avez pas encore d&apos;annonce active avec prix.{' '}
                <button
                  type="button"
                  onClick={() => setTrocTab('free')}
                  className="font-semibold text-[#0A7EA4] hover:underline"
                >
                  Passez en saisie libre
                </button>{' '}
                pour tester le Trocômètre.
              </div>
            )
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/50">Prix de référence</span>
                <input
                  type="number"
                  min="0"
                  value={freePrice}
                  onChange={(e) => setFreePrice(e.target.value)}
                  placeholder="Ex. 15000"
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/50">Catégorie souhaitée</span>
                <select
                  value={freeCategory}
                  onChange={(e) => setFreeCategory(e.target.value)}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
                >
                  <option value="">Toutes les catégories</option>
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleFindTrocs}
              className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              {trocLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              Trouver des trocs
            </button>
            {statusMessage ? <p className="text-sm text-night/60">{statusMessage}</p> : null}
          </div>

          {trocResults.length > 0 ? (
            <div className="mt-6">
              {trocResults.length < 3 ? (
                <p className="mb-3 text-sm text-night/60">
                  Seulement {trocResults.length} troc(s) disponible(s) dans cette gamme de prix.
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                {currentTrocGroup.map((listing, index) => (
                  <TrocometerCard
                    key={listing.id}
                    listing={listing}
                    delayMs={index * 80}
                    onPropose={(item) => {
                      window.location.assign(`/annonces/${item.id}`)
                    }}
                  />
                ))}
              </div>
              {totalTrocGroups > 1 ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={handleNextTrocs}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night transition hover:border-[#0A7EA4]/30 hover:text-[#0A7EA4]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Voir 3 autres
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Comment ça marche</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Trois étapes simples pour trouver un échange</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <article
                key={step.title}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-coral/80">Étape {index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-night">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-night/60">{step.description}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-sm">
          <p className="text-sm text-night/60">
            Besoin d’un point de départ ?{' '}
            <Link href="/annonces/nouvelle" className="font-semibold text-coral hover:underline">
              Publiez votre première annonce
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
