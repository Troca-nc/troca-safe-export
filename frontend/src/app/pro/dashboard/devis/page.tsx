'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Plus,
  Download,
  FileText,
  FilterX,
  Loader2,
  Mail,
  MessageCircle,
  Search,
} from 'lucide-react'

import QuoteBuilder from '@/components/pro/QuoteBuilder'
import { proApi } from '@/lib/api'
import { proQuotesApi } from '@/lib/api'
import { showToast } from '@/lib/toast'

type QuoteRequest = {
  id: string
  proId: number | string
  proName: string
  proCommune?: string | null
  proCategory?: string | null
  requesterUserId?: number | null
  createdAt: string
  visibleFreeAt?: string | null
  isLockedForFree?: boolean
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

type QuoteRecord = {
  id: string | number
  quote_number?: string | null
  source_quote_request_id?: number | null
  subject: string
  requester_name: string
  commune: string
  status: string
  total_xpf?: number | null
  valid_until?: string | null
  sent_at?: string | null
  viewed_at?: string | null
}

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function formatQuoteStatus(status: string) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'draft') return { label: 'Brouillon', tone: 'bg-sand text-night/70' }
  if (normalized === 'sent') return { label: 'Envoyï¿½', tone: 'bg-nc-lagonLight text-nc-lagon' }
  if (normalized === 'viewed') return { label: 'Vu', tone: 'bg-blue-50 text-blue-700' }
  if (normalized === 'accepted') return { label: 'Acceptï¿½', tone: 'bg-emerald-50 text-emerald-700' }
  if (normalized === 'refused') return { label: 'Refusï¿½', tone: 'bg-red-50 text-red-700' }
  if (normalized === 'expired') return { label: 'Expirï¿½', tone: 'bg-slate-100 text-slate-500' }
  if (normalized === 'converted') return { label: 'Converti', tone: 'bg-violet-50 text-violet-700' }
  return { label: status || 'Inconnu', tone: 'bg-slate-100 text-slate-600' }
}

export default function ProDashboardDevisPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'budget' | 'details'>('all')
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<'all' | 'draft' | 'sent' | 'viewed' | 'accepted' | 'refused' | 'expired' | 'converted'>('all')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderRequest, setBuilderRequest] = useState<QuoteRequest | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const loadData = async () => {
    try {
      const [requestsResponse, quotesResponse] = await Promise.all([
        proApi.getQuoteRequestsReceived(),
        proQuotesApi.list(),
      ])
      setRequests(Array.isArray(requestsResponse.data?.data) ? requestsResponse.data.data : [])
      setQuotes(Array.isArray(quotesResponse.data?.data) ? quotesResponse.data.data : [])
    } catch {
      setRequests([])
      setQuotes([])
    } finally {
      setLoading(false)
  }
}

function formatDelayLabel(value?: string | null) {
  if (!value) return '24h'
  const target = new Date(value).getTime()
  if (Number.isNaN(target)) return '24h'
  const diff = Math.max(0, target - Date.now())
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours <= 0) return `${minutes} min`
  if (minutes <= 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

  useEffect(() => {
    let alive = true

    void loadData().finally(() => {
      if (!alive) return
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [reloadKey])

  const openBuilder = (request?: QuoteRequest | null) => {
    setBuilderRequest(request || null)
    setBuilderOpen(true)
  }

  const closeBuilder = () => {
    setBuilderOpen(false)
    setBuilderRequest(null)
  }

  const handleDownload = async (request: QuoteRequest) => {
    setDownloadingId(request.id)
    try {
      const response = await proApi.downloadQuoteRequestPdf(request.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `devis-${request.id}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      showToast({
        tone: 'success',
        title: 'PDF telecharge',
        message: 'Le devis a ete exporte en PDF.',
      })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Export impossible',
        message: error?.response?.data?.error || 'Impossible de generer le PDF pour le moment.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleQuoteDownload = async (quote: QuoteRecord) => {
    try {
      const response = await proQuotesApi.downloadPdf(quote.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${quote.quote_number || `devis-${quote.id}`}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      showToast({
        tone: 'success',
        title: 'PDF telecharge',
        message: 'Le devis a ete exporte en PDF.',
      })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Export impossible',
        message: error?.response?.data?.error || 'Impossible de generer le PDF pour le moment.',
      })
    }
  }

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const todayKey = new Intl.DateTimeFormat('fr-CA').format(new Date())

    return requests.filter((request) => {
      const haystack = [
        request.proName,
        request.proCategory,
        request.proCommune,
        request.request.requester_name,
        request.request.requester_email,
        request.request.need_type,
        request.request.commune,
        request.request.details,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false
      if (filter === 'today') {
        return new Intl.DateTimeFormat('fr-CA').format(new Date(request.createdAt)) === todayKey
      }
      if (filter === 'budget') return Number(request.request.budget_xpf || 0) > 0
      if (filter === 'details') return Boolean(request.request.details?.trim())
      return true
    })
  }, [filter, query, requests])

  const stats = useMemo(() => {
    const total = requests.length
    const withBudget = requests.filter((request) => Number(request.request.budget_xpf || 0) > 0).length
    const withDetails = requests.filter((request) => Boolean(request.request.details?.trim())).length
    const todayKey = new Intl.DateTimeFormat('fr-CA').format(new Date())
    const today = requests.filter((request) => new Intl.DateTimeFormat('fr-CA').format(new Date(request.createdAt)) === todayKey).length
    return { total, withBudget, withDetails, today }
  }, [requests])

  const filteredQuotes = useMemo(() => {
    if (quoteStatusFilter === 'all') return quotes
    return quotes.filter((quote) => String(quote.status || '').toLowerCase() === quoteStatusFilter)
  }, [quoteStatusFilter, quotes])

  const lockedRequests = useMemo(
    () => requests.filter((request) => Boolean(request.isLockedForFree)),
    [requests]
  )

  const quoteStatusFilters = [
    { id: 'all', label: 'Tous' },
    { id: 'draft', label: 'Brouillons' },
    { id: 'sent', label: 'Envoyï¿½s' },
    { id: 'viewed', label: 'Vus' },
    { id: 'accepted', label: 'Acceptï¿½s' },
    { id: 'refused', label: 'Refusï¿½s' },
    { id: 'expired', label: 'Expirï¿½s' },
    { id: 'converted', label: 'Convertis' },
  ] as const

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-corail">Demandes de devis</p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Mes devis recus</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/72 md:text-base">
              Filtrez, relancez et exportez vos demandes en quelques clics. Vous gardez une vue rapide sur les demandes les plus chaudes et sur celles qui meritent un retour immediat.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-nc-corail">
            <BadgeCheck className="h-4 w-4" />
            {requests.length} demande{requests.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openBuilder(null)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-white/90"
          >
            <FileText className="h-4 w-4" />
            Nouveau devis
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: "Aujourd'hui", value: stats.today },
            { label: 'Avec budget', value: stats.withBudget },
            { label: 'Avec details', value: stats.withDetails },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{item.value.toLocaleString('fr-FR')}</p>
            </div>
          ))}
        </div>
      </section>

      {lockedRequests.length > 0 ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Verrouillage 24h</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                {lockedRequests.length} demande{lockedRequests.length > 1 ? 's' : ''} sont visibles immï¿½diatement pour les comptes Pro Premium.
                Pour les comptes gratuits, elles restent masquï¿½es pendant encore {formatDelayLabel(lockedRequests[0]?.visibleFreeAt)}.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800">
              Disponible plus tard
            </span>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Filtres</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Trier vos demandes</h2>
            <p className="mt-1 text-sm text-night/55">
              Recherchez par client, besoin, commune ou notez les demandes les plus urgentes en un coup d'oeil.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
          >
            <FilterX className="h-4 w-4" />
            Reinitialiser
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Recherche</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, besoin, commune..."
                className="input w-full rounded-2xl pl-10"
              />
            </div>
          </label>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-night">Raccourcis</span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'today', label: "Aujourd'hui" },
                { id: 'budget', label: 'Avec budget' },
                { id: 'details', label: 'Avec details' },
              ].map((item) => {
                const active = filter === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id as typeof filter)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'bg-[#0A7EA4] text-white'
                        : 'bg-[var(--color-background-secondary)] text-night/60 hover:bg-white'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {filteredRequests.length > 0 ? (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <article key={request.id} className={`relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${request.isLockedForFree ? 'ring-2 ring-amber-200' : ''}`}>
              {request.isLockedForFree ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,251,235,0.45),rgba(255,251,235,0.92))] p-5 backdrop-blur-[1px]">
                  <div className="max-w-md rounded-[1.5rem] border border-amber-200 bg-white/95 p-5 text-center shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Bloquï¿½ 24h</p>
                    <h3 className="mt-2 text-xl font-semibold text-night">Disponible dans {formatDelayLabel(request.visibleFreeAt)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-night/65">
                      Les comptes gratuits voient cette demande aprï¿½s 24h. Passez en Pro Premium pour accï¿½der immï¿½diatement aux nouveaux appels d'offres.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className={`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between ${request.isLockedForFree ? 'blur-[1px] pointer-events-none select-none' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
                      {formatDate(request.createdAt)}
                    </span>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
                      {request.proCategory || 'Professionnel'}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold text-night">{request.request.need_type}</h2>
                  <p className="mt-1 text-sm text-night/60">
                    {request.proName} ï¿½ {request.proCommune || 'Nouvelle-Caledonie'}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Demandeur</p>
                      <p className="mt-1 font-semibold text-night">{request.request.requester_name}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Commune</p>
                      <p className="mt-1 font-semibold text-night">{request.request.commune}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Budget</p>
                      <p className="mt-1 font-semibold text-night">
                        {request.request.budget_xpf ? `${Number(request.request.budget_xpf).toLocaleString('fr-FR')} XPF` : 'Non precise'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Date souhaitee</p>
                      <p className="mt-1 font-semibold text-night">{request.request.desired_date || 'Non precisee'}</p>
                    </div>
                  </div>

                  {request.request.details ? (
                    <p className="mt-4 rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3 text-sm leading-relaxed text-night/70">
                      {request.request.details}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:w-56">
                  <button
                    type="button"
                    onClick={() => openBuilder(request)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                  >
                    <FileText className="h-4 w-4" />
                    Repondre avec un devis
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(request)}
                    disabled={downloadingId === request.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Telecharger PDF
                  </button>
                  <Link
                    href={`/messages?user=${request.requesterUserId || ''}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Repondre
                  </Link>
                  <a
                    href={`mailto:${request.request.requester_email}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
          <FileText className="mx-auto h-8 w-8 text-night/25" />
          <p className="mt-3 text-lg font-semibold text-night">Aucune demande de devis recue</p>
          <p className="mt-2 text-sm">
            Les prochaines demandes apparaitront ici des qu'un client vous enverra un formulaire.
          </p>
        </div>
      )}

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Devis crees</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Suivi des devis envoyes</h2>
          </div>
          <button
            type="button"
            onClick={() => openBuilder(null)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
          >
            <Plus className="h-4 w-4" />
            Nouveau devis
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quoteStatusFilters.map((item) => {
            const active = quoteStatusFilter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuoteStatusFilter(item.id)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#0A7EA4] text-white'
                    : 'bg-[var(--color-background-secondary)] text-night/60 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {filteredQuotes.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filteredQuotes.map((quote) => {
              const status = formatQuoteStatus(quote.status)
              return (
                <article key={quote.id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                        {quote.quote_number || `DEVIS-${quote.id}`}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-night">{quote.subject}</h3>
                      <p className="mt-1 text-sm text-night/60">
                        {quote.requester_name} ï¿½ {quote.commune}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-night/65 sm:grid-cols-2">
                    <p><strong>Total :</strong> {Number(quote.total_xpf || 0).toLocaleString('fr-FR')} XPF</p>
                    <p><strong>Validitï¿½ :</strong> {quote.valid_until ? formatDate(quote.valid_until) : 'Non prï¿½cisï¿½e'}</p>
                    <p><strong>Envoyï¿½ :</strong> {quote.sent_at ? formatDate(quote.sent_at) : 'Brouillon'}</p>
                    <p><strong>Vu :</strong> {quote.viewed_at ? formatDate(quote.viewed_at) : 'Pas encore'}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuoteDownload(quote)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => openBuilder(requests.find((request) => String(request.id) === String(quote.source_quote_request_id)) || null)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Repondre
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] px-6 py-10 text-center text-night/55">
            <FileText className="mx-auto h-8 w-8 text-night/25" />
            <p className="mt-3 text-lg font-semibold text-night">Aucun devis cree pour linstant</p>
            <p className="mt-2 text-sm">Crï¿½ez votre premier devis depuis une demande reï¿½ue ou depuis le bouton Nouveau devis.</p>
          </div>
        )}
      </section>

      {builderOpen ? (
        <QuoteBuilder
          open={builderOpen}
          onClose={closeBuilder}
          proId={builderRequest?.proId || requests[0]?.proId || 'current'}
          proName={builderRequest?.proName || requests[0]?.proName || 'Professionnel Kalico'}
          initialRequest={builderRequest || null}
          onFinished={loadData}
        />
      ) : null}
    </div>
  )
}
