'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'

import { trackEvent } from '@/lib/analytics'

type ListingItem = {
  id: string | number
  title: string
  description?: string | null
  price: number | null
  is_featured?: boolean
  is_urgent?: boolean
  is_pro?: boolean
  boosted_until?: string | null
  commune_name?: string | null
  category_name?: string | null
  published_at?: string
  created_at?: string
  event_date?: string | null
  location_name?: string | null
  contact_name?: string | null
  website_url?: string | null
  link_url?: string | null
}

type ServiceItem = {
  id: string | number
  title: string
  description: string
  kind?: string
  target_audience?: string
  price_xpf?: number
  normal_price_xpf?: number | null
  promo_price_xpf?: number | null
  discount_pct?: number | null
  location_name?: string | null
  commune_name?: string | null
  category_name?: string | null
  event_date?: string | null
  expires_at?: string | null
  contact_name?: string | null
  author_prenom?: string | null
  website_url?: string | null
  link_url?: string | null
}

type SpotlightTabKey = 'latest' | 'premium' | 'promos' | 'events' | 'rides'
type SpotlightTone = 'lagon' | 'emeraude' | 'corail' | 'sable'

function getToneClasses(tone: SpotlightTone) {
  switch (tone) {
    case 'emeraude':
      return {
        tabActive: 'bg-nc-emeraude text-white border-nc-emeraude',
        accentText: 'text-nc-emeraude',
        pill: 'badge-emeraude',
        cta: 'text-nc-emeraude',
        subtle: 'text-nc-emeraude/90',
        card: 'border-nc-emeraude/20 bg-nc-emeraudeLight text-night',
      }
    case 'corail':
      return {
        tabActive: 'bg-nc-corail text-white border-nc-corail',
        accentText: 'text-nc-corail',
        pill: 'badge-corail',
        cta: 'text-nc-corail',
        subtle: 'text-nc-corail/90',
        card: 'border-nc-corail/20 bg-nc-corailLight text-night',
      }
    case 'sable':
      return {
        tabActive: 'bg-nc-sable text-white border-nc-sable',
        accentText: 'text-nc-sable',
        pill: 'badge-sable',
        cta: 'text-nc-sable',
        subtle: 'text-nc-sable/90',
        card: 'border-nc-sable/20 bg-nc-sableLight text-night',
      }
    default:
      return {
        tabActive: 'bg-nc-lagon text-white border-nc-lagon',
        accentText: 'text-nc-lagon',
        pill: 'badge-lagon',
        cta: 'text-nc-lagon',
        subtle: 'text-nc-lagon/90',
        card: 'border-nc-lagon/20 bg-nc-lagonLight text-night',
      }
  }
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date libre'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date libre'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function formatRelative(value?: string | null) {
  if (!value) return 'Récemment'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Récemment'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function getListingLabel(listing: ListingItem) {
  if (listing.is_featured || (listing.boosted_until && new Date(listing.boosted_until) > new Date())) return 'Mise en avant'
  if (listing.is_urgent) return 'Urgent'
  if (listing.is_pro) return 'Pro'
  return 'Annonce récente'
}

function SpotlightCard({
  title,
  subtitle,
  meta,
  href,
  badge,
  badgeClassName = '',
  accentClassName = 'text-nc-lagon',
  tone = 'border-night/10 bg-[var(--color-surface)] text-[var(--color-text-primary)]',
  primaryLabel = 'Voir',
  accent = false,
}: {
  title: string
  subtitle: string
  meta?: string
  href: string
  badge?: string
  badgeClassName?: string
  accentClassName?: string
  tone?: string
  primaryLabel?: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-[1.5rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone} ${accent ? 'bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,245,242,0.96))] dark:bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(4,18,30,0.96))]' : ''}`}
    >
      {badge ? (
        <span className={`inline-flex rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-85 ${badgeClassName}`}>
          {badge}
        </span>
      ) : null}
      <h3 className={`mt-3 text-lg font-semibold leading-tight ${accentClassName} group-hover:opacity-90`}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-current/65">{subtitle}</p>
      {meta ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-current/45">{meta}</p> : null}
      <span className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${accentClassName}`}>
        {primaryLabel}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

export function HomeSpotlightSection({
  latestListings,
  premiumListings,
  promoItems,
  eventItems,
  rideItems,
  loading = false,
}: {
  latestListings: ListingItem[]
  premiumListings: ListingItem[]
  promoItems: ServiceItem[]
  eventItems: ServiceItem[]
  rideItems: ServiceItem[]
  loading?: boolean
}) {
  const tabs = useMemo(() => {
    const premium = premiumListings.length > 0 ? premiumListings : latestListings.filter((item) => item.is_featured || Boolean(item.boosted_until))
    return [
      {
        key: 'latest',
        label: 'Dernières annonces',
        href: '/annonces',
        items: latestListings,
        badge: 'Flux chaud',
        intro: 'Les nouvelles annonces à ne pas manquer.',
        tone: 'lagon',
      },
      {
        key: 'premium',
        label: 'Mises en avant',
        href: '/annonces?sort=date',
        items: premium.length > 0 ? premium : latestListings,
        badge: 'Premium',
        intro: 'Les annonces boostées et les produits qui remontent en tête.',
        tone: 'lagon',
      },
      {
        key: 'promos',
        label: 'Promotions',
        href: '/bons-plans#promos',
        items: promoItems,
        badge: 'Bons plans',
        intro: 'Promos, ventes flash et coupons locaux.',
        tone: 'emeraude',
      },
      {
        key: 'events',
        label: 'Événements',
        href: '/bons-plans#evenements',
        items: eventItems,
        badge: 'Culture',
        intro: 'Concerts, marchés, animations et rendez-vous locaux.',
        tone: 'sable',
      },
      {
        key: 'rides',
        label: 'Covoiturage',
        href: '/covoiturage',
        items: rideItems,
        badge: 'Mobilité',
        intro: 'Les trajets récents et les places encore ouvertes.',
        tone: 'corail',
      },
    ] as const
  }, [eventItems, latestListings, premiumListings, promoItems, rideItems])

  const [activeTab, setActiveTab] = useState<SpotlightTabKey>(tabs[0].key)

  useEffect(() => {
    void trackEvent('home_spotlight_view', { active_tab: activeTab, visible_tabs: tabs.length })
  }, [])

  const active = tabs.find((tab) => tab.key === activeTab) || tabs[0]
  const activeItems = active.items.slice(0, 4)
  const primary = activeItems[0]
  const isListingTab = active.key === 'latest' || active.key === 'premium'
  const primaryListing = primary as ListingItem | undefined
  const primaryService = primary as ServiceItem | undefined
  const activeTone = getToneClasses((active as { tone?: SpotlightTone }).tone || 'lagon')
  const totalItems = tabs.reduce((sum, tab) => sum + tab.items.length, 0)
  const allEmpty = totalItems === 0
  if (allEmpty) return null

  const emptyState =
    active.key === 'premium'
      ? {
          title: 'Les meilleures annonces apparaîtront ici',
          subtitle: 'Boostez votre annonce pour apparaître en tête de page.',
          cta: 'Déposer une annonce',
          href: '/annonces/nouvelle',
        }
      : active.key === 'latest'
        ? {
            title: 'Soyez parmi les premiers !',
            subtitle: 'Aucune annonce pour l&apos;instant - publiez la vôtre et lancez la communauté.',
            cta: 'Publier une annonce',
            href: '/annonces/nouvelle',
          }
        : active.key === 'promos'
          ? {
              title: 'Les meilleures promos apparaîtront ici',
              subtitle: 'Publiez un bon plan pour le mettre en avant sur Kalico.',
              cta: 'Publier une promo',
              href: '/annonces/nouvelle',
            }
          : active.key === 'events'
            ? {
                title: 'Les meilleurs rendez-vous apparaîtront ici',
                subtitle: 'Ajoutez un événement pour faire vibrer la communauté locale.',
                cta: 'Publier un événement',
                href: '/annonces/nouvelle',
              }
            : {
                title: 'La mobilité locale démarre ici',
                subtitle: 'Proposez un trajet pour lancer les premiers échanges.',
                cta: 'Proposer un trajet',
                href: '/covoiturage?mode=publish',
              }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(8,32,50,0.08)] dark:bg-[var(--color-surface)]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.12))] px-6 py-7 text-white md:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-lagon">
              <Sparkles className="h-3.5 w-3.5" />
              Rappels interactifs
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Le meilleur de Kalico, en direct, sans rien manquer.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Suivez les dernières annonces, les contenus premium, les promotions, les événements et le covoiturage depuis un seul espace rapide et cliquable.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab
                const tabTone = getToneClasses((tab as { tone?: SpotlightTone }).tone || 'lagon')
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key)
                      void trackEvent('home_spotlight_tab_click', { tab: tab.key, item_count: tab.items.length })
                    }}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? tabTone.tabActive
                        : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                      {tab.items.length}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${activeTone.subtle}`}>{active.badge}</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{active.label}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{active.intro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={active.href}
                  onClick={() => void trackEvent('home_spotlight_cta_click', { cta: 'explore', tab: active.key })}
                  className="btn-primary rounded-2xl px-4 py-2.5"
                >
                  Explorer
                </Link>
                <a
                  href="#featured-listings"
                  onClick={() => void trackEvent('home_spotlight_cta_click', { cta: 'featured_jump', tab: active.key })}
                  className={`btn-secondary rounded-2xl px-4 py-2.5 ${activeTone.cta}`}
                >
                  Voir les annonces à la une
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-background-secondary)] px-5 py-6 md:px-6">
            {primary ? (
              <SpotlightCard
                href={isListingTab ? `/annonces/${primaryListing?.id}` : active.href}
                badge={active.badge}
                badgeClassName={activeTone.pill}
                accentClassName={activeTone.accentText}
                title={primary?.title || 'Contenu'}
                subtitle={
                  isListingTab
                    ? `${primaryListing?.category_name || 'Annonce locale'} · ${primaryListing?.commune_name || 'Nouvelle-Calédonie'}`
                    : `${(primaryService?.description || '').slice(0, 120)}${(primaryService?.description?.length || 0) > 120 ? '...' : ''}`
                }
                meta={
                  isListingTab
                    ? `${getListingLabel(primaryListing || { id: 0, title: '', price: null })} · ${formatRelative(primaryListing?.published_at || primaryListing?.created_at)}`
                    : `${formatDateLabel(primaryService?.event_date)} · ${primaryService?.commune_name || primaryService?.location_name || 'Nouvelle-Calédonie'}`
                }
                primaryLabel={isListingTab ? 'Ouvrir' : 'Découvrir'}
                accent={active.key === 'premium' || active.key === 'promos' || active.key === 'events'}
                tone={activeTone.card}
              />
            ) : (
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text-secondary)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Aucun rappel pour le moment</p>
                <p className="mt-1 text-sm">Les contenus récents apparaîtront ici dès qu&apos;ils seront publiés.</p>
              </div>
            )}

            <div className="mt-4 grid gap-3">
              {activeItems.slice(1, 4).map((item) => {
                const isListing = active.key === 'latest' || active.key === 'premium'
                return (
                  <Link
                    key={item.id}
                    href={isListing ? `/annonces/${item.id}` : active.href}
                    onClick={() => void trackEvent('home_spotlight_item_open', { tab: active.key, item_id: item.id, kind: isListing ? 'listing' : 'service' })}
                    className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {isListing
                            ? `${item.category_name || 'Annonce'} · ${item.commune_name || 'Nouvelle-Calédonie'}`
                            : `${formatDateLabel(item.event_date)} · ${item.commune_name || item.location_name || 'Local'}`}
                        </p>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 ${activeTone.accentText}`} />
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/bons-plans" className="badge-emeraude rounded-full px-3 py-1.5 text-xs font-semibold">
                Bons plans
              </Link>
              <Link href="/evenements" className="badge-sable rounded-full px-3 py-1.5 text-xs font-semibold">
                Événements
              </Link>
              <Link href="/covoiturage" className="badge-corail rounded-full px-3 py-1.5 text-xs font-semibold">
                Covoiturage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
