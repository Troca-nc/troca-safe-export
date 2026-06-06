'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, Loader2, MapPin, MessageSquare, ShieldCheck, User2 } from 'lucide-react'

import Header from '@/components/layout/Header'
import { type RdvBookingItem } from '@/components/pro/RdvBookingCard'
import { proBookingsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type Props = {
  bookingId: string
  token: string | null
}

function getStatusTone(status: string) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (normalized === 'cancelled' || normalized === 'declined') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (normalized === 'completed') return 'bg-sky-50 text-sky-700 border-sky-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Non précisé'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Non précisé'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

function getPartnerId(booking: RdvBookingItem) {
  return booking.role === 'client' ? booking.pro.id : booking.requester.id ?? null
}

export default function BookingDetailClient({ bookingId, token }: Props) {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const [booking, setBooking] = useState<RdvBookingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadBooking() {
      setLoading(true)
      setError('')
      try {
        const response = await proBookingsApi.getById(bookingId, token || undefined)
        if (!alive) return
        setBooking(response.data?.data || null)
      } catch (err: any) {
        if (!alive) return
        setBooking(null)
        setError(err?.response?.data?.error || 'Impossible de charger ce rendez-vous.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadBooking()

    return () => {
      alive = false
    }
  }, [bookingId, token])

  const partnerId = useMemo(() => (booking ? getPartnerId(booking) : null), [booking])

  const handleContact = () => {
    if (!partnerId) return
    if (!isAuthenticated) {
      window.location.assign(`/connexion?next=${encodeURIComponent(`/messages?user=${partnerId}`)}`)
      return
    }
    window.location.assign(`/messages?user=${partnerId}`)
  }

  if (!hasHydrated && typeof window !== 'undefined') return null
  if (!isAuthenticated && !token) {
    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-lg font-semibold text-night">Connectez-vous pour voir cette demande.</p>
        <p className="mt-2 text-sm text-night/60">
          Cette page est réservée au client qui a envoyé la demande ou au professionnel concerné.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/connexion?next=/mes-rdv/${bookingId}`} className="rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white">
            Se connecter
          </Link>
          <Link href="/mes-rdv" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night">
            Retour
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/mes-rdv" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-night shadow-sm hover:-translate-y-0.5">
            <ArrowLeft className="h-4 w-4" />
            Retour à Mes rendez-vous
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-night/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-night/55">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0A7EA4]" />
            Lien sécurisé
          </div>
        </div>

        <section className="rounded-[2rem] border border-night/8 border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-corail">
            <CalendarDays className="h-3.5 w-3.5" />
            Détail rendez-vous
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold md:text-5xl">
            Consultez le rendez-vous via un accès sécurisé.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Ce lien permet d’ouvrir le rendez-vous depuis un email transactionnel, même sans passer par la liste principale.
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <div className="mt-3">
              <Link href="/mes-rdv" className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">
                <ArrowLeft className="h-3.5 w-3.5" />
                Retourner à Mes rendez-vous
              </Link>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <div className="flex items-center gap-3 text-night/60">
              <Loader2 className="h-5 w-5 animate-spin text-[#0A7EA4]" />
              Chargement du rendez-vous...
            </div>
          </div>
        ) : booking ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(booking.status)}`}>
                  {String(booking.status || 'pending').replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#0A7EA4]/10 px-3 py-1 text-xs font-semibold text-[#0A7EA4]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDateTime(booking.starts_at)}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-night">{booking.subject}</h2>
              <p className="mt-2 text-sm leading-relaxed text-night/65">
                {booking.details || 'Aucun détail complémentaire renseigné.'}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-[var(--color-border)] bg-sand p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Professionnel</p>
                  <p className="mt-2 text-lg font-semibold text-night">{booking.pro.display_name}</p>
                  <p className="mt-1 text-sm text-night/60">{booking.pro.pro_commune || 'Commune non précisée'}</p>
                  <p className="mt-3 text-sm text-night/55">{booking.pro.pro_phone || 'Téléphone non renseigné'}</p>
                </article>

                <article className="rounded-2xl border border-[var(--color-border)] bg-sand p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Demandeur</p>
                  <p className="mt-2 text-lg font-semibold text-night">{booking.requester.prenom || booking.requester_name}</p>
                  <p className="mt-1 text-sm text-night/60">{booking.requester.email || booking.requester_email}</p>
                  <p className="mt-3 text-sm text-night/55">{booking.requester_phone || 'Téléphone non renseigné'}</p>
                </article>
              </div>
            </section>

            <aside className="space-y-4">
              <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Infos pratiques</p>
                <div className="mt-4 space-y-3 text-sm text-night/70">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>{formatDateTime(booking.starts_at)}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>{booking.commune || booking.pro.pro_commune || 'Commune non précisée'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <User2 className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>{booking.role === 'client' ? 'Votre demande de rendez-vous' : 'Demande reçue'}</span>
                  </div>
                </div>
              </article>

              <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Actions</p>
                <div className="mt-4 flex flex-col gap-3">
                  {partnerId ? (
                    <button
                      type="button"
                      onClick={handleContact}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Ouvrir la messagerie
                    </button>
                  ) : null}
                  {isAuthenticated ? (
                    <Link
                      href="/mes-rdv"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night transition hover:-translate-y-0.5"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour à Mes rendez-vous
                    </Link>
                  ) : (
                    <Link
                      href="/connexion?next=/mes-rdv"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night transition hover:-translate-y-0.5"
                    >
                      Se connecter
                    </Link>
                  )}
                </div>
              </article>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  )
}
