'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { quoteRequestsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { showToast } from '@/lib/toast'

type QuoteRequestDetail = {
  id: number
  author_id: number | null
  mode: 'open' | 'targeted'
  category_slug: string
  category_name: string
  commune: string
  title: string
  description: string
  budget_min_xpf: number | null
  budget_max_xpf: number | null
  desired_date: string | null
  contact_email: string
  contact_phone: string | null
  status: 'open' | 'closed' | 'cancelled'
  created_at: string
  updated_at: string
  offers_count: number
  offers: Array<{
    id: number
    request_id: number
    pro_id: number
    pro_user_id: number
    pro_name: string
    pro_rating: number
    amount_xpf: number
    delay_days: number
    message: string | null
    status: 'pending' | 'selected' | 'rejected'
    created_at: string
    updated_at: string
  }>
}

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return 'Non prï¿½cisï¿½'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function buildBudgetLabel(min?: number | null, max?: number | null) {
  const minValue = Number(min ?? 0)
  const maxValue = Number(max ?? 0)
  if (minValue > 0 && maxValue > 0) {
    return `${formatMoney(minValue)} - ${formatMoney(maxValue)}`
  }
  if (minValue > 0) {
    return `ï¿½ partir de ${formatMoney(minValue)}`
  }
  if (maxValue > 0) {
    return `Jusquï¿½ ${formatMoney(maxValue)}`
  }
  return 'Budget non prï¿½cisï¿½'
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'ï¿½ prï¿½ciser'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'ï¿½ prï¿½ciser'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getStatusTone(status?: string | null) {
  switch (status) {
    case 'selected':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-nc-lagonLight text-[#0A7EA4] border-nc-lagon/20'
  }
}

function getRequestStatusLabel(status?: string | null) {
  switch (status) {
    case 'open':
      return 'Ouverte'
    case 'closed':
      return 'Fermï¿½e'
    case 'cancelled':
      return 'Annulï¿½e'
    default:
      return status || 'Inconnue'
  }
}

export default function QuoteRequestDetailClient({ requestId }: { requestId: string }) {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [data, setData] = useState<QuoteRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectingId, setSelectingId] = useState<number | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await quoteRequestsApi.getById(requestId)
        if (!alive) return
        setData(response.data?.data || null)
      } catch (err: any) {
        if (!alive) return
        setData(null)
        setError(err?.response?.data?.error || 'Impossible de charger cette demande.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [requestId])

  const isRequester = useMemo(() => {
    if (!user || !data) return false
    return Number(user.id) === Number(data.author_id)
  }, [data, user])

  const canChoose = Boolean(isRequester && data && data.status === 'open')

  const handleSelectOffer = async (offerId: number) => {
    if (!data) return
    setSelectingId(offerId)
    try {
      await quoteRequestsApi.selectOffer(data.id, { offer_id: offerId })
      showToast({
        tone: 'success',
        title: 'Offre sï¿½lectionnï¿½e',
        message: 'La demande a bien ï¿½tï¿½ attribuï¿½e au professionnel choisi.',
      })
      const refreshed = await quoteRequestsApi.getById(requestId)
      setData(refreshed.data?.data || null)
    } catch (err: any) {
      showToast({
        tone: 'error',
        title: 'Sï¿½lection impossible',
        message: err?.response?.data?.error || 'Impossible de sï¿½lectionner cette offre.',
      })
    } finally {
      setSelectingId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="h-32 animate-pulse rounded-[1.5rem] bg-sand/70" />
      </div>
    )
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-lg font-semibold text-night">Connectez-vous pour voir cette demande.</p>
        <p className="mt-2 text-sm text-night/60">
          Cette page est rï¿½servï¿½e au demandeur qui a crï¿½ï¿½ lappel doffres.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/connexion?next=/appels-offres/${requestId}`} className="rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white">
            Se connecter
          </Link>
          <Link href="/appels-offres" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night">
            Retour
          </Link>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-lg font-semibold text-night">Demande introuvable</p>
        <p className="mt-2 text-sm text-night/60">{error || 'Cette demande nest pas disponible.'}</p>
        <Link href="/appels-offres" className="mt-5 inline-flex rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night">
          Retour aux appels doffres
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Dï¿½tail de la demande</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">{data.title}</h1>
            <p className="mt-3 text-sm text-night/60">
              Publiï¿½e le {formatDateLabel(data.created_at)} ï¿½ {data.offers_count} offre{data.offers_count > 1 ? 's' : ''} reï¿½ue{data.offers_count > 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/appels-offres" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Demande</p>
              <p className="mt-2 text-sm font-semibold text-night">{data.title}</p>
              <p className="mt-1 text-sm text-night/60">{data.description}</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">CatÃ©gorie</p>
              <p className="mt-2 text-sm font-semibold text-night">{data.category_name}</p>
              <p className="mt-1 text-sm text-night/60">{data.mode === 'open' ? 'Ouvert ï¿½ tous les pros' : 'Ciblage de pros spï¿½cifiques'}</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Commune</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-night">
                <MapPin className="h-4 w-4 text-kalico-blue" />
                {data.commune}
              </p>
              <p className="mt-1 text-sm text-night/60">{getRequestStatusLabel(data.status)}</p>
              <p className="mt-2 text-sm leading-relaxed text-night/55">
                Votre demande reste ouverte jusqu&apos;ï¿½ ce que vous choisissiez une offre. Les pros ont gï¿½nï¿½ralement 48h pour vous rï¿½pondre.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Budget / date</p>
              <p className="mt-2 text-sm font-semibold text-night">{buildBudgetLabel(data.budget_min_xpf, data.budget_max_xpf)}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-night/60">
                <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
                {formatDateLabel(data.desired_date)}
              </p>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Accï¿½s</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Rï¿½servï¿½ au demandeur</h2>
                <p className="mt-1 text-sm text-night/60">
                  {isRequester
                    ? 'Vous ï¿½tes bien lauteur de cette demande.'
                    : 'Vous consultez cette demande en lecture seule.'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl bg-[var(--color-background-secondary)] p-4 text-sm text-night/65">
              <p className="font-semibold text-night">Contact de suivi</p>
              <p>{data.contact_email}</p>
              {data.contact_phone ? <p>{data.contact_phone}</p> : null}
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Offres reï¿½ues</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Comparez les rï¿½ponses et choisissez</h2>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1 text-xs font-semibold text-night/60">
            {data.status === 'open' ? 'Demande ouverte' : getRequestStatusLabel(data.status)}
          </span>
        </div>

        {!data.offers.length ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-center">
            <p className="text-lg font-semibold text-night">Aucune offre pour linstant.</p>
            <p className="mt-2 text-sm text-night/55">Les professionnels voient la demande et peuvent rï¿½pondre depuis leur dashboard.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {data.offers.map((offer) => {
              const selected = offer.status === 'selected'
              const rejected = offer.status === 'rejected'
              return (
                <article
                  key={offer.id}
                  className={`rounded-[1.75rem] border p-5 shadow-sm ${
                    selected
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : rejected
                        ? 'border-slate-200 bg-slate-50/70'
                        : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
                        {offer.pro_name}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-night">{formatMoney(offer.amount_xpf)}</h3>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(offer.status)}`}>
                      {selected ? 'Sï¿½lectionnï¿½e' : rejected ? 'Non retenue' : 'En attente'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Note moyenne</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-night">
                        <BadgeCheck className="h-4 w-4 text-[#0A7EA4]" />
                        {Number(offer.pro_rating || 0).toFixed(1)}/5
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Dï¿½lai</p>
                      <p className="mt-1 font-semibold text-night">{offer.delay_days} jours</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Message</p>
                      <p className="mt-1 text-sm text-night/65">{offer.message || 'Aucun message complï¿½mentaire.'}</p>
                    </div>
                  </div>

                  {canChoose ? (
                    <button
                      type="button"
                      onClick={() => void handleSelectOffer(offer.id)}
                      disabled={selectingId === offer.id || data.status !== 'open'}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {selectingId === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Choisir cette offre
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
