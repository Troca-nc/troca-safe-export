'use client'
// src/app/annonces/page.tsx

import Link from 'next/link'
import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Bell,
  ChevronDown,
  List,
  Map,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import SearchAlertModal from '@/components/SearchAlertModal'
import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import { API_ORIGIN, campaignsApi, metaApi } from '@/lib/api'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { FALLBACK_CATEGORIES, hasNestedCategoryTree, normalizeCategoryTree } from '@/lib/categoryCatalog'
import { getCategoryIcon } from '@/lib/categoryPresentation'
import { useInfiniteListings } from '@/hooks/useInfiniteListings'
import { useListingFilters, type ListingFilters } from '@/hooks/useListingFilters'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import { findCategoryPathById } from '@/shared-copy/categoryTaxonomy'

const AnnoncesMap = dynamic(() => import('@/components/annonces/AnnoncesMap'), { ssr: false })

const SORT_OPTIONS = [
  { value: 'date',       label: 'Plus rï¿½cente' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix dï¿½croissant' },
  { value: 'relevance',  label: 'Pertinence' },
]

const SORT_LABEL_BY_VALUE: Record<string, string> = SORT_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label
  return acc
}, {} as Record<string, string>)

const CONDITION_OPTIONS = [
  { value: 'new',       label: 'Neuf' },
  { value: 'like_new',  label: 'Comme neuf' },
  { value: 'good',      label: 'Bon Ãtat' },
  { value: 'fair',      label: 'Correct' },
  { value: 'for_parts', label: 'Pour piï¿½ces' },
]

const RADIUS_OPTIONS = [5, 10, 20, 50, 100]

function radiusToSliderIndex(radius: number) {
  const target = Number.isFinite(radius) && radius > 0 ? radius : RADIUS_OPTIONS[0]
  return RADIUS_OPTIONS.reduce((bestIndex, currentRadius, index) => (
    Math.abs(currentRadius - target) < Math.abs(RADIUS_OPTIONS[bestIndex] - target) ? index : bestIndex
  ), 0)
}

function sliderIndexToRadius(index: number) {
  return RADIUS_OPTIONS[Math.min(Math.max(0, Math.round(index)), RADIUS_OPTIONS.length - 1)] ?? RADIUS_OPTIONS[0]
}

function getCategoryChildren(category: any) {
  return category?.children || category?.subcategories || []
}

function findCategoryPathBySlug(categories: any[], slug: string): any[] {
  const visit = (nodes: any[], trail: any[] = []) => {
    for (const node of nodes || []) {
      const currentTrail = [...trail, node]
      if (node.slug === slug) {
        return currentTrail
      }
      const found = visit(getCategoryChildren(node), currentTrail)
      if (found.length) return found
    }
    return []
  }

  return visit(categories, [])
}

function isLeafCategory(category: any) {
  return getCategoryChildren(category).length === 0
}

function CategoryTreeNode({
  category,
  selectedSlug,
  expandedSlugs,
  onSelect,
  onToggleExpand,
  depth = 0,
}: {
  category: any
  selectedSlug: string
  expandedSlugs: Set<string>
  onSelect: (slug: string) => void
  onToggleExpand: (slug: string) => void
  depth?: number
}) {
  const children = getCategoryChildren(category)
  const Icon = getCategoryIcon(category.slug, category.name, category.icon)
  const isSelected = selectedSlug === category.slug
  const isExpanded = children.length > 0 && expandedSlugs.has(category.slug)

  return (
    <div className={depth === 0 ? 'space-y-2' : 'space-y-2 border-l border-night/8 pl-3'}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (children.length > 0) {
            onToggleExpand(category.slug)
          } else {
            onSelect(category.slug)
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (children.length > 0) {
              onToggleExpand(category.slug)
            } else {
              onSelect(category.slug)
            }
          }
        }}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors outline-none ${
          isSelected
            ? 'border-nc-lagon bg-nc-lagon text-white shadow-sm'
            : 'border-night/8 bg-white hover:bg-sand text-night/75'
        }`}
      >
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          isSelected ? 'bg-white/10' : 'bg-sand text-night'
        }`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{category.name}</span>
          {children.length > 0 ? (
            <span className={`block text-[11px] ${isSelected ? 'text-white/65' : 'text-night/45'}`}>
              {isExpanded ? 'Sous-catÃ©gories ouvertes' : `${children.length} sous-catï¿½gorie${children.length > 1 ? 's' : ''}`}
            </span>
          ) : null}
        </span>
        {children.length > 0 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(category.slug)
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                isSelected
                  ? 'bg-white/15 text-white'
                  : 'border border-night/10 bg-white text-night/60 hover:border-nc-lagon/30 hover:text-nc-lagon'
              }`}
            >
              Tout
            </button>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        ) : null}
      </div>

      {children.length > 0 && isExpanded ? (
        <div className="space-y-2 pt-1">
          {children.map((child: any) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              selectedSlug={selectedSlug}
              expandedSlugs={expandedSlugs}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CategoryTreeBrowser({
  filters,
  selectedCategoryLabel,
  visibleCategories,
  expandedCategorySet,
  updateFilter,
  toggleCategoryNode,
}: {
  filters: ListingFilters
  selectedCategoryLabel: string | null
  visibleCategories: any[]
  expandedCategorySet: Set<string>
  updateFilter: (key: keyof ListingFilters, value: string | number) => void
  toggleCategoryNode: (slug: string) => void
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-night/8 bg-white/80 p-3 shadow-sm">
      <button
        type="button"
        onClick={() => updateFilter('category', '')}
        className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors ${
          !filters.category
            ? 'bg-nc-lagon text-white shadow-sm'
            : 'text-night/70 hover:bg-sand'
        }`}
      >
        Toutes les catï¿½gories
      </button>

      {selectedCategoryLabel ? (
        <div className="rounded-2xl border border-nc-lagon/20 bg-nc-lagon/8 px-3 py-3 text-sm text-night">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-lagon">CatÃ©gorie active</p>
          <p className="mt-1 font-semibold">{selectedCategoryLabel}</p>
        </div>
      ) : null}

      <div className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
        {visibleCategories.map((cat: any) => (
          <CategoryTreeNode
            key={cat.id}
            category={cat}
            selectedSlug={filters.category}
            expandedSlugs={expandedCategorySet}
            onSelect={(slug) => updateFilter('category', slug)}
            onToggleExpand={toggleCategoryNode}
          />
        ))}
      </div>

      <p className="text-[11px] text-night/40">
        Cliquez sur une catï¿½gorie pour ouvrir ses sous-catï¿½gories. Le filtre actif reste mis en avant.
      </p>
    </div>
  )
}

function findCategoryBySlug(categories: any[], slug: string): any | null {
  const stack = [...categories]
  while (stack.length > 0) {
    const node = stack.shift()
    if (!node) continue
    if (node.slug === slug) return node
    stack.unshift(...getCategoryChildren(node))
  }
  return null
}

type FilterSidebarProps = {
  filters: ListingFilters
  updateFilter: (key: keyof ListingFilters, value: string | number) => void
  communes: any[]
  selectedProvince: any
  selectedProvinceCommunes: any[]
  selectedCommune: any
  zoneOptions: string[]
  zoneLoading: boolean
  sortedProvinces: any[]
  handleUseLocation: () => void
  clearLocation: () => void
  clearFilters: () => void
  snapRadius: (value: number) => number
  collapsedSections: { radius: boolean; condition: boolean }
  toggleSidebarSection: (key: 'radius' | 'condition') => void
  priceHistogramView: any
  displayedListings: any[]
  activeFilterCount: number
  handleCreateSearchAlert: () => void
  geoLoading: boolean
}

function FilterSidebar({
  filters,
  updateFilter,
  selectedProvince,
  selectedProvinceCommunes,
  selectedCommune,
  zoneOptions,
  zoneLoading,
  sortedProvinces,
  handleUseLocation,
  clearLocation,
  clearFilters,
  snapRadius,
  collapsedSections,
  toggleSidebarSection,
  priceHistogramView,
  displayedListings,
  activeFilterCount,
  handleCreateSearchAlert,
  geoLoading,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Localisation */}
      <div className="rounded-2xl border border-night/8 bg-white/80 p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-night">Localisation</h3>
          <p className="mt-1 text-xs text-night/45">
            Choisissez d'abord une province, puis une commune. Le quartier reste optionnel.
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
                    ? 'border-nc-lagon bg-nc-lagon text-white'
                    : 'border-night/12 bg-white text-night/65 hover:bg-sand'
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
                        ? 'border-nc-lagon bg-nc-lagon text-white'
                        : 'border-night/12 bg-white text-night/65 hover:bg-sand'
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
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-night/8 bg-white p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => updateFilter('commune_id', '')}
                    className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                      !filters.commune_id
                        ? 'border-nc-lagon bg-nc-lagon text-white'
                        : 'border-night/12 bg-white text-night/65 hover:bg-sand'
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
                          ? 'border-nc-lagon bg-nc-lagon text-white'
                          : 'border-night/12 bg-white text-night/65 hover:bg-sand'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">
              Quartier / Zone
            </label>
            {!selectedCommune ? (
              <div className="rounded-xl border border-dashed border-night/15 bg-sand/30 px-3 py-3 text-sm text-night/45">
                Choisissez une commune pour voir les quartiers.
              </div>
            ) : (
              <div className="rounded-2xl border border-night/8 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateFilter('quartier_zone', '')}
                    className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                      !filters.quartier_zone
                        ? 'border-nc-lagon bg-nc-lagon text-white'
                        : 'border-night/12 bg-white text-night/65 hover:bg-sand'
                    }`}
                  >
                    Aucune prï¿½fï¿½rence
                  </button>
                  {zoneLoading ? (
                    <span className="rounded-full border border-night/10 bg-sand/30 px-3 py-2 text-sm text-night/45">
                      Chargement...
                    </span>
                  ) : (
                    zoneOptions.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => updateFilter('quartier_zone', zone)}
                        className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                          String(filters.quartier_zone) === String(zone)
                            ? 'border-nc-lagon bg-nc-lagon text-white'
                            : 'border-night/12 bg-white text-night/65 hover:bg-sand'
                        }`}
                      >
                        {zone}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-night/8 bg-sand/20 p-3">
        <button
          type="button"
          onClick={() => toggleSidebarSection('radius')}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={!collapsedSections.radius}
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">
              Rayon de recherche
            </label>
            <p className="mt-1 text-xs text-night/45">
              Distance max autour de votre position partagï¿½e.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night shadow-sm">
              {filters.radius} km
            </div>
            <ChevronDown className={`h-4 w-4 text-night/35 transition-transform ${collapsedSections.radius ? '' : 'rotate-180'}`} />
          </div>
        </button>
        {!collapsedSections.radius ? (
          <>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((value) => {
                const active = Number(filters.radius) === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateFilter('radius', value)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-coral bg-coral text-white shadow-sm'
                        : 'border-night/10 bg-white text-night/60 hover:bg-sand'
                    }`}
                  >
                    {value} km
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={geoLoading}
                className="rounded-full bg-night px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {geoLoading ? 'Localisation&' : 'Utiliser ma position'}
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
            {filters.lat && filters.lng ? (
              <p className="text-[11px] text-jungle">
                Position partagï¿½e activï¿½e.
              </p>
            ) : (
              <p className="text-[11px] text-night/40">
                Aucune demande de permission nest envoyï¿½e tant que vous ne cliquez pas sur le bouton.
              </p>
            )}
          </>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-night/8 bg-sand/20 p-3">
        <div className="pointer-events-none absolute inset-x-3 bottom-3 top-10 overflow-hidden rounded-xl">
          <div className="absolute inset-0 flex items-end gap-1">
            {(priceHistogramView.bins.length > 0 ? priceHistogramView.bins : Array.from({ length: 12 }, () => 0)).map((count: number, index: number) => {
              const maxCount = Math.max(1, ...(priceHistogramView.bins.length > 0 ? priceHistogramView.bins : [1]))
              const heightPct = priceHistogramView.bins.length > 0 ? Math.max(8, Math.round((count / maxCount) * 100)) : 18
              const faded = priceHistogramView.bins.length === 0
              const barCenter = ((index + 0.5) / Math.max(1, priceHistogramView.bins.length || 12)) * 100
              const highlighted = barCenter >= priceHistogramView.selectedStart && barCenter <= priceHistogramView.selectedEnd
              return (
                <div
                  key={`price-bin-${index}`}
                  className={`flex-1 rounded-t-lg transition-all duration-200 ${
                    faded
                      ? 'bg-night/6'
                      : highlighted
                        ? 'bg-nc-lagon/60 shadow-[0_-8px_24px_rgba(30,144,255,0.18)]'
                        : 'bg-nc-lagon/25'
                  }`}
                  style={{
                    height: `${heightPct}%`,
                    opacity: faded ? 0.6 : highlighted ? 1 : 0.72,
                  }}
                  aria-hidden="true"
                />
              )
            })}
          </div>

          {priceHistogramView.datasetMax > 0 ? (
            <>
              <div
                className="absolute inset-y-0 rounded-xl border border-nc-lagon/20 bg-gradient-to-r from-nc-lagon/5 via-nc-lagon/10 to-nc-lagon/5"
                style={{
                  left: `${priceHistogramView.selectedStart}%`,
                  width: `${Math.min(100 - priceHistogramView.selectedStart, priceHistogramView.selectedWidth)}%`,
                }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-1 w-px bg-nc-lagon/50"
                style={{ left: `${priceHistogramView.selectedStart}%` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-1 w-px bg-nc-lagon/50"
                style={{ left: `${priceHistogramView.selectedEnd}%` }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 h-px bg-night/10" aria-hidden="true" />
            </>
          ) : null}
        </div>

        <div className="relative z-10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-night">Prix (XPF)</h3>
            <span className="text-[11px] text-night/40">
              {priceHistogramView.rangeLabel}
            </span>
          </div>

          <div className="rounded-2xl border border-night/8 bg-white/80 p-3 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-3 text-[10px] text-night/40">
              <span>0 XPF</span>
              <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-night/50 shadow-sm">
                {priceHistogramView.selectionLabel}
              </span>
              <span>{priceHistogramView.datasetMax > 0 ? `${Math.round(priceHistogramView.datasetMax).toLocaleString('fr-FR')} XPF` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.price_min}
                step={10}
                min={0}
                onChange={(e) => updateFilter('price_min', e.target.value)}
                onBlur={(e) => updateFilter('price_min', snapTo10(e.target.value))}
                className="input w-full bg-white/90 text-sm"
              />
              <span className="text-sm text-night/30">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.price_max}
                step={10}
                min={0}
                onChange={(e) => updateFilter('price_max', e.target.value)}
                onBlur={(e) => updateFilter('price_max', snapTo10(e.target.value))}
                className="input w-full bg-white/90 text-sm"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-night/35">
              <span>La courbe reflï¿½te les annonces chargï¿½es pour cette recherche.</span>
              <span className="rounded-full bg-nc-lagon/10 px-2 py-1 font-medium text-nc-lagonText">
                {priceHistogramView.bins.length > 0 ? `${displayedListings.length} rï¿½sultats` : 'Aucune donnï¿½e'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-night/8 bg-sand/20 p-3">
        <button
          type="button"
          onClick={() => toggleSidebarSection('condition')}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={!collapsedSections.condition}
        >
          <div>
            <h3 className="text-sm font-semibold text-night">Ãtat</h3>
            <p className="mt-1 text-xs text-night/45">
              Affinez selon lÃtat du produit.
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 text-night/35 transition-transform ${collapsedSections.condition ? '' : 'rotate-180'}`} />
        </button>
        {!collapsedSections.condition ? (
          <div className="space-y-1">
            {CONDITION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 hover:bg-sand">
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
              <button onClick={() => updateFilter('condition', '')} className="pl-3 text-xs text-coral hover:underline">
                Effacer
              </button>
            )}
          </div>
        ) : null}
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="btn-ghost w-full justify-center text-sm text-red-500">
          <X className="h-4 w-4" /> Rï¿½initialiser les filtres ({activeFilterCount})
        </button>
      )}
    </div>
  )
}

function snapTo10(value: string) {
  if (!value.trim()) return ''
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return String(Math.max(0, Math.round(parsed / 10) * 10))
}

function extractListingPrice(listing: Record<string, any>) {
  const candidates = [listing.prix, listing.price, listing.prix_xpf, listing.price_xpf]
  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return null
}

function parsePriceFilterValue(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

function buildPriceHistogram(values: number[], bins = 12) {
  if (!values.length) return { bins: [] as number[], max: 0 }
  const max = Math.max(...values)
  if (!Number.isFinite(max) || max <= 0) {
    return { bins: Array.from({ length: bins }, () => 0), max: 0 }
  }

  const counts = Array.from({ length: bins }, () => 0)
  const size = max / bins
  for (const value of values) {
    const index = Math.min(bins - 1, Math.floor(value / size))
    counts[index] += 1
  }

  return { bins: counts, max }
}

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
      { id: 201, name: 'Konï¿½', latitude: null, longitude: null },
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
  const [categories,  setCategories]  = useState<any[]>([])
  const [communes,    setCommunes]    = useState<any[]>([])
  const [zoneOptions, setZoneOptions] = useState<string[]>([])
  const [zoneLoading, setZoneLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [viewMode,    setViewMode]    = useState<'list' | 'map'>('list')
  const [geoLoading, setGeoLoading] = useState(false)
  const [searchAlertOpen, setSearchAlertOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({ radius: false, condition: false })
  const [expandedCategorySlugs, setExpandedCategorySlugs] = useState<string[]>([])
  const [categoryBanner, setCategoryBanner] = useState<any | null>(null)
  const [fallbackListings, setFallbackListings] = useState<any[]>([])
  const [fallbackTotal, setFallbackTotal] = useState(0)
  const [fallbackLoading, setFallbackLoading] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { user } = useAuthStore()
  const { openAuthModal } = useAuthActionStore()
  const sortMenuRef = useRef<HTMLDivElement | null>(null)
  const {
    filters,
    setFilter,
    setLocation,
    clearLocation,
    resetFilters,
    activeFilterCount,
  } = useListingFilters()
  const visibleCategories = hasNestedCategoryTree(categories) ? categories : FALLBACK_CATEGORIES
  const expandedCategorySet = useMemo(() => new Set(expandedCategorySlugs), [expandedCategorySlugs])

  useEffect(() => {
    if (!sortMenuOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sortMenuOpen])

  const listingFilters = useMemo(() => ({
    q: filters.q,
    category: filters.category,
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
    limit: 24,
  }), [filters])
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
  const displayedListings = listings.length > 0 ? listings : fallbackListings
  const displayedTotal = total > 0 ? total : fallbackTotal
  const isInitialLoading = isLoading && displayedListings.length === 0 && fallbackLoading
  const isLoadingMore = isFetchingNextPage && listings.length > 0
  const priceHistogram = useMemo(() => {
    const prices = displayedListings
      .map((listing: Record<string, any>) => extractListingPrice(listing))
      .filter((value): value is number => typeof value === 'number')
    return buildPriceHistogram(prices, 12)
  }, [displayedListings])
  const priceHistogramView = useMemo(() => {
    const prices = displayedListings
      .map((listing: Record<string, any>) => extractListingPrice(listing))
      .filter((value): value is number => typeof value === 'number')

    const datasetMax = prices.length > 0 ? Math.max(...prices) : 0
    const rawMin = parsePriceFilterValue(filters.price_min)
    const rawMax = parsePriceFilterValue(filters.price_max)
    const selectedMin = Math.max(0, rawMin ?? 0)
    const selectedMaxBase = rawMax ?? datasetMax
    const selectedMax = Math.max(selectedMin, selectedMaxBase)
    const safeRange = Math.max(datasetMax, selectedMax, 1)
    const normalizedMin = Math.max(0, Math.min(100, (selectedMin / safeRange) * 100))
    const normalizedMax = Math.max(normalizedMin, Math.min(100, (selectedMax / safeRange) * 100))

    return {
      ...priceHistogram,
      datasetMax,
      selectedMin,
      selectedMax,
      selectedStart: normalizedMin,
      selectedEnd: normalizedMax,
      selectedWidth: Math.max(3, normalizedMax - normalizedMin),
      rangeLabel: datasetMax > 0 ? `0 - ${Math.round(datasetMax).toLocaleString('fr-FR')} XPF` : 'Distribution des prix',
      selectionLabel: `${Math.round(selectedMin).toLocaleString('fr-FR')} - ${Math.round(selectedMax).toLocaleString('fr-FR')} XPF`,
    }
  }, [displayedListings, filters.price_max, filters.price_min, priceHistogram])
  const loadError = useMemo(() => {
    if (!isError) return ''
    if (error instanceof Error && error.message === 'timeout') {
      return 'Le chargement des annonces prend trop de temps. Essayez de recharger la page.'
    }
    return 'Les annonces sont temporairement indisponibles.'
  }, [error, isError])

  useEffect(() => {
    if (!isError || !error) return
    console.error('[annonces] load:', error)
  }, [error, isError])

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    const run = async () => {
      setFallbackLoading(true)
      try {
        const params = new URLSearchParams()
        Object.entries(listingFilters).forEach(([key, value]) => {
          if (key === 'page' || value == null || value === '') return
          params.set(key, String(value))
        })
        params.set('limit', String(listingFilters.limit ?? 24))
        const baseUrl = API_ORIGIN
        const response = await fetch(`${baseUrl}/api/listings?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const json = await response.json()
        if (!alive) return
        setFallbackListings(Array.isArray(json?.data) ? json.data : [])
        setFallbackTotal(Number(json?.pagination?.total ?? (Array.isArray(json?.data) ? json.data.length : 0)))
      } catch {
        if (!alive) return
        setFallbackListings([])
        setFallbackTotal(0)
      } finally {
        if (alive) setFallbackLoading(false)
      }
    }

    void run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [listingFilters])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('kalico-listings-filters-sections')
      if (!raw) return
      const parsed = JSON.parse(raw)
      setCollapsedSections({
        radius: Boolean(parsed?.radius),
        condition: Boolean(parsed?.condition),
      })
    } catch {
      // Ignore persisted UI state errors.
    }
  }, [])

  const toggleSidebarSection = (key: 'radius' | 'condition') => {
    setCollapsedSections((current) => {
      const next = { ...current, [key]: !current[key] }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('kalico-listings-filters-sections', JSON.stringify(next))
      }
      return next
    })
  }

  const toggleCategoryNode = useCallback((slug: string) => {
    setExpandedCategorySlugs((current) => (
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    ))
  }, [])

  // Charger categories et communes une seule fois
  useEffect(() => {
    Promise.all([metaApi.getCategories(), metaApi.getCommunes()])
      .then(([catRes, comRes]) => {
        setCategories(normalizeCategoryTree(catRes.data?.data?.length ? catRes.data.data : FALLBACK_CATEGORIES))
        setCommunes(comRes.data?.data?.length ? comRes.data.data : FALLBACK_PROVINCES)
      })
      .catch(() => {
        setCategories(normalizeCategoryTree(FALLBACK_CATEGORIES))
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
    if (!filters.commune_id || communes.length === 0) return

    const matchingProvince = communes.find((province: any) =>
      (province.communes || []).some((commune: any) => String(commune.id) === String(filters.commune_id))
    )

    if (matchingProvince && String(matchingProvince.id) !== String(filters.province_id)) {
      setFilter('province_id', String(matchingProvince.id))
    }
  }, [filters.commune_id, filters.province_id, communes, setFilter])

  useEffect(() => {
    if (!filters.category || visibleCategories.length === 0) return

    const path = findCategoryPathBySlug(visibleCategories, filters.category)
    if (!path.length) return

    setExpandedCategorySlugs((current) => {
      const next = new Set(current)
      path.forEach((node: any) => {
        if (getCategoryChildren(node).length > 0) {
          next.add(node.slug)
        }
      })
      return Array.from(next)
    })
  }, [filters.category, visibleCategories])

  useEffect(() => {
    let alive = true

    if (!filters.category) {
      setCategoryBanner(null)
      return () => {
        alive = false
      }
    }

    campaignsApi.getCategoryBanner(filters.category)
      .then((response) => {
        if (!alive) return
        setCategoryBanner(response.data?.data?.banner ?? null)
      })
      .catch(() => {
        if (!alive) return
        setCategoryBanner(null)
      })

    return () => {
      alive = false
    }
  }, [filters.category])

  useEffect(() => {
    if (viewMode !== 'list') return
    if (!hasNextPage || isFetchingNextPage) return

    const element = sentinelRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, viewMode])

  const updateFilter = (key: keyof ListingFilters, value: string | number) => {
    setFilter(key, value as never)
  }

  const clearFilters = () => {
    resetFilters()
  }

  const snapRadius = useCallback((value: number) => {
    return RADIUS_OPTIONS.reduce((best, current) => (
      Math.abs(current - value) < Math.abs(best - value) ? current : best
    ), RADIUS_OPTIONS[0])
  }, [])

  const handleUseLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      window.alert('La gï¿½olocalisation nest pas disponible dans ce navigateur.')
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          position.coords.latitude.toFixed(6),
          position.coords.longitude.toFixed(6)
        )
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        window.alert('Impossible de rï¿½cupï¿½rer votre position pour le moment.')
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60_000,
      }
    )
  }, [setLocation])

  const selectedProvince = communes.find((province: any) => String(province.id) === String(filters.province_id))
  const selectedProvinceCommunes = selectedProvince?.communes || []
  const selectedCommune = useMemo(() => {
    for (const province of communes) {
      const commune = (province.communes || []).find((item: any) => String(item.id) === String(filters.commune_id))
      if (commune) return commune
    }
    return null
  }, [communes, filters.commune_id])

  useEffect(() => {
    let alive = true

    if (!selectedCommune?.slug) {
      setZoneOptions([])
      setZoneLoading(false)
      return () => {
        alive = false
      }
    }

    setZoneLoading(true)
    metaApi.getZones(selectedCommune.slug)
      .then((response) => {
        if (!alive) return
        const zones = Array.isArray(response.data?.data?.zones) ? response.data.data.zones : []
        setZoneOptions(zones.filter(Boolean))
      })
      .catch(() => {
        if (!alive) return
        setZoneOptions([])
      })
      .finally(() => {
        if (alive) setZoneLoading(false)
      })

    return () => {
      alive = false
    }
  }, [selectedCommune?.slug])

  const selectedCategoryLabel = useMemo(() => {
    if (!filters.category) return null
    const path = findCategoryPathBySlug(visibleCategories, filters.category)
    if (!path.length) return filters.category
    return path[path.length - 1]?.name ?? filters.category
  }, [filters.category, visibleCategories])
  const selectedCommuneLabel = useMemo(() => {
    if (!filters.commune_id) return null
    for (const province of communes) {
      const commune = (province.communes || []).find((item: any) => String(item.id) === String(filters.commune_id))
      if (commune) return commune.name
    }
    return filters.commune_id
  }, [communes, filters.commune_id])
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

  const handleCreateSearchAlert = () => {
    if (typeof window === 'undefined') return
    const redirectTo = `${window.location.pathname}${window.location.search}`
    if (!user) {
      openAuthModal({
        type: 'search_alert',
        redirectTo,
      })
      return
    }

    setSearchAlertOpen(true)
  }

  // Sidebar filtres
  const LegacyFilterSidebar = () => (
      <div className="space-y-6">
      {/* CatÃ©gories */}
      <div>
        <h3 className="font-semibold text-night text-sm mb-3">CatÃ©gorie</h3>
        <div className="space-y-3 rounded-2xl border border-night/8 bg-white/80 p-3 shadow-sm">
          <button
            type="button"
            onClick={() => updateFilter('category', '')}
            className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors ${
              !filters.category
                ? 'bg-nc-lagon text-white shadow-sm'
                : 'hover:bg-sand text-night/70'
            }`}
          >
            Toutes les catï¿½gories
          </button>

          {selectedCategoryLabel ? (
            <div className="rounded-2xl border border-nc-lagon/20 bg-nc-lagon/8 px-3 py-3 text-sm text-night">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-lagon">CatÃ©gorie active</p>
              <p className="mt-1 font-semibold">{selectedCategoryLabel}</p>
            </div>
          ) : null}

          <div className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
            {visibleCategories.map((cat: any) => (
              <CategoryTreeNode
                key={cat.id}
                category={cat}
                selectedSlug={filters.category}
                expandedSlugs={expandedCategorySet}
                onSelect={(slug) => updateFilter('category', slug)}
                onToggleExpand={toggleCategoryNode}
              />
            ))}
          </div>

          <p className="text-[11px] text-night/40">
            Cliquez sur une catï¿½gorie pour ouvrir ses sous-catï¿½gories. Le filtre actif reste mis en avant.
          </p>
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
                  ? 'bg-nc-lagon text-white border-nc-lagon'
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
                        ? 'bg-nc-lagon text-white border-nc-lagon'
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
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-night/8 bg-white p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => updateFilter('commune_id', '')}
                    className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                        !filters.commune_id
                          ? 'bg-nc-lagon text-white border-nc-lagon'
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
                          ? 'bg-nc-lagon text-white border-nc-lagon'
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

      <div className="space-y-2 rounded-2xl border border-night/8 bg-sand/20 p-3">
        <button
          type="button"
          onClick={() => toggleSidebarSection('radius')}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={!collapsedSections.radius}
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-night/40">
              Rayon de recherche
            </label>
            <p className="mt-1 text-xs text-night/45">
            Distance max autour de votre position partagï¿½e.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night shadow-sm">
              {filters.radius} km
            </div>
            <ChevronDown className={`h-4 w-4 text-night/35 transition-transform ${collapsedSections.radius ? '' : 'rotate-180'}`} />
          </div>
        </button>
        {!collapsedSections.radius ? (
          <>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((value) => {
                const active = Number(filters.radius) === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateFilter('radius', value)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-coral bg-coral text-white shadow-sm'
                        : 'border-night/10 bg-white text-night/60 hover:bg-sand'
                    }`}
                  >
                    {value} km
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={geoLoading}
                className="rounded-full bg-night px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {geoLoading ? 'Localisation&' : 'Utiliser ma position'}
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
            {filters.lat && filters.lng ? (
              <p className="text-[11px] text-jungle">
                Position partagï¿½e activï¿½e.
              </p>
            ) : (
              <p className="text-[11px] text-night/40">
                Aucune demande de permission nest envoyï¿½e tant que vous ne cliquez pas sur le bouton.
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Prix */}
      <div className="relative overflow-hidden rounded-2xl border border-night/8 bg-sand/20 p-3">
        <div className="pointer-events-none absolute inset-x-3 bottom-3 top-10 overflow-hidden rounded-xl">
          <div className="absolute inset-0 flex items-end gap-1">
            {(priceHistogramView.bins.length > 0 ? priceHistogramView.bins : Array.from({ length: 12 }, () => 0)).map((count, index) => {
              const maxCount = Math.max(1, ...(priceHistogramView.bins.length > 0 ? priceHistogramView.bins : [1]))
              const heightPct = priceHistogramView.bins.length > 0 ? Math.max(8, Math.round((count / maxCount) * 100)) : 18
              const faded = priceHistogramView.bins.length === 0
              const barCenter = ((index + 0.5) / Math.max(1, priceHistogramView.bins.length || 12)) * 100
              const highlighted = barCenter >= priceHistogramView.selectedStart && barCenter <= priceHistogramView.selectedEnd
              return (
                <div
                  key={`price-bin-${index}`}
                  className={`flex-1 rounded-t-lg transition-all duration-200 ${
                    faded
                      ? 'bg-night/6'
                      : highlighted
                        ? 'bg-nc-lagon/60 shadow-[0_-8px_24px_rgba(30,144,255,0.18)]'
                        : 'bg-nc-lagon/25'
                  }`}
                  style={{
                    height: `${heightPct}%`,
                    opacity: faded ? 0.6 : highlighted ? 1 : 0.72,
                  }}
                  aria-hidden="true"
                />
              )
            })}
          </div>

          {priceHistogramView.datasetMax > 0 ? (
            <>
              <div
                className="absolute inset-y-0 rounded-xl border border-nc-lagon/20 bg-gradient-to-r from-nc-lagon/5 via-nc-lagon/10 to-nc-lagon/5"
                style={{
                  left: `${priceHistogramView.selectedStart}%`,
                  width: `${Math.min(100 - priceHistogramView.selectedStart, priceHistogramView.selectedWidth)}%`,
                }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-1 w-px bg-nc-lagon/50"
                style={{ left: `${priceHistogramView.selectedStart}%` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-1 w-px bg-nc-lagon/50"
                style={{ left: `${priceHistogramView.selectedEnd}%` }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 h-px bg-night/10" aria-hidden="true" />
            </>
          ) : null}
        </div>

        <div className="relative z-10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-night text-sm">Prix (XPF)</h3>
            <span className="text-[11px] text-night/40">
              {priceHistogramView.rangeLabel}
            </span>
          </div>

          <div className="rounded-2xl border border-night/8 bg-white/80 p-3 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-3 text-[10px] text-night/40">
              <span>0 XPF</span>
              <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-night/50 shadow-sm">
                {priceHistogramView.selectionLabel}
              </span>
              <span>{priceHistogramView.datasetMax > 0 ? `${Math.round(priceHistogramView.datasetMax).toLocaleString('fr-FR')} XPF` : ''}</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.price_min}
                step={10}
                min={0}
                onChange={(e) => updateFilter('price_min', e.target.value)}
                onBlur={(e) => updateFilter('price_min', snapTo10(e.target.value))}
                className="input text-sm w-full bg-white/90"
              />
              <span className="text-night/30 text-sm">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.price_max}
                step={10}
                min={0}
                onChange={(e) => updateFilter('price_max', e.target.value)}
                onBlur={(e) => updateFilter('price_max', snapTo10(e.target.value))}
                className="input text-sm w-full bg-white/90"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-night/35">
              <span>La courbe reflï¿½te les annonces chargï¿½es pour cette recherche.</span>
              <span className="rounded-full bg-nc-lagon/10 px-2 py-1 font-medium text-nc-lagonText">
                {priceHistogramView.bins.length > 0 ? `${displayedListings.length} rï¿½sultats` : 'Aucune donnï¿½e'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Etat */}
      <div className="space-y-2 rounded-2xl border border-night/8 bg-sand/20 p-3">
        <button
          type="button"
          onClick={() => toggleSidebarSection('condition')}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={!collapsedSections.condition}
        >
          <div>
            <h3 className="font-semibold text-night text-sm">Ãtat</h3>
            <p className="mt-1 text-xs text-night/45">
              Affinez selon lÃtat du produit.
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 text-night/35 transition-transform ${collapsedSections.condition ? '' : 'rotate-180'}`} />
        </button>
        {!collapsedSections.condition ? (
          <div className="space-y-1">
            {CONDITION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-sand cursor-pointer">
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
              <button onClick={() => updateFilter('condition', '')} className="pl-3 text-xs text-coral hover:underline">
                Effacer
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Effacer tous les filtres */}
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="btn-ghost text-sm text-red-500 w-full justify-center">
          <X className="w-4 h-4" /> Rï¿½initialiser les filtres ({activeFilterCount})
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen">
      <h1 className="sr-only">
        Toutes les annonces en Nouvelle-Calédonie
      </h1>
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Barre superieure */}
        <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-night/8 border-l-4 border-l-nc-lagon bg-white/90 p-4 shadow-sm lg:flex-row lg:items-center">
          {/* Recherche */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-night/35 w-4 h-4" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher dans les annonces"
              className="input w-full pl-9 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:ml-auto">
            {/* Toggle Annonces / Troc */}
            <div className="flex w-full items-center rounded-2xl border border-night/12 bg-[var(--color-surface)] p-1 shadow-sm sm:w-auto">
              <button
                type="button"
                onClick={() => updateFilter('troc', '')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                  filters.troc === 'true'
                    ? 'text-night/60 hover:bg-[var(--color-surface-raised)] hover:text-night'
                    : 'bg-nc-lagon text-white shadow-sm shadow-nc-lagon/25'
                }`}
                aria-pressed={filters.troc !== 'true'}
                aria-label="Afficher les annonces classiques"
              >
                Annonces
              </button>
              <button
                type="button"
                onClick={() => updateFilter('troc', 'true')}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                  filters.troc === 'true'
                    ? 'bg-nc-corail text-white shadow-sm shadow-nc-corail/25'
                    : 'text-night/60 hover:bg-[var(--color-surface-raised)] hover:text-night'
                }`}
                aria-pressed={filters.troc === 'true'}
                aria-label="Afficher uniquement les annonces avec troc"
              >
                Troc
              </button>
            </div>

            {/* Tri */}
            <div ref={sortMenuRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSortMenuOpen((current) => !current)}
                className="input inline-flex w-full items-center justify-between gap-2 text-sm font-medium sm:w-auto"
                aria-haspopup="menu"
                aria-expanded={sortMenuOpen}
                aria-controls="annonces-sort-menu"
              >
                <span className="whitespace-nowrap text-night/80">
                  Trier : {SORT_LABEL_BY_VALUE[filters.sort] ?? 'Plus rï¿½centes'}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-night/40 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortMenuOpen ? (
                <div
                  id="annonces-sort-menu"
                  role="menu"
                  aria-label="Tri des annonces"
                  className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_18px_60px_rgba(8,32,50,0.14)]"
                >
                  {SORT_OPTIONS.map((opt) => {
                    const active = filters.sort === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          updateFilter('sort', opt.value)
                          setSortMenuOpen(false)
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                          active ? 'bg-nc-lagon/6 text-night' : 'text-night/70 hover:bg-sand'
                        }`}
                      >
                        <span className={active ? 'font-semibold' : ''}>{opt.label}</span>
                        {active ? <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Actif</span> : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleCreateSearchAlert}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-nc-lagon/20 bg-nc-lagon/6 px-3 py-2 text-sm font-semibold text-nc-lagon transition hover:border-nc-lagon/30 hover:bg-nc-lagon/10 sm:w-auto"
            >
              <Bell className="h-4 w-4" />
              Crï¿½er une alerte
            </button>

            {/* Bouton filtres mobile */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-night/12 bg-white px-3 py-2 text-sm font-semibold text-night shadow-sm lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="mobile-filters-drawer"
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden items-center rounded-xl border border-night/12 bg-white p-1 lg:flex">
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
        </div>

        <div className="mb-4 lg:hidden">
          <div className="rounded-[1.5rem] border border-night/8 bg-white/90 shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={mobileCategoriesOpen}
              onClick={() => setMobileCategoriesOpen((current) => !current)}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral/80">CatÃ©gories</p>
                <p className="mt-1 text-sm font-semibold text-night">
                  {selectedCategoryLabel ?? 'Toutes les catï¿½gories'}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-night/35 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileCategoriesOpen ? (
              <div className="border-t border-night/8 p-3">
                <CategoryTreeBrowser
                  filters={filters}
                  selectedCategoryLabel={selectedCategoryLabel}
                  visibleCategories={visibleCategories}
                  expandedCategorySet={expandedCategorySet}
                  updateFilter={updateFilter}
                  toggleCategoryNode={toggleCategoryNode}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-6">

          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-80 xl:w-96 shrink-0">
            <div className="card sticky top-20 space-y-5 border-l-4 border-l-nc-lagon p-5">
              <CategoryTreeBrowser
                filters={filters}
                selectedCategoryLabel={selectedCategoryLabel}
                visibleCategories={visibleCategories}
                expandedCategorySet={expandedCategorySet}
                updateFilter={updateFilter}
                toggleCategoryNode={toggleCategoryNode}
              />
              <FilterSidebar
                filters={filters}
                updateFilter={updateFilter}
                communes={communes}
                selectedProvince={selectedProvince}
                selectedProvinceCommunes={selectedProvinceCommunes}
                selectedCommune={selectedCommune}
                zoneOptions={zoneOptions}
                zoneLoading={zoneLoading}
                sortedProvinces={sortedProvinces}
                handleUseLocation={handleUseLocation}
                clearLocation={clearLocation}
                clearFilters={clearFilters}
                snapRadius={snapRadius}
                collapsedSections={collapsedSections}
                toggleSidebarSection={toggleSidebarSection}
                priceHistogramView={priceHistogramView}
                displayedListings={displayedListings}
                activeFilterCount={activeFilterCount}
                handleCreateSearchAlert={handleCreateSearchAlert}
                geoLoading={geoLoading}
              />
            </div>
          </aside>

          {/* Drawer filtres mobile */}
          {filtersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
              <div id="mobile-filters-drawer" role="dialog" aria-modal="true" aria-label="Filtres de recherche" className="relative ml-auto h-full w-[min(100vw,24rem)] overflow-y-auto border-l-4 border-l-nc-lagon bg-white p-5 shadow-modal animate-slide-up sm:w-80 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-lg">Filtres</h2>
                  <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar
                  filters={filters}
                  updateFilter={updateFilter}
                  communes={communes}
                  selectedProvince={selectedProvince}
                  selectedProvinceCommunes={selectedProvinceCommunes}
                  selectedCommune={selectedCommune}
                  zoneOptions={zoneOptions}
                  zoneLoading={zoneLoading}
                  sortedProvinces={sortedProvinces}
                  handleUseLocation={handleUseLocation}
                  clearLocation={clearLocation}
                  clearFilters={clearFilters}
                  snapRadius={snapRadius}
                  collapsedSections={collapsedSections}
                  toggleSidebarSection={toggleSidebarSection}
                  priceHistogramView={priceHistogramView}
                  displayedListings={displayedListings}
                  activeFilterCount={activeFilterCount}
                  handleCreateSearchAlert={handleCreateSearchAlert}
                  geoLoading={geoLoading}
                />
              </div>
            </div>
          )}

          {/* Carte Leaflet */}
        {viewMode === 'map' && (
          <div className="mb-6">
            <AnnoncesMap
              listings={displayedListings.map((a: any) => ({
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
                {isInitialLoading ? 'Chargement...' : (
                  <><span className="font-semibold text-night">{displayedTotal}</span> annonce{displayedTotal > 1 ? 's' : ''}</>
                )}
              </p>
              {filters.q && (
                <span className="text-sm text-night/50">
                  pour <span className="font-medium text-night">"{filters.q}"</span>
                </span>
              )}
            </div>

            {categoryBanner ? (
              <div className="mb-4 hidden overflow-hidden rounded-[2rem] border border-nc-lagon/15 bg-white/95 shadow-sm md:block">
                <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-3 p-5 lg:p-6">
                    <div className="inline-flex items-center rounded-full border border-nc-lagon/20 bg-nc-lagon/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">
                      SponsorisÃ©
                    </div>
                    <h3 className="font-display text-2xl font-bold text-night">
                      {categoryBanner.title || 'Mettez votre offre en avant'}
                    </h3>
                    <p className="max-w-2xl text-sm leading-relaxed text-night/65">
                      {categoryBanner.description || 'Une banniï¿½re locale visible au-dessus des rï¿½sultats de la catï¿½gorie.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={categoryBanner.link_url || '/annonces'}
                        className="inline-flex items-center justify-center rounded-2xl bg-nc-lagon px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        {categoryBanner.cta_text || 'DÃ©couvrir'}
                      </a>
                    </div>
                  </div>
                  <div className="min-h-56 bg-[linear-gradient(135deg,_rgba(10,126,164,0.18),_rgba(8,32,50,0.06))]">
                    {categoryBanner.image_url ? (
                      <img
                        src={categoryBanner.image_url}
                        alt={categoryBanner.title || 'Banniï¿½re sponsorisï¿½e'}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {isInitialLoading ? (
              <ListingSkeletonGrid count={6} className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" />
            ) : displayedListings.length === 0 ? (
              <div className="rounded-[2rem] border border-night/8 bg-white/90 px-6 py-16 text-center shadow-sm">
                <div
                  className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-nc-lagon/12 bg-[linear-gradient(180deg,_rgba(10,126,164,0.12),_rgba(10,126,164,0.02))] text-nc-lagon shadow-[0_18px_50px_rgba(10,126,164,0.12)]"
                  aria-hidden="true"
                >
                  <PackageSearch className="h-20 w-20" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-night mb-2">
                  Aucune annonce trouvï¿½e pour ces critï¿½res
                </h3>
                <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-night/55">
                  Soyez le premier ï¿½ publier dans cette catï¿½gorie - les acheteurs sont lï¿½.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={clearFilters} className="btn-secondary">
                    Effacer les filtres
                  </button>
                  {isError ? (
                    <button onClick={() => void refetch()} className="btn-ghost">
                      Rï¿½essayer
                    </button>
                  ) : null}
                </div>
                <div className="mt-4">
                  <Link href="/annonces/nouvelle" className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm">
                    Publier une annonce
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {displayedListings.map((listing) => (
                    <ListingCard
                      key={String((listing as { id?: string | number }).id ?? '')}
                      listing={listing as unknown as Parameters<typeof ListingCard>[0]['listing']}
                    />
                  ))}
                </div>

                {isLoadingMore ? (
                  <div className="mt-4">
                    <ListingSkeletonGrid count={2} className="grid-cols-1 sm:grid-cols-2 gap-4" />
                  </div>
                ) : null}

                {hasNextPage ? <div ref={sentinelRef} aria-hidden="true" className="h-8" /> : null}
              </>
            )}
          </div>
        </div>
      </div>

      <SearchAlertModal
        open={searchAlertOpen}
        onClose={() => setSearchAlertOpen(false)}
        filters={filters}
        categoryLabel={selectedCategoryLabel}
        communeLabel={selectedCommuneLabel}
      />
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
