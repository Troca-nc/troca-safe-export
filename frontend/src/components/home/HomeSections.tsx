'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Anchor,
  Archive,
  ArrowRight,
  Baby,
  Briefcase,
  Car,
  ChevronRight,
  Gamepad2,
  HardHat,
  HeartHandshake,
  Home,
  LocateFixed,
  Package,
  PawPrint,
  Bell,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Wrench,
} from 'lucide-react'

import SearchAlertModal from '@/components/SearchAlertModal'
import PlatformStats from '@/components/PlatformStats'
import CategoryTreeSection from '@/components/home/CategoryTreeSection'
import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import type { ListingFilters } from '@/hooks/useListingFilters'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { SEARCH_ALERTS, getCategoryIcon } from '@/lib/categoryPresentation'
import { trackEvent } from '@/lib/analytics'

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return '...'
  return new Intl.NumberFormat('fr-FR').format(value)
}

function getCategoryChildren(category: CategoryNode) {
  return category.children || category.subcategories || []
}

function getHomepageCategoryIcon(category: Pick<CategoryNode, 'slug' | 'name' | 'icon'>) {
  return getCategoryIcon(category.slug, category.name, category.icon)
}

type HomeHeroSectionProps = {
  q: string
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  suggestions: string[]
}

export function HomeHeroSection({
  q,
  onQueryChange,
  onSubmit,
  suggestions,
}: HomeHeroSectionProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchAlertOpen, setSearchAlertOpen] = useState(false)

  const suggestionPool = useMemo(() => {
    const unique = new Map<string, string>()
    for (const suggestion of suggestions || []) {
      const label = String(suggestion || '').trim()
      if (!label) continue
      const key = label.toLowerCase()
      if (!unique.has(key)) unique.set(key, label)
    }
    return Array.from(unique.values())
  }, [suggestions])

  const filteredSuggestions = useMemo(() => suggestionPool.slice(0, 7), [suggestionPool])

  const quickSuggestions = useMemo(() => {
    return suggestionPool.slice(0, 4)
  }, [suggestionPool])

  const selectSuggestion = (value: string, source: string = 'hero_suggestion') => {
    const nextValue = value.trim()
    if (!nextValue) return
    onQueryChange(nextValue)
    setIsFocused(false)
    setActiveIndex(0)
    void trackEvent('listing_search', {
      query: nextValue,
      source,
    })
    router.push(`/annonces?q=${encodeURIComponent(nextValue)}`)
  }

  const handleGeoSearch = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      window.alert('La géolocalisation n’est pas disponible dans ce navigateur.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams()
        params.set('lat', position.coords.latitude.toFixed(6))
        params.set('lng', position.coords.longitude.toFixed(6))
        params.set('radius', '20')
        router.push(`/annonces?${params.toString()}`)
      },
      () => {
        window.alert('Impossible de récupérer votre position pour le moment.')
      },
      {
        enableHighAccuracy: false,
      },
    )
  }

  const alertFilters: ListingFilters = useMemo(
    () => ({
      q,
      category: '',
      commune_id: '',
      province_id: '',
      quartier_zone: '',
      price_min: '',
      price_max: '',
      condition: '',
      troc: '',
      lat: '',
      lng: '',
      radius: 20,
      sort: 'date',
      page: 1,
    }),
    [q],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredSuggestions.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % filteredSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + filteredSuggestions.length) % filteredSuggestions.length)
    } else if (event.key === 'Enter' && isFocused && filteredSuggestions[activeIndex]) {
      event.preventDefault()
      selectSuggestion(filteredSuggestions[activeIndex], 'hero_dropdown')
    } else if (event.key === 'Escape') {
      setIsFocused(false)
    }
  }

  useEffect(() => {
    setActiveIndex(0)
  }, [suggestionPool])

  return (
    <section className="relative overflow-hidden px-4 py-10 text-white md:py-14">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_#0A7EA4_0%,_#065f7a_100%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 1200 520" aria-hidden="true">
        <defs>
          <pattern id="hero-dots" width="56" height="56" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="2.5" fill="white" />
          </pattern>
        </defs>
        <rect width="1200" height="520" fill="url(#hero-dots)" />
      </svg>
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <span className="relative h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm md:h-24 md:w-24">
              <Image
                src="/brand/kalico1.svg"
                alt="Kalico"
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </span>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
              Nouvelle-Calédonie
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
              La place locale des annonces, du troc et des bons plans en Nouvelle-Calédonie.
            </p>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            Achetez, vendez, troquez en NC
          </h1>

          <div className="mt-5 w-full max-w-[560px]">
            <form onSubmit={onSubmit} className="relative flex w-full flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    onQueryChange(e.target.value)
                    setIsFocused(true)
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsFocused(false), 120)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Que recherchez-vous ?"
                  aria-label="Rechercher une annonce, un bon plan ou une catégorie"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 pl-11 text-sm text-white placeholder:text-white/50 shadow-sm outline-none ring-0 backdrop-blur-sm transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={isFocused && filteredSuggestions.length > 0}
                  aria-controls="hero-search-suggestions"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-nc-lagon shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15 sm:w-auto"
                >
                  Rechercher
                </button>
                <button
                  type="button"
                  onClick={() => setSearchAlertOpen(true)}
                  disabled={!q.trim()}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  title="Créer une alerte sur cette recherche"
                  aria-label="Créer une alerte sur cette recherche"
                >
                  <Bell className="h-4 w-4" />
                </button>
              </div>

              {isFocused && filteredSuggestions.length > 0 ? (
                <div
                  id="hero-search-suggestions"
                  className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 overflow-hidden rounded-3xl border border-white/15 bg-[rgba(8,32,50,0.98)] p-2 shadow-[0_24px_80px_rgba(8,32,50,0.25)] backdrop-blur-md"
                >
                  <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Suggestions
                  </p>
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(suggestion, 'hero_dropdown')}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                          index === activeIndex ? 'bg-white/12 text-white' : 'text-white/85 hover:bg-white/8'
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{suggestion}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
                          Rechercher
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </form>

            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/50">
              Recherches populaires
            </p>
            <div className="mt-2 flex flex-wrap gap-2 pb-1 sm:flex-nowrap sm:overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => selectSuggestion(suggestion, 'hero_chip')}
                  className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                onClick={handleGeoSearch}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15"
              >
                <LocateFixed className="h-3.5 w-3.5" />
                Autour de moi
              </button>
            </div>
          </div>

          <SearchAlertModal
            open={searchAlertOpen}
            onClose={() => setSearchAlertOpen(false)}
            filters={alertFilters}
          />

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/annonces/nouvelle" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-nc-lagon shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15">
              Publier une annonce
            </Link>
            <Link href="/annonces" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15">
              Parcourir les annonces
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}


function AnimatedStat({ value, label, loading }: { value: number | null; label: string; loading: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [displayValue, setDisplayValue] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || loading || value == null) return
    let raf = 0
    const start = performance.now()
    const duration = 1500

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.round(value * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [loading, value, visible])

  const formatted = loading ? '...' : new Intl.NumberFormat('fr-FR').format(displayValue)

  return (
    <div ref={ref} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-sm">
      <p className="text-4xl font-bold text-coral md:text-[2.5rem]">{formatted}</p>
      <p className="mt-2 text-sm font-medium text-night/65">{label}</p>
    </div>
  )
}

export function HomeStatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <PlatformStats variant="light" />
    </section>
  )
}

export function FeaturedListingsSection({
  listings,
  loading,
}: {
  listings: any[]
  loading: boolean
}) {
  if (!loading && listings.length === 0) return null

  return (
    <section id="featured-listings" className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="section-lagon">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Annonces en vedette</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les annonces les plus visibles en ce moment</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
          Tout voir <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-[2rem] border border-[var(--color-border)] border-l-4 border-l-nc-lagon bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
        {loading ? (
          <ListingSkeletonGrid count={8} className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" />
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center text-night/45">
            <p className="text-sm font-semibold text-night">Les meilleures annonces apparaîtront ici</p>
            <p className="mt-2 text-sm text-night/65">
              Boostez votre annonce pour apparaître en tête de page.
            </p>
            <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-block">
              Déposer une annonce
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export function SearchAlertsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-[var(--color-border)] border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-lagon">
            <Sparkles className="h-3.5 w-3.5" />
            Coups de cœur
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Gardez vos recherches en mémoire et recevez une alerte quand une offre correspond.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Les utilisateurs peuvent enregistrer des mots-clés pour suivre ce qui compte vraiment: un modèle précis, une commune, une gamme de prix ou une catégorie.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 pb-1 sm:flex-nowrap sm:overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SEARCH_ALERTS.map((term) => (
              <span
                key={term}
                className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/85"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/8 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Exemple d&apos;alerte</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"Toyota Hilux"</p>
              <p className="mt-1 text-sm text-white/65">Nouméa, prix max 3 500 000 XPF</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"Studio"</p>
              <p className="mt-1 text-sm text-white/65">Dumbéa / Nouméa, location ou vente</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"iPhone"</p>
              <p className="mt-1 text-sm text-white/65">État bon ou comme neuf, en Nouvelle-Calédonie</p>
            </div>
          </div>
          <Link href="/alertes" className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2">
            Gérer mes alertes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryTreeRow({
  category,
  depth,
  onBrowse,
}: {
  category: CategoryNode
  depth: number
  onBrowse: (slug: string) => void
}) {
  const Visual = getHomepageCategoryIcon(category)
  const children = getCategoryChildren(category)

  return (
    <div className={depth === 0 ? 'space-y-3' : 'space-y-3 border-l border-[var(--color-border)] pl-3'}>
      <button
        type="button"
        onClick={() => onBrowse(category.slug)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
          depth === 0
            ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
            : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]/80'
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
          <Visual className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--color-text-primary)]">{category.name}</span>
          <span className="block text-xs text-[var(--color-text-secondary)]">
            {depth === 0 ? 'Famille ouverte' : 'Sous-catégorie ouverte'}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-nc-lagon" />
      </button>

      {children.length > 0 ? (
        <div className={depth === 0 ? 'grid gap-2 md:grid-cols-2' : 'space-y-2'}>
          {children.map((child) => {
            const grandChildren = getCategoryChildren(child)
            const ChildVisual = getHomepageCategoryIcon(child)

            return (
              <div
                key={child.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onBrowse(child.slug)}
                  className="flex w-full items-center gap-3 text-left transition hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                    <ChildVisual className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--color-text-primary)]">{child.name}</span>
                    <span className="block text-xs text-[var(--color-text-secondary)]">
                      {grandChildren.length > 0 ? `${grandChildren.length} sous-catégorie${grandChildren.length > 1 ? 's' : ''}` : 'Dernier niveau'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-nc-lagon" />
                </button>

                {grandChildren.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {grandChildren.map((grandChild) => {
                      const GrandVisual = getHomepageCategoryIcon(grandChild)
                      return (
                        <button
                          key={grandChild.id}
                          type="button"
                          onClick={() => onBrowse(grandChild.slug)}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-nc-lagon/30 hover:bg-nc-lagonLight hover:text-nc-lagonText"
                        >
                          <GrandVisual className="h-3.5 w-3.5" />
                          <span>{grandChild.name}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function CategoryCard({
  category,
  onBrowse,
}: {
  category: CategoryNode
  onBrowse: (slug: string) => void
}) {
  const Visual = getHomepageCategoryIcon(category)

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-lagon bg-white/95 p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="mb-4 flex flex-col items-start gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
          <Visual className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Catégorie</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{category.name}</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(category.subcategories || []).map((sub) => {
          const SubVisual = getHomepageCategoryIcon(sub)
          return (
            <Link
              key={sub.id}
              href={`/annonces?category=${encodeURIComponent(sub.slug)}`}
              className="rounded-full border border-night/10 bg-sand px-3 py-1.5 text-xs font-medium text-night/70 transition-colors hover:border-nc-lagon/30 hover:bg-nc-lagonLight hover:text-nc-lagonText"
            >
              <SubVisual className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
              {sub.name}
            </Link>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onBrowse(category.slug)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-nc-lagon transition-transform group-hover:translate-x-0.5"
      >
        Voir tous les rayons
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function PopularCategoriesSection({
  categories,
  onBrowse,
}: {
  categories: CategoryNode[]
  onBrowse: (slug: string) => void
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="section-lagon">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Rayons populaires</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les catégories que les gens cherchent vraiment</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
          Voir toutes les annonces <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 rounded-[2rem] border border-night/8 border-l-4 border-l-nc-lagon bg-white/90 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        {categories.slice(0, 8).map((cat) => (
          <CategoryCard key={cat.id} category={cat} onBrowse={onBrowse} />
        ))}
      </div>
    </section>
  )
}

export function ExpandedCategoriesSection({
  categories,
  onBrowse,
}: {
  categories: CategoryNode[]
  onBrowse: (slug: string) => void
}) {
  return <CategoryTreeSection />
}

function buildCategorySearchHref(categorySlug: string, subcategorySlug?: string) {
  const params = new URLSearchParams()
  params.set('categorie', categorySlug)
  if (subcategorySlug) params.set('sous_categorie', subcategorySlug)
  return `/annonces?${params.toString()}`
}

function ExpandedCategorySubtree({
  rootSlug,
  categories,
  depth = 0,
}: {
  rootSlug: string
  categories: CategoryNode[]
  depth?: number
}) {
  if (!categories.length) return null

  return (
    <div className={depth === 0 ? 'mt-3 grid gap-x-3 gap-y-1 sm:grid-cols-2' : 'mt-2 space-y-1 border-l border-[var(--color-border)] pl-3'}>
      {categories.map((category) => {
        const children = getCategoryChildren(category)
        return (
          <div key={category.id} className="space-y-1">
            <Link
              href={buildCategorySearchHref(rootSlug, category.slug)}
              className={`block transition-colors hover:text-[#0A7EA4] ${
                depth === 0 ? 'text-sm font-medium text-night/70' : 'text-xs text-night/55'
              }`}
            >
              {category.name}
            </Link>
            {children.length > 0 ? (
              <ExpandedCategorySubtree rootSlug={rootSlug} categories={children} depth={depth + 1} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function ExpandedCategoriesGridSection({
  categories,
}: {
  categories: CategoryNode[]
}) {
  return <CategoryTreeSection />
}

type BonPlanItem = {
  id: number | string
  title: string
  description: string
  kind?: string
  target_audience?: string
  price_xpf?: number
  price_display?: string
  is_free_included?: boolean
  normal_price_xpf?: number | null
  promo_price_xpf?: number | null
  discount_pct?: number | null
  contact_name?: string | null
  location_name?: string | null
  commune_name?: string | null
  event_date?: string | null
  expires_at?: string | null
  author_prenom?: string | null
  author_nom?: string | null
  author_is_pro?: boolean | null
}

type CampaignItem = {
  id: number | string
  title: string
  description?: string | null
  image_url?: string | null
  link_url?: string | null
  cta_text?: string | null
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date libre'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date libre'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function BonPlanCard({ item }: { item: BonPlanItem }) {
  const audienceLabel = item.target_audience === 'pro' ? 'Professionnel' : 'Particulier'
  const kindLabel = {
    promo: 'Promo',
    event: 'Evenement',
    concert: 'Concert',
    other: 'Bon plan',
  }[item.kind || 'other']

  return (
    <article className="rounded-[1.5rem] border border-white/10 border-l-4 border-l-nc-corail bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-emeraude rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {kindLabel}
        </span>
        {item.is_free_included ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Offre Pro
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-night">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-night/60">{item.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">{audienceLabel}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.price_display || `${item.price_xpf ?? 0} XPF`}</span>
        {item.normal_price_xpf && item.promo_price_xpf ? (
          <span className="rounded-full bg-sand px-2.5 py-1">
            {item.normal_price_xpf.toLocaleString('fr-FR')} {'->'} {item.promo_price_xpf.toLocaleString('fr-FR')} XPF
          </span>
        ) : null}
        {item.discount_pct ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">-{item.discount_pct}%</span>
        ) : null}
      <span className="rounded-full bg-sand px-2.5 py-1">{item.commune_name || item.location_name || 'Nouvelle-Calédonie'}</span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-night/55">
        <p>{formatDateLabel(item.event_date)}</p>
        <p>{item.author_prenom ? `Publié par ${item.author_prenom}` : 'Publication locale'}</p>
        {item.contact_name ? <p>Contact: {item.contact_name}</p> : null}
      </div>
    </article>
  )
}

function CovoiturageCard({
  item,
}: {
  item: {
    id: number | string
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    price_xpf: number
    vehicle?: string | null
    seats_remaining?: number
    music_allowed?: boolean
    no_smoking?: boolean
    driver_prenom?: string | null
    driver_nom?: string | null
    trust_score?: number | null
  }
}) {
  const seatsRemaining = item.seats_remaining ?? 0
  const dateLabel = formatDateLabel(item.ride_date)
  const timeLabel = item.ride_time?.slice(0, 5) || 'Heure libre'

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-corail rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Covoiturage
        </span>
        {seatsRemaining <= 1 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Dernière place
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-night">
        {item.departure} - {item.destination}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-night/60">
        {dateLabel} à {timeLabel} · {item.vehicle || 'Véhicule détaillé'} · {item.price_xpf.toLocaleString('fr-FR')} XPF / place
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">{seatsRemaining} place(s) restante(s)</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.music_allowed ? 'Musique ok' : 'Musique calme'}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.no_smoking ? 'Non fumeur' : 'Fumeur accepte'}</span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-night/55">
        <p>{item.driver_prenom ? `Conducteur: ${item.driver_prenom}` : 'Conducteur local'}</p>
        <p>{item.trust_score != null ? `Fiabilité: ${item.trust_score}/100` : 'Trajet vérifié'}</p>
      </div>
    </article>
  )
}

function SponsoredCampaignCard({ item }: { item: CampaignItem }) {
  const href = item.link_url || '/annonces'

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 border-l-4 border-l-nc-sable bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-nc-lagon/20 to-nc-emeraude/20">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 90vw, 33vw"
          />
        ) : null}
        <div className="absolute left-3 top-3">
          <span className="badge badge-sable rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm">
            Sponsorisé
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-night">{item.title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-night/65">
          {item.description || 'Une visibilité locale payante, affichée au bon moment sur Kalico.'}
        </p>
        <a
          href={href}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-nc-sable px-4 py-3 text-sm font-semibold text-white transition hover:bg-nc-sable/90"
        >
          {item.cta_text || 'Découvrir'}
        </a>
      </div>
    </article>
  )
}

export function BonPlanSection({
  sponsoredItems,
  promoItems,
  eventItems,
  covoiturageItems,
  loading,
}: {
  sponsoredItems?: CampaignItem[]
  promoItems?: BonPlanItem[]
  eventItems?: BonPlanItem[]
  covoiturageItems?: Array<{
    id: number | string
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    price_xpf: number
    vehicle?: string | null
    seats_remaining?: number
    music_allowed?: boolean
    no_smoking?: boolean
    driver_prenom?: string | null
    driver_nom?: string | null
    trust_score?: number | null
  }>
  loading?: boolean
}) {
  const sponsoredHasItems = (sponsoredItems || []).length > 0
  const promoHasItems = (promoItems || []).length > 0
  const eventHasItems = (eventItems || []).length > 0
  const rideHasItems = (covoiturageItems || []).length > 0

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.12))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
        {sponsoredHasItems ? (
          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Sponsorisé</p>
                <h3 className="mt-1 text-2xl font-bold text-white">Les bons plans mis en avant</h3>
              </div>
              <Link href="/pro/dashboard/publicite" className="text-sm font-semibold text-nc-sable hover:underline">
                Gérer les campagnes
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {sponsoredItems!.map((item) => (
                <SponsoredCampaignCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="section-lagon">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">Bons plans & événements</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">
              Promotions, culture et mobilité locale
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Une seule vue claire pour les offres du moment, l’agenda culturel et les trajets à partager.
            </p>
          </div>
          <Link href="/bons-plans" className="hidden items-center gap-1 text-sm font-semibold text-white hover:underline md:inline-flex">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Promotions</p>
                <h4 className="mt-1 text-2xl font-bold text-white">Les offres qui marchent maintenant</h4>
              </div>
              <Link href="/annonces/nouvelle" className="text-sm font-semibold text-nc-emeraude hover:underline">
                Ajouter la vôtre
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/8" />
                ))}
              </div>
            ) : promoHasItems ? (
              <div className="grid gap-3 md:grid-cols-3">
                {promoItems!.map((item) => (
                  <BonPlanCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 text-white/80">
                <p className="text-lg font-semibold text-white">Aucune promotion en ligne pour le moment</p>
                <p className="mt-2 text-sm text-white/65">
                  Publiez une promo, un coupon ou une vente flash pour lancer la section.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Culture</p>
                <h4 className="mt-1 text-2xl font-bold text-white">Les rendez-vous à venir</h4>
              </div>
              <Link href="/bons-plans/publier" className="text-sm font-semibold text-nc-sable hover:underline">
                Créer un événement
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/8" />
                ))}
              </div>
            ) : eventHasItems ? (
              <div className="grid gap-3 md:grid-cols-3">
                {eventItems!.map((item) => (
                  <BonPlanCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 text-white/80">
                <p className="text-lg font-semibold text-white">Les rendez-vous à venir s&apos;afficheront ici</p>
                <p className="mt-2 text-sm text-white/65">
                  Ajoutez un concert, une conférence ou un marché pour alimenter la section culturelle.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 border-b-4 border-b-nc-corail bg-white/5 p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-corail">Mobilité</p>
              <h4 className="mt-1 text-2xl font-bold text-white">Covoiturage local et interurbain</h4>
            </div>
            <Link href="/covoiturage" className="text-sm font-semibold text-nc-corail hover:underline">
              Voir les trajets
            </Link>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
            Trouvez un trajet, proposez une place ou consultez les profils de confiance. Les trajets sont
            pensés pour la recherche rapide, les réservations simples et la sécurité des échanges.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/covoiturage" className="btn-primary rounded-2xl px-4 py-2.5">
              Explorer le covoiturage
            </Link>
            <Link href="/covoiturage?mode=publish" className="btn-secondary rounded-2xl px-4 py-2.5">
              Proposer un trajet
            </Link>
          </div>
          {loading ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/8" />
              ))}
            </div>
          ) : rideHasItems ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {covoiturageItems!.map((item) => (
                <CovoiturageCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/8 p-5 text-white/80">
              <p className="text-lg font-semibold text-white">La mobilité locale démarre ici</p>
              <p className="mt-2 text-sm text-white/65">
                Proposez un trajet pour lancer les premiers échanges et réservations.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
