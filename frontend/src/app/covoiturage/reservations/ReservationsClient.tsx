'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Car, CheckCircle2, Clock3, MapPinned, MessageCircle, ShieldCheck, UserRound } from 'lucide-react'

import Header from '@/components/layout/Header'
import PassengerProfileModal from '@/components/covoiturage/PassengerProfileModal'
import RideReviewModal from '@/components/covoiturage/RideReviewModal'
import { covoiturageApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type Booking = {
  id: number | string
  ride_id: number | string
  status: string
  booking_mode: 'auto' | 'manual' | string
  message?: string | null
  seats: number
  created_at: string
  responded_at?: string | null
  expires_at?: string | null
  is_expired?: boolean
  review_id?: number | string | null
  review_exists?: boolean
  role: 'driver' | 'passenger'
  ride: {
    id: number | string
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    price_xpf: number
    seats_total: number
    seats_remaining: number
    booking_mode: 'auto' | 'manual' | string
    status: string
    driver_id: number | string
    driver_prenom?: string | null
    driver_nom?: string | null
    driver_avatar_url?: string | null
    driver_trust_score?: number | null
  }
  other_user: {
    id: number | string
    prenom?: string | null
    nom?: string | null
    avatar_url?: string | null
    trust_score?: number | null
  }
}

type TabKey = 'passenger' | 'driver'

function statusLabel(status: string, expiresAt?: string | null) {
  if (status === 'pending' && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return { label: ' Expir�', className: 'bg-slate-100 text-slate-500' }
  }

  switch (status) {
    case 'pending':
      return { label: '� En attente', className: 'bg-amber-50 text-amber-700 border border-amber-200' }
    case 'auto_confirmed':
      return { label: ' Confirm�', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    case 'accepted':
      return { label: ' Accept�', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    case 'refused':
      return { label: 'L Refus�', className: 'bg-red-50 text-red-700 border border-red-200' }
    case 'cancelled':
      return { label: 'Annul�', className: 'bg-slate-100 text-slate-500 border border-slate-200' }
    default:
      return { label: 'En cours', className: 'bg-slate-100 text-slate-600 border border-slate-200' }
  }
}

function BookingCard({
  booking,
  onViewProfile,
  onContact,
  onCancel,
  onReview,
}: {
  booking: Booking
  onViewProfile: (booking: Booking) => void
  onContact: (booking: Booking) => void
  onCancel: (booking: Booking) => void
  onReview: (booking: Booking) => void
}) {
  const status = statusLabel(booking.status, booking.expires_at)
  const isDriver = booking.role === 'driver'
  const canManage = isDriver && booking.booking_mode === 'manual' && booking.status === 'pending'
  const rideDateTime = new Date(`${booking.ride.ride_date}T${booking.ride.ride_time.slice(0, 5)}`).getTime()
  const isRidePast = Number.isFinite(rideDateTime) && rideDateTime < Date.now()
  const isRideSoon = Number.isFinite(rideDateTime) && rideDateTime > Date.now() && (rideDateTime - Date.now()) <= 24 * 60 * 60 * 1000
  const canReview = booking.role === 'passenger' && ['accepted', 'auto_confirmed'].includes(booking.status) && isRidePast && !booking.review_exists
  const contactLabel = booking.role === 'passenger' ? 'Contacter le conducteur' : 'Contacter le passager'

  return (
    <article className="rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
          {booking.role === 'driver' ? 'Conducteur' : 'Passager'}
        </span>
        <span className="rounded-full bg-[#0A7EA4]/8 px-3 py-1 text-xs font-semibold text-[#0A7EA4]">
          {booking.booking_mode === 'manual' ? 'Sur acceptation' : 'Automatique'}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0A7EA4]/10 text-[#0A7EA4]">
          <Car className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-night">
            {booking.ride.departure} � {booking.ride.destination}
          </h3>
          <p className="mt-1 text-sm text-night/60">
            {booking.ride.ride_date} � {booking.ride.ride_time.slice(0, 5)} � {booking.ride.price_xpf.toLocaleString('fr-FR')} XPF / place
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-night/65 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-[#0A7EA4]" />
          {booking.ride.departure} � {booking.ride.destination}
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
          Demand� le {new Date(booking.created_at).toLocaleDateString('fr-FR')}
        </p>
        <p className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-[#0A7EA4]" />
          {isDriver ? 'Passager' : 'Conducteur'}: {booking.other_user.prenom || 'Profil'}
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0A7EA4]" />
          {booking.seats} place{booking.seats > 1 ? 's' : ''} demand�e{booking.seats > 1 ? 's' : ''}
        </p>
      </div>

      {booking.message ? (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-night/70">
          {booking.message}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[#0A7EA4]/10 bg-[#0A7EA4]/5 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0A7EA4]">
              Coordonn�es utiles
            </p>
            <p className="mt-1 text-sm font-semibold text-night">
              Le jour du trajet, ouvrez la conversation pour vous coordonner.
            </p>
            <p className="mt-1 text-xs text-night/55">
              {booking.other_user.prenom || 'Votre interlocuteur'} est joignable via la messagerie interne.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-night/65 shadow-sm">
              {booking.ride.ride_date} � {booking.ride.ride_time.slice(0, 5)}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-night/65 shadow-sm">
              {booking.ride.departure} � {booking.ride.destination}
            </span>
            {isRideSoon ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
                Jour du trajet
              </span>
            ) : null}
          </div>
        </div>
        {isRideSoon ? (
          <button
            type="button"
            onClick={() => onContact(booking)}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
          >
            <MessageCircle className="h-4 w-4" />
            Ouvrir la conversation
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onContact(booking)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/5"
        >
          <MessageCircle className="h-4 w-4" />
          {contactLabel}
        </button>

        {canManage ? (
          <button
            type="button"
            onClick={() => onViewProfile(booking)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/5"
          >
            Voir le profil
          </button>
        ) : null}

        {canReview ? (
          <button
            type="button"
            onClick={() => onReview(booking)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-[#0A7EA4]/5 px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
          >
            <CheckCircle2 className="h-4 w-4" />
            Noter mon conducteur
          </button>
        ) : null}

        {booking.role === 'passenger' && booking.review_exists ? (
          <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Avis envoy�
          </span>
        ) : null}

        {booking.role === 'passenger' && !['cancelled', 'refused'].includes(booking.status) ? (
          <button
            type="button"
            onClick={() => onCancel(booking)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Annuler
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default function CovoiturageReservationsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<TabKey>('passenger')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated || !user) {
      window.location.assign('/connexion?next=/covoiturage/reservations')
    }
  }, [hasHydrated, isAuthenticated, user])

  const loadReservations = async () => {
    setLoading(true)
    try {
      const response = await covoiturageApi.myReservations()
      setBookings(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (error) {
      console.error('[covoiturage] loadReservations:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return
    void loadReservations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  useEffect(() => {
    const targetBookingId = searchParams.get('review_booking')
    if (!targetBookingId || bookings.length === 0) return
    const booking = bookings.find((item) => String(item.id) === String(targetBookingId))
    if (!booking) return
    const rideDateTime = new Date(`${booking.ride.ride_date}T${booking.ride.ride_time.slice(0, 5)}`).getTime()
    const isRidePast = Number.isFinite(rideDateTime) && rideDateTime < Date.now()
    if (booking.role === 'passenger' && ['accepted', 'auto_confirmed'].includes(booking.status) && isRidePast && !booking.review_exists) {
      setSelectedReviewBooking(booking)
    }
  }, [bookings, searchParams])

  const passengerBookings = useMemo(
    () => bookings.filter((booking) => booking.role === 'passenger'),
    [bookings],
  )

  const driverBookings = useMemo(
    () => bookings.filter((booking) => booking.role === 'driver'),
    [bookings],
  )

  const visibleBookings = tab === 'passenger' ? passengerBookings : driverBookings

  const handleAccept = async (bookingId: number | string) => {
    setActionLoading(true)
    try {
      await covoiturageApi.acceptBooking(bookingId)
      setSelectedBooking(null)
      await loadReservations()
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefuse = async (bookingId: number | string) => {
    setActionLoading(true)
    try {
      await covoiturageApi.refuseBooking(bookingId)
      setSelectedBooking(null)
      await loadReservations()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async (booking: Booking) => {
    setActionLoading(true)
    try {
      await covoiturageApi.cancelBooking(booking.id)
      await loadReservations()
    } finally {
      setActionLoading(false)
    }
  }

  const handleReviewSubmitted = async () => {
    await loadReservations()
    setSelectedReviewBooking(null)
  }

  if (!hasHydrated || (!isAuthenticated && typeof window !== 'undefined')) {
    return null
  }

  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <section className="rounded-[2rem] border border-night/8 border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-corail">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mes réservations
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Suivez vos trajets et vos demandes au m�me endroit.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            G�rez vos trajets en tant que passager ou conducteur, consultez les demandes re�ues et retrouvez les confirmations en un clin d'Sil.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          {([
            { id: 'passenger', label: 'En tant que passager' },
            { id: 'driver', label: 'En tant que conducteur' },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-[#0A7EA4] text-white shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-[1.75rem] bg-sand/70" />
              ))}
            </div>
          ) : visibleBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewProfile={(item) => setSelectedBooking(item)}
                  onContact={(item) => {
                    const partnerId = item.other_user?.id
                    if (!partnerId) return
                    window.location.assign(`/messages?user=${partnerId}`)
                  }}
                  onCancel={handleCancel}
                  onReview={(item) => setSelectedReviewBooking(item)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-white p-8 text-center text-night/55">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A7EA4]/10 text-[#0A7EA4]">
                {tab === 'passenger' ? <MessageCircle className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
              </div>
              <p className="mt-4 text-lg font-semibold text-night">
                {tab === 'passenger' ? 'Aucune r�servation pour le moment' : 'Aucune demande re�ue pour le moment'}
              </p>
              <p className="mt-2 text-sm">
                {tab === 'passenger'
                  ? 'Lancez une recherche ou r�servez votre prochain trajet depuis la page Covoiturage.'
                  : 'Quand un passager demandera une place, elle appara�tra ici.'}
              </p>
              <Link href="/covoiturage" className="btn-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3">
                Voir le covoiturage
                <Car className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </main>

      <PassengerProfileModal
        open={Boolean(selectedBooking)}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onAccept={handleAccept}
        onRefuse={handleRefuse}
      />

      <RideReviewModal
        open={Boolean(selectedReviewBooking)}
        booking={selectedReviewBooking}
        onClose={() => setSelectedReviewBooking(null)}
        onSubmitted={handleReviewSubmitted}
      />

      {actionLoading ? (
        <div className="fixed bottom-4 right-4 rounded-2xl border border-night/8 bg-white px-4 py-3 text-sm shadow-card">
          Action en cours...
        </div>
      ) : null}
    </div>
  )
}
