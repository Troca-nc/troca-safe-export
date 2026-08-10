'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, X } from 'lucide-react'

import { covoiturageApi } from '@/lib/api'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { showToast } from '@/lib/toast'

type Booking = {
  id: number | string
  ride_id: number | string
  role: 'driver' | 'passenger'
  status: string
  review_exists?: boolean
  ride: {
    id: number | string
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    driver_id: number | string
    driver_prenom?: string | null
    driver_nom?: string | null
  }
}

export default function RideReviewModal({
  open,
  booking,
  onClose,
  onSubmitted,
}: {
  open: boolean
  booking: Booking | null
  onClose: () => void
  onSubmitted?: () => void | Promise<void>
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setRating(5)
    setComment('')
    setSubmitting(false)
    setError('')
    setSuccess(false)
  }, [open, booking?.id])

  const driverName = useMemo(() => {
    if (!booking) return 'le conducteur'
    return booking.ride.driver_prenom || 'le conducteur'
  }, [booking])

  const handleSubmit = async () => {
    if (!booking) return
    setSubmitting(true)
    setError('')

    try {
      await covoiturageApi.review(booking.ride_id, {
        booking_id: booking.id,
        target_user_id: booking.ride.driver_id,
        rating,
        comment: comment.trim(),
      })
      setSuccess(true)
      showToast({
        tone: 'success',
        title: 'Avis publié',
        message: `Merci, votre avis sur ${driverName} a bien été ajouté.`,
      })
      await onSubmitted?.()
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      const message = err?.response?.data?.error || "Impossible de publier l'avis."
      setError(message)
      showToast({
        tone: 'error',
        title: 'Avis non publié',
        message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-[var(--color-surface)] p-6 shadow-2xl transition duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">Après trajet</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Notez votre conducteur</h2>
            <p className="mt-1 text-sm text-night/60">
              Votre avis aide les autres passagers à voyager en confiance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-2 text-night/50 transition hover:bg-night/5 hover:text-night"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-5">
            <FeedbackAlert tone="success" title="Avis publié">
              <p>Merci, votre avis a été publié !</p>
              <p className="mt-1 text-sm text-emerald-700/80">
                {driverName} et la communauté Kalico vous remercient.
              </p>
            </FeedbackAlert>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Trajet concerné</p>
              <p className="mt-2 text-sm font-semibold text-night">
                {booking.ride.departure} → {booking.ride.destination}
              </p>
              <p className="mt-1 text-xs text-night/55">
                {booking.ride.ride_date} à {String(booking.ride.ride_time || '').slice(0, 5)}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-night">Votre note</p>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const active = value <= rating
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded-full p-1 transition hover:scale-105"
                      aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                    >
                      <BadgeCheck className={`h-8 w-8 ${active ? 'text-amber-500' : 'text-amber-200'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-night">Commentaire</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience en quelques mots..."
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[#0A7EA4] focus:ring-2 focus:ring-[#0A7EA4]/20"
              />
            </label>

            {error ? (
              <div className="mt-3">
                <FeedbackAlert tone="error" title="Envoi impossible">
                  {error}
                </FeedbackAlert>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
              >
                {submitting ? 'Publication...' : 'Publier mon avis'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night/70 transition hover:bg-[var(--color-background-secondary)]"
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
