'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  FilterX,
  MapPin,
  MessageSquareQuote,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'

import ProQuoteModal from '@/components/pro/ProQuoteModal'
import { normalizeQuoteTemplate } from '@/components/pro/quoteTemplate'
import { type ProCardModel } from '@/components/pro/ProCard'
import { metaApi, proApi, quoteRequestsApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'

type CategoryNode = {
  name: string
  slug: string
  children?: CategoryNode[]
}

type CommuneItem = {
  id?: number
  name: string
  slug: string
}

type QuoteRequestMineItem = {
  id: number
  mode: 'open' | 'targeted'
  category_slug: string
  category_name: string
  commune: string
  title: string
  description: string
  budget_min_xpf?: number | null
  budget_max_xpf?: number | null
  desired_date?: string | null
  contact_email: string
  contact_phone?: string | null
  status: string
  created_at: string
  updated_at: string
  offer_count: number
}

type RequestFormState = {
  mode: 'open' | 'targeted'
  category_slug: string
  commune: string
  title: string
  description: string
  budget_min_xpf: string
  budget_max_xpf: string
  desired_date: string
  contact_email: string
  contact_phone: string
  target_query: string
  target_pro_ids: number[]
}

function getDisplayName(pro: ProCardModel) {
  return (
    pro.display_name
    || pro.pro_company_name
    || [pro.prenom, pro.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Kalico'
  )
}

function formatDateLabel(value?: string | null) {
  if (!value) return '� pr�ciser'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '� pr�ciser'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return 'Non pr�cis�'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function buildBudgetLabel(min?: number | null, max?: number | null) {
  const minValue = Number(min ?? 0)
  const maxValue = Number(max ?? 0)
  if (minValue > 0 && maxValue > 0) {
    return `${formatMoney(minValue)} - ${formatMoney(maxValue)}`
  }
  if (minValue > 0) {
    return `� partir de ${formatMoney(minValue)}`
  }
  if (maxValue > 0) {
    return `Jusqu� ${formatMoney(maxValue)}`
  }
  return 'Budget non pr�cis�'
}

function getCategoryLabel(categories: CategoryNode[], slug: string) {
  return categories.find((category) => category.slug === slug)?.name || slug
}

function ProQuoteCard({
  pro,
  onRequestQuote,
}: {
  pro: ProCardModel
  onRequestQuote: () => void
}) {
  const displayName = getDisplayName(pro)
  const reviewCount = Number(pro.review_count ?? 0)
  const listingCount = Number(pro.listing_count ?? 0)

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="h-20 bg-[linear-gradient(135deg,_rgba(8,32,50,0.95),_rgba(10,126,164,0.55))]" />
      <div className="-mt-6 px-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm">
            {pro.pro_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pro.pro_logo_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#0A7EA4]">
                {displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2) || 'P'}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            V�rifi�
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-night">{displayName}</h3>
            <p className="mt-1 text-xs text-night/60">{pro.pro_category || 'Professionnel local'}</p>
          </div>
          <div className="text-right text-xs text-night/60">
            <p className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
              <MapPin className="h-3.5 w-3.5 text-coral" />
              {pro.pro_commune || 'Nouvelle-Cal�donie'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <MessageSquareQuote className="h-3.5 w-3.5 text-[#0A7EA4]" />
            {reviewCount} avis clients
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#0A7EA4]" />
            {listingCount} annonce{listingCount > 1 ? 's' : ''}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-night/65">
          {pro.pro_description || 'D�couvrir ce professionnel et lui envoyer une demande adapt�e.'}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/pro/${pro.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
          >
            Voir la vitrine
          </Link>
          <button
            type="button"
            onClick={onRequestQuote}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
          >
            Demander un devis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function MyRequestCard({ request }: { request: QuoteRequestMineItem }) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demande envoy�e</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{request.title}</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night/60">
          {formatDateLabel(request.created_at)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Cat�gorie</p>
          <p className="mt-1 font-semibold text-night">{request.category_name}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Commune</p>
          <p className="mt-1 font-semibold text-night">{request.commune}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Budget</p>
          <p className="mt-1 font-semibold text-night">{buildBudgetLabel(request.budget_min_xpf, request.budget_max_xpf)}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Offres re�ues</p>
          <p className="mt-1 font-semibold text-night">{request.offer_count}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          request.status === 'open'
            ? 'bg-emerald-50 text-emerald-700'
            : request.status === 'closed'
              ? 'bg-nc-lagonLight text-nc-lagon'
              : 'bg-slate-100 text-slate-600'
        }`}>
          {request.status === 'open' ? 'En attente' : request.status === 'closed' ? 'Ferm�e' : 'Annul�e'}
        </span>
        <Link
          href={`/appels-offres/${request.id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-white"
        >
          Voir le d�tail
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

export default function AppelsOffresClient() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore()
  const [pros, setPros] = useState<ProCardModel[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [communes, setCommunes] = useState<CommuneItem[]>([])
  const [loadingDirectory, setLoadingDirectory] = useState(true)
  const [loadingMine, setLoadingMine] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [communeFilter, setCommuneFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [myRequests, setMyRequests] = useState<QuoteRequestMineItem[]>([])
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [selectedPro, setSelectedPro] = useState<ProCardModel | null>(null)
  const [requestForm, setRequestForm] = useState<RequestFormState>({
    mode: 'open',
    category_slug: '',
    commune: '',
    title: '',
    description: '',
    budget_min_xpf: '',
    budget_max_xpf: '',
    desired_date: '',
    contact_email: '',
    contact_phone: '',
    target_query: '',
    target_pro_ids: [],
  })

  useEffect(() => {
    if (!user) return
    setRequestForm((current) => ({
      ...current,
      contact_email: current.contact_email || user.email || '',
      contact_phone: current.contact_phone || user.telephone || '',
    }))
  }, [user])

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoadingDirectory(true)
      try {
        const [prosResponse, communesResponse, categoriesResponse] = await Promise.all([
          proApi.list({ limit: 120 }),
          metaApi.getCommunes(),
          metaApi.getCategories(),
        ])

        if (!alive) return

        setPros(Array.isArray(prosResponse.data?.data) ? prosResponse.data.data : [])
        setCommunes(Array.isArray(communesResponse.data?.data) ? communesResponse.data.data : [])
        setCategories(Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [])
      } catch {
        if (!alive) return
        setPros([])
        setCommunes([])
        setCategories([])
      } finally {
        if (alive) setLoadingDirectory(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    const loadMine = async () => {
      if (!hasHydrated) return
      if (!isAuthenticated) {
        setMyRequests([])
        setLoadingMine(false)
        return
      }

      setLoadingMine(true)
      try {
        const response = await quoteRequestsApi.getMine()
        if (!alive) return
        setMyRequests(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setMyRequests([])
      } finally {
        if (alive) setLoadingMine(false)
      }
    }

    void loadMine()
    return () => {
      alive = false
    }
  }, [hasHydrated, isAuthenticated, user?.id])

  const rootCategories = useMemo(() => categories.filter(Boolean), [categories])

  const filteredPros = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const ratingThreshold = Number(minRating || 0)

    return pros.filter((pro) => {
      const haystack = [
        getDisplayName(pro),
        pro.pro_category,
        pro.pro_commune,
        pro.pro_description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false
      if (categoryFilter && pro.pro_category !== categoryFilter) return false
      if (communeFilter && pro.pro_commune !== communeFilter) return false
      if (ratingThreshold > 0 && Number(pro.avg_rating ?? 0) < ratingThreshold) return false
      return true
    })
  }, [categoryFilter, communeFilter, minRating, pros, query])

  const targetFilteredPros = useMemo(() => {
    const normalized = requestForm.target_query.trim().toLowerCase()
    return pros
      .filter((pro) => {
        if (!normalized) return true
        const haystack = [
          getDisplayName(pro),
          pro.pro_category,
          pro.pro_commune,
          pro.pro_description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalized)
      })
      .slice(0, 8)
  }, [pros, requestForm.target_query])

  const selectedTargetPros = useMemo(
    () => pros.filter((pro) => requestForm.target_pro_ids.includes(Number(pro.id))),
    [pros, requestForm.target_pro_ids]
  )

  const handleCreateRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!requestForm.category_slug) {
      showToast({
        tone: 'error',
        title: 'Cat�gorie requise',
        message: 'Choisissez une cat�gorie principale.',
      })
      return
    }

    if (!requestForm.commune.trim()) {
      showToast({
        tone: 'error',
        title: 'Commune requise',
        message: 'Choisissez une commune.',
      })
      return
    }

    if (!requestForm.title.trim() || !requestForm.description.trim()) {
      showToast({
        tone: 'error',
        title: 'Titre ou description manquants',
        message: 'Ajoutez un r�sum� et une description pour votre demande.',
      })
      return
    }

    if (!requestForm.contact_email.trim()) {
      showToast({
        tone: 'error',
        title: 'Email requis',
        message: 'Ajoutez un email de contact pour recevoir les r�ponses.',
      })
      return
    }

    if (requestForm.mode === 'targeted' && requestForm.target_pro_ids.length === 0) {
      showToast({
        tone: 'error',
        title: 'Pros cibl�s manquants',
        message: 'S�lectionnez jusqu� 5 professionnels.',
      })
      return
    }

    try {
      const payload = {
        mode: requestForm.mode,
        category_slug: requestForm.category_slug,
        commune: requestForm.commune.trim(),
        title: requestForm.title.trim(),
        description: requestForm.description.trim(),
        budget_min_xpf: requestForm.budget_min_xpf.trim() ? Number(requestForm.budget_min_xpf) : null,
        budget_max_xpf: requestForm.budget_max_xpf.trim() ? Number(requestForm.budget_max_xpf) : null,
        desired_date: requestForm.desired_date || null,
        contact_email: requestForm.contact_email.trim(),
        contact_phone: requestForm.contact_phone.trim() || null,
        ...(requestForm.mode === 'targeted' ? { target_pro_ids: requestForm.target_pro_ids } : {}),
      }

      const response = await quoteRequestsApi.create(payload)
      const created = response.data?.data
      showToast({
        tone: 'success',
        title: 'Demande publi�e',
        message: 'Votre appel doffres a �t� envoy� aux professionnels concern�s.',
      })

      if (created?.id && isAuthenticated) {
        const mineResponse = await quoteRequestsApi.getMine()
        setMyRequests(Array.isArray(mineResponse.data?.data) ? mineResponse.data.data : [])
      }

      setRequestForm((current) => ({
        ...current,
        mode: 'open',
        category_slug: '',
        commune: '',
        title: '',
        description: '',
        budget_min_xpf: '',
        budget_max_xpf: '',
        desired_date: '',
        target_query: '',
        target_pro_ids: [],
      }))
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Publication impossible',
        message: error?.response?.data?.error || 'Impossible de publier votre demande pour le moment.',
      })
    }
  }

  const toggleTargetPro = (proId: number) => {
    setRequestForm((current) => {
      const exists = current.target_pro_ids.includes(proId)
      if (exists) {
        return {
          ...current,
          target_pro_ids: current.target_pro_ids.filter((id) => id !== proId),
        }
      }
      if (current.target_pro_ids.length >= 5) {
        showToast({
          tone: 'info',
          title: 'Limite atteinte',
          message: 'Vous pouvez cibler jusqu� 5 professionnels.',
        })
        return current
      }
      return {
        ...current,
        target_pro_ids: [...current.target_pro_ids, proId],
      }
    })
  }

  const requestCount = myRequests.length

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Appels doffres</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-night sm:text-4xl">
            Publiez votre besoin, comparez les offres, choisissez librement.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-night/60">
            D�crivez votre demande une seule fois. Selon le mode choisi, Kalico la diffuse � tous les pros actifs de la cat�gorie ou uniquement � une s�lection cibl�e.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Cr�er une demande</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Ouvert � tous les pros ou cibl�</h2>
            </div>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1 text-xs font-semibold text-night/60">
              R�ponses libres, pas de timer
            </span>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreateRequest}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-night">Mode de publication</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: 'open', label: 'Ouvert � tous les pros' },
                    { value: 'targeted', label: 'Cibler des pros sp�cifiques' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRequestForm((current) => ({ ...current, mode: item.value as 'open' | 'targeted' }))}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        requestForm.mode === item.value
                          ? 'border-[#0A7EA4]/30 bg-nc-lagonLight text-[#0A7EA4]'
                          : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] text-night/70 hover:text-night'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Cat�gorie *</span>
                <select
                  value={requestForm.category_slug}
                  onChange={(event) => setRequestForm((current) => ({ ...current, category_slug: event.target.value }))}
                  className="input w-full rounded-2xl"
                >
                  <option value="">Choisir une cat�gorie</option>
                  {rootCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Commune *</span>
                <select
                  value={requestForm.commune}
                  onChange={(event) => setRequestForm((current) => ({ ...current, commune: event.target.value }))}
                  className="input w-full rounded-2xl"
                >
                  <option value="">Choisir une commune</option>
                  {communes.map((commune) => (
                    <option key={commune.slug} value={commune.name}>
                      {commune.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-night">Titre du besoin (100 caract�res max) *</span>
                <input
                  value={requestForm.title}
                  onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))}
                  className="input w-full rounded-2xl"
                  maxLength={100}
                  placeholder="R�sum� rapide de ce que vous cherchez"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-night">Description d�taill�e *</span>
                <textarea
                  rows={5}
                  value={requestForm.description}
                  onChange={(event) => setRequestForm((current) => ({ ...current, description: event.target.value }))}
                  className="input w-full rounded-2xl py-3"
                  placeholder="Expliquez le besoin, les contraintes, le lieu, les d�lais..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Budget min en XPF</span>
                <input
                  type="number"
                  min="0"
                  value={requestForm.budget_min_xpf}
                  onChange={(event) => setRequestForm((current) => ({ ...current, budget_min_xpf: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="0"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Budget max en XPF</span>
                <input
                  type="number"
                  min="0"
                  value={requestForm.budget_max_xpf}
                  onChange={(event) => setRequestForm((current) => ({ ...current, budget_max_xpf: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="0"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Date souhait�e</span>
                <input
                  type="date"
                  value={requestForm.desired_date}
                  onChange={(event) => setRequestForm((current) => ({ ...current, desired_date: event.target.value }))}
                  className="input w-full rounded-2xl"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">T�l�phone</span>
                <input
                  value={requestForm.contact_phone}
                  onChange={(event) => setRequestForm((current) => ({ ...current, contact_phone: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Num�ro de contact"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-night">Email de contact *</span>
                <input
                  type="email"
                  value={requestForm.contact_email}
                  onChange={(event) => setRequestForm((current) => ({ ...current, contact_email: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="vous@exemple.nc"
                />
              </label>
            </div>

            {requestForm.mode === 'targeted' ? (
              <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Ciblage</p>
                    <h3 className="mt-1 text-lg font-bold text-night">Rechercher et s�lectionner des pros</h3>
                    <p className="mt-1 text-sm text-night/60">S�lectionnez jusqu� 5 professionnels.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night/55">
                    {requestForm.target_pro_ids.length}/5
                  </span>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-night">Rechercher un pro</span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                      <input
                        value={requestForm.target_query}
                        onChange={(event) => setRequestForm((current) => ({ ...current, target_query: event.target.value }))}
                        className="input w-full rounded-2xl pl-10"
                        placeholder="Nom, commune, cat�gorie..."
                      />
                    </div>
                  </label>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-night">Pros s�lectionn�s</p>
                    {selectedTargetPros.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTargetPros.map((pro) => (
                          <button
                            key={pro.id}
                            type="button"
                            onClick={() => toggleTargetPro(Number(pro.id))}
                            className="inline-flex items-center gap-2 rounded-full border border-nc-lagon/20 bg-nc-lagonLight px-3 py-1.5 text-xs font-semibold text-[#0A7EA4]"
                          >
                            {getDisplayName(pro)}
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-night/55">Aucun professionnel s�lectionn�.</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {targetFilteredPros.map((pro) => {
                    const selected = requestForm.target_pro_ids.includes(Number(pro.id))
                    return (
                      <button
                        key={pro.id}
                        type="button"
                        onClick={() => toggleTargetPro(Number(pro.id))}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? 'border-[#0A7EA4]/30 bg-nc-lagonLight'
                            : 'border-[var(--color-border)] bg-white hover:border-[#0A7EA4]/20'
                        }`}
                      >
                        <p className="font-semibold text-night">{getDisplayName(pro)}</p>
                        <p className="mt-1 text-xs text-night/55">{pro.pro_category || 'Professionnel local'}</p>
                        <p className="mt-1 text-xs text-night/45">{pro.pro_commune || 'Nouvelle-Cal�donie'}</p>
                      </button>
                    )
                  })}
                  {targetFilteredPros.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-4 py-5 text-sm text-night/55 md:col-span-2 xl:col-span-4">
                      Aucun professionnel trouv� dans cette s�lection.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-night/55">
                {requestForm.mode === 'open'
                  ? 'Votre demande sera envoy�e aux pros actifs de la cat�gorie choisie.'
                  : 'Votre demande sera envoy�e uniquement aux professionnels cibl�s.'}
              </p>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
              >
                Publier ma demande
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </article>

        <aside className="space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Mode comp�titif</p>
              <h2 className="mt-1 font-display text-xl font-bold text-night">Le demandeur choisit librement</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { title: 'Open', desc: 'Diffusion aupr�s des pros actifs de la cat�gorie.', icon: UserPlus },
              { title: 'Targeted', desc: 'Diffusion � une s�lection de professionnels.', icon: BadgeCheck },
              { title: 'Libre', desc: 'Pas de timer, pas dattribution automatique.', icon: FilterX },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-night">
                    <Icon className="h-4 w-4 text-[#0A7EA4]" />
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-night/60">{item.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 text-sm text-night/60">
            D�posez une demande structur�e, comparez les offres re�ues, puis choisissez le pro qui vous convient.
          </div>
        </aside>
      </section>

      <section id="mes-demandes" className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Mes demandes en cours</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Suivez vos publications et le nombre doffres re�ues</h2>
          </div>
          <span className="text-sm text-night/55">
            {requestCount} demande{requestCount > 1 ? 's' : ''}
          </span>
        </div>

        {!hasHydrated || !isAuthenticated ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
            <p className="text-lg font-semibold text-night">Connectez-vous pour suivre vos demandes.</p>
            <p className="mt-2 text-sm text-night/55">Les demandes cr��es avec votre compte appara�tront ici avec le nombre doffres re�ues.</p>
            <div className="mt-5 flex justify-center">
              <Link href="/connexion?next=/appels-offres" className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white">
                Se connecter
              </Link>
            </div>
          </div>
        ) : loadingMine ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[1.75rem] bg-sand/70" />
            ))}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
            <p className="text-lg font-semibold text-night">Aucune demande pour linstant.</p>
            <p className="mt-2 text-sm text-night/55">Publiez votre premi�re demande pour commencer � recevoir des offres.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {myRequests.map((request) => (
              <MyRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Annuaire des pros</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Trouvez le bon professionnel puis ouvrez sa vitrine</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategoryFilter('')
                setCommuneFilter('')
                setMinRating('')
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
            >
              <FilterX className="h-4 w-4" />
              R�initialiser
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 md:col-span-2 xl:col-span-2">
            <span className="text-sm font-semibold text-night">Recherche</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input w-full rounded-2xl pl-10"
                placeholder="Nom, commune, cat�gorie, description..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Cat�gorie</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="input w-full rounded-2xl"
            >
              <option value="">Toutes</option>
              {Array.from(new Set(pros.map((pro) => pro.pro_category).filter(Boolean))).map((name) => (
                <option key={name as string} value={name as string}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Commune</span>
            <select
              value={communeFilter}
              onChange={(event) => setCommuneFilter(event.target.value)}
              className="input w-full rounded-2xl"
            >
              <option value="">Toutes</option>
              {Array.from(new Set(pros.map((pro) => pro.pro_commune).filter(Boolean))).map((name) => (
                <option key={name as string} value={name as string}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Note minimale</span>
            <select
              value={minRating}
              onChange={(event) => setMinRating(event.target.value)}
              className="input w-full rounded-2xl"
            >
              <option value="">Toutes</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
              <option value="5">5</option>
            </select>
          </label>
        </div>

        {loadingDirectory ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-[1.75rem] bg-sand/70" />
            ))}
          </div>
        ) : filteredPros.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center text-sm text-night/55">
            Aucun professionnel ne correspond � vos crit�res.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPros.map((pro) => (
              <ProQuoteCard
                key={pro.id}
                pro={pro}
                onRequestQuote={() => {
                  setSelectedPro(pro)
                  setQuoteOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {selectedPro ? (
        <ProQuoteModal
          proId={selectedPro.id}
          proName={getDisplayName(selectedPro)}
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          template={normalizeQuoteTemplate(selectedPro.pro_quote_template ?? null)}
          onSent={(payload) => {
            showToast({
              tone: 'success',
              title: 'Demande envoy�e',
              message: `${payload.proName} a re�u votre besoin. Vous pouvez aussi utiliser le formulaire dappels doffres ci-dessus.`,
            })
          }}
        />
      ) : null}
    </div>
  )
}
