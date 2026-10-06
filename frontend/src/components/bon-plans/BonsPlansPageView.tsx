'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, BadgeCheck, CalendarDays, CalendarRange, Clock3, Image as ImageIcon, LayoutGrid, List, MapPin, Search, Sparkles, Store, Tag, Ticket } from 'lucide-react'

import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { formatNoumeaDate } from '@/lib/bonPlansDate'
import { followBonPlanBusiness, getBonsPlansPageData } from '@/lib/data/bon-plans'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { BonPlan, BonPlanBusiness, BonsPlansPageData, BonsPlansTab, LocalEvent } from '@/types/bon-plans'

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const price = (value: number | null) => value === null ? null : `${money.format(value)} F`
const searchKey = (value: string) => value.trim().toLocaleLowerCase('fr-FR')

function isWeekend(value: string) {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Pacific/Noumea', weekday: 'short' }).format(new Date(value))
  return day === 'Sat' || day === 'Sun'
}

function Placeholder({ label }: { label: string }) {
  return <div className="flex min-h-44 items-center justify-center bg-cream-sunken text-ink/45" aria-label={label}><ImageIcon className="h-9 w-9" /></div>
}

function OfferCard({ offer, featured }: { offer: BonPlan; featured?: boolean }) {
  const currentPrice = price(offer.promoPriceXpf ?? offer.originalPriceXpf)
  const previousPrice = offer.promoPriceXpf !== null ? price(offer.originalPriceXpf) : null
  return (
    <article className={`group overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-card transition hover:-translate-y-1 hover:shadow-hover ${featured ? 'md:grid md:grid-cols-2' : ''}`}>
      {offer.imageUrl ? <img src={offer.imageUrl} alt="" className="h-full min-h-44 w-full object-cover" /> : <Placeholder label="Visuel de l’offre" />}
      <div className="flex flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-2"><span className="rounded-pill bg-accent/15 px-3 py-1 text-label-sm font-semibold text-accent-text">{offer.category}</span>{offer.discountPercent !== null ? <span className="rounded-pill bg-reef/15 px-3 py-1 text-label-sm font-semibold text-reef-text">-{offer.discountPercent} %</span> : null}</div>
        <h3 className={`mt-4 font-display font-semibold text-ink ${featured ? 'text-h3' : 'text-h4'}`}>{offer.title}</h3>
        <p className="mt-2 line-clamp-3 text-body-sm text-ink/70">{offer.description || 'Les détails sont disponibles auprès du commerce.'}</p>
        <div className="mt-4 flex items-center gap-2 text-body-sm font-semibold"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-label-sm text-cream">{offer.businessInitials}</span><span>{offer.businessName}</span>{offer.verified ? <BadgeCheck className="h-5 w-5 text-info-text" aria-label="Commerce vérifié" /> : null}</div>
        {offer.commune ? <p className="mt-3 flex items-center gap-2 text-meta text-ink/60"><MapPin className="h-4 w-4" />{offer.commune}</p> : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5"><div>{previousPrice ? <p className="text-meta text-ink/50 line-through">{previousPrice}</p> : null}{currentPrice ? <p className="font-display text-price-sm font-semibold">{currentPrice}</p> : <p className="text-label font-semibold text-reef-text">Offre à découvrir</p>}</div>{offer.ctaUrl ? <a href={offer.ctaUrl} target="_blank" rel="noreferrer" className="k-button k-button-secondary">{offer.ctaLabel}<ArrowRight className="h-4 w-4" /></a> : <span className="text-meta font-semibold text-ink/55">En commerce</span>}</div>
      </div>
    </article>
  )
}

function EventCard({ event }: { event: LocalEvent }) {
  const eventPrice = event.isFree ? 'Gratuit' : price(event.priceXpf) || 'Tarif à confirmer'
  return (
    <article className="grid overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-card sm:grid-cols-[11rem_1fr]">
      {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="h-full min-h-44 w-full object-cover" /> : <Placeholder label="Visuel de l’événement" />}
      <div className="p-5 sm:p-6"><div className="flex flex-wrap gap-2"><span className="rounded-pill bg-info/15 px-3 py-1 text-label-sm font-semibold text-info-text">{event.category}</span><span className="rounded-pill bg-reef/15 px-3 py-1 text-label-sm font-semibold text-reef-text">{eventPrice}</span>{event.verified ? <span className="flex items-center gap-1 text-meta font-semibold text-info-text"><BadgeCheck className="h-4 w-4" />Organisateur vérifié</span> : null}</div>
        <h3 className="mt-3 font-display text-h4">{event.title}</h3><p className="mt-2 line-clamp-2 text-body-sm text-ink/70">{event.description || 'Les informations pratiques seront précisées par l’organisateur.'}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta font-semibold text-ink/65"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent-text" />{formatNoumeaDate(event.dateIso, { weekday: 'long' })}</span>{event.time ? <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent-text" />{event.time}{event.endTime ? ` – ${event.endTime}` : ''}</span> : null}{event.commune || event.venue ? <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-text" />{[event.venue, event.commune].filter(Boolean).join(', ')}</span> : null}</div>
        <div className="mt-5 flex items-center justify-between gap-4"><p className="text-meta text-ink/55">{event.organizerName || 'Organisateur local'}</p>{event.bookingUrl ? <a href={event.bookingUrl} target="_blank" rel="noreferrer" className="k-button k-button-secondary">Réserver<Ticket className="h-4 w-4" /></a> : null}</div>
      </div>
    </article>
  )
}

function BusinessList({ businesses, follow, saving, followed, message }: { businesses: BonPlanBusiness[]; follow: (name: string) => void; saving: string | null; followed: string | null; message: string | null }) {
  return <aside className="rounded-block border border-warm-border bg-cream-surface p-5 shadow-card lg:sticky lg:top-24"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-control bg-ink text-cream"><Store className="h-5 w-5" /></span><div><p className="text-eyebrow uppercase text-accent-text">À suivre</p><h2 className="font-display text-h4">Enseignes locales</h2></div></div><div className="mt-5 divide-y divide-warm-border">{businesses.slice(0, 6).map((business) => <div key={business.slug || business.name} className="flex items-center gap-3 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-sunken text-label font-semibold">{business.name.charAt(0).toLocaleUpperCase('fr-FR')}</span><div className="min-w-0 flex-1"><p className="truncate text-label">{business.name}</p>{business.badge ? <p className="mt-1 truncate text-meta text-ink/55">{business.badge}</p> : null}</div><button type="button" onClick={() => follow(business.name)} disabled={saving === business.name || followed === business.name} className="min-h-11 rounded-control border border-warm-border px-3 text-label-sm font-semibold text-accent-text hover:border-accent disabled:opacity-60">{followed === business.name ? 'Suivie' : saving === business.name ? 'Ajout…' : 'Suivre'}</button></div>)}</div>{message ? <p className="mt-4 rounded-control bg-cream-sunken p-3 text-meta" role="status">{message}</p> : null}</aside>
}

function CalendarView({ events }: { events: LocalEvent[] }) {
  return <div className="rounded-block border border-warm-border bg-cream-surface p-4 shadow-card sm:p-6"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{events.slice(0, 14).map((event) => <article key={event.id} className="min-h-40 rounded-card border border-warm-border bg-cream p-3"><p className="text-eyebrow uppercase text-accent-text">{formatNoumeaDate(event.dateIso, { weekday: 'short', month: 'short' })}</p><h3 className="mt-3 text-label font-semibold">{event.title}</h3><p className="mt-2 text-meta text-ink/60">{event.time || 'Horaire à confirmer'}</p><p className="mt-1 text-meta text-ink/60">{event.commune}</p></article>)}</div></div>
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="mt-6 rounded-block border border-dashed border-warm-border bg-cream-surface p-10 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-sunken text-accent-text">{icon}</span><p className="mt-4 text-body text-ink/65">{text}</p></div>
}

export default function BonsPlansPageView({ initialTab }: { initialTab: BonsPlansTab }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [data, setData] = useState<BonsPlansPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [scope, setScope] = useState<'all' | 'weekend' | 'free'>('all')
  const [view, setView] = useState<'agenda' | 'calendar'>('agenda')
  const [saving, setSaving] = useState<string | null>(null)
  const [followed, setFollowed] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { let alive = true; setLoading(true); setError(null); getBonsPlansPageData().then((value) => { if (alive) setData(value) }).catch(() => { if (alive) setError('Les contenus sont momentanément indisponibles.') }).finally(() => { if (alive) setLoading(false) }); return () => { alive = false } }, [retry])
  const source = initialTab === 'promos' ? data?.promotions || [] : data?.events || []
  const categories = useMemo(() => Array.from(new Set(source.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'fr-FR')), [source])
  const key = searchKey(query)
  const promotions = useMemo(() => (data?.promotions || []).filter((item) => (category === 'all' || item.category === category) && (!key || searchKey(`${item.title} ${item.description} ${item.businessName} ${item.commune || ''}`).includes(key))), [category, data, key])
  const events = useMemo(() => (data?.events || []).filter((item) => (category === 'all' || item.category === category) && (scope === 'all' || (scope === 'weekend' ? isWeekend(item.dateIso) : item.isFree)) && (!key || searchKey(`${item.title} ${item.description} ${item.organizerName || ''} ${item.commune || ''}`).includes(key))), [category, data, key, scope])
  const follow = useCallback(async (name: string) => { setMessage(null); if (!isAuthenticated) { openAuthModal({ type: 'login', redirectTo: '/bons-plans' }); return } setSaving(name); try { await followBonPlanBusiness(name); setFollowed(name); setMessage(`Vous suivez maintenant ${name}.`) } catch { setMessage('Impossible d’ajouter cette enseigne pour le moment.') } finally { setSaving(null) } }, [isAuthenticated, openAuthModal])

  return <><Header /><main className="min-h-screen bg-cream text-ink"><section className="relative overflow-hidden border-b border-warm-border bg-ink text-cream"><div className="pointer-events-none absolute inset-0 bg-tressage text-cream/5" /><div className="relative mx-auto max-w-container px-4 py-12 sm:px-6 sm:py-16 lg:px-12"><p className="flex items-center gap-2 text-eyebrow uppercase text-reef-onDeep"><Sparkles className="h-4 w-4" />Sortir et consommer local</p><h1 className="mt-5 max-w-title font-display text-h1-form font-semibold sm:text-h1">{initialTab === 'promos' ? 'Les bons plans près de chez vous' : 'L’agenda des sorties locales'}</h1><p className="mt-5 max-w-prose text-body-lg text-cream/75">{initialTab === 'promos' ? 'Découvrez les offres en cours proposées par les commerces du territoire.' : 'Trouvez les prochains rendez-vous culturels, sportifs et familiaux en Nouvelle-Calédonie.'}</p></div></section>
    <nav className="border-b border-warm-border bg-cream-surface" aria-label="Bons plans et événements"><div className="mx-auto flex max-w-container gap-2 px-4 py-3 sm:px-6 lg:px-12"><Link href="/bons-plans" aria-current={initialTab === 'promos' ? 'page' : undefined} className={`flex min-h-11 items-center gap-2 rounded-control px-4 text-label font-semibold ${initialTab === 'promos' ? 'bg-ink text-cream' : 'hover:bg-cream-sunken'}`}><Tag className="h-4 w-4" />Bons plans</Link><Link href="/evenements" aria-current={initialTab === 'events' ? 'page' : undefined} className={`flex min-h-11 items-center gap-2 rounded-control px-4 text-label font-semibold ${initialTab === 'events' ? 'bg-ink text-cream' : 'hover:bg-cream-sunken'}`}><CalendarDays className="h-4 w-4" />Événements</Link></div></nav>
    <section className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-12 lg:py-12"><div className="rounded-block border border-warm-border bg-cream-surface p-4 shadow-card sm:p-5"><label className="relative block"><span className="sr-only">Rechercher</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/45" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par nom, lieu ou enseigne…" className="min-h-12 w-full rounded-field border border-warm-border bg-cream px-12 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></label><div className="mt-4 flex flex-wrap gap-2"><Filter active={category === 'all'} onClick={() => setCategory('all')}>Tout</Filter>{categories.map((value) => <Filter key={value} active={category === value} onClick={() => setCategory(value)}>{value}</Filter>)}</div></div>
    {initialTab === 'events' ? <div className="mt-5 flex flex-wrap justify-between gap-3"><div className="flex flex-wrap gap-2"><Filter active={scope === 'all'} onClick={() => setScope('all')}>Toutes les dates</Filter><Filter active={scope === 'weekend'} onClick={() => setScope('weekend')}>Ce week-end</Filter><Filter active={scope === 'free'} onClick={() => setScope('free')}>Gratuits</Filter></div><div className="flex rounded-control border border-warm-border bg-cream-surface p-1"><Filter active={view === 'agenda'} onClick={() => setView('agenda')}><List className="h-4 w-4" />Agenda</Filter><Filter active={view === 'calendar'} onClick={() => setView('calendar')}><LayoutGrid className="h-4 w-4" />Calendrier</Filter></div></div> : null}
    <div className="mt-8">{loading ? <div className="grid gap-5 sm:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-80 animate-pulse rounded-card bg-cream-sunken" />)}</div> : error ? <div className="rounded-block border border-alert-error/30 bg-cream-surface p-8 text-center" role="alert"><p className="text-body">{error}</p><Button className="mt-5" onClick={() => setRetry((value) => value + 1)}>Réessayer</Button></div> : initialTab === 'promos' ? <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"><div><SectionTitle eyebrow="Offres en cours" title="À découvrir maintenant" count={promotions.length} />{promotions.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2">{promotions.map((offer, index) => <div key={offer.id} className={index === 0 ? 'sm:col-span-2' : ''}><OfferCard offer={offer} featured={index === 0} /></div>)}</div> : <Empty icon={<Tag />} text="Aucune offre ne correspond à ces critères." />}</div><BusinessList businesses={data?.businesses || []} follow={follow} saving={saving} followed={followed} message={message} /></div> : <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"><div><SectionTitle eyebrow="Prochainement" title="Votre agenda local" count={events.length} />{events.length ? view === 'calendar' ? <div className="mt-6"><CalendarView events={events} /></div> : <div className="mt-6 grid gap-5">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <Empty icon={<CalendarRange />} text="Aucun événement ne correspond à ces critères." />}</div><aside><div className="rounded-block bg-ink p-6 text-cream shadow-panel"><CalendarRange className="h-7 w-7 text-reef-onDeep" /><h2 className="mt-5 font-display text-h3">Vous organisez un événement ?</h2><p className="mt-3 text-body-sm text-cream/70">Ajoutez-le à l’agenda pour le faire connaître près de chez vous.</p><Link href="/evenements/publier" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-label font-semibold hover:bg-accent-strong">Publier un événement<ArrowRight className="h-4 w-4" /></Link></div></aside></div>}</div></section></main></>
}

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`flex min-h-11 items-center gap-2 rounded-pill px-4 text-label-sm font-semibold ${active ? 'bg-ink text-cream' : 'border border-warm-border text-ink hover:border-accent'}`}>{children}</button> }
function SectionTitle({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) { return <div className="flex items-end justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-text">{eyebrow}</p><h2 className="mt-2 font-display text-h3">{title}</h2></div><p className="text-meta text-ink/55">{count} résultat{count > 1 ? 's' : ''}</p></div> }
