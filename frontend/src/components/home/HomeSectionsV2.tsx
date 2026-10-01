'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
  Star,
} from 'lucide-react'

import ListingCard, { ListingGridSkeleton } from '@/components/listings/ListingCard'
import HomePlatformStats from '@/components/home/HomePlatformStats'
import { DeepPanel } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/Skeleton'
import type { HomeCategory, HomeCommune, HomeListing, HomePro } from '@/types/home'

function SectionHeading({
  eyebrow,
  title,
  titleId,
  action,
}: {
  eyebrow: string
  title: string
  titleId: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6">
      <div>
        <p className="m-0 text-eyebrow uppercase text-accent-text">{eyebrow}</p>
        <h2 id={titleId} className="mb-0 mt-3 font-display text-h2 font-normal text-ink">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

export function HomeHeroSection({
  q,
  onQueryChange,
  onSubmit,
  quickCategories,
}: {
  q: string
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  quickCategories: HomeCategory[]
}) {
  return (
    <section className="motif-tressage border-b border-warm-border bg-cream px-4 py-12 text-ink sm:px-6 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-container items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-[72px]">
        <div className="min-w-0 py-2 lg:py-3">
          <p className="m-0 text-eyebrow uppercase text-accent-text">Marketplace calédonienne</p>
          <h1 className="mb-0 mt-5 max-w-title text-balance font-display text-[42px] font-normal leading-[0.98] tracking-[-0.015em] sm:text-[58px] lg:text-display-xl">
            Ce que vous cherchez est déjà sur le territoire.
          </h1>
          <p className="mb-0 mt-6 max-w-[560px] text-body-lg text-ink/75">
            Annonces, services et pros locaux, de Nouméa aux Loyauté. On vend entre voisins, on se rencontre pour de vrai.
          </p>

          <form onSubmit={onSubmit} className="mt-9 max-w-[800px]" role="search">
            <div className="flex items-center rounded-card border border-ink bg-cream-surface p-1.5 shadow-raised">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Rechercher une annonce</span>
                <Search className="absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-ink/45" aria-hidden="true" />
                <input
                  value={q}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Que recherchez-vous ?"
                  className="h-[52px] w-full bg-transparent pl-12 pr-3 text-base text-ink outline-none placeholder:text-ink/40"
                  autoComplete="off"
                />
              </label>
              <span className="hidden h-8 w-px shrink-0 bg-warm-border sm:block" aria-hidden="true" />
              <button type="button" className="hidden min-h-[52px] shrink-0 items-center gap-2 px-4 text-base font-medium text-ink sm:inline-flex">
                <MapPin className="h-[17px] w-[17px] text-info" aria-hidden="true" />
                Toute la NC
              </button>
              <button type="submit" className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-control bg-accent-strong px-5 text-label text-cream transition-colors hover:bg-accent-strongHover sm:px-7">
                Rechercher
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-ink/55">Explorer rapidement</span>
            {quickCategories.slice(0, 5).map((category) => (
              <Link
                key={category.slug}
                href={`/annonces?categorie=${encodeURIComponent(category.slug)}`}
                className="inline-flex min-h-11 items-center rounded-pill border border-warm-border bg-cream-surface px-4 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <DeepPanel className="p-7 sm:p-8">
          <p className="m-0 text-eyebrow uppercase text-accent">Kalico, partout en Nouvelle-Calédonie</p>
          <h2 className="mb-0 mt-4 font-display text-[38px] font-normal leading-[1.08] text-cream">
            Achetez et vendez entre voisins.
          </h2>
          <p className="mb-0 mt-4 text-body-sm text-cream/70">
            Publiez gratuitement, trouvez près de chez vous et échangez directement avec la communauté locale.
          </p>
          <Link
            href="/annonces/nouvelle"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 text-label text-ink-deep transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep"
          >
            Déposer une annonce
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mb-0 mt-3 text-center text-meta text-cream/55">Gratuit, sans commission</p>
          <div className="mt-7">
            <HomePlatformStats />
          </div>
        </DeepPanel>
      </div>
    </section>
  )
}

export function CommunesBarSection({ communes }: { communes: HomeCommune[] }) {
  return (
    <section className="border-b border-warm-border bg-cream-sunken px-4 py-[22px] sm:px-6 lg:px-12" aria-label="Communes populaires">
      <div className="mx-auto flex max-w-container items-center gap-5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
        <p className="m-0 shrink-0 text-eyebrow uppercase text-ink/55">Près de chez vous</p>
        <div className="flex shrink-0 gap-2 lg:flex-wrap">
          {communes.map((commune) => (
            <Link
              key={commune.slug}
              href={`/annonces?commune=${encodeURIComponent(commune.slug)}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-pill border border-warm-border bg-cream-surface px-4 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2"
            >
              {commune.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RecentListingsSection({
  listings,
  loading,
  error,
  onRetry,
}: {
  listings: HomeListing[]
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  return (
    <section className="mx-auto max-w-container px-4 pt-[72px] sm:px-6 lg:px-12" aria-labelledby="home-listings-title">
      <SectionHeading
        eyebrow="Annonces récentes"
        title="Dernières annonces"
        titleId="home-listings-title"
        action={(
          <Link href="/annonces" className="inline-flex min-h-11 items-center gap-2 text-label text-ink">
            Tout voir <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      />

      {loading ? <ListingGridSkeleton count={8} /> : null}
      {!loading && error ? <ErrorState message="Impossible de charger les annonces." onRetry={onRetry} /> : null}
      {!loading && !error && listings.length === 0 ? (
        <div className="rounded-card border border-dashed border-warm-border bg-cream-surface px-6 py-14 text-center text-body text-ink/65">
          Aucune annonce pour l&apos;instant
        </div>
      ) : null}
      {!loading && !error && listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      ) : null}
    </section>
  )
}

const TRUST_ITEMS = [
  {
    title: 'Profils vérifiés',
    body: 'Les informations essentielles de confiance restent visibles au moment de choisir un vendeur ou un professionnel.',
  },
  {
    title: 'Avis lisibles',
    body: 'La note et le nombre d’avis sont présentés ensemble pour donner un contexte clair à chaque réputation.',
  },
  {
    title: 'Proximité utile',
    body: 'La commune et la distance aident à décider rapidement, sur un territoire où chaque trajet compte.',
  },
] as const

export function TrustSection() {
  return (
    <section className="mx-auto max-w-container px-4 pt-[72px] sm:px-6 lg:px-12" aria-labelledby="home-trust-title">
      <DeepPanel className="px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
        <p className="m-0 text-eyebrow uppercase text-accent">Confiance</p>
        <h2 id="home-trust-title" className="mb-0 mt-4 max-w-[760px] font-display text-[40px] font-normal leading-[1.06] text-cream sm:text-h2">
          La confiance se construit avec des informations claires.
        </h2>
        <div className="mt-10 grid gap-7 md:grid-cols-3 md:gap-5">
          {TRUST_ITEMS.map((item) => (
            <article key={item.title} className="border-t-2 border-accent/60 pt-5">
              <h3 className="m-0 text-h5 text-cream">{item.title}</h3>
              <p className="mb-0 mt-3 text-body-sm text-cream/70">{item.body}</p>
            </article>
          ))}
        </div>
      </DeepPanel>
    </section>
  )
}

function ProSkeleton() {
  return (
    <div className="rounded-card border border-warm-border bg-cream-surface p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-control" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-5 h-16" />
      <Skeleton className="mt-5 h-5 w-2/3" />
    </div>
  )
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('fr-FR') || 'K'
}

export function LocalProsSection({
  pros,
  loading,
  error,
  onRetry,
}: {
  pros: HomePro[]
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  return (
    <section className="mx-auto max-w-container px-4 pt-[72px] sm:px-6 lg:px-12" aria-labelledby="home-pros-title">
      <SectionHeading
        eyebrow="Pros locaux"
        title="Des artisans du coin, vérifiés"
        titleId="home-pros-title"
        action={(
          <div className="flex items-center gap-4">
            <Link href="/pros" className="inline-flex min-h-11 items-center text-label text-ink">L&apos;annuaire</Link>
            <Link href="/pro" className="hidden min-h-11 items-center rounded-control border border-warm-border px-4 text-label text-ink sm:inline-flex">Devenir Pro</Link>
          </div>
        )}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <ProSkeleton key={index} />)}
        </div>
      ) : null}
      {!loading && error ? <ErrorState message="Impossible de charger les professionnels." onRetry={onRetry} /> : null}
      {!loading && !error && pros.length === 0 ? (
        <div className="rounded-card border border-dashed border-warm-border bg-cream-surface px-6 py-14 text-center text-body text-ink/65">
          Aucun professionnel mis en avant pour l&apos;instant
        </div>
      ) : null}
      {!loading && !error && pros.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pros.map((pro) => (
            <Link
              key={pro.id}
              href={`/pro/${pro.id}`}
              className="flex min-h-full flex-col rounded-card border border-warm-border bg-cream-surface p-6 text-ink shadow-card transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-cream-sunken font-display text-xl text-ink">
                  {getInitials(pro.displayName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-label">{pro.displayName}</span>
                  <span className="mt-1 block text-meta text-ink/55">
                    {[pro.category, pro.commune].filter(Boolean).join(' · ') || 'Professionnel local'}
                  </span>
                </span>
              </div>
              <p className="mb-0 mt-4 line-clamp-3 text-body-sm text-ink/70">
                {pro.description || 'Découvrez les services et les annonces de ce professionnel local.'}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-caption text-ink/60">
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4 text-reef-text" aria-hidden="true" /> Vérifié
                </span>
                {pro.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 text-accent-text" aria-hidden="true" />
                    {pro.rating.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} · {pro.reviewCount} avis
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}

const ALERT_STEPS = [
  { icon: Search, label: 'Décrivez votre recherche' },
  { icon: Sparkles, label: 'Une annonce correspond' },
  { icon: BellRing, label: 'Vous êtes prévenu' },
] as const

export function AlertsCtaSection() {
  return (
    <section className="mx-auto max-w-container px-4 py-[72px] sm:px-6 lg:px-12" aria-labelledby="home-alerts-title">
      <div className="grid items-center gap-10 rounded-block border border-warm-border bg-cream-surface p-7 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-12">
        <div>
          <p className="m-0 text-eyebrow uppercase text-accent-text">Alertes</p>
          <h2 id="home-alerts-title" className="mb-0 mt-4 max-w-[560px] font-display text-[40px] font-normal leading-[1.08] text-ink sm:text-[42px]">
            Dites-nous ce que vous cherchez, on vous prévient.
          </h2>
          <p className="mb-0 mt-4 max-w-[560px] text-body text-ink/70">
            Enregistrez vos critères une fois. Kalico vous avertit lorsqu’une nouvelle annonce correspond.
          </p>
          <Link href="/alertes" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-control border border-ink px-5 text-label text-ink transition-colors hover:bg-cream-sunken">
            Créer une alerte <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ol className="flex flex-col gap-3">
          {ALERT_STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.label} className="flex min-h-16 items-center gap-4 rounded-card bg-cream-sunken px-5 py-4 text-ink">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/15 text-info-text">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex-1 text-label">{step.label}</span>
                <span className="inline-flex items-center gap-1 text-caption text-ink/45">
                  {index + 1}/3
                  {index === ALERT_STEPS.length - 1 ? <CheckCircle2 className="h-4 w-4 text-reef-text" aria-hidden="true" /> : null}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
