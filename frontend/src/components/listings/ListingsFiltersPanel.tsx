'use client'

import { ChevronDown, LocateFixed, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { ListingFilters } from '@/hooks/useListingFilters'
import type { ListingProvince, ListingSearchItem } from '@/types/listings'

const CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'Correct' },
  { value: 'for_parts', label: 'Pour pièces' },
] as const

const RADIUS_OPTIONS = [5, 10, 20, 50, 100] as const

type SectionKey = 'location' | 'price' | 'condition'

type Props = {
  filters: ListingFilters
  provinces: ListingProvince[]
  zones: string[]
  listings: ListingSearchItem[]
  metadataLoading: boolean
  metadataError: boolean
  zonesLoading: boolean
  geoLoading: boolean
  activeFilterCount: number
  updateFilter: (key: keyof ListingFilters, value: string | number) => void
  useLocation: () => void
  clearLocation: () => void
  resetFilters: () => void
}

function FilterSection({
  name,
  eyebrow,
  summary,
  open,
  onToggle,
  children,
}: {
  name: string
  eyebrow: string
  summary: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-card border border-warm-border bg-cream-surface px-5 py-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
        aria-expanded={open}
        aria-controls={`listing-filter-${name}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-eyebrow-sm uppercase text-accent-text">{eyebrow}</span>
          <span className="mt-1 block truncate text-meta text-ink/60">{summary}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink/45 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? <div id={`listing-filter-${name}`} className="mt-4 border-t border-warm-border/70 pt-4">{children}</div> : null}
    </section>
  )
}

export default function ListingsFiltersPanel({
  filters,
  provinces,
  zones,
  listings,
  metadataLoading,
  metadataError,
  zonesLoading,
  geoLoading,
  activeFilterCount,
  updateFilter,
  useLocation,
  clearLocation,
  resetFilters,
}: Props) {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    location: true,
    price: false,
    condition: false,
  })

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('kalico-listings-filters-sections')
      if (!saved) return
      const parsed = JSON.parse(saved) as Partial<Record<SectionKey, boolean>>
      setOpenSections({
        location: parsed.location ?? true,
        price: parsed.price ?? false,
        condition: parsed.condition ?? false,
      })
    } catch {
      // Le stockage de préférence est optionnel.
    }
  }, [])

  const toggleSection = (key: SectionKey) => {
    setOpenSections((current) => {
      const next = { ...current, [key]: !current[key] }
      try {
        window.localStorage.setItem('kalico-listings-filters-sections', JSON.stringify(next))
      } catch {
        // Le filtre reste fonctionnel sans persistance.
      }
      return next
    })
  }

  const selectedProvince = provinces.find((province) => province.id === filters.province_id) ?? null
  const selectedCommune = selectedProvince?.communes.find((commune) => commune.id === filters.commune_id)
    ?? provinces.flatMap((province) => province.communes).find((commune) => commune.id === filters.commune_id)
    ?? null

  const prices = useMemo(
    () => listings.map((listing) => listing.price).filter((price): price is number => typeof price === 'number' && price >= 0),
    [listings],
  )
  const histogram = useMemo(() => {
    if (prices.length === 0) return Array.from({ length: 18 }, () => 0)
    const max = Math.max(...prices, 1)
    const bins = Array.from({ length: 18 }, () => 0)
    prices.forEach((price) => {
      bins[Math.min(17, Math.floor((price / max) * 18))] += 1
    })
    return bins
  }, [prices])
  const maxBin = Math.max(...histogram, 1)
  const minPrice = Number(filters.price_min || 0)
  const maxPrice = Number(filters.price_max || Number.POSITIVE_INFINITY)
  const datasetMax = Math.max(...prices, 1)

  const locationSummary = selectedCommune?.name
    ?? selectedProvince?.name
    ?? (filters.lat && filters.lng ? `Autour de moi · ${filters.radius} km` : 'Toute la Nouvelle-Calédonie')
  const priceSummary = filters.price_min || filters.price_max
    ? `${filters.price_min || '0'} – ${filters.price_max || '∞'} XPF`
    : 'Tous les prix'
  const conditionSummary = CONDITIONS.find((item) => item.value === filters.condition)?.label ?? 'Tous les états'

  return (
    <div className="flex flex-col gap-3">
      <FilterSection
        name="location"
        eyebrow="Localisation"
        summary={locationSummary}
        open={openSections.location}
        onToggle={() => toggleSection('location')}
      >
        {metadataLoading ? <p className="text-body-sm text-ink/55">Chargement des communes…</p> : null}
        {metadataError ? (
          <p className="rounded-control bg-[var(--color-error-soft)] px-3 py-3 text-body-sm text-[var(--color-error)]">
            La localisation est temporairement indisponible.
          </p>
        ) : null}
        {!metadataLoading && !metadataError ? (
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-label-sm text-ink/65">Province</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateFilter('province_id', '')}
                  className={`min-h-11 rounded-pill border px-3 text-body-sm ${!filters.province_id ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream text-ink'}`}
                >
                  Toute la NC
                </button>
                {provinces.map((province) => (
                  <button
                    type="button"
                    key={province.id}
                    onClick={() => updateFilter('province_id', province.id)}
                    className={`min-h-11 rounded-pill border px-3 text-body-sm ${filters.province_id === province.id ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream text-ink'}`}
                  >
                    {province.name.replace('Province ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-label-sm text-ink/65">Commune</p>
              {selectedProvince ? (
                <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => updateFilter('commune_id', '')}
                    className={`min-h-11 rounded-control px-3 text-left text-body-sm ${!filters.commune_id ? 'bg-cream-sunken font-semibold' : 'hover:bg-cream-sunken'}`}
                  >
                    Toutes les communes
                  </button>
                  {selectedProvince.communes.map((commune) => (
                    <button
                      type="button"
                      key={commune.id}
                      onClick={() => updateFilter('commune_id', commune.id)}
                      className={`min-h-11 rounded-control px-3 text-left text-body-sm ${filters.commune_id === commune.id ? 'bg-cream-sunken font-semibold' : 'hover:bg-cream-sunken'}`}
                    >
                      {commune.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-control bg-cream-sunken px-3 py-3 text-body-sm text-ink/55">Choisissez une province pour voir ses communes.</p>
              )}
            </div>

            {selectedCommune ? (
              <div>
                <p className="mb-2 text-label-sm text-ink/65">Quartier</p>
                {zonesLoading ? <p className="text-body-sm text-ink/55">Chargement…</p> : null}
                {!zonesLoading && zones.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {zones.map((zone) => (
                      <button
                        type="button"
                        key={zone}
                        onClick={() => updateFilter('quartier_zone', filters.quartier_zone === zone ? '' : zone)}
                        className={`min-h-11 rounded-pill border px-3 text-body-sm ${filters.quartier_zone === zone ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream text-ink'}`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                ) : null}
                {!zonesLoading && zones.length === 0 ? <p className="text-body-sm text-ink/50">Aucun quartier proposé.</p> : null}
              </div>
            ) : null}

            <div className="border-t border-warm-border pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="m-0 text-label-sm text-ink/65">Rayon autour de moi</p>
                <p className="m-0 font-display text-price-sm text-ink">{filters.radius} km</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((radius) => (
                  <button
                    type="button"
                    key={radius}
                    onClick={() => updateFilter('radius', radius)}
                    className={`min-h-11 min-w-11 rounded-control border px-2 text-body-sm ${filters.radius === radius ? 'border-ink bg-cream-sunken font-semibold' : 'border-warm-border bg-cream'}`}
                  >
                    {radius}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={filters.lat && filters.lng ? clearLocation : useLocation}
                disabled={geoLoading}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-ink px-3 text-label text-ink disabled:border-warm-border disabled:text-ink/45"
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
                {geoLoading ? 'Localisation…' : filters.lat && filters.lng ? 'Effacer ma position' : 'Utiliser ma position'}
              </button>
            </div>
          </div>
        ) : null}
      </FilterSection>

      <FilterSection
        name="price"
        eyebrow="Prix"
        summary={priceSummary}
        open={openSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="flex h-14 items-end gap-1" aria-hidden="true">
          {histogram.map((count, index) => {
            const low = (index / 18) * datasetMax
            const high = ((index + 1) / 18) * datasetMax
            const active = high >= minPrice && low <= maxPrice
            return (
              <span
                key={index}
                className={`min-w-0 flex-1 rounded-t-sm ${active ? 'bg-accent-strong/75' : 'bg-warm-border'}`}
                style={{ height: `${Math.max(8, (count / maxBin) * 100)}%` }}
              />
            )
          })}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input
            type="number"
            min="0"
            step="10"
            value={filters.price_min}
            onChange={(event) => updateFilter('price_min', event.target.value)}
            placeholder="Min"
            aria-label="Prix minimum"
            className="h-12 min-w-0 rounded-control border border-warm-border bg-cream px-3 text-base text-ink outline-none focus:border-ink focus:ring-2 focus:ring-accent-strong/25"
          />
          <span className="text-ink/40">–</span>
          <input
            type="number"
            min="0"
            step="10"
            value={filters.price_max}
            onChange={(event) => updateFilter('price_max', event.target.value)}
            placeholder="Max"
            aria-label="Prix maximum"
            className="h-12 min-w-0 rounded-control border border-warm-border bg-cream px-3 text-base text-ink outline-none focus:border-ink focus:ring-2 focus:ring-accent-strong/25"
          />
        </div>
      </FilterSection>

      <FilterSection
        name="condition"
        eyebrow="État"
        summary={conditionSummary}
        open={openSections.condition}
        onToggle={() => toggleSection('condition')}
      >
        <div className="flex flex-col gap-1">
          {CONDITIONS.map((condition) => (
            <label key={condition.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 hover:bg-cream-sunken">
              <input
                type="radio"
                name="listing-condition"
                value={condition.value}
                checked={filters.condition === condition.value}
                onChange={() => updateFilter('condition', condition.value)}
                className="h-5 w-5 accent-ink"
              />
              <span className="text-body-sm text-ink">{condition.label}</span>
            </label>
          ))}
          {filters.condition ? (
            <button type="button" onClick={() => updateFilter('condition', '')} className="min-h-11 text-left text-body-sm font-semibold text-accent-text">
              Effacer ce filtre
            </button>
          ) : null}
        </div>
      </FilterSection>

      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control text-label text-[var(--color-error)] hover:bg-[var(--color-error-soft)]"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Réinitialiser ({activeFilterCount})
        </button>
      ) : null}
    </div>
  )
}
