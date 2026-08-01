'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'

import BoostModal from '@/components/pro/BoostModal'
import { invalidateApiCache, listingsApi, proApi } from '@/lib/api'

type ProListing = {
  id: string | number
  title: string
  titre?: string
  price?: number | null
  prix?: number | null
  status?: string | null
  category_name?: string | null
  commune_name?: string | null
  cover_image?: string | null
  total_views?: number
  views_7d?: number
  views_30d?: number
  total_contacts?: number
  contacts_7d?: number
  conversion_rate?: number
  is_boosted?: boolean
  boost_expires_at?: string | null
  created_at?: string | null
  published_at?: string | null
}

type Filter = 'all' | 'active' | 'expired' | 'boosted'

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'active', label: 'Actives' },
  { id: 'expired', label: 'ExpirÃ©es' },
  { id: 'boosted', label: 'BoostÃ©es' },
]

function formatPrice(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return 'Prix sur demande'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function formatDate(value?: string | null) {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function getStatusLabel(status?: string | null) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'draft') return { label: 'Brouillon', tone: 'bg-sand text-night/65' }
  if (normalized === 'reserved') return { label: 'Réservée', tone: 'bg-amber-50 text-amber-700' }
  if (normalized === 'inactive' || normalized === 'sold' || normalized === 'expired') {
    return { label: 'ExpirÃ©e', tone: 'bg-amber-50 text-amber-700' }
  }
  return { label: 'Actif', tone: 'bg-emerald-50 text-emerald-700' }
}

export default function ProDashboardListingsPage() {
  const params = useSearchParams()
  const boostListingId = params.get('boost')
  const [listings, setListings] = useState<ProListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [boostTarget, setBoostTarget] = useState<ProListing | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | number | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [actionError, setActionError] = useState('')
  const pageSize = 20

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const response = await proApi.getListings()
        if (!alive) return
        setListings(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setListings([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!boostListingId || loading) return
    const match = listings.find((item) => String(item.id) === String(boostListingId))
    if (match) setBoostTarget(match)
  }, [boostListingId, listings, loading])

  const filteredListings = useMemo(() => {
    const now = Date.now()
    return listings.filter((listing) => {
      const status = String(listing.status || '').toLowerCase()
      const boosted = Boolean(listing.is_boosted || (listing.boost_expires_at && new Date(listing.boost_expires_at).getTime() > now))
      if (filter === 'active') return status === 'active'
      if (filter === 'expired') return status === 'inactive' || status === 'sold' || status === 'expired'
      if (filter === 'boosted') return boosted
      return true
    })
  }, [filter, listings])

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedListings = filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filter])

  const handleRenew = async (listingId: string | number) => {
    setRefreshingId(listingId)
    setActionError('')
    try {
      await proApi.renewListing(listingId)
      const response = await proApi.getListings()
      setListings(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (error: any) {
      setActionError(error?.response?.data?.error || 'Impossible de renouveler cette annonce.')
    } finally {
      setRefreshingId(null)
    }
  }

  const handleDelete = async (listingId: string | number) => {
    if (!window.confirm('Supprimer dÃ©finitivement cette annonce ?')) return
    setDeletingId(listingId)
    setActionError('')
    try {
      await listingsApi.delete(String(listingId))
      invalidateApiCache('pro.')
      const response = await proApi.getListings()
      setListings(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (error: any) {
      setActionError(error?.response?.data?.error || 'Impossible de supprimer cette annonce.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-20 animate-pulse rounded-[2rem] bg-sand/70 sm:h-24" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70 sm:h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Mes annonces</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">GÃ©rez vos annonces en un coup d'Å“il</h1>
            <p className="mt-2 text-sm text-night/60">Filtrez, renouvelez, boostez et supprimez vos annonces depuis votre espace Pro.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
            <BadgeCheck className="h-4 w-4" />
            {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      <section className="-mx-1 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 shadow-sm sm:mx-0 sm:flex-wrap sm:overflow-visible">
        {FILTERS.map((item) => {
          const active = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-[#0A7EA4] text-white shadow-sm ring-1 ring-[#0A7EA4]/20'
                  : 'border border-transparent text-night/75 hover:border-[#0A7EA4]/20 hover:bg-[var(--color-background-secondary)] hover:text-night'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <section className="space-y-3">
        {paginatedListings.length > 0 ? (
          paginatedListings.map((listing) => {
            const status = getStatusLabel(listing.status)
            const boosted = Boolean(listing.is_boosted || (listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date()))
            return (
              <article key={listing.id} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
                    <div className="h-20 w-full shrink-0 overflow-hidden rounded-2xl bg-sand sm:w-20">
                      {listing.cover_image ? (
                        <Image src={listing.cover_image} alt={listing.title} width={80} height={80} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-night/35">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="line-clamp-1 text-base font-semibold text-night">{listing.title}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                        {boosted ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            âš¡ BoostÃ©e
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-night/60">
                        {listing.category_name || 'CatÃ©gorie'} Â· {formatPrice(listing.price ?? listing.prix)}
                      </p>
                      <p className="mt-1 text-xs text-night/45">
                        {listing.commune_name || 'Nouvelle-CalÃ©donie'} Â· publiÃ©e le {formatDate(listing.created_at || listing.published_at)}
                      </p>
                      <p className="mt-2 text-sm text-night/60">
                        ðŸ‘ {Number(listing.total_views ?? 0)} Â· ðŸ’¬ {Number(listing.total_contacts ?? 0)} Â· {Number(listing.conversion_rate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Link
                      href={`/annonces/nouvelle?edit=${listing.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      Modifier
                    </Link>
                    <button
                      type="button"
                      onClick={() => setBoostTarget(listing)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A7EA4] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Sparkles className="h-4 w-4" />
                      Booster
                    </button>
                    {String(listing.status || '').toLowerCase() !== 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleRenew(listing.id)}
                        disabled={refreshingId === listing.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {refreshingId === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Renouveler
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-12 text-center text-night/55 sm:px-6">
            <Search className="mx-auto h-8 w-8 text-night/25" />
            <p className="mt-3 text-lg font-semibold text-night">Aucune annonce pour ce filtre</p>
            <p className="mt-2 text-sm">Essayez une autre catÃ©gorie ou crÃ©ez une nouvelle annonce.</p>
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            PrÃ©cÃ©dent
          </button>
          <span className="w-full text-center text-sm text-night/55 sm:w-auto">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:opacity-50"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <BoostModal
        open={Boolean(boostTarget)}
        onClose={() => setBoostTarget(null)}
        listing={
          boostTarget
            ? {
                id: boostTarget.id,
                title: boostTarget.title,
                cover_image: boostTarget.cover_image ?? null,
                price: boostTarget.price ?? boostTarget.prix ?? null,
              }
            : null
        }
      />
    </div>
  )
}

