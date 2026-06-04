'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, FilterX, MapPin, Search, Star, Sparkles, BadgeCheck, MessageSquareQuote } from 'lucide-react'

import ProQuoteModal from '@/components/pro/ProQuoteModal'
import { type ProCardModel } from '@/components/pro/ProCard'
import { proApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { showToast } from '@/lib/toast'

type QuoteHistoryItem = {
  id: string
  proId: string | number
  proName: string
  createdAt: string
  request: {
    requester_name: string
    requester_email: string
    requester_phone: string
    need_type: string
    commune: string
    budget_xpf: string
    desired_date: string
    details: string
  }
}

function getDisplayName(pro: ProCardModel) {
  return (
    pro.display_name
    || pro.pro_company_name
    || [pro.prenom, pro.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Troca'
  )
}

function formatRating(value?: number | null) {
  const rating = Number(value ?? 0)
  return Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : '0.0'
}

function formatDateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function ProQuoteCard({
  pro,
  onRequestQuote,
}: {
  pro: ProCardModel
  onRequestQuote: () => void
}) {
  const displayName = getDisplayName(pro)
  const rating = Number(pro.avg_rating ?? 0)
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
            Vérifié
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
              {pro.pro_commune || 'Nouvelle-Calédonie'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {formatRating(rating)} ({reviewCount} avis)
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#0A7EA4]" />
            {listingCount} annonce{listingCount > 1 ? 's' : ''}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-night/65">
          {pro.pro_description || 'Découvrir ce professionnel et lui envoyer une demande adaptée.'}
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

export default function AppelsOffresClient() {
  const { isAuthenticated } = useAuthStore()
  const [pros, setPros] = useState<ProCardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [commune, setCommune] = useState('')
  const [minRating, setMinRating] = useState('')
  const [activeTab, setActiveTab] = useState<'pros' | 'requests'>('pros')
  const [selectedPro, setSelectedPro] = useState<ProCardModel | null>(null)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteHistory, setQuoteHistory] = useState<QuoteHistoryItem[]>([])
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let alive = true
    const loadPros = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await proApi.list({ limit: 100 })
        const items = Array.isArray(response.data?.data) ? response.data.data : []
        if (!alive) return
        setPros(items)
      } catch {
        if (!alive) return
        setPros([])
        setError("Impossible de charger l'annuaire des pros pour le moment.")
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadPros()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    const loadQuoteHistory = async () => {
      if (!isAuthenticated) {
        if (alive) setQuoteHistory([])
        return
      }

      try {
        const response = await proApi.getQuoteRequestsMine({ limit: 6 })
        const items = Array.isArray(response.data?.data) ? response.data.data : []
        if (!alive) return
        setQuoteHistory(items.slice(0, 6))
      } catch {
        if (!alive) return
        setQuoteHistory([])
      }
    }

    void loadQuoteHistory()
    return () => {
      alive = false
    }
  }, [isAuthenticated])

  const categoryOptions = useMemo(() => {
    const values = new Set<string>()
    pros.forEach((pro) => {
      const value = String(pro.pro_category ?? '').trim()
      if (value) values.add(value)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [pros])

  const communeOptions = useMemo(() => {
    const values = new Set<string>()
    pros.forEach((pro) => {
      const value = String(pro.pro_commune ?? '').trim()
      if (value) values.add(value)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [pros])

  const filteredPros = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const minRatingValue = Number(minRating || 0)
    return [...pros]
      .filter((pro) => {
        const displayName = getDisplayName(pro)
        const categoryValue = String(pro.pro_category ?? '').trim()
        const communeValue = String(pro.pro_commune ?? '').trim()
        const haystack = [
          displayName,
          categoryValue,
          communeValue,
          String(pro.pro_description ?? ''),
          String(pro.pro_company_name ?? ''),
        ].join(' ').toLowerCase()

        if (category && categoryValue !== category) return false
        if (commune && communeValue !== commune) return false
        if (minRatingValue > 0 && Number(pro.avg_rating ?? 0) < minRatingValue) return false
        if (normalizedQuery && !haystack.includes(normalizedQuery)) return false
        return true
      })
      .sort((a, b) => {
        const ratingDelta = Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0)
        if (ratingDelta !== 0) return ratingDelta
        const reviewsDelta = Number(b.review_count ?? 0) - Number(a.review_count ?? 0)
        if (reviewsDelta !== 0) return reviewsDelta
        return getDisplayName(a).localeCompare(getDisplayName(b), 'fr')
      })
  }, [pros, query, category, commune, minRating])

  const resetFilters = () => {
    setQuery('')
    setCategory('')
    setCommune('')
    setMinRating('')
  }

  const saveQuoteHistory = (payload: QuoteHistoryItem) => {
    setQuoteHistory((current) => {
      const next = [payload, ...current.filter((entry) => entry.id !== payload.id)].slice(0, 6)
      return next
    })
    setActiveTab('requests')
    showToast({
      tone: 'success',
      title: 'Demande enregistrée',
      message: 'Votre demande de devis est disponible dans Mes demandes.',
    })
  }

  const downloadQuotePdf = async (requestId: string) => {
    setPdfLoadingId(requestId)
    try {
      const response = await proApi.downloadQuoteRequestPdf(requestId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `devis-${requestId}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      showToast({
        tone: 'success',
        title: 'PDF prêt',
        message: 'Votre devis a été téléchargé.',
      })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Téléchargement impossible',
        message: error?.response?.data?.error || 'Impossible de générer le PDF pour le moment.',
      })
    } finally {
      setPdfLoadingId(null)
    }
  }

  const openQuoteForPro = (pro: ProCardModel) => {
    setSelectedPro(pro)
    setQuoteOpen(true)
  }

  const avgRating = useMemo(() => {
    if (!filteredPros.length) return 0
    const total = filteredPros.reduce((acc, pro) => acc + Number(pro.avg_rating ?? 0), 0)
    return total / filteredPros.length
  }, [filteredPros])

  return (
    <div ref={topRef} className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
              Appels d&apos;offres
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night sm:text-4xl">
              Déposez votre besoin et recevez un devis rapide
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-night/60 sm:text-base">
              Trouvez un professionnel vérifié, comparez les avis et envoyez une demande adaptée à votre projet.
              Connectez-vous pour conserver vos demandes dans l&apos;onglet « Mes demandes » sur tous vos appareils.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pros')
                topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
            >
              Trouver un pro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
            >
              Mes demandes
              <MessageSquareQuote className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Pros vérifiés</p>
            <p className="mt-2 text-2xl font-bold text-night">{pros.length.toLocaleString('fr-FR')}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Note moyenne</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-night">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              {avgRating ? avgRating.toFixed(1) : '0.0'}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Demandes suivies</p>
            <p className="mt-2 text-2xl font-bold text-night">{quoteHistory.length.toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('pros')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'pros'
                ? 'bg-[#0A7EA4] text-white'
                : 'border border-[var(--color-border)] bg-white text-night hover:bg-[var(--color-background-secondary)]'
            }`}
          >
            Pros vérifiés
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'requests'
                ? 'bg-[#0A7EA4] text-white'
                : 'border border-[var(--color-border)] bg-white text-night hover:bg-[var(--color-background-secondary)]'
            }`}
          >
            Mes demandes
          </button>
        </div>

        {activeTab === 'pros' ? (
          <div className="pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Filtres</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Affinez votre recherche</h2>
                <p className="mt-1 text-sm text-night/55">
                  Recherchez par nom, spécialité, commune et niveau de note.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                <FilterX className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Recherche</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nom, entreprise, spécialité..."
                    className="input w-full rounded-2xl pl-10"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Catégorie</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="input w-full rounded-2xl"
                >
                  <option value="">Toutes les catégories</option>
                  {categoryOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Commune</span>
                <select
                  value={commune}
                  onChange={(event) => setCommune(event.target.value)}
                  className="input w-full rounded-2xl"
                >
                  <option value="">Toutes les communes</option>
                  {communeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Note minimum</span>
                <select
                  value={minRating}
                  onChange={(event) => setMinRating(event.target.value)}
                  className="input w-full rounded-2xl"
                >
                  <option value="">Toutes les notes</option>
                  <option value="4.5">4.5 et +</option>
                  <option value="4">4.0 et +</option>
                  <option value="3.5">3.5 et +</option>
                </select>
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-80 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] animate-pulse"
                    />
                  ))
                : filteredPros.map((pro) => (
                    <ProQuoteCard key={pro.id} pro={pro} onRequestQuote={() => openQuoteForPro(pro)} />
                  ))}
            </div>

            {!loading && filteredPros.length === 0 && (
              <div className="mt-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-night">Aucun professionnel ne correspond à vos filtres.</p>
                <p className="mt-2 text-sm text-night/55">
                  Essayez un autre mot-clé ou réinitialisez les filtres pour voir plus de résultats.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-5">
            {!isAuthenticated ? (
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
                <p className="text-lg font-semibold text-night">Connectez-vous pour retrouver vos demandes.</p>
                <p className="mt-2 text-sm text-night/55">
                  Sans compte, vos demandes restent visibles pendant cette visite seulement. Avec un compte, elles sont synchronisées sur tous vos appareils.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/connexion?redirect=/appels-offres"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/inscription?redirect=/appels-offres"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-white"
                  >
                    Créer un compte
                  </Link>
                </div>
              </div>
            ) : quoteHistory.length === 0 ? (
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
                <p className="text-lg font-semibold text-night">Aucune demande enregistrée pour le moment.</p>
                <p className="mt-2 text-sm text-night/55">
                  Envoyez votre première demande de devis depuis la liste des professionnels vérifiés.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('pros')}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                >
                  Trouver un pro
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {quoteHistory.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demande envoyée</p>
                        <h3 className="mt-1 text-lg font-semibold text-night">{request.proName}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night/60">
                        {formatDateLabel(request.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Besoin</p>
                        <p className="mt-1 font-semibold text-night">{request.request.need_type}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Commune</p>
                        <p className="mt-1 font-semibold text-night">{request.request.commune}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Budget</p>
                        <p className="mt-1 font-semibold text-night">
                          {request.request.budget_xpf ? `${Number(request.request.budget_xpf).toLocaleString('fr-FR')} XPF` : 'Non précisé'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Date souhaitée</p>
                        <p className="mt-1 font-semibold text-night">{request.request.desired_date || 'Non précisée'}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/pro/${request.proId}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                      >
                        Voir la vitrine
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const pro = pros.find((item) => String(item.id) === String(request.proId))
                          if (pro) {
                            openQuoteForPro(pro)
                          } else {
                            setActiveTab('pros')
                            setQuery(request.request.need_type)
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-white"
                      >
                        Relancer
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadQuotePdf(request.id)}
                        disabled={pdfLoadingId === request.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-nc-lagonLight px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pdfLoadingId === request.id ? 'Génération...' : 'Télécharger PDF'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '1. Choisissez un pro',
              desc: 'Filtrez par spécialité, commune et note pour trouver la bonne vitrine.',
            },
            {
              title: '2. Décrivez votre besoin',
              desc: 'La modale de devis vous aide à remplir les champs essentiels en quelques secondes.',
            },
            {
              title: '3. Suivez vos demandes',
              desc: 'Vos demandes restent visibles dans Mes demandes pour relancer rapidement.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-night/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {selectedPro && (
        <ProQuoteModal
          proId={selectedPro.id}
          proName={getDisplayName(selectedPro)}
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          template={selectedPro.pro_quote_template ?? null}
          onSent={(payload) => {
            const next: QuoteHistoryItem = {
              id: `${payload.proId}-${Date.now()}`,
              proId: payload.proId,
              proName: payload.proName,
              createdAt: new Date().toISOString(),
              request: {
                requester_name: payload.request.requester_name,
                requester_email: payload.request.requester_email,
                requester_phone: payload.request.requester_phone,
                need_type: payload.request.need_type,
                commune: payload.request.commune,
                budget_xpf: payload.request.budget_xpf,
                desired_date: payload.request.desired_date,
                details: payload.request.details,
              },
            }
            saveQuoteHistory(next)
          }}
        />
      )}
    </div>
  )
}
