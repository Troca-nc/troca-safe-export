'use client'

import Header from '@/components/layout/Header'
import { covoiturageApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, Car, Clock3, MapPin, ShieldCheck, Search, Send, Users } from 'lucide-react'
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
  is_verified_driver?: boolean
  driver_prenom?: string | null
  driver_nom?: string | null
  departure_commune_name?: string | null
  destination_commune_name?: string | null
  bookings_count?: number
  reviews_count?: number
  avg_rating?: number
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

function RideCard({
  ride,
  onBook,
}: {
  ride: Ride
  onBook: (id: number | string) => void
}) {
  return (
    <article className="rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-coral/15 bg-coral/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
          Covoiturage
        </span>
        {ride.is_verified_driver ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Conducteur verifie
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-xl font-semibold text-night">
        {ride.departure} - {ride.destination}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">
          <MapPin className="mr-1 inline h-3.5 w-3.5 text-coral" />
          {ride.departure_commune_name || 'Depart'} {'->'} {ride.destination_commune_name || 'Arrivee'}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-1">
          <Clock3 className="mr-1 inline h-3.5 w-3.5 text-coral" />
          {formatDateLabel(ride.ride_date)} a {ride.ride_time.slice(0, 5)}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-1">
          <Users className="mr-1 inline h-3.5 w-3.5 text-coral" />
          {ride.seats_remaining ?? 0} place(s) restante(s)
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-night/65">{ride.description}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-sand/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Prix</p>
          <p className="mt-1 text-lg font-bold text-night">{ride.price_xpf.toLocaleString('fr-FR')} XPF</p>
        </div>
        <div className="rounded-2xl bg-sand/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Confort</p>
          <p className="mt-1 text-sm text-night/70">{ride.vehicle || 'Vehicule detaille'}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
        <span className="rounded-full bg-night/5 px-2.5 py-1">{ride.music_allowed ? 'Musique ok' : 'Calme'}</span>
        <span className="rounded-full bg-night/5 px-2.5 py-1">{ride.no_smoking ? 'Non fumeur' : 'Fumeur accepte'}</span>
        <span className="rounded-full bg-night/5 px-2.5 py-1">{ride.animals_allowed ? 'Animaux ok' : 'Pas d&apos;animaux'}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-night/8 pt-4">
        <div className="text-sm text-night/65">
          <p className="font-semibold text-night">{ride.driver_prenom || 'Conducteur local'}</p>
          <p>{ride.trust_score != null ? `Confiance ${ride.trust_score}/100` : 'Profil rassurant'}</p>
        </div>
        <button
          type="button"
          onClick={() => onBook(ride.id)}
          className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          Reserver
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

  const loadRides = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await covoiturageApi.list({
        limit: 12,
        q: filters.q || undefined,
        departure: filters.departure || undefined,
        destination: filters.destination || undefined,
      })
      setRides(data?.data ?? [])
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de charger les trajets pour le moment.')
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
      setError(err?.response?.data?.error || 'La reservation a echoue.')
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
      setError(err?.response?.data?.error || 'La publication du trajet a echoue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <section className="grid gap-6 rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lagoon">
              <Car className="h-3.5 w-3.5" />
              Covoiturage
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Trouver un trajet, publier une place, voyager serein.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Recherchez un covoiturage local ou interurbain, reservez une place et voyagez avec des profils de confiance.
              La section combine recherche rapide, avis, verification et une UX simple pour le web et le mobile.
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

          <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lagoon">Rechercher</p>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Depart</span>
                <input
                  value={filters.departure}
                  onChange={(e) => setFilters((prev) => ({ ...prev, departure: e.target.value }))}
                  placeholder="Noumea"
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
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Mots cles</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                    placeholder="Prive, famille, plein air..."
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

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" id="publier">
          <form onSubmit={handleCreate} className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-coral/10 p-2 text-coral">
                <Car className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral/80">Publier un trajet</p>
                <h2 className="mt-1 text-lg font-semibold text-night">Renseignez un trajet clair et rassurant</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-night">Depart</span>
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
                  required
                  value={form.price_xpf}
                  onChange={(e) => setForm((prev) => ({ ...prev, price_xpf: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-semibold text-night">Vehicule et confort</span>
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
                placeholder="Etapes, bagages, musique, regles de confort, point de rendez-vous..."
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
                Reinitialiser
              </button>
            </div>
            {!user ? (
              <p className="mt-4 text-sm text-night/55">
                Connectez-vous pour publier un trajet ou reserver une place.
              </p>
            ) : null}
          </form>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral/80">Trajets disponibles</p>
                  <h2 className="mt-1 text-lg font-semibold text-night">Resultats recents</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/65">
                  <ShieldCheck className="h-4 w-4 text-coral" />
                  {rides.length} trajet(s)
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-48 animate-pulse rounded-[1.75rem] bg-sand/60" />
                  ))}
                </div>
              ) : rides.length > 0 ? (
                <div className="grid gap-4">
                  {rides.map((ride) => (
                    <RideCard key={ride.id} ride={ride} onBook={handleBook} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Aucun trajet disponible</p>
                  <p className="mt-2 text-sm">Essayez un autre depart, une autre destination, ou publiez le premier trajet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {bookingId ? (
          <div className="fixed bottom-4 right-4 rounded-2xl border border-night/8 bg-white px-4 py-3 text-sm shadow-card">
            Reservation en cours...
          </div>
        ) : null}
      </main>
    </div>
  )
}
