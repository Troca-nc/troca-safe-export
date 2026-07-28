'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import {
  BadgeCheck,
  CalendarDays,
  Loader2,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

import { quoteRequestsApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'

type IncomingQuoteRequest = {
  id: number
  mode: 'open' | 'targeted'
  category_slug: string
  category_name: string
  commune: string
  title: string
  description: string
  budget_min_xpf: number | null
  budget_max_xpf: number | null
  desired_date: string | null
  status: string
  created_at: string
  offer_count: number
  my_offer: {
    id: number
    amount_xpf: number
    delay_days: number
    message: string | null
    status: string
    created_at: string
  } | null
}

type OfferHistoryItem = {
  id: number
  request_id: number
  amount_xpf: number
  delay_days: number
  message: string | null
  status: 'pending' | 'selected' | 'rejected'
  status_label: string
  title: string
  commune: string
  category_name: string
  mode: 'open' | 'targeted'
  request_status: string
  created_at: string
  updated_at: string
}

type OfferFormState = {
  amount_xpf: string
  delay_days: string
  message: string
}

const EMPTY_FORM: OfferFormState = {
  amount_xpf: '',
  delay_days: '',
  message: '',
}

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return 'À préciser'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function formatDate(value?: string | null) {
  if (!value) return 'À confirmer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'À confirmer'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getStatusTone(status?: string | null) {
  switch (String(status || '').toLowerCase()) {
    case 'selected':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'pending':
    default:
      return 'bg-nc-lagonLight text-[#0A7EA4] border-nc-lagon/20'
  }
}

function getStatusLabel(status?: string | null) {
  switch (String(status || '').toLowerCase()) {
    case 'selected':
      return 'Sélectionné'
    case 'rejected':
      return 'Non retenu'
    case 'pending':
    default:
      return 'En attente'
  }
}

export default function ProDashboardAppelsOffresPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<IncomingQuoteRequest[]>([])
  const [offers, setOffers] = useState<OfferHistoryItem[]>([])
  const [offerForms, setOfferForms] = useState<Record<number, OfferFormState>>({})
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canAccess = hasHydrated && isAuthenticated && Boolean(user?.is_pro)

  useEffect(() => {
    if (!canAccess) return

    let alive = true

    const load = async () => {
      try {
        const [incomingResponse, historyResponse] = await Promise.all([
          quoteRequestsApi.getProIncoming(),
          quoteRequestsApi.getProOffersMine(),
        ])

        if (!alive) return

        setRequests(Array.isArray(incomingResponse.data?.data) ? incomingResponse.data.data : [])
        setOffers(Array.isArray(historyResponse.data?.data) ? historyResponse.data.data : [])
      } catch {
        if (!alive) return
        setRequests([])
        setOffers([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    const timer = window.setInterval(() => {
      void load()
    }, 30_000)

    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [canAccess])

  const handleOfferChange = (requestId: number, field: keyof OfferFormState, value: string) => {
    setOfferForms((current) => ({
      ...current,
      [requestId]: {
        amount_xpf: current[requestId]?.amount_xpf ?? '',
        delay_days: current[requestId]?.delay_days ?? '',
        message: current[requestId]?.message ?? '',
        [field]: value,
      },
    }))
  }

  const handleSubmitOffer = async (requestId: number) => {
    const form = offerForms[requestId] || EMPTY_FORM
    if (!form.amount_xpf.trim() || !form.delay_days.trim()) {
      setError('Merci de renseigner le montant et le délai.')
      return
    }

    setSubmittingId(requestId)
    setError('')
    setSuccess('')

    try {
      await quoteRequestsApi.submitOffer(requestId, {
        amount_xpf: Number(form.amount_xpf),
        delay_days: Number(form.delay_days),
        message: form.message.trim() || null,
      })
      setSuccess('Votre offre a bien été envoyée.')
      const [incomingResponse, historyResponse] = await Promise.all([
        quoteRequestsApi.getProIncoming(),
        quoteRequestsApi.getProOffersMine(),
      ])
      setRequests(Array.isArray(incomingResponse.data?.data) ? incomingResponse.data.data : [])
      setOffers(Array.isArray(historyResponse.data?.data) ? historyResponse.data.data : [])
      setOfferForms((current) => ({
        ...current,
        [requestId]: EMPTY_FORM,
      }))
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de soumettre votre offre pour le moment.')
    } finally {
      setSubmittingId(null)
    }
  }

  if (!canAccess) {
    return (
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="h-10 w-40 animate-pulse rounded-full bg-sand/70" />
        <div className="mt-4 h-44 animate-pulse rounded-[1.75rem] bg-sand/70" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Appels d’offres</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Demandes reçues et offres soumises</h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              Répondez aux demandes ciblées ou ouvertes de votre catégorie, envoyez vos offres puis suivez leur statut depuis votre espace Pro.
            </p>
          </div>
          <Link
            href="/appels-offres"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
          >
            Voir la page demandeur
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#0A7EA4]" />
            {requests.length} demande{requests.length > 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <BadgeCheck className="h-3.5 w-3.5 text-[#0A7EA4]" />
            {offers.length} offre{offers.length > 1 ? 's' : ''} soumise{offers.length > 1 ? 's' : ''}
          </span>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Demandes reçues</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Soumettez une offre quand vous êtes intéressé</h2>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
            <p className="text-lg font-semibold text-night">Aucune demande disponible pour l’instant.</p>
            <p className="mt-2 text-sm text-night/55">Les demandes correspondant à votre activité apparaîtront ici dès qu’elles seront publiées.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {requests.map((request) => {
              const form = offerForms[request.id] || EMPTY_FORM
              const hasResponded = Boolean(request.my_offer)

              return (
                <article
                  key={request.id}
                  className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
                        {request.category_name}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-night">{request.title}</h3>
                    </div>
                    {hasResponded ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Déjà répondu
                      </span>
                    ) : (
                      <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-[#0A7EA4]">
                        Ouverte
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Commune</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-night">
                        <MapPin className="h-4 w-4 text-coral" />
                        {request.commune}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Budget</p>
                      <p className="mt-1 font-semibold text-night">
                        {request.budget_min_xpf || request.budget_max_xpf
                          ? `${request.budget_min_xpf ? formatMoney(request.budget_min_xpf) : '—'} · ${request.budget_max_xpf ? formatMoney(request.budget_max_xpf) : '—'}`
                          : 'Non précisé'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Date souhaitée</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-night">
                        <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
                        {formatDate(request.desired_date)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Offres reçues</p>
                      <p className="mt-1 font-semibold text-night">{request.offer_count}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-night/65">{request.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-night/60">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {request.mode === 'open' ? 'Diffusion ouverte' : 'Diffusion ciblée'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Demande {request.status === 'open' ? 'active' : request.status}
                    </span>
                  </div>

                  {!hasResponded ? (
                    <div className="mt-5 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Répondre</p>
                          <h4 className="mt-1 text-base font-bold text-night">Soumettre une offre</h4>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-night">Montant en XPF</span>
                          <input
                            type="number"
                            min="1"
                            value={form.amount_xpf}
                            onChange={(event) => handleOfferChange(request.id, 'amount_xpf', event.target.value)}
                            className="input w-full rounded-2xl"
                            placeholder="Ex. 150000"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-night">Délai en jours</span>
                          <input
                            type="number"
                            min="1"
                            value={form.delay_days}
                            onChange={(event) => handleOfferChange(request.id, 'delay_days', event.target.value)}
                            className="input w-full rounded-2xl"
                            placeholder="Ex. 7"
                          />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-sm font-semibold text-night">Message optionnel</span>
                          <textarea
                            rows={4}
                            maxLength={500}
                            value={form.message}
                            onChange={(event) => handleOfferChange(request.id, 'message', event.target.value)}
                            className="input w-full rounded-2xl py-3"
                            placeholder="Ajoutez un mot de contexte, vos disponibilités ou vos garanties..."
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSubmitOffer(request.id)}
                        disabled={submittingId === request.id}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Envoyer mon offre
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                      Votre offre est déjà enregistrée pour cette demande. Vous la retrouverez dans l’historique ci-dessous.
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link
                      href={`/appels-offres/${request.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      Voir la demande
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="text-xs text-night/45">{formatDate(request.created_at)}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Mes offres soumises</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Historique et statuts</h2>
          </div>
          <span className="text-sm text-night/55">{offers.length} offre{offers.length > 1 ? 's' : ''}</span>
        </div>

        {offers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
            <p className="text-lg font-semibold text-night">Aucune offre envoyée pour l’instant.</p>
            <p className="mt-2 text-sm text-night/55">Vos réponses apparaîtront ici dès que vous commencerez à traiter des demandes.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
                      {offer.category_name}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-night">{offer.title}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(offer.status)}`}>
                    {getStatusLabel(offer.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Montant</p>
                    <p className="mt-1 font-semibold text-night">{formatMoney(offer.amount_xpf)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Délai</p>
                    <p className="mt-1 font-semibold text-night">{offer.delay_days} jours</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Message</p>
                    <p className="mt-1 text-sm text-night/65">{offer.message || 'Aucun message complémentaire.'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-night/55">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {offer.commune}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(offer.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {offer.request_status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
