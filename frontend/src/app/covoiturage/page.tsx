'use client'

import Header from '@/components/layout/Header'
import { covoiturageApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, Car, Search, Send, Star, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

type Ride = {
  id: number | string
  departure: string
  destination: string
  ride_date: string
  ride_time: string
  seats_total: number
  seats_reserved: number
  seats_remaining?: number
  price_xpf: number
  vehicle?: string | null
  description: string
  status: string
  trust_score?: number | null
  avg_rating?: number | null
  is_verified_driver?: boolean
  is_featured?: boolean
  driver_prenom?: string | null
  driver_nom?: string | null
  departure_commune_name?: string | null
  destination_commune_name?: string | null
  bookings_count?: number
  reviews_count?: number
  music_allowed?: boolean
  no_smoking?: boolean
  animals_allowed?: boolean
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
      return list.sort((a, b) =>
        formatRouteLabel(a).localeCompare(formatRouteLabel(b), 'fr', { sensitivity: 'base' })
      )
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
  onBook,
}: {
  ride: Ride
  onBook: (id: number | string) => void
}) {
  const rating = ride.avg_rating ?? ride.trust_score ?? 0
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] border-l-4 border-l-nc-corail bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-corail rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {ride.is_featured ? 'Boosté' : 'Covoiturage'}
        </span>
        {ride.is_verified_driver ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Conducteur vérifié
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
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{ride.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        <div className="text-sm text-[var(--color-text-secondary)]">
          <p className="font-semibold text-[var(--color-text-primary)]">{ride.driver_prenom || 'Conducteur local'}</p>
          <p>{ride.trust_score != null ? `Confiance ${ride.trust_score}/100` : 'Profil rassurant'}</p>
        </div>
        <button
          type="button"
          onClick={() => onBook(ride.id)}
          className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          Réserver
          <Send className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}

export default function CovoituragePage() {
  const { user } = useAuthStore()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingId, setBookingId] = useState<string | number | null>(null)
  const [filters, setFilters] = useState({ q: '', departure: '', destination: '' })
  const [sortBy, setSortBy] = useState<'time' | 'city' | 'rating' | 'price_asc' | 'price_desc'>('time')
  const [form, setForm] = useState({
    departure: '',
    destination: '',
    ride_date: '',
    ride_time: '',
    seats_total: 3,
    price_xpf: 0,
    vehicle: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)

  const hasFilters = useMemo(
    () => Boolean(filters.q || filters.departure || filters.destination),
    [filters],
  )

  const sortedRides = useMemo(() => sortRides(rides, sortBy), [rides, sortBy])
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

  const loadRides = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('limit', '12')
      if (filters.q) params.set('q', filters.q)
      if (filters.departure) params.set('departure', filters.departure)
      if (filters.destination) params.set('destination', filters.destination)

      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
      const response = await fetch(`${baseUrl}/api/covoiturage?${params.toString()}`, { credentials: 'include' })
      const json = await response.json()
      setRides(Array.isArray(json?.data) ? json.data : [])
    } catch (err: any) {
      console.error('[covoiturage] loadRides:', err)
      setError('')
      setRides([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBook = async (id: number | string) => {
    setBookingId(id)
    setError('')
    try {
      await covoiturageApi.book(id, { seats: 1 })
      await loadRides()
    } catch (err: any) {
      console.error('[covoiturage] handleBook:', err)
      setError('')
    } finally {
      setBookingId(null)
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await covoiturageApi.create({
        ...form,
        price_xpf: snapTo10(Number(form.price_xpf)),
        stops: [],
        comfort: form.vehicle || null,
        luggage_allowed: 'Oui',
        music_allowed: true,
        no_smoking: true,
        animals_allowed: false,
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
      })
      await loadRides()
    } catch (err: any) {
      console.error('[covoiturage] handleCreate:', err)
      setError('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <section className="grid gap-6 rounded-[2rem] border border-night/8 border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-corail">
              <Car className="h-3.5 w-3.5" />
              Covoiturage
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Trouver un trajet, publier une place, voyager serein.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Recherchez un covoiturage local ou interurbain, réservez une place et voyagez avec des profils de confiance.
              La section combine recherche rapide, avis, vérification et une UX simple pour le web et le mobile.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/connexion" className="btn-primary rounded-2xl px-4 py-2.5">
                Se connecter
              </Link>
              <a href="#publier" className="btn-secondary rounded-2xl px-4 py-2.5">
                Proposer un trajet
              </a>
            </div>
          </div>

            <div className="rounded-[1.5rem] border border-white/10 border-b-4 border-b-nc-corail bg-white/8 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-corail">Rechercher</p>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Départ</span>
                <input
                  value={filters.departure}
                  onChange={(e) => setFilters((prev) => ({ ...prev, departure: e.target.value }))}
                  placeholder="Nouméa"
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-night outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Destination</span>
                <input
                  value={filters.destination}
                  onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))}
                  placeholder="Bourail"
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-night outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Mots clés</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                    placeholder="Privé, famille, plein air..."
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 pl-11 text-sm text-night outline-none"
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={loadRides}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
              >
                Actualiser les trajets
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {hasFilters ? <p className="mt-3 text-xs text-white/55">Filtres actifs pour un tri plus rapide.</p> : null}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" id="publier">
          <form onSubmit={handleCreate} className="rounded-[2rem] border border-night/8 border-l-4 border-l-nc-corail bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-coral/10 p-2 text-coral">
                <Car className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-corail">Publier un trajet</p>
                <h2 className="mt-1 text-lg font-semibold text-night">Renseignez un trajet clair et rassurant</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
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
            </div>

            <label className="mt-4 block">
                <span className="mb-1 block text-sm font-semibold text-night">Véhicule et confort</span>
              <input
                value={form.vehicle}
                onChange={(e) => setForm((prev) => ({ ...prev, vehicle: e.target.value }))}
                placeholder="SUV, climatisation, coffre..."
                className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="mt-4 block">
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

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Publication...' : 'Publier le trajet'}
              </button>
              <button
                type="button"
                onClick={() => setForm({
                  departure: '',
                  destination: '',
                  ride_date: '',
                  ride_time: '',
                  seats_total: 3,
                  price_xpf: 0,
                  vehicle: '',
                  description: '',
                })}
                className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3"
              >
                Réinitialiser
              </button>
            </div>
            {!user ? (
              <p className="mt-4 text-sm text-night/55">
                Connectez-vous pour publier un trajet ou réserver une place.
              </p>
            ) : null}
          </form>

          <aside className="space-y-4">
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
              ) : featuredRides.length > 0 ? (
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
                          <p className="mt-1 text-xs text-night/55">{ride.driver_prenom || 'Conducteur local'} · {ride.price_xpf.toLocaleString('fr-FR')} XPF</p>
                        </div>
                      </div>
                      <Link href="/covoiturage" className="btn-secondary mt-3 inline-flex w-full justify-center rounded-2xl px-3 py-2 text-sm">
                        Voir
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
                  <p className="text-sm">Aucune annonce boostée pour le moment.</p>
                </div>
              )}

              <div className="mt-5 rounded-[1.75rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(10,126,164,0.92),_rgba(46,139,87,0.88))] p-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Publiez votre annonce</p>
                <p className="mt-2 text-lg font-semibold">Touchez des milliers de Calédoniens</p>
                <p className="mt-2 text-sm text-white/75">Un trajet visible, une mise en relation simple, sans logique de paiement.</p>
                <Link href="#publier" className="btn-primary mt-4 inline-flex w-full justify-center rounded-2xl px-4 py-2.5">
                  Déposer une annonce
                </Link>
              </div>

              {verifiedDrivers.length > 0 ? (
                <div className="mt-4 rounded-[1.5rem] border border-night/8 bg-[var(--color-background-secondary)] p-4">
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
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-corail">Trajets disponibles</p>
              <h2 className="mt-1 text-2xl font-semibold text-night">Offres type BlaBlaCar</h2>
              <p className="mt-1 text-sm text-night/55">Triez les trajets par ville, note conducteur ou prix pour trouver rapidement le bon départ.</p>
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
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-[1.75rem] bg-sand/60" />
              ))}
            </div>
          ) : sortedRides.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} onBook={handleBook} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
                <Car className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-night">Aucun trajet disponible pour le moment</p>
              <p className="mt-2 text-sm">Soyez le premier à proposer un trajet en NC.</p>
              <Link href="#publier" className="btn-primary mt-5 inline-flex items-center gap-2">
                Proposer un trajet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {bookingId ? (
          <div className="fixed bottom-4 right-4 rounded-2xl border border-night/8 bg-white px-4 py-3 text-sm shadow-card">
            Reservation en cours...
          </div>
        ) : null}
      </main>
    </div>
  )
}
