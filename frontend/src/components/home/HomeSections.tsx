'use client'

import Link from 'next/link'
import { type FormEvent } from 'react'
import { ArrowRight, Search, Sparkles } from 'lucide-react'

import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { FEATURED_SEARCHES, SEARCH_ALERTS, getCategoryIcon } from '@/lib/categoryPresentation'

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return '...'
  return new Intl.NumberFormat('fr-FR').format(value)
}

type HomeHeroSectionProps = {
  q: string
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBrowse: (slug: string) => void
  activeCount: number | null
  bonPlansCount: number | null
  rideCount?: number | null
  statsLoading: boolean
}

export function HomeHeroSection({
  q,
  onQueryChange,
  onSubmit,
  onBrowse,
  activeCount,
  bonPlansCount,
  rideCount,
  statsLoading,
}: HomeHeroSectionProps) {
  return (
    <section className="bg-night px-4 py-8 text-white md:py-12">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(72,202,228,0.26),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(10,126,164,0.24),_transparent_30%),linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(8,32,50,0.92))] px-6 py-7 shadow-[0_24px_80px_rgba(8,32,50,0.26)] md:px-10 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lagoon">
            <Sparkles className="h-3.5 w-3.5" />
            Petites annonces Nouvelle-Caledonie
          </div>

          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Achetez mieux.
            <br />
            Vendez plus vite.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            La place de marche locale pour trouver les bonnes affaires pres de chez vous, publier en quelques minutes
            et vendre en confiance.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" />
              <input
                value={q}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Rechercher un telephone, une voiture, un appartement..."
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 pl-11 text-sm text-night shadow-lg outline-none ring-0 transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              />
            </div>
            <button type="submit" className="btn-primary rounded-2xl px-5 py-3">
              Chercher
            </button>
          </form>

          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {FEATURED_SEARCHES.map((item) => {
              const Visual = getCategoryIcon(item.slug)
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onBrowse(item.slug)}
                  className="flex min-w-[88px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/95 px-3 py-3 text-center text-night shadow-sm transition hover:-translate-y-0.5 hover:border-night/15 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand text-night">
                    <Visual className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-night/70">{item.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3.5">
              <p className="text-2xl font-bold text-white">{statsLoading ? '...' : formatNumber(activeCount)}</p>
              <p className="mt-1 text-sm text-white/65">annonces en ligne</p>
              <p className="mt-2 text-[11px] text-white/35">mis a jour toutes les heures</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3.5">
              <p className="text-2xl font-bold text-white">{statsLoading ? '...' : formatNumber(bonPlansCount)}</p>
              <p className="mt-1 text-sm text-white/65">bons plans actifs</p>
              <p className="mt-2 text-[11px] text-white/35">mis a jour toutes les heures</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3.5">
              <p className="text-2xl font-bold text-white">{statsLoading ? '...' : formatNumber(rideCount ?? 0)}</p>
              <p className="mt-1 text-sm text-white/65">covoiturages actifs</p>
              <p className="mt-2 text-[11px] text-white/35">trajets, reseau local, places partagees</p>
            </div>
          </div>
        </div>
      </div>
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
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Annonces en vedette</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les annonces les plus visibles en ce moment</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex">
          Tout voir <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <ListingSkeletonGrid count={8} className="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" />
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-night/8 bg-white/90 py-14 text-center text-night/45">
          <p className="text-sm">Pas encore d&apos;annonce en vedette.</p>
          <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-block">
            Etre le premier a publier
          </Link>
        </div>
      )}
    </section>
  )
}

export function SearchAlertsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lagoon">
            <Sparkles className="h-3.5 w-3.5" />
            Coups de coeur
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Gardez vos recherches en memoire et recevez une alerte quand une offre correspond.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Les utilisateurs peuvent enregistrer des mots-cles pour suivre ce qui compte vraiment: un modele precis, une commune, une gamme de prix ou une categorie.
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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lagoon">Exemple d&apos;alerte</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"Toyota Hilux"</p>
              <p className="mt-1 text-sm text-white/65">Noumea, prix max 3 500 000 XPF</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"Studio"</p>
              <p className="mt-1 text-sm text-white/65">Dumbea / Noumea, location ou vente</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"iPhone"</p>
              <p className="mt-1 text-sm text-white/65">Etat bon ou comme neuf, en Nouvelle-Caledonie</p>
            </div>
          </div>
          <Link href="/annonces" className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2">
            Creer une alerte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryCard({
  category,
  onBrowse,
}: {
  category: CategoryNode
  onBrowse: (slug: string) => void
}) {
  const Visual = getCategoryIcon(category.slug)

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-night/8 bg-white/95 p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Categorie</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{category.name}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-night/5 text-night">
          <Visual className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(category.subcategories || []).slice(0, 4).map((sub) => (
          <Link
            key={sub.id}
            href={`/annonces?category=${encodeURIComponent(sub.slug)}`}
            className="rounded-full border border-night/10 bg-sand px-3 py-1.5 text-xs font-medium text-night/70 transition-colors hover:border-coral/30 hover:bg-coral/5 hover:text-coral"
          >
            {sub.name}
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onBrowse(category.slug)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-coral transition-transform group-hover:translate-x-0.5"
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
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Rayons populaires</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les categories que les gens cherchent vraiment</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex">
          Voir toutes les annonces <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.slice(0, 8).map((cat) => (
          <CategoryCard key={cat.id} category={cat} onBrowse={onBrowse} />
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
    <article className="rounded-[1.5rem] border border-white/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-coral/15 bg-coral/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
          {kindLabel}
        </span>
        {item.is_free_included ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Offre Pro Plus
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
        <span className="rounded-full bg-sand px-2.5 py-1">{item.commune_name || item.location_name || 'Nouvelle-Caledonie'}</span>
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
        <span className="rounded-full border border-coral/15 bg-coral/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
          Covoiturage
        </span>
        {seatsRemaining <= 1 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Derniere place
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-night">
        {item.departure} - {item.destination}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-night/60">
        {dateLabel} a {timeLabel} · {item.vehicle || 'Vehicule detaille'} · {item.price_xpf.toLocaleString('fr-FR')} XPF / place
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">{seatsRemaining} place(s) restante(s)</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.music_allowed ? 'Musique ok' : 'Musique calme'}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.no_smoking ? 'Non fumeur' : 'Fumeur accepte'}</span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-night/55">
        <p>{item.driver_prenom ? `Conducteur: ${item.driver_prenom}` : 'Conducteur local'}</p>
        <p>{item.trust_score != null ? `Fiabilite: ${item.trust_score}/100` : 'Trajet verifie'}</p>
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
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
              <Sparkles className="h-3.5 w-3.5" />
              Bons plans & promotions
            </div>
            <h3 className="mt-4 font-display text-3xl font-bold text-white">Promos, ventes flash et coupons locaux</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
              Une vitrine moderne pour entreprises, commerçants, artisans, associations et particuliers.
              Chaque offre peut mettre en avant son prix initial, son prix promo et sa durée d&apos;expiration.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/annonces/nouvelle" className="btn-primary rounded-2xl px-4 py-2.5">
                Publier une promo
              </Link>
              <Link href="/annonces" className="btn-secondary rounded-2xl px-4 py-2.5">
                Explorer les offres
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
              <Sparkles className="h-3.5 w-3.5" />
              Evenements & culture
            </div>
            <h3 className="mt-4 font-display text-3xl font-bold text-white">Concerts, festivals et sorties locales</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
              Une section dédiée aux spectacles, marchés, conférences et animations communautaires.
              Les événements peuvent afficher leur date, lieu, billetterie et mise en avant sociale.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/annonces/nouvelle" className="btn-primary rounded-2xl px-4 py-2.5">
                Publier un événement
              </Link>
              <Link href="/annonces" className="btn-secondary rounded-2xl px-4 py-2.5">
                Voir le calendrier
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lagoon/90">Promotions</p>
                <h4 className="mt-1 text-2xl font-bold text-white">Les offres qui marchent maintenant</h4>
              </div>
              <Link href="/annonces/nouvelle" className="text-sm font-semibold text-lagoon hover:underline">
                Ajouter la votre
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
                  Soyez le premier a publier une promo, un coupon ou une vente flash visible par toute la communaute.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lagoon/90">Culture</p>
                <h4 className="mt-1 text-2xl font-bold text-white">Les rendez-vous a venir</h4>
              </div>
              <Link href="/annonces/nouvelle" className="text-sm font-semibold text-lagoon hover:underline">
                Creer un evenement
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
                <p className="text-lg font-semibold text-white">Aucun evenement en ligne pour le moment</p>
                <p className="mt-2 text-sm text-white/65">
                  Ajoutez un concert, une conference ou un marche pour alimenter la section culturelle.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lagoon/90">Mobilite</p>
              <h4 className="mt-1 text-2xl font-bold text-white">Covoiturage local et interurbain</h4>
            </div>
            <Link href="/covoiturage" className="text-sm font-semibold text-lagoon hover:underline">
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
              <p className="text-lg font-semibold text-white">Aucun trajet en ligne pour le moment</p>
              <p className="mt-2 text-sm text-white/65">
                La section covoiturage affichera bientôt les trajets disponibles et les réservations en cours.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
