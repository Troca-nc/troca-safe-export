'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Download,
  FileText,
  FilterX,
  Loader2,
  Mail,
  MessageCircle,
  Search,
} from 'lucide-react'

import { proApi } from '@/lib/api'
import { showToast } from '@/lib/toast'

type QuoteRequest = {
  id: string
  proId: number | string
  proName: string
  proCommune?: string | null
  proCategory?: string | null
  requesterUserId?: number | null
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

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export default function ProDashboardDevisPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'budget' | 'details'>('all')

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const response = await proApi.getQuoteRequestsReceived()
        if (!alive) return
        setRequests(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setRequests([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

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

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Filtres</p>
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
            <article key={request.id} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                    {request.proName} · {request.proCommune || 'Nouvelle-Caledonie'}
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
                    onClick={() => handleDownload(request)}
                    disabled={downloadingId === request.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  )
}
