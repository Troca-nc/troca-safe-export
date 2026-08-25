'use client'

import Link from 'next/link'
import Image from 'next/image'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, MapPin, Search } from 'lucide-react'

import PlatformStats from '@/components/PlatformStats'
import CategoryTreeSection from '@/components/home/CategoryTreeSection'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { getCategoryIcon } from '@/lib/categoryPresentation'

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

export function HomeHeroSection({ q, onQueryChange, onSubmit, listings }: HomeHeroSectionProps) {
  const cards = listings.slice(0, 2)
  useScrollReveal()

  return (
    <section
      className="relative overflow-hidden px-4 pb-10 pt-6 text-[#17313d] dark:text-white dark:!bg-[#0c2a35] bg-[var(--color-bg-page)]"
    >
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #123A44 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, #123A44 0 1px, transparent 1px 9px)',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-lagon)] m-0">
              Marketplace calédonienne · Bientôt ouvert
            </p>

            <h1 className="font-display font-normal text-[42px] sm:text-[56px] md:text-[68px] lg:text-[82px] leading-[0.97] tracking-[-0.015em] max-w-[860px] mt-[22px] mb-0">
              Ce que vous cherchez est déjà sur le territoire.
            </h1>
            <p className="mt-6 text-[19px] leading-[1.6] text-[var(--color-text-secondary)] max-w-[560px]">
              Annonces, services et pros locaux, de Nouméa aux Loyauté. On vend entre voisins, on se rencontre pour de vrai.
            </p>

            <form
              onSubmit={onSubmit}
              className="mt-6 flex w-full max-w-2xl items-center rounded-[14px] border border-[#123A44] bg-[var(--color-surface)] p-1.5 shadow-[0_6px_24px_rgba(18,58,68,0.09)]"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#71838d]" />
                <input
                  value={q}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Toyota, studio Nouméa, plombier, iPhone..."
                  aria-label="Rechercher une annonce"
                  className="w-full bg-transparent px-4 py-3 pl-11 text-sm text-[#17313d] placeholder:text-[#6d5d4b]/55 outline-none"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium text-[#17313d] sm:inline-flex"
              >
                <MapPin className="h-4 w-4 text-[#71838d]" />
                Toute la NC
              </button>
              <span className="hidden h-6 w-px shrink-0 bg-[var(--color-border)] sm:block" aria-hidden="true" />
              <button
                type="submit"
                className="btn-primary inline-flex shrink-0 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                Rechercher
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-[var(--color-text-muted)] mr-1">Recherché en ce moment</span>
              {['Véhicules', 'Immobilier', 'Emploi', 'Services', 'High-tech'].map((tag) => (
                <Link
                  key={tag}
                  href={`/annonces?q=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[14px] font-medium text-[var(--color-text-primary)] hover:border-[var(--color-lagon-dark)]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {cards.length > 0 ? (
              cards.map((listing) => <HeroListingCard key={String(listing.id)} listing={listing} />)
            ) : (
              <aside className="rounded-[24px] bg-[#0E2A31] relative overflow-hidden p-[34px_32px] text-[#FBF6EC]">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, #FBF6EC 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, #FBF6EC 0 1px, transparent 1px 9px)',
                  }}
                />
                <div className="relative">
                  <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-emeraude)]">
                    Rejoignez les premiers
                  </p>
                  <p className="mt-[18px] mb-0 font-display text-[38px] leading-[1.08]">
                    Kalico ouvre ses portes en Nouvelle-Calédonie.
                  </p>
                  <p className="mt-4 mb-0 text-[15px] leading-[1.6] text-[rgba(251,246,236,0.72)]">
                    Déposez votre première annonce gratuitement. Sans commission, sans engagement.
                  </p>
                  <Link
                    href="/annonces/nouvelle"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--coral)] text-[#0E2A31] px-5 py-[14px] text-[16px] font-semibold"
                  >
                    + Déposer une annonce
                  </Link>
                  <p className="mt-[14px] mb-0 text-[13px] text-[rgba(251,246,236,0.5)] text-center">
                    Gratuit, sans commission
                  </p>
                  <div className="mt-7 pt-[22px] border-t border-[rgba(251,246,236,0.16)] flex flex-col gap-[14px]">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-[30px] leading-none text-[#FBF6EC] min-w-[76px]">100%</span>
                      <span className="text-[14px] leading-[1.4] text-[rgba(251,246,236,0.66)]">
                        calédonien, de Nouméa aux Loyauté
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-[30px] leading-none text-[#FBF6EC] min-w-[76px]">0 XPF</span>
                      <span className="text-[14px] leading-[1.4] text-[rgba(251,246,236,0.66)]">
                        pour déposer une annonce particulier
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-[30px] leading-none text-[#FBF6EC] min-w-[76px]">∞</span>
                      <span className="text-[14px] leading-[1.4] text-[rgba(251,246,236,0.66)]">
                        annonces possibles sur tout le territoire
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const NEARBY_COMMUNES = [
  { name: 'Nouméa', count: '1 240' },
  { name: 'Dumbéa', count: '380' },
  { name: 'Mont-Dore', count: '295' },
  { name: 'Païta', count: '210' },
  { name: 'Bourail', count: '86' },
  { name: 'Koné', count: '74' },
  { name: 'Lifou', count: '52' },
  { name: 'Poindimié', count: '41' },
] as const

export function CommunesBarSection() {
  return (
    <section className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)] py-[22px] px-12">
      <div className="flex items-center gap-5">
        <p className="m-0 flex-shrink-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Près de chez vous
        </p>
        <div className="flex flex-wrap gap-2">
          {NEARBY_COMMUNES.map((c) => (
            <Link
              key={c.name}
              href={`/annonces?commune=${encodeURIComponent(c.name)}`}
              className="inline-flex items-baseline gap-[7px] rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-[15px] py-[7px] text-[14px] font-medium text-[var(--color-text-primary)] hover:border-[var(--color-lagon-dark)]"
            >
              {c.name}
              <span className="text-[12px] text-[var(--color-text-muted)]">{c.count}</span>
            </Link>
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
    <div className="group overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] border-l-4 border-l-nc-lagon bg-[var(--color-surface)] p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="mb-4 flex flex-col items-start gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
          <Visual className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Catégorie</p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">{category.name}</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(category.subcategories || []).map((sub) => {
          const SubVisual = getHomepageCategoryIcon(sub)
          return (
            <Link
              key={sub.id}
              href={`/annonces?category=${encodeURIComponent(sub.slug)}`}
              className="rounded-full border border-night/10 bg-[var(--color-bg-page)] px-3 py-1.5 text-xs font-medium text-night/70 transition-colors hover:border-nc-lagon/30 hover:bg-nc-lagonLight hover:text-nc-lagonText"
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

      <div className="grid gap-4 rounded-[2rem] border border-[var(--color-border)] border-l-4 border-l-nc-lagon bg-[var(--color-surface)] p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
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

export function RecentListingsSection() {
  return (
    <section className="px-12 pt-[72px]">
      <div className="flex items-end justify-between gap-8 mb-7">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-lagon)]">
            Les premières annonces
          </p>
          <h2 className="mt-3 mb-0 font-display font-normal text-[46px] leading-[1.05]">
            Déjà en ligne cette semaine
          </h2>
        </div>
        <Link
          href="/annonces"
          className="inline-flex items-center gap-[6px] text-[15px] font-semibold text-[var(--color-text-primary)] pb-[6px]"
        >
          Tout voir
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
        <p className="font-display text-[22px] font-normal text-[var(--color-text-primary)] mb-3">
          Soyez la première annonce de votre commune.
        </p>
        <p className="text-[15px] text-[var(--color-text-secondary)] mb-6 max-w-[480px] mx-auto">
          Kalico ouvre ses portes. Les premiers vendeurs seront mis en avant sur la page d'accueil.
        </p>
        <Link
          href="/annonces/nouvelle"
          className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--coral)] text-white px-6 py-3 text-[15px] font-semibold"
        >
          + Déposer une annonce
        </Link>
      </div>
    </section>
  )
}

const TRUST_ITEMS = [
  {
    title: 'Vérification en trois temps',
    body: "Email, téléphone, puis pièce professionnelle pour les pros. Le badge vérifié n'apparaît qu'au bout des trois.",
  },
  {
    title: 'Les avis restent lisibles',
    body: "Note moyenne et nombre d'avis sur la carte, détail sur le profil. Un vendeur avec 6 avis et un avec 48 ne s'affichent pas pareil.",
  },
  {
    title: 'La distance, pas juste la commune',
    body: "À 12 km de chez vous dit plus que Dumbéa. Sur un territoire où l'on fait 150 km pour un meuble, c'est l'information qui décide.",
  },
] as const

export function TrustSection() {
  return (
    <section className="px-12 pt-[72px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <h3 className="font-display font-normal text-[22px] leading-[1.2] text-[var(--color-text-primary)] mb-4">
              {item.title}
            </h3>
            <p className="text-[15px] leading-[1.6] text-[var(--color-text-secondary)] m-0">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const LOCAL_PROS = [
  {
    initials: 'PB',
    name: 'Plomberie Baie',
    trade: 'Plombier · Nouméa',
    blurb: 'Dépannage et installation sanitaire sur le Grand Nouméa, urgences le week-end.',
    rating: '4,9',
    reviews: '64',
  },
  {
    initials: 'ED',
    name: 'Élec Dumbéa',
    trade: 'Électricien · Dumbéa',
    blurb: 'Mise aux normes, tableaux, recherche de panne. Devis sous 48 h.',
    rating: '4,7',
    reviews: '38',
  },
  {
    initials: 'MC',
    name: 'Menuiserie Cocotier',
    trade: 'Menuisier · Païta',
    blurb: 'Terrasses, pergolas et mobilier sur mesure en bois local.',
    rating: '5,0',
    reviews: '21',
  },
  {
    initials: 'GT',
    name: 'Garage Tropic',
    trade: 'Garagiste · Mont-Dore',
    blurb: 'Entretien toutes marques, pneus, climatisation. Prêt de véhicule.',
    rating: '4,6',
    reviews: '91',
  },
] as const

export function LocalProsSection() {
  return (
    <section className="px-12 pt-[72px]">
      <div className="flex items-end justify-between gap-8 mb-7">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-lagon)]">
            Pros locaux
          </p>
          <h2 className="mt-3 mb-0 font-display font-normal text-[46px] leading-[1.05]">
            Des artisans du coin, vérifiés
          </h2>
        </div>
        <div className="flex items-center gap-4 pb-[6px]">
          <Link href="/pros" className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            L'annuaire
          </Link>
          <Link
            href="/pro"
            className="rounded-[10px] border border-[var(--color-border)] px-4 py-2 text-[15px] font-semibold text-[var(--color-text-primary)]"
          >
            Devenir Pro
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LOCAL_PROS.map((pro) => (
          <div key={pro.name} className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full bg-[rgba(85,173,179,0.16)] text-[15px] font-semibold text-[var(--color-lagon)]">
                {pro.initials}
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[15px] font-semibold text-[var(--color-text-primary)] truncate">{pro.name}</p>
                <p className="m-0 text-[13px] text-[var(--color-text-muted)]">{pro.trade}</p>
              </div>
            </div>
            <p className="text-[14px] leading-[1.5] text-[var(--color-text-secondary)] mb-4">{pro.blurb}</p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-muted)]">
                ★ {pro.rating} · {pro.reviews} avis
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(110,154,106,0.14)] border border-[rgba(110,154,106,0.3)] px-2 py-1 text-[11px] font-semibold text-[#3F6B3C]">
                ✓ Vérifié
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const HOME_ALERTS = [
  { term: 'Toyota Hilux', filters: 'Grand Nouméa · moins de 3 500 000 XPF', status: '2 nouvelles' },
  { term: 'Studio meublé', filters: 'Nouméa, Dumbéa · location', status: 'active' },
  { term: 'Planche de surf', filters: 'Toute la NC · bon état ou mieux', status: 'active' },
] as const

export function AlertsCtaSection() {
  return (
    <section className="px-12 pt-[72px] pb-[72px]">
      <div className="rounded-[24px] bg-[#0E2A31] p-12 flex flex-col md:flex-row gap-12 items-start">
        <div className="flex-1">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-emeraude)]">
            Alertes
          </p>
          <h2 className="mt-4 mb-0 font-display font-normal text-[42px] leading-[1.08] text-[#FBF6EC]">
            Dites-nous ce que vous cherchez, on vous prévient.
          </h2>
          <p className="mt-4 mb-0 text-[16px] leading-[1.6] text-[rgba(251,246,236,0.72)] max-w-[480px]">
            Un modèle précis, une commune, un budget maximum. L'alerte part dès qu'une annonce correspond.
          </p>
          <Link
            href="/alertes"
            className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-[var(--coral)] text-white px-6 py-3 text-[15px] font-semibold"
          >
            Créer une alerte
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {HOME_ALERTS.map((alert) => (
            <div key={alert.term} className="rounded-[14px] bg-[rgba(251,246,236,0.07)] border border-[rgba(251,246,236,0.12)] p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="m-0 text-[16px] font-semibold text-[#FBF6EC]">{alert.term}</p>
                <span
                  className={`text-[12px] font-semibold px-2 py-1 rounded-full ${
                    alert.status === '2 nouvelles'
                      ? 'bg-[var(--coral)] text-white'
                      : 'bg-[rgba(251,246,236,0.12)] text-[rgba(251,246,236,0.6)]'
                  }`}
                >
                  {alert.status}
                </span>
              </div>
              <p className="m-0 text-[13px] text-[rgba(251,246,236,0.55)]">{alert.filters}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
