'use client'

import Link from 'next/link'
import Image from 'next/image'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, CheckCircle2, MapPin, Search, Sparkles, ShieldCheck } from 'lucide-react'

import PlatformStats from '@/components/PlatformStats'
import CategoryTreeSection from '@/components/home/CategoryTreeSection'
import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { SEARCH_ALERTS, getCategoryIcon } from '@/lib/categoryPresentation'

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
  listings: HomeListing[]
}

type HomeListing = {
  id: string | number
  title?: string | null
  price?: string | number | null
  price_xpf?: string | number | null
  price_display?: string | null
  commune_name?: string | null
  commune?: string | null
  image_url?: string | null
  cover_image?: string | null
  images?: Array<string | { url?: string | null; image_url?: string | null; src?: string | null }>
  category_slug?: string | null
  category_name?: string | null
  category?: string | null
}

const HERO_CATEGORY_PILLS = [
  { slug: 'vehicules', label: 'Véhicules' },
  { slug: 'immobilier', label: 'Immobilier' },
  { slug: 'services', label: 'Services' },
  { slug: 'electronique-multimedia', label: 'High-tech' },
  { slug: 'maison-jardin', label: 'Jardin' },
] as const


const HERO_FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Publication gratuite',
    subtitle: 'Pour les particuliers',
  },
  {
    icon: MapPin,
    title: 'Toute la NC couverte',
    subtitle: 'Communes, tribus, îles',
  },
  {
    icon: ShieldCheck,
    title: 'Pros vérifiés',
    subtitle: 'Artisans et services de confiance',
  },
] as const

function normalizeHeroPrice(listing: HomeListing) {
  const value = listing.price_display ?? listing.price_xpf ?? listing.price
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${new Intl.NumberFormat('fr-FR').format(value)} F`
  }
  return 'Prix sur demande'
}

function getHeroListingCommune(listing: HomeListing) {
  return String(listing.commune_name ?? listing.commune ?? '').trim() || 'Nouvelle-Calédonie'
}

function getHeroListingImage(listing: HomeListing) {
  const direct = String(listing.image_url ?? listing.cover_image ?? '').trim()
  if (direct) return direct
  const firstImage = listing.images?.[0]
  if (typeof firstImage === 'string' && firstImage.trim()) return firstImage.trim()
  if (firstImage && typeof firstImage === 'object') {
    const objectImage = String(firstImage.url ?? firstImage.image_url ?? firstImage.src ?? '').trim()
    if (objectImage) return objectImage
  }
  return null
}

function getHeroListingHref(listing: HomeListing) {
  return `/annonces/${listing.id}`
}

function HeroListingCard({ listing }: { listing: HomeListing }) {
  const image = getHeroListingImage(listing)
  const categoryLabel = listing.category_name || listing.category || 'Annonce'
  const categoryInitial = categoryLabel.trim().charAt(0).toUpperCase() || 'A'
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [listing.id])

  return (
    <Link
      href={getHeroListingHref(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e7dbcd] bg-white shadow-[0_20px_60px_rgba(3,31,45,0.12)] transition duration-300 hover:-translate-y-1 hover:border-[#d4c4b0] hover:shadow-[0_24px_64px_rgba(3,31,45,0.14)] dark:border-white/10 dark:bg-white/8 dark:hover:border-white/20 dark:hover:bg-white/12"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f1e7da] dark:bg-[linear-gradient(160deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.03))]">
        {image && !errored ? (
          <>
            <div
              className={`absolute inset-0 flex items-center justify-center bg-[#1d9e75] text-5xl font-bold text-white transition-opacity duration-300 ${
                loaded ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {categoryInitial}
            </div>
            <Image
              src={image}
              alt={listing.title || 'Annonce Kalico'}
              fill
              sizes="(max-width: 768px) 50vw, 320px"
              className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setLoaded(true)}
              onError={() => setErrored(true)}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-[#1d9e75] text-white">
            <span className="text-5xl font-bold leading-none">{categoryInitial}</span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">{categoryLabel}</span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-[rgba(6,36,52,0.75)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 text-[#17313d] dark:text-white">
        <div className="space-y-1">
          <p className="line-clamp-2 font-display text-xl font-bold leading-tight">{listing.title || 'Annonce locale'}</p>
          <p className="text-lg font-semibold text-[#1d9e75] dark:text-[#8ce3d2]">{normalizeHeroPrice(listing)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 text-sm text-[#39505b] dark:text-white/75">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-[#1d9e75] dark:text-[#8ce3d2]" />
            {getHeroListingCommune(listing)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6d5d4b] dark:text-white/55">
            Voir
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function HeroFeature({ icon: Icon, title, subtitle }: (typeof HERO_FEATURES)[number]) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-secondary)] text-nc-emeraude">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
        <span className="block text-xs text-[var(--color-text-secondary)]">{subtitle}</span>
      </span>
    </div>
  )
}

export function HomeHeroSection({ q, onQueryChange, onSubmit, listings }: HomeHeroSectionProps) {
  const cards = listings.slice(0, 2)
  useScrollReveal()

  return (
    <section
      className="relative overflow-hidden px-4 pb-10 pt-6 text-[#17313d] dark:text-white dark:!bg-[#0c2a35]"
      style={{ background: '#fdf8f1' }}
    >
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,_rgba(23,49,61,0.22)_1px,_transparent_0)] [background-size:28px_28px] dark:[background-image:radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.75)_1px,_transparent_0)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 rounded-[2rem] border border-[#e7dbcd] bg-white/75 p-5 shadow-[0_30px_90px_rgba(3,31,45,0.08)] backdrop-blur-md md:grid-cols-[1.05fr_0.95fr] md:p-8 dark:border-white/10 dark:bg-[rgba(7,28,41,0.16)]">
          <div className="flex min-w-0 flex-col justify-center">
            <span className="inline-flex w-fit items-center rounded-full border border-[#d8c8b5] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1d6d89] dark:border-white/15 dark:bg-white/10 dark:text-white/75">
              100 % Nouvelle-Calédonie
            </span>

            <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-[#17313d] md:text-6xl dark:text-white">
              Les premières annonces arrivent. La vôtre aussi ?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#39505b] md:text-lg dark:text-white/80">Annonces, services et pros locaux partout en Nouvelle-Calédonie. De Nouméa aux Loyauté, de Koné à l&apos;île des Pins.</p>

            <form onSubmit={onSubmit} className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#71838d] dark:text-white/45" />
                <input
                  value={q}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Toyota, studio Nouméa, plombier, iPhone..."
                  aria-label="Rechercher une annonce"
                  className="w-full rounded-2xl border border-[#d8c8b5] bg-white px-4 py-3 pl-11 text-sm text-[#17313d] placeholder:text-[#6d5d4b]/55 outline-none ring-0 backdrop-blur-sm transition focus:border-[#1d9e75]/40 focus:bg-white focus:ring-4 focus:ring-[#1d9e75]/10 dark:border-white/12 dark:bg-white/10 dark:text-white dark:placeholder:text-white/55 dark:focus:border-white/30 dark:focus:bg-white/12 dark:focus:ring-white/10"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="btn-primary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                Rechercher
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {HERO_CATEGORY_PILLS.map((pill) => (
                <Link
                  key={pill.slug}
                  href={`/annonces?categorie=${encodeURIComponent(pill.slug)}`}
                  className="inline-flex items-center rounded-full border border-[#d8c8b5] bg-white px-3.5 py-2 text-sm font-medium text-[#17313d] transition hover:-translate-y-0.5 hover:border-[#1d9e75]/30 hover:bg-[#f8f2ea] dark:border-white/12 dark:bg-white/8 dark:text-white/90 dark:hover:border-white/20 dark:hover:bg-white/12"
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {cards.length > 0 ? (
              cards.map((listing) => <HeroListingCard key={String(listing.id)} listing={listing} />)
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-[1.75rem] border border-dashed border-[#d8c8b5] bg-white/55 px-6 py-10 text-center text-sm text-[#39505b] dark:border-white/10 dark:bg-white/5 dark:text-white/65">
                <div className="flex flex-col items-center justify-center gap-6 text-center p-8 h-full">
                  <div className="text-5xl">🌺</div>
                  <p className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    Soyez parmi les premiers.
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Kalico ouvre ses portes en Nouvelle-Calédonie.
                    Déposez votre première annonce gratuitement.
                  </p>
                  <a href="/annonces/nouvelle" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
                    Déposer une annonce
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-white/12 pt-5 md:grid-cols-3 md:gap-0">
          {HERO_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`md:px-5 ${index > 0 ? 'md:border-l md:border-white/12' : ''}`}
            >
              <HeroFeature {...feature} />
            </div>
          ))}
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
      <p className="text-4xl font-bold text-kalico-blue md:text-[2.5rem]">{formatted}</p>
      <p className="mt-2 text-sm font-medium text-night/65">{label}</p>
    </div>
  )
}

export function HomeStatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
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
    return (
    <section id="featured-listings" className="bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-10" data-reveal="true">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="section-lagon">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Annonces en vedette</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les catégories que les gens cherchent vraiment</h2>
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
            <p className="mt-2 text-sm text-night/65">Boostez votre annonce pour apparaître en tête de page.</p>
            <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-block">
              Déposer la première annonce
            </Link>
          </div>
        )}
      </div>
      </div>
    </section>
  )
}

export function SearchAlertsSection() {
  return (
    <section className="bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-5 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-[var(--color-text-primary)] shadow-[0_24px_80px_rgba(8,32,50,0.08)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center" data-reveal="true">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-lagon">
            <Sparkles className="h-3.5 w-3.5" />
            Coups de cœur
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Gardez vos recherches en mémoire et recevez une alerte quand une offre correspond.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
            Les utilisateurs peuvent enregistrer des mots-clés pour suivre ce qui compte vraiment: un modèle précis, une commune, une gamme de prix ou une catégorie.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 pb-1 sm:flex-nowrap sm:overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SEARCH_ALERTS.map((term) => (
              <span
                key={term}
                className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)]"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Exemple d&apos;alerte</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold">"Toyota Hilux"</p>
              <p className="mt-1 text-sm text-white/65">Nouméa, prix max 3 500 000 XPF</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold">"Studio"</p>
              <p className="mt-1 text-sm text-white/65">Dumbéa / Nouméa, location ou vente</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface)] p-4">
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
        className="btn-primary mt-5"
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
    <section className="mx-auto max-w-7xl px-4 py-10" data-reveal="true">
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
    event: 'Événement',
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
        {dateLabel} · {timeLabel} · {item.vehicle || 'Véhicule détaillé'} · {item.price_xpf.toLocaleString('fr-FR')} XPF / place
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">{seatsRemaining} place(s) restante(s)</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.music_allowed ? 'Musique ok' : 'Musique calme'}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.no_smoking ? 'Non fumeur' : 'Fumeur accepté'}</span>
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
          className="btn-primary w-full"
        >
          {item.cta_text || 'Découvrir'}
        </a>
      </div>
    </article>
  )
}

export function BonPlanSection({
  sponsoredItems,
  loading,
}: {
  sponsoredItems?: CampaignItem[]
  loading?: boolean
}) {
  const sponsoredHasItems = (sponsoredItems || []).length > 0

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text-primary)] shadow-[0_24px_80px_rgba(8,32,50,0.08)]">
        {sponsoredHasItems ? (
          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Sponsorisé</p>
                <h3 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">Les bons plans mis en avant</h3>
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
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Bons plans & Événements</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
              Promotions, culture et mobilité locale
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
              Une seule vue claire pour les offres du moment, l'agenda culturel et les trajets à partager.
            </p>
          </div>
          <Link href="/bons-plans" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function CovoiturageSection({
  covoiturageItems,
  loading,
}: {
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
  const rideHasItems = (covoiturageItems || []).length > 0

  return (
    <section className="bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
        <div className="rounded-[1.5rem] border border-[var(--color-border)] border-b-4 border-b-nc-corail bg-[var(--color-surface)] p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-corail">Mobilité</p>
              <h4 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">Covoiturage local et interurbain</h4>
            </div>
            <Link href="/covoiturage" className="text-sm font-semibold text-nc-corail hover:underline">
              Voir les trajets
            </Link>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
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
                <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]" />
              ))}
            </div>
          ) : rideHasItems ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {covoiturageItems!.map((item) => (
                <CovoiturageCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-5 py-8 text-center text-[var(--color-text-primary)]">
              <div className="mx-auto flex max-w-md flex-col items-center">
                <span className="mb-3 text-2xl animate-pulse motion-reduce:animate-none" aria-hidden="true">
                    🚗
                  </span>
                <p className="font-display text-lg font-medium text-night dark:text-white">
                  Le premier trajet, c&apos;est souvent le plus utile.
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Proposez un trajet, trouvez des passagers.
                </p>
                <Link href="/covoiturage/nouveau" className="btn-primary mt-4 inline-flex items-center justify-center">
                  Proposer un trajet
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
