'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CheckCircle2, Loader2, X } from 'lucide-react'

import { usersApi } from '@/lib/api'

type ReviewItem = {
  rating?: number
  comment?: string | null
  role?: string | null
  reviewer_prenom?: string | null
  created_at?: string
}

type PassengerProfile = {
  id: number | string
  prenom?: string | null
  nom?: string | null
  avatar_url?: string | null
  bio?: string | null
  member_since?: string | null
  rides_as_driver?: number | null
  rides_as_passenger?: number | null
  trust_score?: number | null
  reviews?: ReviewItem[]
}

type ReservationBooking = {
  id: number | string
  status: string
  message?: string | null
  seats?: number | null
  expires_at?: string | null
  ride: {
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    price_xpf: number
  }
  other_user: {
    id: number | string
    prenom?: string | null
    nom?: string | null
    avatar_url?: string | null
    trust_score?: number | null
  }
}

type PassengerProfileModalProps = {
  open: boolean
  booking: ReservationBooking | null
  onClose: () => void
  onAccept?: (bookingId: number | string) => Promise<void> | void
  onRefuse?: (bookingId: number | string) => Promise<void> | void
}

function getScoreTone(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatMemberSince(value?: string | null) {
  if (!value) return 'membre depuis peu'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'membre depuis peu'
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
}

function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim() || '?'
}

export default function PassengerProfileModal({
  open,
  booking,
  onClose,
  onAccept,
  onRefuse,
}: PassengerProfileModalProps) {
  const [profile, setProfile] = useState<PassengerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<'accept' | 'refuse' | null>(null)

  useEffect(() => {
    if (!open || !booking?.other_user?.id) return
    let alive = true

    setLoading(true)
    usersApi
      .getProfile(String(booking.other_user.id))
      .then((res) => {
        if (!alive) return
        setProfile(res.data.data ?? null)
      })
      .catch(() => {
        if (!alive) return
        setProfile(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [booking?.other_user?.id, open])

  const reviews = useMemo(() => {
    const list = (profile?.reviews || []) as ReviewItem[]
    return list.slice(0, 3)
  }, [profile?.reviews])

  if (!open || !booking) return null

  const score = Math.max(0, Math.min(100, Number(profile?.trust_score ?? booking.other_user.trust_score ?? 100)))
  const fullName = `${profile?.prenom || booking.other_user.prenom || 'Passager'} ${profile?.nom || booking.other_user.nom || ''}`.trim()
  const avatar = profile?.avatar_url || booking.other_user.avatar_url

  const handleAccept = async () => {
    if (!onAccept) return
    setActionLoading('accept')
    try {
      await onAccept(booking.id)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefuse = async () => {
    if (!onRefuse) return
    setActionLoading('refuse')
    try {
      await onRefuse(booking.id)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <button type="button" aria-label="Fermer" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-night/10 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A7EA4]">Profil passager</p>
            <h3 className="font-display text-2xl font-bold text-night">Réservation en attente</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full border border-night/10 p-2 text-night/55 transition hover:border-night/20 hover:text-night"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
          <div className="border-b border-night/10 p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0A7EA4]/10 text-xl font-bold text-[#0A7EA4]">
                  {initials(profile?.prenom || booking.other_user.prenom, profile?.nom || booking.other_user.nom)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-semibold text-night">{fullName}</p>
                <p className="text-sm text-night/55">Membre depuis {formatMemberSince(profile?.member_since)}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-night">Score de confiance</span>
                <span className="font-bold text-night">{score}/100</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${getScoreTone(score)}`} style={{ width: `${score}%` }} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-night/45">Trajets conducteur</p>
                <p className="mt-1 text-2xl font-bold text-night">{Number(profile?.rides_as_driver ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-night/45">Trajets passager</p>
                <p className="mt-1 text-2xl font-bold text-night">{Number(profile?.rides_as_passenger ?? 0)}</p>
              </div>
            </div>

            {booking.message ? (
              <div className="mt-6 rounded-2xl border border-[#0A7EA4]/15 bg-[#0A7EA4]/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0A7EA4]">Message de la demande</p>
                <p className="mt-2 text-sm leading-relaxed text-night/75">{booking.message}</p>
              </div>
            ) : null}
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-night/10 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Derniers avis</p>
              {loading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl bg-white" />
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {reviews.map((review, index) => (
                    <div key={`${review.created_at || index}`} className="rounded-2xl bg-white p-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <BadgeCheck
                            key={starIndex}
                            className={`h-3.5 w-3.5 ${starIndex < Number(review.rating || 0) ? 'text-amber-500' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-night/70">{review.comment || 'Aucun commentaire.'}</p>
                      <p className="mt-1 text-[11px] text-night/40">
                        {review.reviewer_prenom ? `par ${review.reviewer_prenom}` : 'Avis reçu'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-night/55">Aucun avis pour le moment.</p>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-night/10 p-4">
              <p className="text-sm font-semibold text-night">Trajet demandé</p>
              <p className="mt-1 text-sm text-night/65">
                {booking.ride.departure} → {booking.ride.destination} · {booking.ride.ride_date} à {booking.ride.ride_time.slice(0, 5)}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0A7EA4]">
                {booking.ride.price_xpf.toLocaleString('fr-FR')} XPF / place
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAccept}
                disabled={actionLoading === 'accept'}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
              >
                {actionLoading === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Accepter
              </button>
              <button
                type="button"
                onClick={handleRefuse}
                disabled={actionLoading === 'refuse'}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-70"
              >
                {actionLoading === 'refuse' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Refuser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
