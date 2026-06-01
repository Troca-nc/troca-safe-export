'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, Search, Sparkles } from 'lucide-react'

import PlatformStats from '@/components/PlatformStats'
import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { SEARCH_ALERTS, getCategoryIcon } from '@/lib/categoryPresentation'

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return '...'
  return new Intl.NumberFormat('fr-FR').format(value)
}

function getCategoryChildren(category: CategoryNode) {
  return category.children || category.subcategories || []
}

type HomeHeroSectionProps = {
  q: string
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function HomeHeroSection({
  q,
  onQueryChange,
  onSubmit,
}: HomeHeroSectionProps) {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            🇳🇨 Nouvelle-Calédonie
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            Achetez, vendez, troquez en NC
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
            La première plateforme d&apos;annonces 100% calédonienne.
          </p>

          <form onSubmit={onSubmit} className="mt-5 flex w-full max-w-[460px] gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={q}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Que recherchez-vous ?"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 pl-11 text-sm text-white placeholder:text-white/50 shadow-sm outline-none ring-0 backdrop-blur-sm transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-nc-lagon shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15"
            >
              Rechercher
            </button>
          </form>

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
          <ListingSkeletonGrid count={8} className="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" />
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center text-night/45">
            <p className="text-sm font-semibold text-night">Soyez parmi les premiers !</p>
            <p className="mt-2 text-sm text-night/65">
              Aucune annonce pour l&apos;instant — publiez la vôtre et lancez la communauté.
            </p>
            <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-block">
              Publier une annonce
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
        <div>
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
          <div className="mt-5 flex flex-wrap gap-2">
            {SEARCH_ALERTS.map((term) => (
              <span
                key={term}
                className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/85"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5">
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
          <Link href="/annonces" className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2">
            Créer une alerte
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
  const Visual = getCategoryIcon(category.slug, category.name, category.icon)
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-nc-lagonText">
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
            const ChildVisual = getCategoryIcon(child.slug, child.name, child.icon)

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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-nc-lagonText">
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
                      const GrandVisual = getCategoryIcon(grandChild.slug, grandChild.name, grandChild.icon)
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
  const Visual = getCategoryIcon(category.slug, category.name, category.icon)

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-lagon bg-white/95 p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="mb-4 flex flex-col items-start gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nc-lagonLight text-nc-lagonText">
          <Visual className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Catégorie</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{category.name}</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(category.subcategories || []).map((sub) => {
          const SubVisual = getCategoryIcon(sub.slug, sub.name, sub.icon)
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
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="section-lagon">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Tous les rayons</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">L&apos;arbre complet des catégories, entièrement déplié</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
          Voir toutes les annonces <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] border-t-4 border-t-nc-lagon bg-[var(--color-surface)] p-4 shadow-sm"
          >
            <button
              type="button"
              onClick={() => onBrowse(category.slug)}
              className="mb-3 flex w-full items-center gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-lagonLight text-nc-lagonText">
                  {(() => {
                    const Visual = getCategoryIcon(category.slug, category.name, category.icon)
                    return <Visual className="h-7 w-7" />
                  })()}
                </span>
                <span className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Catégorie</p>
                  <h3 className="mt-1 truncate font-display text-xl font-bold text-[var(--color-text-primary)]">{category.name}</h3>
                </span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-nc-lagon" />
            </button>

            <div className="space-y-2">
              {(category.children || category.subcategories || []).map((child) => (
                <CategoryTreeRow key={child.id} category={child} depth={1} onBrowse={onBrowse} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
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

export function BonPlanSection({
  promoItems,
  eventItems,
  covoiturageItems,
  loading,
}: {
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
  const promoHasItems = (promoItems || []).length > 0
  const eventHasItems = (eventItems || []).length > 0
  const rideHasItems = (covoiturageItems || []).length > 0

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.12))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
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
              <Link href="/annonces/nouvelle" className="text-sm font-semibold text-nc-sable hover:underline">
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
