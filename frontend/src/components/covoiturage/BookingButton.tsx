'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, MessageCircle, Send, ShieldCheck, Sparkles } from 'lucide-react'

import { covoiturageApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type BookingMode = 'auto' | 'manual'

type BookingButtonProps = {
  rideId: number | string
  bookingMode?: BookingMode | string | null
  seatsRemaining?: number | null
  driverId?: number | string | null
  currentUserId?: number | string | null
  onBooked?: () => void | Promise<void>
}

export default function BookingButton({
  rideId,
  bookingMode = 'auto',
  seatsRemaining = 0,
  driverId,
  currentUserId,
  onBooked,
}: BookingButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<null | { mode: BookingMode; label: string }>(null)
  const [error, setError] = useState('')
  const [openRequest, setOpenRequest] = useState(false)
  const [message, setMessage] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [spinKey, setSpinKey] = useState(0)

  const normalizedMode: BookingMode = String(bookingMode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto'
  const isDriver = currentUserId != null && String(currentUserId) === String(driverId)
  const seatsLeft = Math.max(0, Number(seatsRemaining || 0))
  const showLoginPrompt = !isAuthenticated || currentUserId == null

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => setSuccess(null), 2800)
    return () => window.clearTimeout(timer)
  }, [success])

  const buttonLabel = useMemo(() => {
    if (seatsLeft <= 0) return 'Complet'
    if (normalizedMode === 'manual') return 'Demander une place'
    return 'R�server une place'
  }, [normalizedMode, seatsLeft])

  const submitBooking = async (payloadMessage?: string) => {
    setError('')
    setLoading(true)
    try {
      const response = await covoiturageApi.book(rideId, {
        seats: 1,
        ...(payloadMessage ? { message: payloadMessage } : {}),
      })
      const status = String(response.data?.data?.status || '').toLowerCase()
      if (status === 'pending') {
        setSuccess({ mode: 'manual', label: '� Demande envoy�e - r�ponse sous 24h' })
      } else {
        setSuccess({ mode: 'auto', label: ' Place r�serv�e !' })
      }
      setOpenRequest(false)
      setMessage('')
      setSpinKey((value) => value + 1)
      await onBooked?.()
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Impossible de r�server ce trajet.')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoBook = async () => {
    if (seatsLeft <= 0 || loading || isDriver) return
    await submitBooking()
  }

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (manualLoading || isDriver || seatsLeft <= 0) return
    setManualLoading(true)
    try {
      await submitBooking(message.trim())
    } finally {
      setManualLoading(false)
    }
  }

  if (isDriver) return null

  if (showLoginPrompt) {
    return (
      <Link
        href="/connexion"
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        <Sparkles className="h-4 w-4" />
        Connectez-vous pour r�server
      </Link>
    )
  }

  if (seatsLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500">
        <ShieldCheck className="h-4 w-4" />
        Complet
      </span>
    )
  }

  if (success) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {success.label}
      </div>
    )
  }

  if (normalizedMode === 'manual') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpenRequest(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:-translate-y-0.5 hover:bg-[#0A7EA4]/5"
        >
          {loading || manualLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          {buttonLabel}
        </button>

        {openRequest ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <button type="button" aria-label="Fermer" className="absolute inset-0" onClick={() => setOpenRequest(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-3xl bg-[var(--color-surface)] p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A7EA4]/10 text-[#0A7EA4]">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-night">Demander une place</h3>
                  <p className="text-sm text-night/60">Ajoutez un message facultatif avant l'envoi.</p>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-night">Message optionnel</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Bonjour, je suis int�ress�(e) par cette place..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4]/35 focus:ring-4 focus:ring-[#0A7EA4]/10"
                  />
                </label>

                {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={manualLoading}
                    className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 disabled:opacity-70"
                  >
                    {manualLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Envoyer la proposition
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenRequest(false)}
                    className="btn-secondary inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <button
      type="button"
      onClick={handleAutoBook}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-70"
      key={spinKey}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {loading ? 'Recherche en cours...' : buttonLabel}
    </button>
  )
}
