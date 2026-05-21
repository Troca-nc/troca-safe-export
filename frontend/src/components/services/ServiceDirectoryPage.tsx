'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, Clock3, MapPin, Search, Sparkles, Users, X } from 'lucide-react'

import { bonPlansApi } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

type ServiceItem = {
  id: number | string
  title: string
  description: string
  kind?: string
  target_audience?: string
  price_xpf?: number
  normal_price_xpf?: number | null
  promo_price_xpf?: number | null
  discount_pct?: number | null
  is_free_included?: boolean
  location_name?: string | null
  commune_name?: string | null
  event_date?: string | null
  expires_at?: string | null
  link_url?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  website_url?: string | null
  author_prenom?: string | null
  author_is_pro?: boolean | null
  view_count?: number | null
  share_count?: number | null
}

type DirectoryMode = 'promo' | 'event'

function formatDateLabel(value?: string | null, fallback = 'Date libre') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatCurrency(value?: number | null) {
  if (value == null) return 'Sur devis'
  return `${value.toLocaleString('fr-FR')} XPF`
}

function ServiceCard({
  item,
  mode,
  featured = false,
}: {
  item: ServiceItem
  mode: DirectoryMode
  featured?: boolean
}) {
  const isPromo = mode === 'promo'
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(item.title)}` : '#'
  const handleShare = async () => {
    const shareData = {
      title: item.title,
      text: item.description,
      url: shareUrl,
    }

    let channel: 'native' | 'copy' = 'copy'
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData)
        channel = 'native'
        void trackEvent('service_directory_share', {
          mode,
          item_id: item.id,
          kind: item.kind || null,
          channel,
        })
        return
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      channel = 'copy'
      void trackEvent('service_directory_share', {
        mode,
        item_id: item.id,
        kind: item.kind || null,
        channel,
      })
    } catch {}
  }

  const primaryHref = item.link_url || item.website_url || `mailto:${item.contact_name || 'contact'}`
  const primaryLabel = item.link_url ? (isPromo ? 'Voir l offre' : 'Reserver') : item.website_url ? 'Voir le site' : 'Contacter'

  return (
    <article className={`rounded-[1.5rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${featured ? 'border-coral/20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,245,242,0.94))]' : 'border-night/8 bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-coral/15 bg-coral/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
          {isPromo ? 'Promotion' : 'Evenement'}
        </span>
        {featured ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            A la une
          </span>
        ) : null}
        {item.author_is_pro ? (
          <span className="rounded-full border border-ocean/20 bg-ocean/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ocean">
            Organisateur verifie
          </span>
        ) : null}
        {item.is_free_included ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Offre premium
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-night">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-night/65">{item.description}</p>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-night/65 sm:grid-cols-2">
        <span className="rounded-full bg-sand px-2.5 py-1">{item.commune_name || item.location_name || 'Nouvelle-Caledonie'}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">
          <CalendarDays className="mr-1 inline h-3.5 w-3.5 text-coral" />
          {formatDateLabel(item.event_date, isPromo ? 'Expiration libre' : 'Date libre')}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-1">
          <Users className="mr-1 inline h-3.5 w-3.5 text-coral" />
          {isPromo ? `${item.view_count ?? 0} vues` : `${item.share_count ?? 0} partages`}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-1">
          <Clock3 className="mr-1 inline h-3.5 w-3.5 text-coral" />
          {item.contact_name || 'Contact local'}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-sand/50 p-3">
        {isPromo ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Tarif</p>
            <p className="mt-1 text-lg font-bold text-night">
              {item.promo_price_xpf != null ? formatCurrency(item.promo_price_xpf) : formatCurrency(item.price_xpf)}
            </p>
            {item.normal_price_xpf != null ? (
              <p className="mt-1 text-sm text-night/60">
                Au lieu de {formatCurrency(item.normal_price_xpf)}
                {item.discount_pct != null ? ` (-${item.discount_pct}%)` : ''}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Heure / lieu</p>
            <p className="mt-1 text-sm font-semibold text-night">
              {formatDateLabel(item.event_date, 'Date a confirmer')}
            </p>
            <p className="mt-1 text-sm text-night/60">{item.location_name || item.commune_name || 'Lieu local'}</p>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={primaryHref}
          target={primaryHref.startsWith('http') ? '_blank' : undefined}
          rel={primaryHref.startsWith('http') ? 'noreferrer' : undefined}
          onClick={() => void trackEvent('service_directory_open', { mode, item_id: item.id, kind: item.kind || null })}
          className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night transition hover:-translate-y-0.5"
        >
          Partager
        </button>
      </div>
    </article>
  )
}

export function ServiceDirectoryPage({
  title,
  eyebrow,
  description,
  kind,
  mode,
  searchPlaceholder,
  introPoints,
}: {
  title: string
  eyebrow: string
  description: string
  kind: string
  mode: DirectoryMode
  searchPlaceholder: string
  introPoints: string[]
}) {
  const [items, setItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [audience, setAudience] = useState<'all' | 'particulier' | 'pro'>('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await bonPlansApi.list({
          limit: 36,
          kind,
          q: searchQuery || undefined,
          target_audience: audience === 'all' ? undefined : audience,
        })
        if (!alive) return
        setItems(data?.data ?? [])
      } catch (err: any) {
        if (!alive) return
        setItems([])
        setError(err?.response?.data?.error || 'Impossible de charger les contenus pour le moment.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [audience, kind, searchQuery])

  useEffect(() => {
    void trackEvent('service_directory_view', {
      mode,
      kind,
    })
  }, [kind, mode])

  const visibleItems = useMemo(() => {
    return [...items].filter((item) => {
      if (mode === 'event' && timeFilter !== 'all') {
        const eventDate = item.event_date ? new Date(item.event_date) : null
        const isPast = eventDate ? eventDate.getTime() < Date.now() : false
        if (timeFilter === 'upcoming' && isPast) return false
        if (timeFilter === 'past' && !isPast) return false
      }
      return true
    })
  }, [items, mode, timeFilter])

  const featured = visibleItems.slice(0, 3)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchQuery(searchInput.trim())
    void trackEvent('service_directory_search', {
      mode,
      kind,
      query_length: searchInput.trim().length,
    })
  }

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <section className="bg-night px-4 py-8 text-white md:py-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.2))] px-6 py-8 shadow-[0_24px_80px_rgba(8,32,50,0.24)] md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lagoon">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">{description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {introPoints.map((point) => (
              <span key={point} className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/85">
                {point}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/8 p-4 md:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 pl-11 text-sm text-night outline-none"
                />
              </div>
              <button type="submit" className="btn-primary rounded-2xl px-5 py-3">
                Rechercher
              </button>
            </form>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => {
                  setAudience('all')
                  void trackEvent('service_directory_filter', { mode, kind, audience: 'all' })
                }}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${audience === 'all' ? 'bg-lagoon text-night' : 'border border-white/10 bg-white/5 text-white/80'}`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudience('particulier')
                  void trackEvent('service_directory_filter', { mode, kind, audience: 'particulier' })
                }}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${audience === 'particulier' ? 'bg-lagoon text-night' : 'border border-white/10 bg-white/5 text-white/80'}`}
              >
                Particuliers
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudience('pro')
                  void trackEvent('service_directory_filter', { mode, kind, audience: 'pro' })
                }}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${audience === 'pro' ? 'bg-lagoon text-night' : 'border border-white/10 bg-white/5 text-white/80'}`}
              >
                Pros
              </button>
              {mode === 'event' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeFilter('all')
                      void trackEvent('service_directory_filter', { mode, kind, time_filter: 'all' })
                    }}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${timeFilter === 'all' ? 'bg-coral text-white' : 'border border-white/10 bg-white/5 text-white/80'}`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeFilter('upcoming')
                      void trackEvent('service_directory_filter', { mode, kind, time_filter: 'upcoming' })
                    }}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${timeFilter === 'upcoming' ? 'bg-coral text-white' : 'border border-white/10 bg-white/5 text-white/80'}`}
                  >
                    A venir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeFilter('past')
                      void trackEvent('service_directory_filter', { mode, kind, time_filter: 'past' })
                    }}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${timeFilter === 'past' ? 'bg-coral text-white' : 'border border-white/10 bg-white/5 text-white/80'}`}
                  >
                    Passes
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Contenus recents</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Les contenus les plus visibles maintenant</h2>
          </div>
          <Link href="/annonces/nouvelle" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex" onClick={() => void trackEvent('service_directory_publish', { mode, kind, source: 'top' })}>
            Publier
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-[1.5rem] border border-night/8 bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 text-night/70">
            <p className="text-lg font-semibold text-night">Impossible de charger la section pour le moment</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <ServiceCard key={item.id} item={item} mode={mode} featured={featured[0]?.id === item.id || item.is_free_included === true} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 text-night/70">
            <p className="text-lg font-semibold text-night">Aucun contenu trouve</p>
            <p className="mt-2 text-sm">Essayez une autre recherche ou publiez le premier contenu de cette categorie.</p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="rounded-[2rem] border border-night/8 bg-white px-6 py-6 shadow-[0_24px_80px_rgba(8,32,50,0.06)] md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">
                {mode === 'promo' ? 'Apercu' : 'Selection'}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-night">
                {mode === 'promo' ? 'Promotions a la une' : 'Evenements a venir'}
              </h3>
            </div>
            <Link href={mode === 'promo' ? '/bons-plans' : '/evenements'} className="inline-flex items-center gap-1 text-sm font-semibold text-coral hover:underline">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {featured.slice(0, 3).map((item, index) => (
              <div key={item.id} className={`rounded-[1.5rem] border p-4 ${index === 0 ? 'border-coral/20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,245,242,0.94))]' : 'border-night/8 bg-sand-light'}`}>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-coral/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
                    {mode === 'promo' ? 'Promo' : 'Evenement'}
                  </span>
                  {index === 0 ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                      A la une
                    </span>
                  ) : null}
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/55">
                    {item.commune_name || item.location_name || 'Local'}
                  </span>
                </div>
                <p className="mt-3 text-base font-semibold text-night">{item.title}</p>
                <p className="mt-2 text-sm text-night/65">
                  {mode === 'promo'
                    ? `${item.promo_price_xpf ? formatCurrency(item.promo_price_xpf) : formatCurrency(item.price_xpf)}${item.discount_pct ? ` · -${item.discount_pct}%` : ''}`
                    : `${formatDateLabel(item.event_date, 'Date a venir')} · ${item.contact_name || 'Organisateur local'}`}
                </p>
                <Link href={mode === 'promo' ? '/bons-plans' : '/evenements'} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-coral">
                  Ouvrir
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
