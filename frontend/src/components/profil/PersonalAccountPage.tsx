'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  Bell,
  Check,
  Clock3,
  Eye,
  Heart,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  Repeat2,
  Trash2,
  X,
} from 'lucide-react'

import AccountTabs from '@/components/layout/AccountTabs'
import Header from '@/components/layout/Header'
import PersonalAlertsManager from '@/components/profil/PersonalAlertsManager'
import { DEMO } from '@/lib/demo'
import {
  getPersonalFavorites,
  getPersonalListings,
  getPersonalOffers,
  personalAccountActions,
} from '@/lib/data/personal-account'
import { showDemoToast } from '@/lib/demoMode'
import { useAuthStore } from '@/store/authStore'
import type { AccountSession } from '@/types/account'
import type {
  PersonalFavorite,
  PersonalListing,
  PersonalListingsData,
  PersonalOffer,
} from '@/types/personal-account'

export type PersonalAccountTab = 'listings' | 'favorites' | 'alerts' | 'offers'

const TAB_META: Record<PersonalAccountTab, { title: string; subtitle: string }> = {
  listings: { title: 'Mes annonces', subtitle: 'Vos annonces et leurs performances' },
  favorites: { title: 'Coups de cœur', subtitle: 'Les annonces que vous gardez de côté' },
  alerts: { title: 'Alertes', subtitle: 'Vos recherches enregistrées et leurs résultats récents' },
  offers: { title: 'Offres reçues', subtitle: 'Répondez aux offres de prix et propositions de troc' },
}

const TABS = [
  { id: 'listings', label: 'Mes annonces', href: '/profil/annonces', icon: <Archive className="h-4 w-4" /> },
  { id: 'favorites', label: 'Coups de cœur', href: '/profil/favoris', icon: <Heart className="h-4 w-4" /> },
  { id: 'alerts', label: 'Alertes', href: '/profil/alertes', icon: <Bell className="h-4 w-4" /> },
  { id: 'offers', label: 'Offres reçues', href: '/profil/offres', icon: <Inbox className="h-4 w-4" /> },
]

const formatXpf = (value: number | null) => value == null
  ? 'Prix à débattre'
  : value === 0 ? 'Gratuit' : `${value.toLocaleString('fr-FR')} XPF`

const formatDate = (value: string | null) => {
  if (!value) return 'Date non renseignée'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function getErrorMessage(error: unknown) {
  const response = error as { response?: { data?: { error?: string } } }
  return response?.response?.data?.error || 'Une erreur est survenue. Réessayez.'
}

function EmptyState({ icon, title, body, href, action }: { icon: React.ReactNode; title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-warm-border bg-surface p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-ink">{icon}</div>
      <h2 className="mt-4 font-display text-2xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-ink/60">{body}</p>
      <Link href={href} className="btn-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">
        <Plus className="h-4 w-4" /> {action}
      </Link>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
      <p className="text-sm">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream-surface px-4 py-2 text-sm font-semibold shadow-sm">
        <RefreshCw className="h-4 w-4" /> Réessayer
      </button>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-label="Chargement">
      <div className="skeleton h-14 rounded-2xl" />
      {[0, 1, 2].map((index) => <div key={index} className="skeleton h-44 rounded-[2rem]" />)}
    </div>
  )
}

const statusMeta: Record<string, { label: string; className: string }> = {
  active: { label: 'En ligne', className: 'bg-green-100 text-green-800' },
  pending: { label: 'Brouillon', className: 'bg-sand text-ink/70' },
  reserved: { label: 'Réservée', className: 'bg-blue-100 text-blue-800' },
  sold: { label: 'Vendue', className: 'bg-night text-white' },
  completed: { label: 'Terminée', className: 'bg-night text-white' },
  expired: { label: 'Expirée', className: 'bg-orange-100 text-orange-800' },
}

function ListingsView({ session, demo }: { session: AccountSession; demo: boolean }) {
  const [data, setData] = useState<PersonalListingsData | null>(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setData(await getPersonalListings(session)) } catch (err) { setError(getErrorMessage(err)) } finally { setLoading(false) }
  }, [session])

  useEffect(() => { void load() }, [load])

  const mutate = async (listing: PersonalListing, action: 'sold' | 'renew' | 'delete') => {
    if (action === 'delete' && !window.confirm(`Supprimer « ${listing.title} » ?`)) return
    setBusyId(listing.id)
    setFeedback(null)
    try {
      if (demo) {
        showDemoToast('Action simulée en mode démo')
        setData((current) => current ? {
          ...current,
          capacity: {
            ...current.capacity,
            used: action === 'renew' ? Math.min(current.capacity.limit, current.capacity.used + 1) : action === 'sold' && listing.status === 'active' ? Math.max(0, current.capacity.used - 1) : current.capacity.used,
          },
          listings: action === 'delete'
            ? current.listings.filter((item) => item.id !== listing.id)
            : current.listings.map((item) => item.id === listing.id ? { ...item, status: action === 'sold' ? 'sold' : 'active', expiresAt: action === 'renew' ? new Date(Date.now() + 60 * 86_400_000).toISOString() : item.expiresAt } : item),
        } : current)
      } else {
        if (action === 'sold') await personalAccountActions.markSold(listing.id)
        if (action === 'renew') await personalAccountActions.renew(listing.id)
        if (action === 'delete') await personalAccountActions.deleteListing(listing.id)
        await load()
      }
      setFeedback(action === 'sold' ? 'Annonce marquée comme vendue.' : action === 'renew' ? 'Annonce republiée pour 60 jours.' : 'Annonce supprimée.')
    } catch (err) { setFeedback(getErrorMessage(err)) } finally { setBusyId(null) }
  }

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState message={error || 'Données indisponibles.'} onRetry={load} />

  const filters = [
    ['all', 'Tout'], ['active', 'En ligne'], ['pending', 'Brouillons'], ['sold', 'Vendues'], ['expired', 'Expirées'],
  ]
  const shown = data.listings.filter((listing) => filter === 'all' || listing.status === filter || (filter === 'sold' && listing.status === 'completed'))
  return (
    <div className="space-y-5">
      {feedback ? <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{feedback}</div> : null}
      <section className="overflow-hidden rounded-[2rem] bg-ink p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Emplacements utilisés</p>
            <p className="mt-2 font-display text-3xl font-bold">{data.capacity.used} sur {data.capacity.limit}</p>
            <p className="mt-1 text-sm text-white/65">Seules vos annonces en ligne occupent un emplacement.</p>
          </div>
          <Link href="/deposer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-rust px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Déposer une annonce
          </Link>
        </div>
        <div className="mt-5 grid max-w-sm grid-cols-5 gap-2" aria-label={`${data.capacity.used} emplacements occupés sur ${data.capacity.limit}`}>
          {Array.from({ length: Math.min(data.capacity.limit, 5) }).map((_, index) => <span key={index} className={`h-2 rounded-full ${index < data.capacity.used ? 'bg-sunset' : 'bg-cream/15'}`} />)}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(([id, label]) => {
          const count = data.listings.filter((item) => id === 'all' || item.status === id || (id === 'sold' && item.status === 'completed')).length
          return <button key={id} type="button" onClick={() => setFilter(id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${filter === id ? 'border-ink bg-ink text-white' : 'border-warm-border bg-surface text-ink/65'}`}>{label} · {count}</button>
        })}
      </div>

      {shown.length === 0 ? <EmptyState icon={<PackageOpen className="h-6 w-6" />} title="Aucune annonce ici" body="Déposez une annonce ou choisissez un autre filtre pour retrouver vos publications." href="/deposer" action="Déposer une annonce" /> : (
        <div className="space-y-4">
          {shown.map((listing) => {
            const meta = statusMeta[listing.status] ?? statusMeta.pending
            const daysLeft = listing.expiresAt ? Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86_400_000) : null
            return (
              <article key={listing.id} className={`rounded-[2rem] border border-warm-border bg-surface p-4 shadow-sm sm:p-5 ${listing.status === 'sold' ? 'opacity-75' : ''}`}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={`/annonces/${listing.id}`} className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sand text-ink/25 sm:h-36 sm:w-44">
                    {listing.coverImage ? <img src={listing.coverImage} alt="" className="h-full w-full object-cover" /> : <PackageOpen className="h-9 w-9" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>{listing.isTroc ? <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink">Troc</span> : null}</div>
                        <Link href={`/annonces/${listing.id}`} className="mt-2 block font-display text-xl font-bold text-ink hover:text-rust">{listing.title}</Link>
                        <p className="mt-1 font-semibold text-ink">{formatXpf(listing.price)}</p>
                      </div>
                      <p className="text-xs text-ink/45">{listing.publishedAt ? `Publiée le ${formatDate(listing.publishedAt)}` : 'Non publiée'}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/55">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {listing.views} vues</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {listing.favorites} favoris</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {listing.messages} messages</span>
                    </div>
                    {listing.status === 'active' && daysLeft != null ? <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${daysLeft <= 7 ? 'text-orange-700' : 'text-ink/55'}`}><Clock3 className="h-3.5 w-3.5" /> {daysLeft > 0 ? `Expire dans ${daysLeft} jours` : 'Expiration atteinte'}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {listing.status === 'active' ? <><Link href={`/annonces/nouvelle?edit=${listing.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-warm-border px-4 py-2 text-sm font-semibold text-ink"><Pencil className="h-4 w-4" /> Modifier</Link><button disabled={busyId === listing.id} onClick={() => void mutate(listing, 'sold')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" /> Marquer vendue</button></> : null}
                      {listing.status === 'expired' ? <button disabled={busyId === listing.id} onClick={() => void mutate(listing, 'renew')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-rust px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Republier 60 jours</button> : null}
                      {['pending', 'expired'].includes(listing.status) ? <button disabled={busyId === listing.id} onClick={() => void mutate(listing, 'delete')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Supprimer</button> : null}
                    </div>
                  </div>
                </div>
                {listing.status === 'active' && listing.views < 40 ? <div className="mt-4 rounded-2xl bg-accent/65 px-4 py-3 text-sm text-ink"><strong>Conseil :</strong> ajoutez des photos ou précisez le titre pour améliorer la visibilité.</div> : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FavoritesView({ session, demo }: { session: AccountSession; demo: boolean }) {
  const [items, setItems] = useState<PersonalFavorite[]>([])
  const [category, setCategory] = useState('Tout')
  const [hideSold, setHideSold] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setItems(await getPersonalFavorites(session)) } catch (err) { setError(getErrorMessage(err)) } finally { setLoading(false) }
  }, [session])
  useEffect(() => { void load() }, [load])

  const remove = async (item: PersonalFavorite) => {
    const previous = items
    setItems((current) => current.filter((favorite) => favorite.id !== item.id))
    setFeedback('Retiré des coups de cœur.')
    if (demo) { showDemoToast('Action simulée en mode démo'); return }
    try { await personalAccountActions.removeFavorite(item.id) } catch (err) { setItems(previous); setFeedback(getErrorMessage(err)) }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={load} />
  const categories = ['Tout', ...Array.from(new Set(items.map((item) => item.categoryName).filter(Boolean)))]
  const shown = items.filter((item) => (category === 'Tout' || item.categoryName === category) && (!hideSold || item.status !== 'sold'))

  return (
    <div className="space-y-5">
      {feedback ? <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{feedback}</div> : null}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((name) => <button key={name} onClick={() => setCategory(name)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${category === name ? 'border-ink bg-ink text-white' : 'border-warm-border bg-surface text-ink/65'}`}>{name} · {items.filter((item) => name === 'Tout' || item.categoryName === name).length}</button>)}</div>
        <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink/70"><input type="checkbox" checked={hideSold} onChange={(event) => setHideSold(event.target.checked)} className="h-4 w-4 rounded" /> Masquer les vendues</label>
      </div>
      {shown.length === 0 ? <EmptyState icon={<Heart className="h-6 w-6" />} title="Aucun coup de cœur" body="Explorez les annonces et utilisez le cœur pour les retrouver ici." href="/annonces" action="Parcourir les annonces" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => <article key={item.id} className={`overflow-hidden rounded-[1.75rem] border border-warm-border bg-surface shadow-sm ${item.status === 'sold' ? 'opacity-65' : ''}`}>
            <Link href={`/annonces/${item.id}`} className="relative flex aspect-[4/3] items-center justify-center bg-sand text-ink/25">{item.coverImage ? <img src={item.coverImage} alt="" className="h-full w-full object-cover" /> : <Heart className="h-9 w-9" />}{item.status === 'sold' ? <span className="absolute left-3 top-3 rounded-full bg-night px-2.5 py-1 text-xs font-semibold text-white">Vendue</span> : null}{item.priceDropXpf ? <span className="absolute left-3 top-3 rounded-full bg-sunset px-2.5 py-1 text-xs font-semibold text-ink">−{item.priceDropXpf.toLocaleString('fr-FR')} XPF (démo)</span> : null}</Link>
            <div className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">{item.categoryName || 'Annonce'}</p><Link href={`/annonces/${item.id}`} className="mt-1 block font-display text-lg font-bold text-ink">{item.title}</Link><p className="mt-2 font-semibold text-ink">{formatXpf(item.price)}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-ink/50"><MapPin className="h-3.5 w-3.5" /> {item.communeName || 'Nouvelle-Calédonie'}</p><button type="button" onClick={() => void remove(item)} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-warm-border text-sm font-semibold text-ink"><Heart className="h-4 w-4 fill-rust text-rust" /> Retirer</button></div>
          </article>)}
        </div>
      )}
    </div>
  )
}

function OffersView({ session, demo }: { session: AccountSession; demo: boolean }) {
  const [offers, setOffers] = useState<PersonalOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [countering, setCountering] = useState<PersonalOffer | null>(null)
  const [counterValue, setCounterValue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setOffers(await getPersonalOffers(session)) } catch (err) { setError(getErrorMessage(err)) } finally { setLoading(false) }
  }, [session])
  useEffect(() => { void load() }, [load])

  const decide = async (offer: PersonalOffer, decision: 'accepted' | 'declined' | 'countered') => {
    setBusyId(offer.id); setFeedback(null)
    try {
      if (!demo) {
        if (offer.kind === 'price') await personalAccountActions.respondPriceOffer(offer.id, decision, decision === 'countered' ? Number(counterValue) : undefined)
        else if (decision === 'accepted') await personalAccountActions.acceptTroc(offer.id)
        else if (decision === 'declined') await personalAccountActions.declineTroc(offer.id)
        else await personalAccountActions.counterTroc(offer.id, counterValue)
      } else showDemoToast('Action simulée en mode démo')
      setOffers((current) => current.map((item) => item.id === offer.id ? { ...item, status: decision } : item))
      setFeedback(decision === 'accepted' ? 'Offre acceptée : le membre est prévenu.' : decision === 'declined' ? 'Offre refusée.' : 'Contre-proposition envoyée.')
      setCountering(null); setCounterValue('')
    } catch (err) { setFeedback(getErrorMessage(err)) } finally { setBusyId(null) }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      {feedback ? <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{feedback}</div> : null}
      {offers.length === 0 ? <EmptyState icon={<Inbox className="h-6 w-6" />} title="Aucune offre reçue" body="Les offres de prix et propositions de troc apparaîtront ici." href="/profil/annonces" action="Voir mes annonces" /> : offers.map((offer) => {
        const pending = ['pending', 'seen'].includes(offer.status)
        const difference = offer.kind === 'price' && offer.askingXpf ? Math.round(((offer.offeredXpf - offer.askingXpf) / offer.askingXpf) * 100) : null
        const offeredBalance = offer.kind === 'troc' && offer.offeredValueXpf != null && offer.requestedValueXpf != null
          ? offer.offeredValueXpf + (offer.complementDirection === 'i_pay' ? offer.complementXpf : offer.complementDirection === 'they_pay' ? -offer.complementXpf : 0) - offer.requestedValueXpf
          : null
        return <article key={`${offer.kind}-${offer.id}`} className={`rounded-[2rem] border border-warm-border bg-surface p-5 shadow-sm ${pending ? '' : 'opacity-75'}`}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${offer.kind === 'troc' ? 'bg-ink text-white' : 'bg-accent text-ink'}`}>{offer.kind === 'troc' ? 'Troc' : 'Offre de prix'}</span><span className="text-xs text-ink/45">{formatDate(offer.createdAt)}</span></div>
              <h2 className="mt-2 font-display text-xl font-bold text-ink">{offer.listingTitle}</h2>
              <p className="mt-1 text-sm text-ink/60">Proposition de <strong className="text-ink">{offer.personName}</strong></p>
              {offer.kind === 'price' ? <div className="mt-4 flex flex-wrap items-end gap-3"><p className="text-2xl font-bold text-rust">{formatXpf(offer.offeredXpf)}</p>{offer.askingXpf != null ? <p className="pb-1 text-sm text-ink/50">Prix demandé : {formatXpf(offer.askingXpf)}</p> : null}{difference != null ? <span className={`mb-1 rounded-full px-2 py-1 text-xs font-semibold ${difference < -20 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>{difference}%</span> : null}</div> : <div className="mt-4 rounded-2xl bg-sand/70 p-4"><p className="font-semibold text-ink">{offer.offeredListingTitle || offer.offeredDescription}</p>{offer.offeredListingTitle ? <p className="mt-1 text-sm text-ink/60">{offer.offeredDescription}</p> : null}{offer.complementXpf > 0 ? <p className="mt-2 text-sm font-semibold text-rust">Complément : {formatXpf(offer.complementXpf)}</p> : null}{offeredBalance != null ? <p className="mt-2 text-xs font-semibold text-ink/55">Écart calculé sur les valeurs renseignées : {offeredBalance > 0 ? '+' : ''}{formatXpf(offeredBalance)}</p> : <p className="mt-2 text-xs text-ink/45">Balance indisponible : une valeur réelle manque.</p>}</div>}
            </div>
            <Link href="/messages" className="inline-flex items-center gap-2 text-sm font-semibold text-rust"><Mail className="h-4 w-4" /> Échanger par message</Link>
          </div>
          {pending ? <div className="mt-5 flex flex-wrap gap-2"><button disabled={busyId === offer.id} onClick={() => void decide(offer, 'accepted')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-jungle px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" /> Accepter</button><button onClick={() => { setCountering(offer); setCounterValue(offer.kind === 'price' ? String(offer.askingXpf || '') : '') }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-warm-border px-4 py-2 text-sm font-semibold text-ink"><Repeat2 className="h-4 w-4" /> Contre-proposer</button><button disabled={busyId === offer.id} onClick={() => void decide(offer, 'declined')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><X className="h-4 w-4" /> Refuser</button></div> : <p className="mt-5 text-sm font-semibold text-ink/55">Statut : {offer.status}</p>}
          {countering?.id === offer.id && countering.kind === offer.kind ? <div className="mt-4 rounded-2xl border border-rust/20 bg-orange-50/50 p-4"><label className="text-sm font-semibold text-ink">{offer.kind === 'price' ? 'Montant de la contre-offre (XPF)' : 'Votre contre-proposition'}</label>{offer.kind === 'price' ? <input type="number" min="1" value={counterValue} onChange={(event) => setCounterValue(event.target.value)} className="input mt-2" /> : <textarea value={counterValue} onChange={(event) => setCounterValue(event.target.value)} rows={3} className="input mt-2" placeholder="Décrivez ce que vous proposez en échange" />}<div className="mt-3 flex gap-2"><button disabled={!counterValue.trim() || busyId === offer.id} onClick={() => void decide(offer, 'countered')} className="rounded-full bg-rust px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Envoyer</button><button onClick={() => setCountering(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60">Annuler</button></div></div> : null}
        </article>
      })}
    </div>
  )
}

export default function PersonalAccountPage({ activeTab }: { activeTab: PersonalAccountTab }) {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const meta = TAB_META[activeTab]
  const session = user as AccountSession | null
  const demo = DEMO || String(user?.id || '').startsWith('demo-')
  const tabs = useMemo(() => TABS, [])

  return (
    <main className="min-h-screen bg-page text-ink">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        {!hasHydrated ? <PageSkeleton /> : !isAuthenticated || !session ? (
          <div className="rounded-[2rem] border border-warm-border bg-surface p-8 text-center shadow-sm">
            <h1 className="font-display text-3xl font-bold">Connectez-vous à votre espace</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-ink/60">Vos annonces, favoris, alertes et offres sont réservés à votre compte.</p>
            <Link href={`/connexion?next=/profil/${activeTab === 'favorites' ? 'favoris' : activeTab === 'alerts' ? 'alertes' : activeTab === 'offers' ? 'offres' : 'annonces'}`} className="btn-primary mt-5 inline-flex rounded-full px-5 py-2.5">Se connecter</Link>
          </div>
        ) : (
          <>
            <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-rust">Espace particulier</p><h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">{meta.title}</h1><p className="mt-2 text-sm text-ink/55 sm:text-base">{meta.subtitle}</p></div>
            <div className="mb-7 rounded-[1.5rem] border border-warm-border bg-surface px-2 shadow-sm"><AccountTabs items={tabs} activeId={activeTab} label="Espace particulier" /></div>
            {activeTab === 'listings' ? <ListingsView session={session} demo={demo} /> : null}
            {activeTab === 'favorites' ? <FavoritesView session={session} demo={demo} /> : null}
            {activeTab === 'alerts' ? <PersonalAlertsManager session={session} /> : null}
            {activeTab === 'offers' ? <OffersView session={session} demo={demo} /> : null}
          </>
        )}
      </section>
    </main>
  )
}
