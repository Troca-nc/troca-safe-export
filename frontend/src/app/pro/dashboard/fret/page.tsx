'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Truck,
  Package,
  CheckCircle2,
} from 'lucide-react'

import { fretApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type DashboardData = {
  transporter?: {
    id: number | string
    company_name?: string | null
    display_name?: string | null
    pro_commune?: string | null
    pro_phone?: string | null
    pro_logo_url?: string | null
    rating?: number | null
    is_verified?: boolean
    service_zones?: string[]
    fret_description?: string | null
    fret_vehicle_type?: string | null
  }
  available_requests?: Array<any>
  my_offers?: Array<any>
  confirmed_transports?: Array<any>
}

type OfferFormState = {
  amount_xpf: string
  pickup_date: string
  pickup_slot: 'morning' | 'midday' | 'afternoon' | 'evening'
  message: string
}

const SLOT_LABELS = {
  morning: 'Matin',
  midday: 'Midi',
  afternoon: 'Apr�s-midi',
  evening: 'Fin de journ�e',
}

function formatMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) return '� pr�ciser'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return '� confirmer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '� confirmer'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
}

function getStatusTone(status?: string) {
  switch (status) {
    case 'closed':
      return 'bg-nc-lagonLight text-nc-lagon border-nc-lagon/20'
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'selected':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'rejected':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-100'
  }
}

export default function ProDashboardFretPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [offerForms, setOfferForms] = useState<Record<number, OfferFormState>>({})
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [deliveringId, setDeliveringId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canAccess = hasHydrated && isAuthenticated && Boolean(user?.is_pro)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/connexion')
      return
    }
    if (user && !user.is_pro) {
      router.replace('/pro')
    }
  }, [hasHydrated, isAuthenticated, router, user])

  const load = async () => {
    try {
      const response = await fretApi.getDashboard()
      setData(response.data?.data ?? null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canAccess) return
    void load()
    const timer = window.setInterval(() => {
      void load()
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [canAccess])

  const transporter = data?.transporter
  const availableRequests = useMemo(() => data?.available_requests ?? [], [data])
  const myOffers = useMemo(() => data?.my_offers ?? [], [data])
  const confirmedTransports = useMemo(() => data?.confirmed_transports ?? [], [data])

  const handleOfferChange = (requestId: number, field: keyof OfferFormState, value: string) => {
    setOfferForms((current) => ({
      ...current,
      [requestId]: {
        amount_xpf: current[requestId]?.amount_xpf || '',
        pickup_date: current[requestId]?.pickup_date || '',
        pickup_slot: current[requestId]?.pickup_slot || 'morning',
        message: current[requestId]?.message || '',
        [field]: value,
      },
    }))
  }

  const handleSubmitOffer = async (requestId: number) => {
    const form = offerForms[requestId] || { amount_xpf: '', pickup_date: '', pickup_slot: 'morning', message: '' }
    if (!form.amount_xpf || !form.pickup_date) {
      setError('Veuillez renseigner le prix et la date de prise en charge.')
      return
    }
    setSubmittingId(requestId)
    setError('')
    setSuccess('')
    try {
      await fretApi.submitOffer(requestId, {
        amount_xpf: Number(form.amount_xpf),
        pickup_date: form.pickup_date,
        pickup_slot: form.pickup_slot,
        message: form.message.trim() || null,
      })
      setSuccess('Votre offre a bien �t� envoy�e.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de soumettre votre offre pour le moment.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleMarkDelivered = async (requestId: number) => {
    setDeliveringId(requestId)
    setError('')
    setSuccess('')
    try {
      await fretApi.markDelivered(requestId)
      setSuccess('Transport marqu� comme livr�.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de marquer ce transport comme livr�.')
    } finally {
      setDeliveringId(null)
    }
  }

  if (!canAccess) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-sand/80" />
          <p className="mt-4 text-sm text-night/55">Chargement du dashboard Envoi & Livraison...</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Envoi & Livraison</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Demandes en cours et offres priv�es</h1>
            <p className="mt-2 text-sm text-night/60">
              R�pondez aux demandes ouvertes, suivez vos offres et marquez vos transports comme livr�s depuis le dashboard Pro.
          </p>
        </div>
          <Link href="/envoi-livraison" className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
            Ouvrir la page demandeur
            <Send className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5" />
            {transporter?.pro_commune || 'Nouvelle-Calédonie'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {transporter?.is_verified ? 'Pro Envoi & Livraison v�rifi�' : 'Profil � v�rifier'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <BadgeCheck className="h-3.5 w-3.5" />
            {Number(transporter?.rating ?? 0).toFixed(1)}/5
          </span>
        </div>
      </section>

      {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-emeraude">Demandes en cours</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">R�pondre rapidement</h2>
            </div>
            <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-sm font-semibold text-nc-lagon">
              {availableRequests.length}
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {availableRequests.length ? (
              availableRequests.map((request) => {
              const myOffer = request.my_offer || null
              const form = offerForms[request.id] || {
                amount_xpf: myOffer ? String(myOffer.amount_xpf) : '',
                pickup_date: myOffer?.pickup_date || '',
                pickup_slot: myOffer?.pickup_slot || 'morning',
                message: myOffer?.message || '',
              }
              const canSubmit = !myOffer || myOffer.status === 'pending'
              return (
                <article key={request.id} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-night">{request.departure_commune?.name || request.departure} � {request.destination_commune?.name || request.destination}</p>
                      <p className="mt-1 text-xs text-night/55">{request.cargo_type || 'Marchandise'} � {request.volume_bucket} � {request.weight_bucket}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(myOffer?.status || 'pending')}`}>
                      {myOffer?.status_label || 'En attente'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Demande ouverte jusqu'au choix du demandeur
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <Package className="h-3.5 w-3.5" />
                      {formatMoney(request.budget_max_xpf)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Prix propos�</span>
                      <input
                        type="number"
                        min="1"
                        step="100"
                        value={form.amount_xpf}
                        onChange={(event) => handleOfferChange(request.id, 'amount_xpf', event.target.value)}
                        className="input w-full rounded-2xl"
                        disabled={!canSubmit}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Date de prise en charge</span>
                      <input
                        type="date"
                        value={form.pickup_date}
                        onChange={(event) => handleOfferChange(request.id, 'pickup_date', event.target.value)}
                        className="input w-full rounded-2xl"
                        disabled={!canSubmit}
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Cr�neau</span>
                      <select
                        value={form.pickup_slot}
                        onChange={(event) => handleOfferChange(request.id, 'pickup_slot', event.target.value)}
                        className="input w-full rounded-2xl"
                        disabled={!canSubmit}
                      >
                        {Object.entries(SLOT_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Message optionnel</span>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(event) => handleOfferChange(request.id, 'message', event.target.value)}
                        className="input w-full rounded-2xl py-2"
                        placeholder="Expliquez votre approche ou vos contraintes..."
                        disabled={!canSubmit}
                      />
                    </label>
                  </div>

                  {myOffer ? (
                    <p className="mt-3 text-sm text-night/60">
                      Votre offre actuelle : {formatMoney(myOffer.amount_xpf)} � {formatDateLabel(myOffer.pickup_date)} � {myOffer.status_label}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void handleSubmitOffer(request.id)}
                    disabled={submittingId === request.id || !canSubmit}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
                  >
                    {submittingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Soumettre mon offre
                  </button>
                </article>
              )
              })
            ) : (
              <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-night/55">
                Aucune demande Envoi & Livraison en cours pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-emeraude">Mes offres</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Historique des r�ponses</h2>
            <div className="mt-4 space-y-3">
              {myOffers.length ? myOffers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-night">{offer.request_departure || 'D�part'} � {offer.request_destination || 'Arriv�e'}</p>
                      <p className="mt-1 text-xs text-night/55">{formatDateLabel(offer.pickup_date)} � {offer.pickup_slot_label}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(offer.status)}`}>
                      {offer.status_label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-night/65">Prix : {formatMoney(offer.amount_xpf)}</p>
                </div>
              )) : (
                <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/40 p-4 text-sm text-night/55">
                  Aucune offre envoy�e pour le moment.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Confirm�s</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Mes transports confirm�s</h2>
            <div className="mt-4 space-y-3">
              {confirmedTransports.length ? confirmedTransports.map((request) => (
                <div key={request.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-night">{request.departure_commune?.name || request.departure} � {request.destination_commune?.name || request.destination}</p>
                      <p className="mt-1 text-xs text-night/55">{formatDateLabel(request.selected_offer?.pickup_date)} � {request.selected_offer?.pickup_slot}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(request.status)}`}>
                      {request.status_label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-night/65">Prix : {formatMoney(request.selected_offer?.amount_xpf)}</p>
                  {request.status !== 'delivered' ? (
                    <button
                      type="button"
                      onClick={() => void handleMarkDelivered(request.id)}
                      disabled={deliveringId === request.id}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {deliveringId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Marquer comme livr�
                    </button>
                  ) : null}
                </div>
              )) : (
                <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/40 p-4 text-sm text-night/55">
                  Aucun transport confirm� pour le moment.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
