'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Loader2, RefreshCw, Scale } from 'lucide-react'

import ListingImage from '@/components/ListingImage'
import TrocometerCard, { type TrocometerListing } from '@/components/trocometer/TrocometerCard'
import TrocProposalModal from '@/components/trocometer/TrocProposalModal'
import { listingsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 3

function extractListings(payload: unknown): TrocometerListing[] {
  if (Array.isArray(payload)) return payload as TrocometerListing[]

  if (payload && typeof payload === 'object') {
    const candidate = payload as {
      data?: TrocometerListing[] | { data?: TrocometerListing[] }
      rows?: TrocometerListing[]
      items?: TrocometerListing[]
    }

    if (Array.isArray(candidate.data)) return candidate.data
    if (candidate.data && typeof candidate.data === 'object' && Array.isArray(candidate.data.data)) return candidate.data.data
    if (Array.isArray(candidate.rows)) return candidate.rows
    if (Array.isArray(candidate.items)) return candidate.items
  }

  return []
}

function getListingPrice(listing: TrocometerListing) {
  const raw = listing.price ?? listing.price_xpf ?? 0
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat('fr-FR').format(price)} XPF`
}

function chunkListings(listings: TrocometerListing[]) {
  const groups: TrocometerListing[][] = []
  for (let index = 0; index < listings.length; index += PAGE_SIZE) {
    groups.push(listings.slice(index, index + PAGE_SIZE))
  }
  return groups
}

export default function Trocometer() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const rotationRef = useRef<number | null>(null)

  const [ownListings, setOwnListings] = useState<TrocometerListing[]>([])
  const [selectedListingId, setSelectedListingId] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loadingOwnListings, setLoadingOwnListings] = useState(false)
  const [searching, setSearching] = useState(false)
  const [matches, setMatches] = useState<TrocometerListing[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [renderSeed, setRenderSeed] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [spin, setSpin] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [proposalTarget, setProposalTarget] = useState<TrocometerListing | null>(null)

  const clearRotationTimer = useCallback(() => {
    if (rotationRef.current) {
      window.clearTimeout(rotationRef.current)
      rotationRef.current = null
    }
  }, [])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearRotationTimer()
    }
  }, [clearRotationTimer])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated || !user?.id) {
      clearRotationTimer()
      setOwnListings([])
      setSelectedListingId('')
      setMatches([])
      setPageIndex(0)
      setStatusMessage(null)
      setLoadingOwnListings(false)
      setDropdownOpen(false)
      setProposalTarget(null)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoadingOwnListings(true)
      try {
        const response = await listingsApi.getUserListings(String(user.id), { limit: 50 })
        const items = extractListings(response.data).filter((listing) => getListingPrice(listing) > 0)

        if (cancelled) return

        setOwnListings(items)
        setSelectedListingId((current) => {
          if (current && items.some((item) => String(item.id) === current)) return current
          return items[0] ? String(items[0].id) : ''
        })
        setMatches([])
        setPageIndex(0)
        setRenderSeed((value) => value + 1)
        setStatusMessage(null)
        setProposalTarget(null)
      } catch {
        if (cancelled) return
        setOwnListings([])
        setSelectedListingId('')
        setMatches([])
        setPageIndex(0)
        setStatusMessage(null)
        setProposalTarget(null)
      } finally {
        if (!cancelled) setLoadingOwnListings(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [clearRotationTimer, hasHydrated, isAuthenticated, user?.id])

  useEffect(() => {
    if (!selectedListingId && ownListings.length > 0) {
      setSelectedListingId(String(ownListings[0].id))
    }
  }, [ownListings, selectedListingId])

  useEffect(() => {
    clearRotationTimer()
    setMatches([])
    setPageIndex(0)
    setStatusMessage(null)
    setRenderSeed((value) => value + 1)
    setTransitioning(false)
    setProposalTarget(null)
  }, [clearRotationTimer, selectedListingId])

  const selectedListing = useMemo(
    () => ownListings.find((listing) => String(listing.id) === selectedListingId) || null,
    [ownListings, selectedListingId]
  )

  const matchGroups = useMemo(() => chunkListings(matches), [matches])
  const currentGroup = matchGroups[pageIndex] || []
  const groupCount = matchGroups.length
  const canCycle = groupCount > 1
  const displayedCount = matches.length
  const ownListingCount = ownListings.length

  const handleChooseListing = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
    setDropdownOpen(false)
  }, [])

  const handleOpenProposal = useCallback((listing: TrocometerListing) => {
    setProposalTarget(listing)
  }, [])

  const handleCloseProposal = useCallback(() => {
    setProposalTarget(null)
  }, [])

  const handleSearch = useCallback(async () => {
    if (!selectedListing) return

    const price = getListingPrice(selectedListing)
    if (price <= 0) {
      setStatusMessage('Sélectionnez une annonce avec un prix valide.')
      return
    }

    setSearching(true)
    setStatusMessage(null)
    setMatches([])
    setPageIndex(0)
    setTransitioning(false)
    clearRotationTimer()

    try {
      const response = await listingsApi.search({
        troc: true,
        price_min: Math.floor(price * 0.7),
        price_max: Math.ceil(price * 1.3),
        limit: 9,
      })

      const items = extractListings(response.data)
      const selectedId = String(selectedListing.id)
      const ownIds = new Set(ownListings.map((listing) => String(listing.id)))

      const filtered = items.filter((listing) => {
        const id = String(listing.id)
        return id !== selectedId && !ownIds.has(id)
      })

      setMatches(filtered)
      setPageIndex(0)
      setRenderSeed((value) => value + 1)

      if (filtered.length === 0) {
        setStatusMessage('Aucun troc disponible dans cette gamme - revenez bientôt !')
      } else if (filtered.length < PAGE_SIZE) {
        setStatusMessage(`Seulement ${filtered.length} troc(s) disponible(s) dans cette gamme de prix.`)
      } else {
        setStatusMessage(null)
      }
    } catch {
      setMatches([])
      setPageIndex(0)
      setRenderSeed((value) => value + 1)
      setStatusMessage('Aucun troc disponible dans cette gamme - revenez bientôt !')
    } finally {
      setSearching(false)
    }
  }, [ownListings, selectedListing])

  const handleNextGroup = useCallback(() => {
    if (!canCycle || transitioning || searching) return

    setSpin((value) => value + 360)
    setTransitioning(true)
    clearRotationTimer()

    rotationRef.current = window.setTimeout(() => {
      setPageIndex((value) => (value + 1) % groupCount)
      setRenderSeed((value) => value + 1)
      setTransitioning(false)
    }, 150)
  }, [canCycle, clearRotationTimer, groupCount, searching, transitioning])

  if (!hasHydrated) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(8,32,50,0.08)]">
        <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Scale className="h-3.5 w-3.5" />
            Trocômètre
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold">Que vaut votre objet en troc ?</h3>
          <p className="mt-2 text-sm text-white/70">Chargement de votre session…</p>
        </div>
        <div className="p-6">
          <div className="h-28 animate-pulse rounded-2xl border border-[var(--color-border)] bg-sand/70" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(8,32,50,0.08)]">
        <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Scale className="h-3.5 w-3.5" />
            Trocômètre
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold">Que vaut votre objet en troc ?</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Choisissez une de vos annonces et découvrez 3 objets de valeur équivalente prêts à être échangés.
          </p>
        </div>
        <div className="p-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
            <p className="text-lg font-semibold text-night">Connectez-vous pour utiliser le Trocômètre</p>
            <p className="mt-2 text-sm text-night/60">
              Accédez à vos annonces et trouvez les meilleurs trocs de la communauté calédonienne.
            </p>
            <Link
              href="/connexion"
              className="btn-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm"
            >
              <Scale className="h-4 w-4" />
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(8,32,50,0.08)]">
      <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-6 text-white md:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
          <Scale className="h-3.5 w-3.5" />
          Trocômètre
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold md:text-3xl">Que vaut votre objet en troc ?</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
          Choisissez une de vos annonces, lancez la recherche, puis parcourez trois trocs à la fois dans une
          fourchette de valeur de ±30%.
        </p>
      </div>

      <div className="space-y-5 p-6 md:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <div ref={dropdownRef} className="relative">
            <label className="mb-2 block text-sm font-semibold text-night">
              Choisissez une de vos annonces
            </label>
            <button
              type="button"
              onClick={() => setDropdownOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left shadow-sm transition hover:border-coral/30 hover:shadow-md"
            >
              <span className="min-w-0 flex-1">
                {selectedListing ? (
                  <span className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-sand">
                      <ListingImage
                        src={selectedListing.cover_image ?? selectedListing.photos?.[0] ?? null}
                        alt={selectedListing.title}
                        fallbackIcon="🪙"
                        className="h-full w-full"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-night">{selectedListing.title}</span>
                      <span className="block text-sm text-night/55">
                        {formatPrice(getListingPrice(selectedListing))}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="block text-sm text-night/45">Choisissez une de vos annonces…</span>
                )}
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-night/45 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen ? (
              <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[0_18px_60px_rgba(8,32,50,0.14)]">
                {ownListings.map((listing) => {
                  const price = formatPrice(getListingPrice(listing))
                  return (
                    <button
                      key={String(listing.id)}
                      type="button"
                      onClick={() => handleChooseListing(String(listing.id))}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sand/80 ${
                        String(listing.id) === selectedListingId ? 'bg-sand/80' : ''
                      }`}
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-sand">
                        <ListingImage
                          src={listing.cover_image ?? listing.photos?.[0] ?? null}
                          alt={listing.title}
                          fallbackIcon="🪙"
                          className="h-full w-full"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-night">{listing.title}</span>
                        <span className="block text-sm text-night/55">{price}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!selectedListing || searching || loadingOwnListings}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            {searching ? 'Recherche en cours…' : 'Trouver des trocs'}
          </button>
        </div>

        {loadingOwnListings ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5 text-sm text-night/55">
            Chargement de vos annonces…
          </div>
        ) : null}

        {!loadingOwnListings && ownListingCount === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5 text-center">
            <p className="text-lg font-semibold text-night">Aucune de vos annonces n’est prête pour le Trocômètre</p>
            <p className="mt-2 text-sm text-night/60">
              Publiez une annonce avec un prix pour commencer à trouver des échanges de même valeur.
            </p>
            <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-flex rounded-2xl px-5 py-3 text-sm">
              Publier une annonce
            </Link>
          </div>
        ) : null}

        {statusMessage && matches.length > 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm text-night/65">
            {statusMessage}
          </div>
        ) : null}

        {displayedCount > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {currentGroup.map((listing, index) => (
              <TrocometerCard
                key={`${renderSeed}-${listing.id}`}
                listing={listing}
                delayMs={index * 80}
                fadeOut={transitioning}
                onPropose={handleOpenProposal}
              />
            ))}
          </div>
        ) : null}

        {matches.length === 0 && statusMessage && selectedListing && !searching ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
            <p className="text-lg font-semibold text-night">
              {statusMessage.includes('Aucun troc disponible')
                ? 'Aucun troc disponible dans cette gamme - revenez bientôt !'
                : statusMessage}
            </p>
            <p className="mt-2 text-sm text-night/60">
              Essayez une autre annonce ou revenez plus tard pour découvrir de nouvelles opportunités.
            </p>
          </div>
        ) : null}

        {canCycle && displayedCount > 0 ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleNextGroup}
              disabled={transitioning || searching}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night transition hover:border-coral/30 hover:text-coral disabled:cursor-not-allowed disabled:opacity-60"
              style={{ transform: `rotate(${spin}deg)`, transition: 'transform 400ms ease' }}
            >
              <RefreshCw className="h-4 w-4" />
              Voir 3 autres
            </button>
          </div>
        ) : null}

      </div>

      <TrocProposalModal
        open={Boolean(proposalTarget)}
        selectedListing={selectedListing}
        targetListing={proposalTarget}
        onClose={handleCloseProposal}
      />
    </div>
  )
}
