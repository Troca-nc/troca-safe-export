'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, FilterX, Search } from 'lucide-react'

import ProCard, { type ProCardModel } from '@/components/pro/ProCard'
import { proApi } from '@/lib/api'

const FALLBACK_CATEGORY_OPTIONS = [
  'Services',
  'Artisanat',
  'Commerce',
  'Restauration',
  'Transport',
  'Santé',
  'Immobilier',
  'Informatique',
  'Événementiel',
  'BTP',
]

const FALLBACK_COMMUNE_OPTIONS = [
  'Nouméa',
  'Dumbéa',
  'Païta',
  'Mont-Dore',
  'Boulouparis',
  'La Foa',
  'Bourail',
  'Koné',
  'Koumac',
  'Lifou',
  'Maré',
  'Ouvéa',
]

function getDisplayName(pro: ProCardModel) {
  return (
    pro.display_name
    || pro.pro_company_name
    || [pro.prenom, pro.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Kalico'
  )
}

function formatNumber(value: number) {
  return value.toLocaleString('fr-FR')
}

function ProCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="h-20 animate-pulse bg-sand/70" />
      <div className="-mt-6 px-4 pb-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="h-12 w-12 rounded-full bg-sand/80 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-sand/80 animate-pulse" />
        </div>
        <div className="h-4 w-2/3 rounded-full bg-sand/80 animate-pulse" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-sand/70 animate-pulse" />
        <div className="mt-3 h-10 rounded-2xl bg-sand/70 animate-pulse" />
      </div>
    </div>
  )
}

export default function ProsDirectoryClient() {
  const [pros, setPros] = useState<ProCardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [commune, setCommune] = useState('')
  const [minRating, setMinRating] = useState('')

  useEffect(() => {
    let alive = true

    const loadPros = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await proApi.list({ limit: 100 })
        const items = Array.isArray(response.data?.data) ? response.data.data : []
        if (!alive) return
        setPros(items)
      } catch {
        if (!alive) return
        setPros([])
        setError("Impossible de charger l'annuaire pour le moment.")
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadPros()

    return () => {
      alive = false
    }
  }, [])

  const categoryOptions = useMemo(() => {
    const values = new Set<string>()
    pros.forEach((pro) => {
      const value = String(pro.pro_category ?? '').trim()
      if (value) values.add(value)
    })
    const options = Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'))
    return options.length ? options : FALLBACK_CATEGORY_OPTIONS
  }, [pros])

  const communeOptions = useMemo(() => {
    const values = new Set<string>()
    pros.forEach((pro) => {
      const value = String(pro.pro_commune ?? '').trim()
      if (value) values.add(value)
    })
    const options = Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'))
    return options.length ? options : FALLBACK_COMMUNE_OPTIONS
  }, [pros])

  const filteredPros = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const minRatingValue = Number(minRating || 0)

    return [...pros]
      .filter((pro) => {
        const displayName = getDisplayName(pro)
        const categoryValue = String(pro.pro_category ?? '').trim()
        const communeValue = String(pro.pro_commune ?? '').trim()
        const haystack = [
          displayName,
          categoryValue,
          communeValue,
          String(pro.pro_description ?? ''),
          String(pro.pro_company_name ?? ''),
        ]
          .join(' ')
          .toLowerCase()

        if (category && categoryValue !== category) return false
        if (commune && communeValue !== commune) return false
        if (minRatingValue > 0 && Number(pro.avg_rating ?? 0) < minRatingValue) return false
        if (normalizedQuery && !haystack.includes(normalizedQuery)) return false
        return true
      })
      .sort((a, b) => {
        const ratingDelta = Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0)
        if (ratingDelta !== 0) return ratingDelta
        const reviewsDelta = Number(b.review_count ?? 0) - Number(a.review_count ?? 0)
        if (reviewsDelta !== 0) return reviewsDelta
        return getDisplayName(a).localeCompare(getDisplayName(b), 'fr')
      })
  }, [pros, query, category, commune, minRating])

  const resetFilters = () => {
    setQuery('')
    setCategory('')
    setCommune('')
    setMinRating('')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
              Annuaire des pros
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night sm:text-4xl">
              Les professionnels vérifiés de Nouvelle-Calédonie
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-night/60 sm:text-base">
              Parcourez les pros certifiés par Kalico, comparez leur note, leur commune et leur spécialité, puis
              contactez la bonne vitrine en quelques clics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
            >
              Devenir Pro
            </Link>
            <Link
              href="/appels-offres"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
            >
              Publier un besoin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Pros vérifiés</p>
            <p className="mt-2 text-2xl font-bold text-night">{formatNumber(pros.length)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Communes couvertes</p>
            <p className="mt-2 text-2xl font-bold text-night">{formatNumber(communeOptions.length)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Résultats affichés</p>
            <p className="mt-2 text-2xl font-bold text-night">{formatNumber(filteredPros.length)}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Filtres</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Affinez votre recherche</h2>
            <p className="mt-1 text-sm text-night/55">
              Cherchez par nom, spécialité, commune et niveau de note.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
          >
            <FilterX className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Recherche</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, entreprise, spécialité..."
                className="input w-full rounded-2xl pl-10"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Catégorie</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="input w-full rounded-2xl"
            >
              <option value="">Toutes les catégories</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Commune</span>
            <select
              value={commune}
              onChange={(event) => setCommune(event.target.value)}
              className="input w-full rounded-2xl"
            >
              <option value="">Toutes les communes</option>
              {communeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Note minimum</span>
            <select
              value={minRating}
              onChange={(event) => setMinRating(event.target.value)}
              className="input w-full rounded-2xl"
            >
              <option value="">Toutes les notes</option>
              <option value="4.5">4,5 et plus</option>
              <option value="4">4,0 et plus</option>
              <option value="3.5">3,5 et plus</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-night/55">
          <p>
            {loading
              ? 'Chargement de l’annuaire...'
              : `${filteredPros.length} professionnel${filteredPros.length > 1 ? 's' : ''} trouvé${filteredPros.length > 1 ? 's' : ''}`}
          </p>
          {query || category || commune || minRating ? (
            <p className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
              Filtres actifs
            </p>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredPros.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPros.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-night">Aucun professionnel ne correspond à vos filtres</p>
            <p className="mt-2 text-sm text-night/60">
              Essayez une autre commune, une note plus basse ou réinitialisez votre recherche.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
