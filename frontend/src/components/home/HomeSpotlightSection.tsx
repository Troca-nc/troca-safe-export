'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Car, ChevronRight, Clock3, Sparkles } from 'lucide-react'

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

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date libre'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date libre'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function formatRelative(value?: string | null) {
  if (!value) return 'Recemment'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recemment'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function getListingLabel(listing: ListingItem) {
  if (listing.is_featured || (listing.boosted_until && new Date(listing.boosted_until) > new Date())) return 'Mise en avant'
  if (listing.is_urgent) return 'Urgent'
  if (listing.is_pro) return 'Pro'
  return 'Annonce recente'
}

function getListingTone(listing: ListingItem) {
  if (listing.is_featured || (listing.boosted_until && new Date(listing.boosted_until) > new Date())) return 'border-coral/20 bg-coral/5 text-coral'
  if (listing.is_urgent) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (listing.is_pro) return 'border-ocean/20 bg-ocean/8 text-ocean'
  return 'border-night/10 bg-night/5 text-night/60'
}

function SpotlightCard({
  title,
  subtitle,
  meta,
  href,
  badge,
  tone = 'border-night/10 bg-white text-night',
  primaryLabel = 'Voir',
  accent = false,
}: {
  title: string
  subtitle: string
  meta?: string
  href: string
  badge?: string
  tone?: string
  primaryLabel?: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-[1.5rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone} ${accent ? 'bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,245,242,0.96))]' : ''}`}
    >
      {badge ? (
        <span className="inline-flex rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-85">
          {badge}
        </span>
      ) : null}
      <h3 className="mt-3 text-lg font-semibold leading-tight group-hover:text-coral">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-current/65">{subtitle}</p>
      {meta ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-current/45">{meta}</p> : null}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-coral">
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
}: {
  latestListings: ListingItem[]
  premiumListings: ListingItem[]
  promoItems: ServiceItem[]
  eventItems: ServiceItem[]
  rideItems: ServiceItem[]
}) {
  const tabs = useMemo(() => {
    const premium = premiumListings.length > 0 ? premiumListings : latestListings.filter((item) => item.is_featured || Boolean(item.boosted_until))
    return [
      {
        key: 'latest',
        label: 'Dernieres annonces',
        href: '/annonces',
        items: latestListings,
        badge: 'Flux chaud',
        intro: 'Les nouvelles annonces a ne pas manquer.',
      },
      {
        key: 'premium',
        label: 'Mises en avant',
        href: '/annonces?sort=date',
        items: premium.length > 0 ? premium : latestListings,
        badge: 'Premium',
        intro: 'Les annonces boostees et les produits qui remontent en tete.',
      },
      {
        key: 'promos',
        label: 'Promotions',
        href: '/bons-plans',
        items: promoItems,
        badge: 'Bons plans',
        intro: 'Promos, ventes flash et coupons locaux.',
      },
      {
        key: 'events',
        label: 'Evenements',
        href: '/evenements',
        items: eventItems,
        badge: 'Culture',
        intro: 'Concerts, marches, animations et rendez-vous locaux.',
      },
      {
        key: 'rides',
        label: 'Covoiturage',
        href: '/covoiturage',
        items: rideItems,
        badge: 'Mobilite',
        intro: 'Les trajets recents et les places encore ouvertes.',
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

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.12))] px-6 py-7 text-white md:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lagoon">
              <Sparkles className="h-3.5 w-3.5" />
              Rappels interactifs
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Le meilleur de Troca, en direct, sans rien manquer.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Suivez les dernires annonces, les contenus premium, les promotions, les evenements et le covoiturage depuis un seul espace rapide et cliquable.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab
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
                        ? 'border-lagoon bg-lagoon text-night'
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon/90">{active.badge}</p>
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
                  className="btn-secondary rounded-2xl px-4 py-2.5"
                >
                  Voir les annonces a la une
                </a>
              </div>
            </div>
          </div>

          <div className="bg-sand-light px-5 py-6 md:px-6">
            {primary ? (
              <SpotlightCard
                href={
                  isListingTab
                    ? `/annonces/${primaryListing?.id}`
                    : active.href
                }
                badge={active.badge}
                title={
                  primary?.title || 'Contenu'
                }
                subtitle={
                  isListingTab
                    ? `${primaryListing?.category_name || 'Annonce locale'} · ${primaryListing?.commune_name || 'Nouvelle-Caledonie'}`
                    : `${(primaryService?.description || '').slice(0, 120)}${(primaryService?.description?.length || 0) > 120 ? '...' : ''}`
                }
                meta={
                  isListingTab
                    ? `${getListingLabel(primaryListing || { id: 0, title: '', price: null })} · ${formatRelative(primaryListing?.published_at || primaryListing?.created_at)}`
                    : `${formatDateLabel(primaryService?.event_date)} · ${primaryService?.commune_name || primaryService?.location_name || 'Nouvelle-Caledonie'}`
                }
                primaryLabel={isListingTab ? 'Ouvrir' : 'Decouvrir'}
                accent={active.key === 'premium' || active.key === 'promos' || active.key === 'events'}
                tone={active.key === 'premium' ? 'border-coral/20 bg-white text-night' : 'border-night/10 bg-white text-night'}
              />
            ) : (
              <div className="rounded-[1.5rem] border border-night/10 bg-white p-5 text-night/60">
                <p className="text-sm font-semibold text-night">Aucun rappel pour le moment</p>
                <p className="mt-1 text-sm">Les contenus recents apparaitront ici des qu&apos;ils seront publies.</p>
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
                    className="rounded-[1.25rem] border border-night/8 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-night">
                          {isListing ? item.title : item.title}
                        </p>
                        <p className="mt-1 text-xs text-night/55">
                          {isListing
                            ? `${item.category_name || 'Annonce'} · ${item.commune_name || 'Nouvelle-Caledonie'}`
                            : `${formatDateLabel(item.event_date)} · ${item.commune_name || item.location_name || 'Local'}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-coral" />
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/bons-plans" className="rounded-full border border-coral/15 bg-coral/5 px-3 py-1.5 text-xs font-semibold text-coral">
                Bons plans
              </Link>
              <Link href="/evenements" className="rounded-full border border-coral/15 bg-coral/5 px-3 py-1.5 text-xs font-semibold text-coral">
                Evenements
              </Link>
              <Link href="/covoiturage" className="rounded-full border border-coral/15 bg-coral/5 px-3 py-1.5 text-xs font-semibold text-coral">
                Covoiturage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
