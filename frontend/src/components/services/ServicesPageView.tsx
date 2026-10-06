'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Box,
  Briefcase,
  Camera,
  Check,
  ChevronRight,
  HelpCircle,
  Clock3,
  FileText,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
  Star,
  Truck,
  UserRound,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import {
  createQuoteRequest,
  createShippingRequest,
  estimateShipping,
  getQuoteRequests,
  getRouteMembers,
  getServicesCatalog,
  getShippingRequests,
  selectQuoteOffer,
  selectShippingOffer,
} from '@/lib/data/services'
import { filterAndSortPros, formatXpf, shippingPriceLabel, type ProSort } from '@/lib/servicesPresentation'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type {
  QuoteDraft,
  QuoteRequest,
  RouteMember,
  ServicesCatalog,
  ServicesTab,
  ShippingDraft,
  ShippingEstimate,
  ShippingRequest,
  ShippingSize,
} from '@/types/services'

const emptyCatalog: ServicesCatalog = { categories: [], communes: [], pros: [] }
const fieldClass = 'min-h-12 w-full rounded-field border border-warm-border bg-cream px-4 text-base text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10'
const tabs: Array<{ id: ServicesTab; label: string; icon: typeof FileText }> = [
  { id: 'devis', label: 'Faire un devis', icon: FileText },
  { id: 'pros', label: 'Professionnels', icon: Briefcase },
  { id: 'envoi', label: 'Envoi et livraison', icon: Box },
]
const heroCopy: Record<ServicesTab, { eyebrow: string; title: string; body: string }> = {
  devis: { eyebrow: 'Faire un devis', title: 'Un besoin précis, des offres comparables.', body: 'Décrivez votre projet et recevez les propositions des professionnels disponibles sur Kalico.' },
  pros: { eyebrow: 'Professionnels', title: 'Trouvez le bon savoir-faire près de chez vous.', body: 'Parcourez les professionnels actifs et vérifiés, puis consultez leur vitrine ou démarrez une demande.' },
  envoi: { eyebrow: 'Envoi et livraison', title: 'Préparez un envoi avec des informations fiables.', body: 'Consultez une estimation issue du serveur, les membres sur le même axe et les offres reçues.' },
}
const shippingSizes: Array<{ id: ShippingSize; label: string; body: string }> = [
  { id: 'small', label: 'Petit', body: 'Moins de 10 kg' },
  { id: 'medium', label: 'Moyen', body: '10 à 50 kg' },
  { id: 'large', label: 'Grand', body: '50 à 200 kg' },
  { id: 'oversize', label: 'Hors gabarit', body: 'Plus de 200 kg' },
]

function initialQuoteDraft(): QuoteDraft {
  return { categorySlug: '', commune: '', title: '', description: '', budgetMaxXpf: '', desiredDate: '', contactEmail: '', contactPhone: '' }
}

function initialShippingDraft(): ShippingDraft {
  return { departureCommuneId: '', destinationCommuneId: '', size: 'small', cargoType: '', description: '', urgency: 'flexible', contactEmail: '', contactPhone: '', fragile: false }
}

export default function ServicesPageView() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [tab, setTab] = useState<ServicesTab>('devis')
  const [catalog, setCatalog] = useState<ServicesCatalog>(emptyCatalog)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [shippingRequests, setShippingRequests] = useState<ShippingRequest[]>([])
  const [shippingLoading, setShippingLoading] = useState(false)
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>(initialQuoteDraft)
  const [shippingDraft, setShippingDraft] = useState<ShippingDraft>(initialShippingDraft)

  const requireAuth = useCallback((target: ServicesTab) => {
    openAuthModal({ type: 'login', redirectTo: `/services?onglet=${target}` })
  }, [openAuthModal])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    try {
      const result = await getServicesCatalog()
      setCatalog(result)
      setQuoteDraft((current) => ({
        ...current,
        categorySlug: current.categorySlug || result.categories[0]?.slug || '',
        commune: current.commune || result.communes[0]?.name || '',
      }))
      setShippingDraft((current) => ({
        ...current,
        departureCommuneId: current.departureCommuneId || String(result.communes[0]?.id || ''),
        destinationCommuneId: current.destinationCommuneId || String(result.communes[1]?.id || ''),
      }))
    } catch {
      setCatalogError('Les services sont momentanément indisponibles.')
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  const loadQuotes = useCallback(async () => {
    if (!hasHydrated) return
    setQuotesLoading(true)
    try { setQuotes(await getQuoteRequests(isAuthenticated)) }
    finally { setQuotesLoading(false) }
  }, [hasHydrated, isAuthenticated])

  const loadShippingRequests = useCallback(async () => {
    if (!hasHydrated) return
    setShippingLoading(true)
    try { setShippingRequests(await getShippingRequests(isAuthenticated)) }
    finally { setShippingLoading(false) }
  }, [hasHydrated, isAuthenticated])

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('onglet')
    if (requested === 'devis' || requested === 'pros' || requested === 'envoi') setTab(requested)
    void loadCatalog()
  }, [loadCatalog])
  useEffect(() => { void loadQuotes() }, [loadQuotes])
  useEffect(() => { void loadShippingRequests() }, [loadShippingRequests])
  useEffect(() => {
    if (!user) return
    setQuoteDraft((current) => ({ ...current, contactEmail: current.contactEmail || user.email || '', contactPhone: current.contactPhone || user.telephone || '' }))
    setShippingDraft((current) => ({ ...current, contactEmail: current.contactEmail || user.email || '', contactPhone: current.contactPhone || user.telephone || '' }))
  }, [user])

  const selectTab = (value: ServicesTab) => {
    setTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set('onglet', value)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }
  const hero = heroCopy[tab]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream text-ink">
        <section className="relative overflow-hidden border-b border-warm-border">
          <div className="absolute inset-0 bg-tressage text-ink/5" />
          <div className="relative mx-auto max-w-container px-4 pb-0 pt-12 sm:px-6 lg:px-12 lg:pt-16">
            <p className="text-eyebrow uppercase text-accent-text">Services, {hero.eyebrow}</p>
            <h1 className="mt-5 max-w-title text-balance font-display text-h1-form sm:text-h1">{hero.title}</h1>
            <p className="mt-5 max-w-prose text-pretty text-body-lg text-ink/70">{hero.body}</p>
            <div className="mt-9 flex gap-1 overflow-x-auto" role="tablist" aria-label="Services Kalico">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => selectTab(id)} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-label font-semibold ${tab === id ? 'border-accent-strong text-ink' : 'border-transparent text-ink/60 hover:text-ink'}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {catalogLoading ? <PageSkeleton /> : catalogError ? <ErrorState text={catalogError} retry={() => void loadCatalog()} /> : (
          <section className="mx-auto max-w-container px-4 py-9 sm:px-6 lg:px-12">
            {tab === 'devis' ? <QuoteTab catalog={catalog} draft={quoteDraft} setDraft={setQuoteDraft} requests={quotes} loading={quotesLoading} authenticated={isAuthenticated} requireAuth={() => requireAuth('devis')} reload={loadQuotes} /> : null}
            {tab === 'pros' ? <ProsTab catalog={catalog} openQuote={() => selectTab('devis')} /> : null}
            {tab === 'envoi' ? <ShippingTab catalog={catalog} draft={shippingDraft} setDraft={setShippingDraft} requests={shippingRequests} requestsLoading={shippingLoading} authenticated={isAuthenticated} requireAuth={() => requireAuth('envoi')} reload={loadShippingRequests} /> : null}
          </section>
        )}
      </main>
    </>
  )
}

function QuoteTab({ catalog, draft, setDraft, requests, loading, authenticated, requireAuth, reload }: { catalog: ServicesCatalog; draft: QuoteDraft; setDraft: React.Dispatch<React.SetStateAction<QuoteDraft>>; requests: QuoteRequest[]; loading: boolean; authenticated: boolean; requireAuth: () => void; reload: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<number | null>(null)
  const selectedCategory = catalog.categories.find((category) => category.slug === draft.categorySlug)
  const matchingPros = catalog.pros.filter((pro) => (!selectedCategory || pro.category === selectedCategory.name) && (!draft.commune || pro.commune === draft.commune))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)
    if (!authenticated) return requireAuth()
    setSubmitting(true)
    try {
      await createQuoteRequest(draft)
      setStatus('Votre demande a été envoyée.')
      setDraft((current) => ({ ...initialQuoteDraft(), categorySlug: current.categorySlug, commune: current.commune, contactEmail: current.contactEmail, contactPhone: current.contactPhone }))
      await reload()
    } catch { setStatus('Impossible d’envoyer la demande pour le moment.') }
    finally { setSubmitting(false) }
  }

  const chooseOffer = async (requestId: number, offerId: number) => {
    setSelecting(offerId)
    try { await selectQuoteOffer(requestId, offerId); await reload() }
    finally { setSelecting(null) }
  }

  return <div className="space-y-12">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <form id="service-quote-form" onSubmit={submit} className="space-y-5">
        <FormSection number="1" title="De quoi avez-vous besoin ?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Métier"><select required value={draft.categorySlug} onChange={(event) => setDraft((current) => ({ ...current, categorySlug: event.target.value }))} className={fieldClass}>{catalog.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></Field>
            <Field label="Titre de la demande"><input required minLength={2} maxLength={100} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className={fieldClass} placeholder="Résumez votre besoin" /></Field>
          </div>
          <Field label="Description" hint={`${draft.description.length} / 5 000`}><textarea required minLength={2} maxLength={5000} rows={6} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={`${fieldClass} py-3`} placeholder="Précisez les travaux, dimensions et contraintes utiles." /></Field>
          <div className="rounded-card border border-dashed border-warm-border bg-cream p-4" aria-disabled="true">
            <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-cream-sunken text-accent-text"><Camera className="h-5 w-5" /></span><div><p className="text-label font-semibold">Photos bientôt disponibles</p><p className="mt-1 text-body-sm text-ink/60">Le contrat devis actuel ne permet pas encore de joindre des images. Aucun fichier ne sera envoyé silencieusement.</p></div></div>
          </div>
        </FormSection>
        <FormSection number="2" title="Où et quand ?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Commune"><select required value={draft.commune} onChange={(event) => setDraft((current) => ({ ...current, commune: event.target.value }))} className={fieldClass}>{catalog.communes.map((commune) => <option key={commune.id} value={commune.name}>{commune.name}</option>)}</select></Field>
            <Field label="Date souhaitée"><input type="date" value={draft.desiredDate} onChange={(event) => setDraft((current) => ({ ...current, desiredDate: event.target.value }))} className={fieldClass} /></Field>
            <Field label="Budget maximal" hint="Facultatif"><input type="number" min={0} step={1000} value={draft.budgetMaxXpf} onChange={(event) => setDraft((current) => ({ ...current, budgetMaxXpf: event.target.value }))} className={fieldClass} placeholder="Montant en XPF" /></Field>
            <Field label="Téléphone" hint="Facultatif"><input value={draft.contactPhone} onChange={(event) => setDraft((current) => ({ ...current, contactPhone: event.target.value }))} className={fieldClass} /></Field>
            <div className="sm:col-span-2"><Field label="Adresse e-mail"><input required type="email" value={draft.contactEmail} onChange={(event) => setDraft((current) => ({ ...current, contactEmail: event.target.value }))} className={fieldClass} /></Field></div>
          </div>
        </FormSection>
        {status ? <StatusMessage text={status} success={status.includes('envoyée')} /> : null}
      </form>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="relative overflow-hidden rounded-block bg-ink p-6 text-cream shadow-raised">
          <div className="absolute inset-0 bg-tressage text-cream/5" />
          <div className="relative"><p className="text-eyebrow uppercase text-accent">Votre demande</p><p className="mt-4 font-display text-h2">{matchingPros.length}</p><p className="mt-1 text-body-sm text-cream/75">professionnel{matchingPros.length > 1 ? 's' : ''} chargé{matchingPros.length > 1 ? 's' : ''} correspondent actuellement au métier et à la commune.</p><dl className="mt-6 space-y-3 border-t border-cream/15 pt-5"><SummaryLine label="Service" value={selectedCategory?.name || 'À choisir'} /><SummaryLine label="Commune" value={draft.commune || 'À choisir'} /><SummaryLine label="Date" value={draft.desiredDate ? formatDate(draft.desiredDate) : 'Flexible'} /><SummaryLine label="Budget" value={draft.budgetMaxXpf ? formatXpf(Number(draft.budgetMaxXpf)) : 'Non précisé'} /></dl><Button type="submit" form="service-quote-form" loading={submitting} loadingLabel="Envoi…" className="mt-6 w-full"><Send className="h-4 w-4" />Envoyer ma demande</Button><p className="mt-3 text-meta text-cream/60">Le nombre maximal d’offres n’est pas configurable dans le contrat actuel.</p></div>
        </div>
      </aside>
    </div>

    <section>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-text">Mes demandes</p><h2 className="mt-2 font-display text-h2">Comparer les offres reçues</h2></div><Link href="/appels-offres" className="k-button k-button-secondary">Toutes mes demandes<ArrowRight className="h-4 w-4" /></Link></div>
      {loading ? <ListSkeleton /> : !authenticated ? <EmptyState icon={<UserRound />} title="Connectez-vous pour retrouver vos devis" body="Vos demandes et les offres reçues seront regroupées ici." action={<Button onClick={requireAuth}>Se connecter</Button>} /> : requests.length ? <div className="mt-6 space-y-5">{requests.map((request) => <QuoteRequestCard key={request.id} request={request} selecting={selecting} chooseOffer={chooseOffer} />)}</div> : <EmptyState icon={<FileText />} title="Aucune demande envoyée" body="Complétez le formulaire pour recevoir vos premières offres." />}
    </section>
  </div>
}

function QuoteRequestCard({ request, selecting, chooseOffer }: { request: QuoteRequest; selecting: number | null; chooseOffer: (requestId: number, offerId: number) => Promise<void> }) {
  return <article className="overflow-hidden rounded-block border border-warm-border bg-cream-surface shadow-card"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-warm-border p-5"><div><p className="text-meta font-semibold uppercase text-accent-text">{request.categoryName}, {request.commune}</p><h3 className="mt-2 font-display text-h3">{request.title}</h3><p className="mt-2 text-body-sm text-ink/60">{request.offerCount} offre{request.offerCount > 1 ? 's' : ''} reçue{request.offerCount > 1 ? 's' : ''}, demande {request.status === 'open' ? 'ouverte' : 'fermée'}</p></div><Link href={`/appels-offres/${request.id}`} className="k-button k-button-tertiary">Voir le détail<ChevronRight className="h-4 w-4" /></Link></div>{request.offers.length ? <div className="grid gap-px bg-warm-border md:grid-cols-2 xl:grid-cols-3">{request.offers.map((offer) => <div key={offer.id} className="bg-cream-surface p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-label font-semibold">{offer.proName}</p><p className="mt-1 flex items-center gap-1 text-body-sm text-ink/60"><Star className="h-4 w-4" />{offer.proRating ? offer.proRating.toLocaleString('fr-FR') : 'Sans note'}</p></div><span className="rounded-pill bg-cream-sunken px-3 py-1 text-meta font-semibold">{offer.status === 'selected' ? 'Choisie' : 'Reçue'}</span></div><p className="mt-5 font-display text-h3">{formatXpf(offer.amountXpf)}</p><p className="mt-2 flex items-center gap-2 text-body-sm text-ink/65"><Clock3 className="h-4 w-4" />Intervention sous {offer.delayDays} jour{offer.delayDays > 1 ? 's' : ''}</p>{offer.message ? <p className="mt-3 text-body-sm text-ink/60">{offer.message}</p> : null}<Button className="mt-5 w-full" variant={offer.status === 'selected' ? 'secondary' : 'primary'} disabled={request.status !== 'open' || offer.status === 'selected'} loading={selecting === offer.id} onClick={() => void chooseOffer(request.id, offer.id)}>{offer.status === 'selected' ? <><Check className="h-4 w-4" />Offre choisie</> : 'Choisir cette offre'}</Button></div>)}</div> : <p className="p-6 text-body text-ink/60">Les offres apparaîtront ici dès leur réception.</p>}</article>
}

function ProsTab({ catalog, openQuote }: { catalog: ServicesCatalog; openQuote: () => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [commune, setCommune] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [sort, setSort] = useState<ProSort>('rating')
  const proCategories = useMemo(() => Array.from(new Set(catalog.pros.map((pro) => pro.category))).sort((left, right) => left.localeCompare(right, 'fr-FR')), [catalog.pros])
  const shown = useMemo(() => filterAndSortPros(catalog.pros, { query, category, commune, verifiedOnly, sort }), [catalog.pros, query, category, commune, verifiedOnly, sort])

  return <div><div className="rounded-block border border-warm-border bg-cream-surface p-3 shadow-card"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_16rem]"><label className="relative"><span className="sr-only">Rechercher un professionnel</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/45" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${fieldClass} pl-12`} placeholder="Métier ou entreprise" /></label><select aria-label="Métier" value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}><option value="">Tous les métiers</option>{proCategories.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Commune" value={commune} onChange={(event) => setCommune(event.target.value)} className={fieldClass}><option value="">Toutes les communes</option>{catalog.communes.map((value) => <option key={value.id} value={value.name}>{value.name}</option>)}</select></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setVerifiedOnly((value) => !value)} className={`flex min-h-11 items-center gap-2 rounded-pill px-4 text-label-sm font-semibold ${verifiedOnly ? 'bg-ink text-cream' : 'border border-warm-border bg-cream-surface text-ink'}`}><BadgeCheck className="h-4 w-4" />Professionnels vérifiés</button><span className="flex min-h-11 items-center gap-2 rounded-pill border border-warm-border px-4 text-label-sm text-ink/55" title="Cette donnée n’est pas fournie par l’API"><HelpCircle className="h-4 w-4" />Délai de réponse non disponible</span></div><select aria-label="Trier les professionnels" value={sort} onChange={(event) => setSort(event.target.value as ProSort)} className="min-h-11 rounded-control border border-warm-border bg-cream-surface px-4 text-base"><option value="rating">Mieux notés</option><option value="reviews">Plus d’avis</option><option value="name">Nom</option></select></div><div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-text">Annuaire</p><h2 className="mt-2 font-display text-h2">{shown.length} professionnel{shown.length > 1 ? 's' : ''}</h2></div></div>{shown.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{shown.map((pro) => <article key={pro.id} className="flex min-w-0 flex-col rounded-block border border-warm-border bg-cream-surface p-5 shadow-card"><div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-card bg-cream-sunken font-display text-h3 text-accent-text">{pro.logoUrl ? <img src={pro.logoUrl} alt="" className="h-full w-full object-cover" /> : initials(pro.name)}</span><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-label-lg font-semibold">{pro.name}</h3>{pro.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-reef-text" aria-label="Vérifié" /> : null}</div><p className="mt-1 text-body-sm text-ink/60">{pro.category}</p><p className="mt-2 flex items-center gap-1 text-body-sm text-ink/60"><MapPin className="h-4 w-4" />{pro.commune}</p></div></div><p className="mt-5 line-clamp-3 min-h-[4.5rem] text-body-sm text-ink/65">{pro.description || 'Consultez la vitrine de ce professionnel pour découvrir ses services.'}</p><div className="mt-5 flex flex-wrap gap-3 border-t border-warm-border pt-4 text-body-sm"><span className="flex items-center gap-1 font-semibold"><Star className="h-4 w-4" />{pro.rating ? pro.rating.toLocaleString('fr-FR') : 'Sans note'}</span><span className="text-ink/55">{pro.reviewCount} avis</span><span className="text-ink/55">{pro.listingCount} annonce{pro.listingCount > 1 ? 's' : ''}</span></div><div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2"><Link href={`/pro/${pro.id}`} className="k-button k-button-secondary">Voir la vitrine</Link><Button onClick={openQuote}>Demander un devis</Button></div></article>)}</div> : <EmptyState icon={<Briefcase />} title="Aucun professionnel dans cette zone" body="Modifiez le métier, la commune ou la recherche pour élargir les résultats." />}</div>
}

function ShippingTab({ catalog, draft, setDraft, requests, requestsLoading, authenticated, requireAuth, reload }: { catalog: ServicesCatalog; draft: ShippingDraft; setDraft: React.Dispatch<React.SetStateAction<ShippingDraft>>; requests: ShippingRequest[]; requestsLoading: boolean; authenticated: boolean; requireAuth: () => void; reload: () => Promise<void> }) {
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null)
  const [members, setMembers] = useState<RouteMember[]>([])
  const [estimating, setEstimating] = useState(false)
  const [estimateAttempted, setEstimateAttempted] = useState(false)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<number | null>(null)
  const departure = catalog.communes.find((item) => String(item.id) === draft.departureCommuneId)
  const destination = catalog.communes.find((item) => String(item.id) === draft.destinationCommuneId)
  const sameCommune = Boolean(departure && destination && departure.id === destination.id)

  const compare = async () => {
    setEstimateAttempted(true); setEstimateError(null); setEstimate(null); setMembers([])
    if (!departure || !destination) return setEstimateError('Choisissez un départ et une arrivée.')
    if (sameCommune) return
    setEstimating(true)
    try {
      const [nextEstimate, nextMembers] = await Promise.all([estimateShipping(draft), getRouteMembers(departure.name, destination.name)])
      setEstimate(nextEstimate); setMembers(nextMembers)
    } catch { setEstimateError('L’estimation est momentanément indisponible.') }
    finally { setEstimating(false) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setStatus(null)
    if (!authenticated) return requireAuth()
    if (sameCommune) return setStatus('Choisissez deux communes différentes pour créer une demande de transport.')
    setSubmitting(true)
    try { await createShippingRequest(draft); setStatus('Votre demande d’envoi a été créée.'); await reload() }
    catch { setStatus('Impossible de créer la demande pour le moment.') }
    finally { setSubmitting(false) }
  }

  const chooseOffer = async (requestId: number, offerId: number) => {
    setSelecting(offerId)
    try { await selectShippingOffer(requestId, offerId); await reload() }
    finally { setSelecting(null) }
  }

  return <div className="space-y-12"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]"><form id="service-shipping-form" onSubmit={submit} className="space-y-5"><FormSection number="1" title="Départ et arrivée"><div className="grid gap-4 sm:grid-cols-2"><Field label="Départ"><select required value={draft.departureCommuneId} onChange={(event) => { setDraft((current) => ({ ...current, departureCommuneId: event.target.value })); setEstimateAttempted(false) }} className={fieldClass}><option value="">Choisir</option>{catalog.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</select></Field><Field label="Arrivée"><select required value={draft.destinationCommuneId} onChange={(event) => { setDraft((current) => ({ ...current, destinationCommuneId: event.target.value })); setEstimateAttempted(false) }} className={fieldClass}><option value="">Choisir</option>{catalog.communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</select></Field></div>{sameCommune ? <div className="rounded-card border border-warm-border bg-cream p-4"><p className="text-label font-semibold">Même commune</p><p className="mt-1 text-body-sm text-ink/65">Privilégiez une remise en main propre. Aucun tarif de transport n’est calculé pour ce cas.</p></div> : null}</FormSection><FormSection number="2" title="Quel colis envoyez-vous ?"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{shippingSizes.map((size) => <button key={size.id} type="button" onClick={() => { setDraft((current) => ({ ...current, size: size.id })); setEstimateAttempted(false) }} className={`min-h-24 rounded-card border p-4 text-left ${draft.size === size.id ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream'}`}><span className="block text-label font-semibold">{size.label}</span><span className={`mt-2 block text-body-sm ${draft.size === size.id ? 'text-cream/70' : 'text-ink/55'}`}>{size.body}</span></button>)}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Contenu"><input required value={draft.cargoType} onChange={(event) => setDraft((current) => ({ ...current, cargoType: event.target.value }))} className={fieldClass} placeholder="Ex. cartons, matériel" /></Field><Field label="Délai"><select value={draft.urgency} onChange={(event) => { setDraft((current) => ({ ...current, urgency: event.target.value as ShippingDraft['urgency'] })); setEstimateAttempted(false) }} className={fieldClass}><option value="flexible">Date flexible</option><option value="week">Dans la semaine</option><option value="h24">Dans les 24 h</option></select></Field></div><Field label="Précisions" hint="Facultatif"><textarea rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={`${fieldClass} py-3`} /></Field><label className="flex min-h-11 items-center gap-3 text-label font-semibold"><input type="checkbox" checked={draft.fragile} onChange={(event) => setDraft((current) => ({ ...current, fragile: event.target.checked }))} className="h-5 w-5" />Contenu fragile</label><Button type="button" variant="secondary" loading={estimating} loadingLabel="Estimation…" onClick={() => void compare()}><Search className="h-4 w-4" />Comparer les possibilités</Button>{estimateError ? <StatusMessage text={estimateError} /> : null}</FormSection><FormSection number="3" title="Coordonnées"><div className="grid gap-4 sm:grid-cols-2"><Field label="Adresse e-mail"><input required type="email" value={draft.contactEmail} onChange={(event) => setDraft((current) => ({ ...current, contactEmail: event.target.value }))} className={fieldClass} /></Field><Field label="Téléphone" hint="Facultatif"><input value={draft.contactPhone} onChange={(event) => setDraft((current) => ({ ...current, contactPhone: event.target.value }))} className={fieldClass} /></Field></div></FormSection>{status ? <StatusMessage text={status} success={status.includes('créée')} /> : null}</form><aside className="space-y-5 lg:sticky lg:top-32 lg:self-start"><div className="relative overflow-hidden rounded-block bg-ink p-6 text-cream shadow-raised"><div className="absolute inset-0 bg-tressage text-cream/5" /><div className="relative"><p className="text-eyebrow uppercase text-accent">Votre envoi</p><div className="mt-5 space-y-4"><RouteLine dot="outline" value={departure?.name || 'Départ'} /><div className="ml-2 h-5 border-l border-cream/25" /><RouteLine dot="solid" value={destination?.name || 'Arrivée'} /></div><dl className="mt-6 space-y-3 border-t border-cream/15 pt-5"><SummaryLine label="Gabarit" value={shippingSizes.find((size) => size.id === draft.size)?.label || ''} /><SummaryLine label="Délai" value={draft.urgency === 'h24' ? 'Dans les 24 h' : draft.urgency === 'week' ? 'Dans la semaine' : 'Flexible'} /></dl><div className="mt-6 border-t border-cream/15 pt-5"><p className="text-body-sm text-cream/65">Estimation serveur</p><p className="mt-2 font-display text-h3">{sameCommune ? 'Remise en main propre' : shippingPriceLabel(estimate)}</p>{estimate?.distanceKm != null ? <p className="mt-2 text-body-sm text-cream/60">Distance de référence, {estimate.distanceKm.toLocaleString('fr-FR')} km</p> : null}</div><Button type="submit" form="service-shipping-form" loading={submitting} loadingLabel="Création…" className="mt-6 w-full" disabled={sameCommune}><Send className="h-4 w-4" />Créer la demande</Button></div></div><div className="rounded-block border border-warm-border bg-cream-surface p-5"><p className="text-eyebrow uppercase text-accent-text">Suivi des envois</p><p className="mt-3 text-body-sm text-ink/65">Le statut réel de vos demandes apparaît ci-dessous. Le suivi par référence et la chronologie détaillée ne sont pas encore fournis par l’API.</p></div></aside></div>

    {estimateAttempted && !sameCommune ? <section><p className="text-eyebrow uppercase text-accent-text">Possibilités</p><h2 className="mt-2 font-display text-h2">Pour cet axe</h2><div className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-block border border-ink bg-cream-surface p-6 shadow-card"><div className="flex items-start justify-between gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-card bg-cream-sunken text-accent-text"><Truck className="h-6 w-6" /></span><span className="rounded-pill bg-ink px-3 py-1 text-meta font-semibold text-cream">Source serveur</span></div><h3 className="mt-5 font-display text-h3">Demande aux transporteurs</h3><p className="mt-2 text-body-sm text-ink/65">Une estimation indicative, puis des offres émises par les transporteurs vérifiés.</p><p className="mt-5 font-display text-h3">{shippingPriceLabel(estimate)}</p></article><article className="rounded-block border border-warm-border bg-cream-surface p-6 shadow-card"><div className="flex items-start justify-between gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-card bg-cream-sunken text-reef-text"><UserRound className="h-6 w-6" /></span><span className="text-meta text-ink/55">{members.length} membre{members.length > 1 ? 's' : ''}</span></div><h3 className="mt-5 font-display text-h3">Membres qui font la route</h3><p className="mt-2 text-body-sm text-ink/65">Contactez un conducteur dont le trajet correspond. Le prix du trajet n’est pas présenté comme un tarif de colis.</p>{members.length ? <div className="mt-5 space-y-3">{members.map((member) => <Link key={member.id} href={`/covoiturage/${member.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-warm-border bg-cream p-3"><span><span className="block text-label font-semibold">{member.driverName}</span><span className="mt-1 block text-body-sm text-ink/55">{formatDate(member.dateIso)}, {member.vehicle || 'véhicule non précisé'}</span></span><ChevronRight className="h-4 w-4" /></Link>)}</div> : <p className="mt-5 text-body-sm text-ink/55">Aucun trajet membre ne correspond actuellement.</p>}</article></div></section> : null}

    <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-text">Demandes et suivi</p><h2 className="mt-2 font-display text-h2">Vos envois récents</h2></div><Link href="/envoi-livraison" className="k-button k-button-secondary">Gérer tous mes envois<ArrowRight className="h-4 w-4" /></Link></div>{requestsLoading ? <ListSkeleton /> : !authenticated ? <EmptyState icon={<PackageCheck />} title="Connectez-vous pour suivre vos demandes" body="Les offres et le statut de vos envois seront regroupés ici." action={<Button onClick={requireAuth}>Se connecter</Button>} /> : requests.length ? <div className="mt-6 grid gap-5 xl:grid-cols-2">{requests.map((request) => <article key={request.id} className="rounded-block border border-warm-border bg-cream-surface p-5 shadow-card"><div className="flex items-start justify-between gap-4"><div><p className="text-meta font-semibold uppercase text-accent-text">Envoi {request.id}</p><h3 className="mt-2 font-display text-h3">{request.departure} vers {request.destination}</h3><p className="mt-2 text-body-sm text-ink/60">{request.cargoType}</p></div><span className="rounded-pill bg-cream-sunken px-3 py-1 text-meta font-semibold">{request.statusLabel}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoTile label="Estimation" value={request.estimatedMinXpf != null && request.estimatedMaxXpf != null ? `${formatXpf(request.estimatedMinXpf)} à ${formatXpf(request.estimatedMaxXpf)}` : 'Tarif sur demande'} /><InfoTile label="Offres reçues" value={String(request.offersCount)} /></div>{request.offers.length ? <div className="mt-5 space-y-3">{request.offers.map((offer) => <div key={offer.id} className="rounded-card border border-warm-border bg-cream p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-label font-semibold">{offer.transporterName}</p><p className="mt-1 text-body-sm text-ink/55">Enlèvement {formatDate(offer.pickupDate)}, {offer.pickupSlot.toLocaleLowerCase('fr-FR')}</p></div><p className="font-display text-h3">{formatXpf(offer.amountXpf)}</p></div><Button className="mt-4 w-full" compact disabled={request.selectedOfferId != null} loading={selecting === offer.id} onClick={() => void chooseOffer(request.id, offer.id)}>{request.selectedOfferId === offer.id ? 'Offre choisie' : 'Choisir cette offre'}</Button></div>)}</div> : null}</article>)}</div> : <EmptyState icon={<Truck />} title="Aucune demande d’envoi" body="Comparez les possibilités puis créez votre première demande." />}</section>
  </div>
}

function FormSection({ number, title, children }: { number: string; title: string; children: ReactNode }) { return <section className="rounded-block border border-warm-border bg-cream-surface p-5 shadow-card sm:p-7"><div className="flex items-baseline gap-3"><span className="font-display text-h3 text-accent-text">{number}</span><h2 className="font-display text-h3">{title}</h2></div><div className="mt-6 space-y-5">{children}</div></section> }
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="block"><span className="mb-2 flex min-h-5 items-center justify-between gap-3 text-label-sm font-semibold text-ink/70"><span>{label}</span>{hint ? <span className="font-normal text-ink/45">{hint}</span> : null}</span>{children}</label> }
function SummaryLine({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 text-body-sm"><dt className="text-cream/60">{label}</dt><dd className="text-right font-semibold">{value}</dd></div> }
function RouteLine({ dot, value }: { dot: 'solid' | 'outline'; value: string }) { return <div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${dot === 'solid' ? 'bg-accent' : 'border-2 border-accent'}`} /><span className="font-display text-h3">{value}</span></div> }
function InfoTile({ label, value }: { label: string; value: string }) { return <div className="rounded-card bg-cream p-4"><p className="text-meta uppercase text-ink/50">{label}</p><p className="mt-2 text-label font-semibold">{value}</p></div> }
function StatusMessage({ text, success = false }: { text: string; success?: boolean }) { return <div role="status" className={`rounded-card border p-4 text-body-sm ${success ? 'border-reef-text/25 bg-reef-soft text-ink' : 'border-alert-error/30 bg-cream-surface text-ink'}`}>{text}</div> }
function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) { return <div className="mt-6 rounded-block border border-dashed border-warm-border bg-cream-surface p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-sunken text-accent-text">{icon}</span><h3 className="mt-4 font-display text-h3">{title}</h3><p className="mx-auto mt-2 max-w-prose text-body-sm text-ink/60">{body}</p>{action ? <div className="mt-5">{action}</div> : null}</div> }
function ErrorState({ text, retry }: { text: string; retry: () => void }) { return <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-12"><div className="rounded-block border border-alert-error/30 bg-cream-surface p-8 text-center" role="alert"><RefreshCw className="mx-auto h-8 w-8 text-accent-text" /><p className="mt-4 text-body">{text}</p><Button onClick={retry} className="mt-5">Réessayer</Button></div></section> }
function PageSkeleton() { return <section className="mx-auto grid max-w-container gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-12"><div className="space-y-5">{[0, 1].map((item) => <div key={item} className="h-72 animate-pulse rounded-block bg-cream-sunken" />)}</div><div className="h-96 animate-pulse rounded-block bg-cream-sunken" /></section> }
function ListSkeleton() { return <div className="mt-6 grid gap-5 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-56 animate-pulse rounded-block bg-cream-sunken" />)}</div> }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date à confirmer' : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Noumea' }).format(date) }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toLocaleUpperCase('fr-FR')).join('') || 'K' }
