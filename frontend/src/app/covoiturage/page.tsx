'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Bell, Car, Search, Star, Users } from 'lucide-react'

import Header from '@/components/layout/Header'
import BookingButton from '@/components/covoiturage/BookingButton'
import TransporterCard from '@/components/transport/TransporterCard'
import { API_ORIGIN, covoiturageApi, proTransportApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type Ride = {
  id: number | string
  departure: string
  destination: string
  ride_date: string
  ride_time: string
  seats_total: number
  seats_reserved: number
  seats_remaining?: number
  booking_mode?: 'auto' | 'manual'
  recurrence_type?: 'none' | 'daily' | 'weekly'
  recurrence_days?: number[]
  recurrence_until?: string | null
  recurrence_count?: number | null
  recurrence_parent_id?: number | string | null
  price_xpf: number
  vehicle?: string | null
  description: string
  status: string
  trust_score?: number | null
  avg_rating?: number | null
  is_verified_driver?: boolean
  is_featured?: boolean
  user_id?: number | string
  driver_prenom?: string | null
  driver_nom?: string | null
  departure_commune_name?: string | null
  destination_commune_name?: string | null
  bookings_count?: number
  reviews_count?: number
  music_allowed?: boolean
  no_smoking?: boolean
  animals_allowed?: boolean
  women_only?: boolean
  is_direct?: boolean
  via_stops?: string[] | null
}

type Transporter = {
  id: number | string
  company_name: string
  display_name?: string | null
  pro_logo_url?: string | null
  vehicle_photo_url?: string | null
  transport_type: string[]
  transport_type_labels?: string[]
  vehicle_description?: string | null
  vehicle_capacity?: number | null
  service_zones?: string[]
  base_price_xpf?: number | null
  price_per_km_xpf?: number | null
  avg_rating?: number | null
  total_rides?: number | null
  rides_completed?: number | null
  is_verified?: boolean
  is_available?: boolean
  pro_commune?: string | null
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date libre'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date libre'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

function snapTo10(value: number) {
  return Math.max(0, Math.round(value / 10) * 10)
}

const WEEKDAY_OPTIONS = [
  { value: 1, short: 'Lun', label: 'Lundi' },
  { value: 2, short: 'Mar', label: 'Mardi' },
  { value: 3, short: 'Mer', label: 'Mercredi' },
  { value: 4, short: 'Jeu', label: 'Jeudi' },
  { value: 5, short: 'Ven', label: 'Vendredi' },
  { value: 6, short: 'Sam', label: 'Samedi' },
  { value: 0, short: 'Dim', label: 'Dimanche' },
] as const

function addIsoDays(value: string, days: number) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatRecurrenceLabel(ride: Ride) {
  if (!ride.recurrence_type || ride.recurrence_type === 'none') return ''

  if (ride.recurrence_type === 'daily') {
    return 'Tous les jours'
  }

  const days = Array.isArray(ride.recurrence_days)
    ? [...new Set(ride.recurrence_days.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b)
    : []

  if (!days.length) {
    return 'Chaque semaine'
  }

  if (days.length === 5 && [1, 2, 3, 4, 5].every((day, index) => days[index] === day)) {
    return 'Lun-ven'
  }

  return days.map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.short || '').filter(Boolean).join(', ')
}

function formatRecurrenceDraftSummary(draft: {
  recurrence_type: 'daily' | 'weekly'
  recurrence_days: number[]
  recurrence_until: string
  ride_date: string
}) {
  if (!draft.ride_date || !draft.recurrence_until) return null

  const untilLabel = formatDateLabel(draft.recurrence_until)
  const days = [...new Set(draft.recurrence_days.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b)
  const dayLabel =
    draft.recurrence_type === 'daily'
      ? 'Tous les jours'
      : days.length
        ? days.map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.label || '').filter(Boolean).join(', ')
        : 'Chaque semaine'

  let occurrences = 1
  const start = new Date(`${draft.ride_date}T12:00:00Z`)
  const end = new Date(`${draft.recurrence_until}T12:00:00Z`)
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
    if (draft.recurrence_type === 'daily') {
      occurrences = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    } else if (days.length) {
      let count = 0
      const cursor = new Date(start)
      cursor.setUTCHours(12, 0, 0, 0)
      while (cursor <= end) {
        if (days.includes(cursor.getUTCDay())) count += 1
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      occurrences = count || 1
    }
  }

  return { untilLabel, dayLabel, occurrences }
}

function formatTimeLabel(value?: string | null) {
  if (!value) return 'Heure libre'
  return value.slice(0, 5)
}

function formatRouteLabel(ride: Ride) {
  const departure = ride.departure_commune_name || ride.departure || 'Départ'
  const destination = ride.destination_commune_name || ride.destination || 'Arrivée'
  return `${departure} → ${destination}`
}

function sortRides(rides: Ride[], sortBy: string) {
  const list = [...rides]
  switch (sortBy) {
    case 'rating':
      return list.sort((a, b) => (b.avg_rating ?? b.trust_score ?? 0) - (a.avg_rating ?? a.trust_score ?? 0))
    case 'price_asc':
      return list.sort((a, b) => (a.price_xpf ?? 0) - (b.price_xpf ?? 0))
    case 'price_desc':
      return list.sort((a, b) => (b.price_xpf ?? 0) - (a.price_xpf ?? 0))
    case 'city':
      return list.sort((a, b) => formatRouteLabel(a).localeCompare(formatRouteLabel(b), 'fr', { sensitivity: 'base' }))
    case 'time':
    default:
      return list.sort((a, b) => {
        const ad = `${a.ride_date || ''}T${a.ride_time || '00:00'}`
        const bd = `${b.ride_date || ''}T${b.ride_time || '00:00'}`
        return new Date(ad).getTime() - new Date(bd).getTime()
      })
  }
}

function RideCard({
  ride,
  currentUserId,
  onBooked,
}: {
  ride: Ride
  currentUserId?: number | string | null
  onBooked?: () => void | Promise<void>
}) {
  const rating = ride.avg_rating ?? ride.trust_score ?? 0
  const recurrenceLabel = formatRecurrenceLabel(ride)

  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] border-l-4 border-l-nc-corail bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-corail rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {ride.is_featured ? 'Boosté' : 'Covoiturage'}
        </span>
        {recurrenceLabel ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            ↻ {recurrenceLabel}
          </span>
        ) : null}
        {ride.is_verified_driver ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Conducteur vérifié
          </span>
        ) : null}
        {ride.women_only ? (
          <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
            Réservé aux femmes
          </span>
        ) : null}
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          {formatDateLabel(ride.ride_date)}
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{formatRouteLabel(ride)}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {formatTimeLabel(ride.ride_time)} · {ride.vehicle || 'Véhicule détaillé'} · {ride.seats_remaining ?? 0} place{(ride.seats_remaining ?? 0) > 1 ? 's' : ''} restante{(ride.seats_remaining ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-2xl bg-nc-corailLight px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-corailText">Prix</p>
          <p className="mt-1 text-lg font-bold text-nc-corailText">{ride.price_xpf.toLocaleString('fr-FR')} XPF</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
        <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">Départ: {ride.departure}</span>
        <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">Arrivée: {ride.destination}</span>
        <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">Note {rating > 0 ? `${rating.toFixed(1)}/5` : '—'}</span>
        {ride.is_direct === false ? (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
            🚏 Via {Array.isArray(ride.via_stops) && ride.via_stops.length ? ride.via_stops.slice(0, 3).join(', ') : 'route compatible'}
          </span>
        ) : null}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{ride.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        <div className="text-sm text-[var(--color-text-secondary)]">
          {ride.user_id ? (
            <Link
              href={`/covoiturage/conducteur/${ride.user_id}`}
              className="font-semibold text-[var(--color-text-primary)] hover:text-[#0A7EA4] hover:underline"
            >
              {ride.driver_prenom || 'Conducteur local'}
            </Link>
          ) : (
            <p className="font-semibold text-[var(--color-text-primary)]">{ride.driver_prenom || 'Conducteur local'}</p>
          )}
          <p>{ride.trust_score != null ? `Confiance ${ride.trust_score}/100` : 'Profil rassurant'}</p>
        </div>
        <BookingButton
          rideId={ride.id}
          bookingMode={ride.booking_mode}
          seatsRemaining={ride.seats_remaining ?? ride.seats_total}
          driverId={ride.user_id ?? null}
          currentUserId={currentUserId ?? null}
          onBooked={onBooked}
        />
      </div>
    </article>
  )
}

export default function CovoituragePage() {
  const { user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [activeTab, setActiveTab] = useState<'search' | 'publish' | 'transport'>('search')
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ departure: '', destination: '', ride_date: '' })
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false)
  const [sortBy, setSortBy] = useState<'time' | 'city' | 'rating' | 'price_asc' | 'price_desc'>('time')
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [transportLoading, setTransportLoading] = useState(false)
  const [transportFilters, setTransportFilters] = useState({
    type: '',
    departure: '',
    destination: '',
    ride_date: '',
    ride_time: '',
    passengers: 1,
  })
  const [form, setForm] = useState({
    departure: '',
    destination: '',
    ride_date: '',
    ride_time: '',
    seats_total: 3,
    price_xpf: 0,
    vehicle: '',
    description: '',
    booking_mode: 'auto' as 'auto' | 'manual',
    women_only: false,
    recurrence_enabled: false,
    recurrence_type: 'weekly' as 'daily' | 'weekly',
    recurrence_days: [1, 2, 3, 4, 5] as number[],
    recurrence_until: '',
  })
  const [saving, setSaving] = useState(false)
  const [publishNotice, setPublishNotice] = useState<null | {
    title: string
    description: string
    details: string[]
  }>(null)

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode')
    const tab = new URLSearchParams(window.location.search).get('tab')
    setActiveTab(tab === 'transport' ? 'transport' : mode === 'publish' ? 'publish' : 'search')
  }, [])

  useEffect(() => {
    if (!form.recurrence_enabled || !form.ride_date) return
    setForm((prev) => {
      if (!prev.recurrence_enabled || !prev.ride_date) return prev
      const suggestedUntil = addIsoDays(prev.ride_date, 30)
      if (!suggestedUntil) return prev
      if (!prev.recurrence_until || prev.recurrence_until < prev.ride_date) {
        return { ...prev, recurrence_until: suggestedUntil }
      }
      return prev
    })
  }, [form.recurrence_enabled, form.ride_date])

  useEffect(() => {
    if (!publishNotice) return
    const timer = window.setTimeout(() => setPublishNotice(null), 9000)
    return () => window.clearTimeout(timer)
  }, [publishNotice])

  const hasFilters = useMemo(
    () => Boolean(filters.departure || filters.destination || filters.ride_date || womenOnlyFilter),
    [filters, womenOnlyFilter],
  )

  const visibleRides = useMemo(() => {
    const list = filters.ride_date ? rides.filter((ride) => ride.ride_date === filters.ride_date) : rides
    return sortRides(list, sortBy)
  }, [filters.ride_date, rides, sortBy])

  const featuredRides = useMemo(
    () => [...rides].filter((ride) => ride.is_featured || (ride.trust_score ?? 0) >= 85 || (ride.avg_rating ?? 0) >= 4.8).slice(0, 5),
    [rides],
  )

  const verifiedDrivers = useMemo(
    () =>
      rides
        .filter((ride) => ride.is_verified_driver || (ride.trust_score ?? 0) >= 80)
        .slice(0, 3)
        .map((ride) => ({
          id: ride.id,
          name: ride.driver_prenom || 'Conducteur',
          score: ride.avg_rating ?? ride.trust_score ?? 0,
          route: formatRouteLabel(ride),
        })),
    [rides],
  )

  const recurrenceDraftSummary = useMemo(
    () =>
      form.recurrence_enabled
        ? formatRecurrenceDraftSummary({
            recurrence_type: form.recurrence_type,
            recurrence_days: form.recurrence_days,
            recurrence_until: form.recurrence_until,
            ride_date: form.ride_date,
          })
        : null,
    [form.recurrence_days, form.recurrence_enabled, form.recurrence_type, form.recurrence_until, form.ride_date],
  )

  const refreshRides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '12')
      if (filters.departure) params.set('departure', filters.departure)
      if (filters.destination) params.set('destination', filters.destination)
      if (womenOnlyFilter) params.set('women_only', 'true')

      const response = await fetch(`${API_ORIGIN}/api/covoiturage?${params.toString()}`, { credentials: 'include' })
      const json = await response.json()
      const data = Array.isArray(json?.data) ? json.data : []
      setRides(data)
    } catch (err) {
      console.error('[covoiturage] loadRides:', err)
      setRides([])
    } finally {
      setLoading(false)
    }
  }

  const refreshTransporters = async () => {
    setTransportLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '12')
      if (transportFilters.type) params.set('type', transportFilters.type)
      if (transportFilters.departure) params.set('zone', transportFilters.departure)
      if (transportFilters.passengers) params.set('passengers', String(transportFilters.passengers))
      if (transportFilters.ride_date) params.set('date', transportFilters.ride_date)
      if (transportFilters.ride_time) params.set('time', transportFilters.ride_time)

      const response = await proTransportApi.list(Object.fromEntries(params.entries()))
      const data = Array.isArray(response.data?.data) ? response.data.data : []
      setTransporters(data)
    } catch (err) {
      console.error('[covoiturage] loadTransporters:', err)
      setTransporters([])
    } finally {
      setTransportLoading(false)
    }
  }

  useEffect(() => {
    void refreshRides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.departure, filters.destination, womenOnlyFilter])

  useEffect(() => {
    if (activeTab === 'transport') {
      void refreshTransporters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])


  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const recurrenceSummary = form.recurrence_enabled
        ? formatRecurrenceDraftSummary({
            recurrence_type: form.recurrence_type,
            recurrence_days: form.recurrence_days,
            recurrence_until: form.recurrence_until,
            ride_date: form.ride_date,
          })
        : null

      await covoiturageApi.create({
        ...form,
        price_xpf: snapTo10(Number(form.price_xpf)),
        stops: [],
        comfort: form.vehicle || null,
        luggage_allowed: 'Oui',
        music_allowed: true,
        no_smoking: true,
        animals_allowed: false,
        women_only: form.women_only,
      })
      setForm({
        departure: '',
        destination: '',
        ride_date: '',
        ride_time: '',
        seats_total: 3,
        price_xpf: 0,
        vehicle: '',
        description: '',
        booking_mode: 'auto',
        women_only: false,
        recurrence_enabled: false,
        recurrence_type: 'weekly',
        recurrence_days: [1, 2, 3, 4, 5],
        recurrence_until: '',
      })

      setPublishNotice({
        title: form.recurrence_enabled ? 'Série publiée' : 'Trajet publié',
        description: form.recurrence_enabled
          ? 'Votre série récurrente est désormais en ligne. Elle sera visible sur les créneaux choisis.'
          : 'Votre trajet est désormais visible dans la liste des covoiturages disponibles.',
        details:
          form.recurrence_enabled && recurrenceSummary
            ? [
                `${recurrenceSummary.occurrences} trajet${recurrenceSummary.occurrences > 1 ? 's' : ''} programmés`,
                `Jusqu’au ${recurrenceSummary.untilLabel}`,
                recurrenceSummary.dayLabel,
              ]
            : ['Votre trajet est prêt à être consulté et réservé.'],
      })

      await refreshRides()
      setActiveTab('search')
    } catch (err) {
      console.error('[covoiturage] handleCreate:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {publishNotice ? (
          <section className="mb-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Publication réussie</p>
                <h2 className="mt-1 text-xl font-bold text-emerald-950">{publishNotice.title}</h2>
                <p className="mt-2 text-sm text-emerald-900/75">{publishNotice.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setPublishNotice(null)}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                aria-label="Fermer la notification de publication"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {publishNotice.details.map((detail) => (
                <span key={detail} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                  {detail}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-night/8 border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-corail">
            <Car className="h-3.5 w-3.5" />
            Covoiturage
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Trouver un trajet, publier une place, voyager serein.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Trouvez un trajet ou proposez une place — simple, local, entre Calédoniens.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/connexion" className="btn-primary rounded-2xl px-4 py-2.5">
              Se connecter
            </Link>
            <Link href="?mode=publish" className="btn-secondary rounded-2xl px-4 py-2.5">
              Proposer un trajet
            </Link>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'search', label: 'Rechercher un trajet' },
            { id: 'publish', label: 'Proposer un trajet' },
            { id: 'transport', label: 'Transport Pro' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'search' | 'publish' | 'transport')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#0A7EA4] text-white shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {activeTab === 'search' ? (
              <section className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void refreshRides()
                  }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Départ</span>
                    <input
                      value={filters.departure}
                      onChange={(e) => setFilters((prev) => ({ ...prev, departure: e.target.value }))}
                      placeholder="Nouméa"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                    <input
                      value={filters.destination}
                      onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))}
                      placeholder="Bourail"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-night">Date du trajet</span>
                    <input
                      type="date"
                      value={filters.ride_date}
                      onChange={(e) => setFilters((prev) => ({ ...prev, ride_date: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] px-4 py-3 text-sm text-night/70">
                    <input
                      type="checkbox"
                      checked={womenOnlyFilter}
                      onChange={(e) => setWomenOnlyFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-night/20 text-coral"
                    />
                    <span>Afficher seulement les trajets réservés aux femmes</span>
                  </label>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
                      >
                        <Search className="h-4 w-4" />
                        Rechercher
                      </button>
                      {user ? (
                        <Link
                          href="/profil/alertes-trajet"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-[#0A7EA4]/5 px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
                        >
                          <Bell className="h-4 w-4" />
                          Alerte
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openAuthModal({
                              type: 'login',
                              redirectTo: '/profil/alertes-trajet',
                            })
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-[#0A7EA4]/5 px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
                        >
                          <Bell className="h-4 w-4" />
                          Alerte
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-corail">Trier les résultats</p>
                    {hasFilters ? <p className="text-xs text-night/55">Filtres actifs pour un tri plus rapide.</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'time', label: 'Départ' },
                      { value: 'city', label: 'Ville' },
                      { value: 'rating', label: 'Note conducteur' },
                      { value: 'price_asc', label: 'Prix croissant' },
                      { value: 'price_desc', label: 'Prix décroissant' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSortBy(opt.value as typeof sortBy)}
                        className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                          sortBy === opt.value
                            ? 'border-nc-corail bg-nc-corail text-white'
                            : 'border-night/10 bg-sand text-night/70 hover:bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    {loading ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="h-48 animate-pulse rounded-[1.75rem] bg-sand/60" />
                        ))}
                      </div>
                    ) : visibleRides.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {visibleRides.map((ride) => (
                          <RideCard
                            key={ride.id}
                            ride={ride}
                            currentUserId={user?.id ?? null}
                            onBooked={refreshRides}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
                          <Car className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-night">Aucun trajet disponible pour le moment</p>
                        <p className="mt-2 text-sm">Soyez le premier à proposer un trajet en NC.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('publish')}
                          className="btn-primary mt-5 inline-flex items-center gap-2"
                        >
                          Proposer un trajet
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : activeTab === 'publish' ? (
              <section className="relative rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
                <form
                  onSubmit={handleCreate}
                  className={user ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4 md:grid-cols-2 opacity-40 pointer-events-none select-none'}
                >
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="rounded-full bg-coral/10 p-2 text-coral">
                      <Car className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-corail">Publier un trajet</p>
                      <h2 className="mt-1 text-lg font-semibold text-night">Renseignez un trajet clair et rassurant</h2>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Départ</span>
                    <input
                      required
                      value={form.departure}
                      onChange={(e) => setForm((prev) => ({ ...prev, departure: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                    <input
                      required
                      value={form.destination}
                      onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Date</span>
                    <input
                      type="date"
                      required
                      value={form.ride_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, ride_date: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Heure</span>
                    <input
                      type="time"
                      required
                      value={form.ride_time}
                      onChange={(e) => setForm((prev) => ({ ...prev, ride_time: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Places</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      required
                      value={form.seats_total}
                      onChange={(e) => setForm((prev) => ({ ...prev, seats_total: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Prix / place</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={form.price_xpf}
                      onChange={(e) => setForm((prev) => ({ ...prev, price_xpf: Number(e.target.value) }))}
                      onBlur={(e) => setForm((prev) => ({ ...prev, price_xpf: snapTo10(Number(e.target.value || 0)) }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-night">Véhicule et confort</span>
                    <input
                      value={form.vehicle}
                      onChange={(e) => setForm((prev) => ({ ...prev, vehicle: e.target.value }))}
                      placeholder="SUV, climatisation, coffre..."
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <div className="md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-night">Mode de réservation</span>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          value: 'auto',
                          title: 'R?servation automatique',
                          description: 'La place est bloquée instantanément',
                        },
                        {
                          value: 'manual',
                          title: 'Sur acceptation',
                          description: "Je vois le profil et j'accepte/refuse dans les 24h",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            form.booking_mode === option.value
                              ? 'border-[#0A7EA4] bg-nc-lagonLight'
                              : 'border-night/10 bg-sand/40 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="booking_mode"
                            value={option.value}
                            checked={form.booking_mode === option.value}
                            onChange={() => setForm((prev) => ({ ...prev, booking_mode: option.value as 'auto' | 'manual' }))}
                            className="sr-only"
                          />
                          <p className="font-semibold text-night">{option.title}</p>
                          <p className="mt-1 text-sm text-night/60">{option.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] px-4 py-3 text-sm text-night/70">
                    <input
                      type="checkbox"
                      checked={form.women_only}
                      onChange={(e) => setForm((prev) => ({ ...prev, women_only: e.target.checked }))}
                      className="h-4 w-4 rounded border-night/20 text-coral"
                    />
                    <span>Réserver ce trajet aux femmes</span>
                  </label>
                  <div className="md:col-span-2 rounded-3xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-night">Trajet récurrent</p>
                        <p className="mt-1 text-xs text-night/60">
                          Publiez une seule fois, puis générez automatiquement les prochains trajets.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-night">
                        <input
                          type="checkbox"
                          checked={form.recurrence_enabled}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              recurrence_enabled: e.target.checked,
                              recurrence_until: e.target.checked && prev.ride_date ? addIsoDays(prev.ride_date, 30) : prev.recurrence_until,
                            }))
                          }
                          className="h-4 w-4 rounded border-night/20 text-[#0A7EA4] focus:ring-[#0A7EA4]/25"
                        />
                        Activer
                      </label>
                    </div>
                    {form.recurrence_enabled ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-night">Fréquence</span>
                          <select
                            value={form.recurrence_type}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                recurrence_type: e.target.value as 'daily' | 'weekly',
                              }))
                            }
                            className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                          >
                            <option value="weekly">Chaque semaine</option>
                            <option value="daily">Tous les jours</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-night">Jusqu'au</span>
                          <input
                            type="date"
                            value={form.recurrence_until}
                            onChange={(e) => setForm((prev) => ({ ...prev, recurrence_until: e.target.value }))}
                            className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        {form.recurrence_type === 'weekly' ? (
                          <div className="md:col-span-2">
                            <span className="mb-2 block text-sm font-semibold text-night">Jours de départ</span>
                            <div className="flex flex-wrap gap-2">
                              {WEEKDAY_OPTIONS.map((weekday) => {
                                const isActive = form.recurrence_days.includes(weekday.value)
                                return (
                                  <button
                                    key={weekday.value}
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        recurrence_days: prev.recurrence_days.includes(weekday.value)
                                          ? prev.recurrence_days.filter((day) => day !== weekday.value)
                                          : [...prev.recurrence_days, weekday.value].sort((a, b) => a - b),
                                      }))
                                    }
                                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                                      isActive
                                        ? 'bg-[#0A7EA4] text-white shadow-sm'
                                        : 'border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
                                    }`}
                                  >
                                    {weekday.short}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {form.recurrence_enabled ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Récapitulatif</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-night">
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">Trajet récurrent</span>
                          {recurrenceDraftSummary ? (
                            <>
                              <span>•</span>
                              <span>Jusqu’au {recurrenceDraftSummary.untilLabel}</span>
                              <span>•</span>
                              <span>{recurrenceDraftSummary.dayLabel}</span>
                              <span>•</span>
                              <span>{recurrenceDraftSummary.occurrences} trajet{recurrenceDraftSummary.occurrences > 1 ? 's' : ''} programmés</span>
                            </>
                          ) : (
                            <span>Choisissez une date de début et une date de fin pour prévisualiser la série.</span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-night">Description du trajet</span>
                    <textarea
                      required
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={5}
                      placeholder="Étapes, bagages, musique, règles de confort, point de rendez-vous..."
                      className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving || !user}
                      className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Publication...' : 'Publier le trajet'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
        setForm({
          departure: '',
          destination: '',
          ride_date: '',
          ride_time: '',
          seats_total: 3,
          price_xpf: 0,
          vehicle: '',
          description: '',
          booking_mode: 'auto',
          women_only: false,
          recurrence_enabled: false,
          recurrence_type: 'weekly',
          recurrence_days: [1, 2, 3, 4, 5],
          recurrence_until: '',
        })
                      }
                      className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </form>

                {!user ? (
                  <div className="absolute inset-5 flex items-center justify-center rounded-[1.5rem] bg-white/80 p-6 backdrop-blur-sm">
                    <div className="max-w-sm rounded-[1.5rem] border border-night/8 bg-white p-6 text-center shadow-lg">
                      <p className="text-lg font-semibold text-night">Connectez-vous pour proposer un trajet</p>
                      <div className="mt-4 flex flex-col gap-3">
                        <Link href="/connexion" className="btn-primary inline-flex justify-center rounded-2xl px-4 py-2.5">
                          Se connecter
                        </Link>
                        <Link href="/inscription" className="btn-secondary inline-flex justify-center rounded-2xl px-4 py-2.5">
                          Créer un compte
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : (
              <section className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Transport Pro</p>
                    <h2 className="mt-1 text-2xl font-bold text-night">Trouver un transporteur local</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60">
                      Comparez les transporteurs professionnels, leurs zones d&apos;intervention et leurs tarifs.
                    </p>
                  </div>
                  <Link href="/pro/transport/inscription" className="text-sm font-semibold text-[#0A7EA4] hover:underline">
                    Devenir transporteur pro
                  </Link>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void refreshTransporters()
                  }}
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Type de transport</span>
                    <select
                      value={transportFilters.type}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    >
                      <option value="">Tous les types</option>
                      <option value="taxi">Taxi / VTC</option>
                      <option value="navette">Navette</option>
                      <option value="aeroport">Transfert aéroport</option>
                      <option value="excursion">Excursion</option>
                      <option value="scolaire">Transport scolaire</option>
                      <option value="chauffeur">Location avec chauffeur</option>
                      <option value="location">Location avec chauffeur</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Commune / zone</span>
                    <input
                      value={transportFilters.departure}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, departure: e.target.value }))}
                      placeholder="Nouméa, Dumbéa..."
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                    <input
                      value={transportFilters.destination}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, destination: e.target.value }))}
                      placeholder="Aéroport, Bourail..."
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Date</span>
                    <input
                      type="date"
                      value={transportFilters.ride_date}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, ride_date: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Heure</span>
                    <input
                      type="time"
                      value={transportFilters.ride_time}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, ride_time: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Passagers</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={transportFilters.passengers}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, passengers: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <div className="md:col-span-2 xl:col-span-3">
                    <button
                      type="submit"
                      className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
                    >
                      <Users className="h-4 w-4" />
                      Rechercher des transporteurs
                    </button>
                  </div>
                </form>

                <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                  {transportLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-80 animate-pulse rounded-[1.75rem] bg-sand/60" />
                      ))}
                    </div>
                  ) : transporters.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {transporters.map((transporter) => (
                        <TransporterCard
                          key={transporter.id}
                          transporter={transporter}
                          detailHref={`/covoiturage/transport/${transporter.id}`}
                          quoteHref={`/covoiturage/transport/${transporter.id}#devis`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A7EA4]/10 text-[#0A7EA4]">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-night">Aucun transporteur trouvé</p>
                      <p className="mt-2 text-sm">Essayez de changer la zone, le type ou la date de recherche.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            {featuredRides.length > 0 ? (
              <div className="sticky top-20 rounded-[2rem] border border-night/8 border-l-4 border-l-nc-corail bg-white p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-corail">Annonces boostées</p>
                    <h2 className="mt-1 text-lg font-semibold text-night">Les plus visibles maintenant</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/65">
                    <Star className="h-4 w-4 text-amber-500" />
                    {featuredRides.length} coup(s) de cœur
                  </div>
                </div>

                {loading ? (
                  <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-32 animate-pulse rounded-[1.5rem] bg-sand/60" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {featuredRides.map((ride) => (
                      <article key={ride.id} className="rounded-[1.5rem] border border-night/8 bg-[var(--color-background-secondary)] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-corailLight text-nc-corailText">
                            <Car className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-corail">Boosté</p>
                            <h3 className="truncate text-sm font-semibold text-night">{formatRouteLabel(ride)}</h3>
                            <p className="mt-1 text-xs text-night/55">
                              {ride.driver_prenom || 'Conducteur local'} · {ride.price_xpf.toLocaleString('fr-FR')} XPF
                            </p>
                          </div>
                        </div>
                        <Link href="/covoiturage" className="btn-secondary mt-3 inline-flex w-full justify-center rounded-2xl px-3 py-2 text-sm">
                          Voir
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(10,126,164,0.92),_rgba(46,139,87,0.88))] p-5 text-white shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Publiez votre annonce</p>
              <p className="mt-2 text-lg font-semibold">Touchez des milliers de Calédoniens</p>
              <p className="mt-2 text-sm text-white/75">Un trajet visible, une mise en relation simple, sans logique de paiement.</p>
              <button
                type="button"
                onClick={() => setActiveTab('publish')}
                className="btn-primary mt-4 inline-flex w-full justify-center rounded-2xl px-4 py-2.5"
              >
                Déposer une annonce
              </button>
            </div>

            {verifiedDrivers.length > 0 ? (
              <div className="rounded-[1.5rem] border border-night/8 bg-[var(--color-background-secondary)] p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-nc-corail" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-corail">Conducteurs vérifiés</p>
                    <h3 className="mt-1 text-sm font-semibold text-night">Les profils les plus rassurants</h3>
                  </div>
                </div>
                <div className="mt-3 grid gap-3">
                  {verifiedDrivers.map((driver) => (
                    <div key={driver.id} className="rounded-2xl border border-night/8 bg-white p-3">
                      <p className="text-sm font-semibold text-night">{driver.name}</p>
                      <p className="mt-1 text-xs text-night/55">{driver.route}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-nc-corail">
                        {driver.score > 0 ? `${driver.score.toFixed(1)}/5 de note` : 'Conducteur vérifié'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

      </main>
    </div>
  )
}
