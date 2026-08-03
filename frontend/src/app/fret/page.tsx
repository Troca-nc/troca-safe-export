'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  PackageOpen,
  Send,
  ShieldCheck,
  Truck,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import { metaApi, fretApi, reviewsApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import { estimateFreightQuote, VOLUME_BUCKETS, WEIGHT_BUCKETS, URGENCY_BUCKETS } from '@/shared-copy/envoi-livraisonPricing'

type CommuneOption = {
  id: number
  name: string
  slug: string
  provinceName: string
}

type FretOffer = {
  id: number
  request_id: number
  amount_xpf: number
  pickup_date: string
  pickup_slot: string
  pickup_slot_label?: string
  message?: string | null
  status: 'pending' | 'selected' | 'rejected' | 'withdrawn'
  status_label?: string
  transporter: {
    id: number
    user_id: number
    company_name: string
    display_name?: string | null
    rating: number
    is_verified: boolean
    pro_phone?: string | null
    pro_commune?: string | null
    vehicle_description?: string | null
    prenom?: string | null
    nom?: string | null
    email?: string | null
    telephone?: string | null
    pro_logo_url?: string | null
  }
}

type FretRequest = {
  id: number
  departure_commune_id: number | null
  destination_commune_id: number | null
  departure_commune?: { id: number | null; name: string; slug?: string | null } | null
  destination_commune?: { id: number | null; name: string; slug?: string | null } | null
  departure: string
  destination: string
  cargo_type: string
  volume_bucket: string
  weight_bucket: string
  urgency: string
  description: string
  budget_max_xpf: number | null
  contact_email: string
  contact_phone: string
  estimated_min_xpf: number | null
  estimated_max_xpf: number | null
  response_deadline_at: string | null
  status: string
  status_label?: string
  selected_offer_id: number | null
  selected_transporter_id: number | null
  selected_at: string | null
  selection_change_deadline_at: string | null
  confirmed_at: string | null
  delivered_at: string | null
  offers_count: number
  offers: FretOffer[]
  my_offer?: FretOffer | null
  selected_offer?: FretOffer | null
  author_name?: string | null
  selected_transporter?: string | null
}

type FretDashboard = {
  requests: FretRequest[]
}

type FretFormState = {
  service_type: 'colis' | 'demenagement' | 'fret_pro'
  departure_commune_id: string
  destination_commune_id: string
  cargo_type: string
  volume_bucket: string
  weight_bucket: string
  urgency: string
  budget_max_xpf: string
  description: string
  contact_email: string
  contact_phone: string
  poids: string
  fragile: boolean
  volume: string
  etage_depart: string
  etage_arrivee: string
  manutention: boolean
  nb_pieces: string
}

type ReviewFormState = {
  rating: string
  comment: string
}

type BucketOption = {
  label: string
  min_xpf: number
  max_xpf: number
}

const INITIAL_FORM: FretFormState = {
  service_type: 'fret_pro',
  departure_commune_id: '',
  destination_commune_id: '',
  cargo_type: '',
  volume_bucket: 'range_0_5_2',
  weight_bucket: 'lt_10',
  urgency: 'flexible',
  budget_max_xpf: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  poids: 'lt_5',
  fragile: false,
  volume: 'lt_10',
  etage_depart: 'rdc',
  etage_arrivee: 'rdc',
  manutention: false,
  nb_pieces: '1',
}

const VOLUME_OPTIONS = Object.entries(VOLUME_BUCKETS as Record<string, BucketOption>).map(([value, option]) => ({
  value,
  label: option.label,
  min_xpf: option.min_xpf,
  max_xpf: option.max_xpf,
}))
const WEIGHT_OPTIONS = Object.entries(WEIGHT_BUCKETS as Record<string, BucketOption>).map(([value, option]) => ({
  value,
  label: option.label,
  min_xpf: option.min_xpf,
  max_xpf: option.max_xpf,
}))
const URGENCY_OPTIONS = Object.entries(URGENCY_BUCKETS as Record<string, BucketOption>).map(([value, option]) => ({
  value,
  label: option.label,
  min_xpf: option.min_xpf,
  max_xpf: option.max_xpf,
}))

const DELIVERY_TABS = [
  { id: 'colis', label: 'Colis & Envoi' },
  { id: 'demenagement', label: 'D�m�nagement' },
  { id: 'fret_pro', label: 'Fret Pro' },
] as const

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

function formatCountdown(deadline: string | null | undefined, now: number) {
  if (!deadline) return '60:00'
  const remaining = Math.max(0, new Date(deadline).getTime() - now)
  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function flattenCommunes(provinces: Array<{ name: string; communes: Array<{ id: number; name: string; slug: string }> }>): CommuneOption[] {
  return provinces.flatMap((province) => province.communes.map((commune) => ({
    id: Number(commune.id),
    name: commune.name,
    slug: commune.slug,
    provinceName: province.name,
  })))
}

function getRequestTitle(request: FretRequest) {
  return `${request.departure_commune?.name || request.departure} � ${request.destination_commune?.name || request.destination}`
}

function getStatusTone(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'closed':
      return 'bg-nc-lagonLight text-nc-lagon border-nc-lagon/20'
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-100'
  }
}

function getTransporterLabel(offer: FretOffer) {
  return offer.transporter.display_name || offer.transporter.company_name || 'Transporteur'
}

export default function FreightPage() {
  const { isAuthenticated, user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [form, setForm] = useState<FretFormState>(INITIAL_FORM)
  const [activeTab, setActiveTab] = useState<FretFormState['service_type']>('fret_pro')
  const [communes, setCommunes] = useState<CommuneOption[]>([])
  const [requests, setRequests] = useState<FretRequest[]>([])
  const [loadingCommunes, setLoadingCommunes] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [now, setNow] = useState(Date.now())
  const [reviewForms, setReviewForms] = useState<Record<number, ReviewFormState>>({})
  const [reviewSubmittingId, setReviewSubmittingId] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    setLoadingCommunes(true)
    metaApi.getCommunes()
      .then((response) => {
        if (!alive) return
        const list = Array.isArray(response.data?.data) ? flattenCommunes(response.data.data) : []
        setCommunes(list)
        setForm((current) => {
          if (current.departure_commune_id && current.destination_commune_id) {
            return current
          }
          const noumea = list.find((item) => item.slug === 'noumea') || list[0] || null
          const dumbea = list.find((item) => item.slug === 'dumbea') || list[1] || list[0] || null
          return {
            ...current,
            departure_commune_id: current.departure_commune_id || (noumea ? String(noumea.id) : ''),
            destination_commune_id: current.destination_commune_id || (dumbea ? String(dumbea.id) : ''),
          }
        })
      })
      .catch(() => {
        if (!alive) return
        setCommunes([])
      })
      .finally(() => {
        if (alive) setLoadingCommunes(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    setForm((current) => ({
      ...current,
      contact_email: current.contact_email || user.email || '',
      contact_phone: current.contact_phone || user.telephone || '',
    }))
  }, [isAuthenticated, user])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      service_type: activeTab,
    }))
  }, [activeTab])

  useEffect(() => {
    let alive = true
    const loadRequests = async () => {
      if (!isAuthenticated) {
        if (alive) {
          setRequests([])
          setLoadingRequests(false)
        }
        return
      }

      try {
        const response = await fretApi.getMine()
        if (!alive) return
        const list = Array.isArray(response.data?.data) ? response.data.data : []
        setRequests(list)
        if (!selectedRequestId && list[0]) {
          setSelectedRequestId(list[0].id)
        }
      } catch {
        if (!alive) return
        setRequests([])
      } finally {
        if (alive) setLoadingRequests(false)
      }
    }

    void loadRequests()
    const timer = window.setInterval(() => {
      if (isAuthenticated) {
        void loadRequests()
      }
    }, 30_000)

    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [isAuthenticated, selectedRequestId])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const communeById = useMemo(() => new Map(communes.map((item) => [String(item.id), item])), [communes])
  const departureCommune = communeById.get(form.departure_commune_id)
  const destinationCommune = communeById.get(form.destination_commune_id)

  const estimate = useMemo(() => {
    if (!departureCommune || !destinationCommune) return null
    return estimateFreightQuote({
      departureSlug: departureCommune.slug,
      destinationSlug: destinationCommune.slug,
      volumeBucket: form.volume_bucket,
      weightBucket: form.weight_bucket,
      urgency: form.urgency,
    })
  }, [departureCommune, destinationCommune, form.volume_bucket, form.weight_bucket, form.urgency])

  const currentDeliveryTab = useMemo(
    () => DELIVERY_TABS.find((tab) => tab.id === activeTab) || DELIVERY_TABS[2],
    [activeTab]
  )

  const activeRequest = useMemo(() => {
    if (!requests.length) return null
    if (selectedRequestId) {
      const found = requests.find((request) => request.id === selectedRequestId)
      if (found) return found
    }
    return requests[0] || null
  }, [requests, selectedRequestId])

  useEffect(() => {
    if (!requests.length) return
    if (!selectedRequestId) {
      setSelectedRequestId(requests[0].id)
    }
  }, [requests, selectedRequestId])

  const latestOfferCount = activeRequest?.offers?.length ?? 0

  const refreshRequests = async (preferredId?: number) => {
    if (!isAuthenticated) return
    const response = await fretApi.getMine()
    const list = Array.isArray(response.data?.data) ? response.data.data : []
    setRequests(list)
    if (preferredId) {
      setSelectedRequestId(preferredId)
      return
    }
    if (!selectedRequestId && list[0]) {
      setSelectedRequestId(list[0].id)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!isAuthenticated) {
        openAuthModal({
          type: 'publish_listing',
          redirectTo: '/envoi-livraison',
        })
        return
      }

    if (!departureCommune || !destinationCommune) {
      setError('Choisissez deux communes pour votre demande.')
      return
    }

    if (departureCommune.id === destinationCommune.id) {
      setError('Le d�part et larriv�e doivent �tre diff�rents.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fretApi.createRequest({
        service_type: form.service_type,
        departure_commune_id: Number(form.departure_commune_id),
        destination_commune_id: Number(form.destination_commune_id),
        cargo_type: form.cargo_type.trim(),
        volume_bucket: form.volume_bucket,
        weight_bucket: form.weight_bucket,
        urgency: form.urgency,
        budget_max_xpf: form.budget_max_xpf ? Number(form.budget_max_xpf) : null,
        description: form.description.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        poids: form.poids,
        fragile: form.fragile,
        volume: form.volume,
        etage_depart: form.etage_depart,
        etage_arrivee: form.etage_arrivee,
        manutention: form.manutention,
        nb_pieces: form.nb_pieces,
      })

      const created = response.data?.data?.request as FretRequest | undefined
      const estimateData = response.data?.data?.estimate
      const estimateMin = Number(estimateData?.estimated_min_xpf ?? 0)
      const estimateMax = Number(estimateData?.estimated_max_xpf ?? 0)

      setNotice('Votre demande a �t� envoy�e aux transporteurs disponibles. Vous recevrez leurs offres dans lheure.')
      if (created?.id) {
        setSelectedRequestId(created.id)
      }
      await refreshRequests(created?.id)
      if (estimateMin || estimateMax) {
        setNotice((current) => `${current} Fourchette indicative : ${formatMoney(estimateMin)} - ${formatMoney(estimateMax)}.`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible denregistrer votre demande pour le moment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectOffer = async (requestId: number, offerId: number) => {
    setError('')
    try {
      await fretApi.selectOffer(requestId, offerId)
      setNotice('Loffre a �t� s�lectionn�e. Les confirmations ont �t� envoy�es.')
      await refreshRequests(requestId)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de s�lectionner cette offre pour le moment.')
    }
  }

  const handleReviewChange = (requestId: number, field: keyof ReviewFormState, value: string) => {
    setReviewForms((current) => ({
      ...current,
      [requestId]: {
        rating: current[requestId]?.rating || '5',
        comment: current[requestId]?.comment || '',
        [field]: value,
      },
    }))
  }

  const handleReviewSubmit = async (request: FretRequest) => {
    if (!request.selected_transporter_id) return
    const state = reviewForms[request.id] || { rating: '5', comment: '' }
    setReviewSubmittingId(request.id)
    setError('')
    try {
      await reviewsApi.createReview({
        pro_id: request.selected_transporter_id,
        rating: Number(state.rating || 5),
        title: 'Transport Envoi & Livraison',
        comment: state.comment.trim(),
      })
      setNotice('Votre avis a bien �t� publi�.')
      setReviewForms((current) => ({
        ...current,
        [request.id]: { rating: '5', comment: '' },
      }))
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de publier votre avis pour le moment.')
    } finally {
      setReviewSubmittingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(8,32,50,0.96),_rgba(10,126,164,0.72))] p-6 text-white shadow-sm md:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
            <Truck className="h-3.5 w-3.5" />
            Envoi & Livraison
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold">D�crivez votre envoi, les pros r�pondent rapidement</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">
            D�part, arriv�e, volume, poids et urgence : votre demande est envoy�e aux pros Envoi & Livraison actifs,
            puis vous comparez les offres et choisissez librement le transporteur.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Offres priv�es
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              Choix manuel
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Paiement hors plateforme
            </span>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demandeur</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Cr�er une demande</h2>
              </div>
              <div className="rounded-2xl bg-nc-lagonLight px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Estimation</p>
                <p className="text-lg font-bold text-night">{estimate ? `${formatMoney(estimate.estimated_min_xpf)} - ${formatMoney(estimate.estimated_max_xpf)}` : '� calculer'}</p>
              </div>
            </div>

            <div className="grid gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-2 sm:grid-cols-3">
              {DELIVERY_TABS.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active ? 'bg-[#0A7EA4] text-white shadow-sm' : 'bg-white text-night/70 hover:bg-sand'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Commune de d�part</span>
                <select
                  value={form.departure_commune_id}
                  onChange={(event) => setForm((current) => ({ ...current, departure_commune_id: event.target.value }))}
                  className="input w-full rounded-2xl"
                  disabled={loadingCommunes}
                >
                  <option value="">{loadingCommunes ? 'Chargement...' : 'Choisir une commune'}</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name} � {commune.provinceName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Commune darriv�e</span>
                <select
                  value={form.destination_commune_id}
                  onChange={(event) => setForm((current) => ({ ...current, destination_commune_id: event.target.value }))}
                  className="input w-full rounded-2xl"
                  disabled={loadingCommunes}
                >
                  <option value="">{loadingCommunes ? 'Chargement...' : 'Choisir une commune'}</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name} � {commune.provinceName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-night">
                  {activeTab === 'colis'
                    ? 'Description du colis'
                    : activeTab === 'demenagement'
                      ? 'D�tail du volume � d�placer'
                      : 'Type de marchandise'}
                </span>
                <input
                  value={form.cargo_type}
                  onChange={(event) => setForm((current) => ({ ...current, cargo_type: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder={
                    activeTab === 'colis'
                      ? 'Ex. ordinateur portable, vase, cartons...'
                      : activeTab === 'demenagement'
                        ? 'Ex. canap�, lit, meubles, �lectrom�nager...'
                        : 'Ex. mobilier, cartons, mat�riaux...'
                  }
                />
              </label>
              {activeTab === 'colis' ? (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-night">Poids du colis</span>
                    <select
                      value={form.poids}
                      onChange={(event) => setForm((current) => ({ ...current, poids: event.target.value }))}
                      className="input w-full rounded-2xl"
                    >
                      <option value="lt_5">Moins de 5 kg</option>
                      <option value="range_5_15">5 � 15 kg</option>
                      <option value="range_15_50">15 � 50 kg</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-sand/40 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.fragile}
                      onChange={(event) => setForm((current) => ({ ...current, fragile: event.target.checked }))}
                      className="h-4 w-4 rounded border-night/20"
                    />
                    <span className="text-sm font-semibold text-night">Colis fragile</span>
                  </label>
                </>
              ) : null}
              {activeTab === 'demenagement' ? (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-night">Volume estim�</span>
                    <select
                      value={form.volume}
                      onChange={(event) => setForm((current) => ({ ...current, volume: event.target.value }))}
                      className="input w-full rounded-2xl"
                    >
                      <option value="lt_10">Moins de 10 m�</option>
                      <option value="range_10_30">10 � 30 m�</option>
                      <option value="gt_30">Plus de 30 m�</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-night">�tage au d�part</span>
                    <select
                      value={form.etage_depart}
                      onChange={(event) => setForm((current) => ({ ...current, etage_depart: event.target.value }))}
                      className="input w-full rounded-2xl"
                    >
                      <option value="rdc">RDC</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                      <option value="maison">Maison individuelle</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-night">�tage � l'arriv�e</span>
                    <select
                      value={form.etage_arrivee}
                      onChange={(event) => setForm((current) => ({ ...current, etage_arrivee: event.target.value }))}
                      className="input w-full rounded-2xl"
                    >
                      <option value="rdc">RDC</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                      <option value="maison">Maison individuelle</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-sand/40 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.manutention}
                      onChange={(event) => setForm((current) => ({ ...current, manutention: event.target.checked }))}
                      className="h-4 w-4 rounded border-night/20"
                    />
                    <span className="text-sm font-semibold text-night">Manutention souhait�e</span>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-night">Nombre de pi�ces</span>
                    <select
                      value={form.nb_pieces}
                      onChange={(event) => setForm((current) => ({ ...current, nb_pieces: event.target.value }))}
                      className="input w-full rounded-2xl"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5+">5+</option>
                    </select>
                  </label>
                </>
              ) : null}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">
                  {activeTab === 'colis' ? 'Poids estim�' : 'Volume estim�'}
                </span>
                <select
                  value={form.volume_bucket}
                  onChange={(event) => setForm((current) => ({ ...current, volume_bucket: event.target.value as FretFormState['volume_bucket'] }))}
                  className="input w-full rounded-2xl"
                >
                  {VOLUME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">
                  {activeTab === 'colis' ? 'Urgence' : 'Poids estim�'}
                </span>
                <select
                  value={form.weight_bucket}
                  onChange={(event) => setForm((current) => ({ ...current, weight_bucket: event.target.value as FretFormState['weight_bucket'] }))}
                  className="input w-full rounded-2xl"
                >
                  {WEIGHT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Date souhait�e / urgence</span>
                <select
                  value={form.urgency}
                  onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.value as FretFormState['urgency'] }))}
                  className="input w-full rounded-2xl"
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Budget maximum optionnel</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.budget_max_xpf}
                  onChange={(event) => setForm((current) => ({ ...current, budget_max_xpf: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="XPF"
                />
              </label>
            </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">
                  {activeTab === 'colis'
                    ? 'Description compl�mentaire'
                    : activeTab === 'demenagement'
                      ? 'Pr�cisions compl�mentaires'
                      : 'Description compl�mentaire'}
                </span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="input w-full rounded-2xl py-3"
                placeholder="Pr�cisez les contraintes, lacc�s, le chargement..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Email de contact</span>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="vous@exemple.nc"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">T�l�phone</span>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(event) => setForm((current) => ({ ...current, contact_phone: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="+687 ..."
                />
              </label>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Route de r�f�rence</p>
                <p className="mt-1 text-lg font-bold text-night">{estimate ? formatMoney(estimate.route_reference_xpf) : '� calculer'}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Fourchette indicative</p>
                <p className="mt-1 text-lg font-bold text-night">{estimate ? `${formatMoney(estimate.estimated_min_xpf)} - ${formatMoney(estimate.estimated_max_xpf)}` : '� calculer'}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Distance estim�e</p>
                <p className="mt-1 text-lg font-bold text-night">{estimate ? `${Math.round(estimate.distance_km)} km` : '� calculer'}</p>
              </div>
            </div>

            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            {notice ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer ma demande
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Fen�tre de r�ponse</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">Votre demande en cours</h2>
                </div>
                {activeRequest ? (
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusTone(activeRequest.status)}`}>
                    {activeRequest.status_label || activeRequest.status}
                  </span>
                ) : null}
              </div>

              {activeRequest ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-night">{getRequestTitle(activeRequest)}</p>
                        <p className="mt-1 text-xs text-night/55">{activeRequest.cargo_type || 'Marchandise'} � {activeRequest.volume_bucket} � {activeRequest.weight_bucket}</p>
                      </div>
                      <div className="rounded-2xl bg-nc-lagonLight px-3 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Statut</p>
                        <p className="text-lg font-bold text-night">{activeRequest.status_label || activeRequest.status}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5 text-coral" />
                        {activeRequest.departure_commune?.name || activeRequest.departure}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5 text-coral" />
                        {activeRequest.destination_commune?.name || activeRequest.destination}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <Package className="h-3.5 w-3.5 text-nc-lagon" />
                        {activeRequest.offers_count} offre(s)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <CalendarDays className="h-3.5 w-3.5 text-nc-lagon" />
                        Votre demande reste ouverte tant que vous n'avez pas choisi un transporteur.
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-night/65">
                      Votre demande a �t� envoy�e aux transporteurs disponibles. Les r�ponses arrivent sans compte � rebours, puis le choix reste enti�rement manuel.
                    </p>
                  </div>

                  {activeRequest.offers.length ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-night">Offres re�ues</p>
                        <p className="text-xs text-night/55">{latestOfferCount} visible(s) pour vous</p>
                      </div>
                      {activeRequest.offers.map((offer) => {
                        const canChoose = activeRequest.status !== 'delivered' && activeRequest.status !== 'cancelled'
                        const isSelected = Number(activeRequest.selected_offer_id) === Number(offer.id)
                        return (
                          <article key={offer.id} className={`rounded-2xl border p-4 ${isSelected ? 'border-nc-lagon bg-nc-lagonLight/40' : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-night">{getTransporterLabel(offer)}</p>
                                  {offer.transporter.is_verified ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                      <BadgeCheck className="h-3 w-3" />
                                      Pro Envoi & Livraison v�rifi�
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm text-night/60">Note moyenne {offer.transporter.rating.toFixed(1)}/5</p>
                              </div>
                              <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-sm font-bold text-night">{formatMoney(offer.amount_xpf)}</span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDateLabel(offer.pickup_date)}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                {offer.pickup_slot_label || offer.pickup_slot}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${offer.status === 'selected' ? 'bg-emerald-50 text-emerald-700' : offer.status === 'rejected' ? 'bg-slate-100 text-slate-600' : 'bg-sand text-night/70'}`}>
                                {offer.status_label || offer.status}
                              </span>
                            </div>

                            {offer.message ? <p className="mt-3 text-sm leading-relaxed text-night/65">{offer.message}</p> : null}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {canChoose ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelectOffer(activeRequest.id, offer.id)}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  {isSelected ? 'Changer le choix' : 'Choisir cette offre'}
                                </button>
                              ) : null}
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-nc-lagonLight px-3 py-2 text-xs font-semibold text-nc-lagon">
                                  Choix manuel
                                </span>
                              ) : null}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/35 p-5 text-sm text-night/60">
                      Aucune offre re�ue pour linstant. Les transporteurs disponibles re�oivent d�j� la demande.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/35 p-5 text-sm text-night/60">
                  Envoyez votre premi�re demande pour voir ici la fen�tre de r�ponse, les offres re�ues et lhorodatage de s�lection.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(214,240,246,0.55),_rgba(255,255,255,0.98))] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Conseil</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-night">Plus vous d�crivez pr�cis�ment, plus les offres sont pertinentes</h3>
              <p className="mt-2 text-sm leading-relaxed text-night/60">
                Volume, poids, urgence et description compl�tent la r�f�rence de trajet. Les transporteurs peuvent ainsi r�pondre plus vite avec un prix r�aliste.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night">
                <Package className="h-4 w-4 text-[#0A7EA4]" />
                Estimation en quelques secondes
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Historique</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Toutes vos demandes Envoi & Livraison</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-night/55">
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Avis apr�s livraison
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Offres priv�es
              </span>
            </div>
          </div>

          {loadingRequests ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="h-44 animate-pulse rounded-2xl bg-sand/60" />
              <div className="h-44 animate-pulse rounded-2xl bg-sand/60" />
              <div className="h-44 animate-pulse rounded-2xl bg-sand/60" />
            </div>
          ) : requests.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {requests.map((request) => {
                const selectedOffer = request.offers.find((offer) => Number(offer.id) === Number(request.selected_offer_id)) || null
                const canReview = request.status === 'delivered' && request.selected_transporter_id
                const reviewState = reviewForms[request.id] || { rating: '5', comment: '' }

                return (
                  <article key={request.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-night">{getRequestTitle(request)}</p>
                        <p className="mt-1 text-xs text-night/55">{request.cargo_type || 'Marchandise'} � {request.volume_bucket} � {request.weight_bucket}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(request.status)}`}>
                        {request.status_label || request.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {request.delivered_at ? 'Livr�' : request.status === 'closed' ? 'En attente du choix' : 'Demande ouverte'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {request.departure_commune?.name || request.departure}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {request.destination_commune?.name || request.destination}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-night/65">
                      Budget max : {formatMoney(request.budget_max_xpf)} � Offre indicative : {estimateFreightQuote({
                        departureSlug: request.departure_commune?.slug || '',
                        destinationSlug: request.destination_commune?.slug || '',
                        volumeBucket: request.volume_bucket as keyof typeof VOLUME_BUCKETS,
                        weightBucket: request.weight_bucket as keyof typeof WEIGHT_BUCKETS,
                        urgency: request.urgency as keyof typeof URGENCY_BUCKETS,
                      }).estimated_min_xpf} - {estimateFreightQuote({
                        departureSlug: request.departure_commune?.slug || '',
                        destinationSlug: request.destination_commune?.slug || '',
                        volumeBucket: request.volume_bucket as keyof typeof VOLUME_BUCKETS,
                        weightBucket: request.weight_bucket as keyof typeof WEIGHT_BUCKETS,
                        urgency: request.urgency as keyof typeof URGENCY_BUCKETS,
                      }).estimated_max_xpf}
                    </p>

                    {selectedOffer ? (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                        <p className="font-semibold">Offre retenue : {getTransporterLabel(selectedOffer)}</p>
                        <p className="mt-1">{formatMoney(selectedOffer.amount_xpf)} � {formatDateLabel(selectedOffer.pickup_date)} � {selectedOffer.pickup_slot_label}</p>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-night transition hover:bg-sand"
                      onClick={() => setSelectedRequestId(request.id)}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Voir les offres
                    </button>

                    {canReview ? (
                      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
                        <p className="text-sm font-semibold text-night">Laisser un avis</p>
                        <div className="mt-3 grid gap-3">
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Note</span>
                            <select
                              value={reviewState.rating}
                              onChange={(event) => handleReviewChange(request.id, 'rating', event.target.value)}
                              className="input w-full rounded-2xl"
                            >
                              {[5, 4, 3, 2, 1].map((value) => (
                                <option key={value} value={value}>{value} / 5</option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Commentaire</span>
                            <textarea
                              rows={3}
                              value={reviewState.comment}
                              onChange={(event) => handleReviewChange(request.id, 'comment', event.target.value)}
                              className="input w-full rounded-2xl py-2"
                              placeholder="Votre retour apr�s livraison..."
                            />
                          </label>
                          <button
                            type="button"
                            disabled={reviewSubmittingId === request.id}
                            onClick={() => void handleReviewSubmit(request)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
                          >
                            {reviewSubmittingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Publier mon avis
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/40 p-6 text-center text-sm text-night/55">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A7EA4]/10 text-[#0A7EA4]">
                <PackageOpen className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-semibold text-night">Aucune demande pour linstant</p>
              <p className="mt-2 text-sm">
                Vos demandes envoi & livraison et leur statut appara�tront ici apr�s votre premier envoi.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
