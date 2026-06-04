'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, Filter, Loader2, Route, ShieldCheck } from 'lucide-react'

import Header from '@/components/layout/Header'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import RdvBookingCard, { type RdvBookingItem } from '@/components/pro/RdvBookingCard'
import { proBookingsApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'

type TabKey = 'all' | 'client' | 'pro'

const TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'client', label: 'Mes demandes' },
  { id: 'pro', label: 'Demandes reçues' },
]

function getPartnerId(booking: RdvBookingItem) {
  return booking.role === 'client' ? booking.pro.id : booking.requester.id ?? null
}

export default function MesRdvPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [bookings, setBookings] = useState<RdvBookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('all')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated || !user) {
      window.location.assign('/connexion?redirect=/mes-rdv')
    }
  }, [hasHydrated, isAuthenticated, user])

  const loadBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await proBookingsApi.getMine()
      setBookings(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (err: any) {
      setBookings([])
      setError(err?.response?.data?.error || 'Impossible de charger vos rendez-vous.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return
    void loadBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  const counts = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'pending').length
    const upcoming = bookings.filter((booking) => ['pending', 'confirmed', 'auto_confirmed', 'accepted'].includes(String(booking.status).toLowerCase())).length
    return {
      total: bookings.length,
      pending,
      upcoming,
      client: bookings.filter((booking) => booking.role === 'client').length,
      pro: bookings.filter((booking) => booking.role === 'pro').length,
    }
  }, [bookings])

  const visibleBookings = useMemo(() => {
    if (tab === 'client') return bookings.filter((booking) => booking.role === 'client')
    if (tab === 'pro') return bookings.filter((booking) => booking.role === 'pro')
    return bookings
  }, [bookings, tab])

  const handleContact = (booking: RdvBookingItem) => {
    const partnerId = getPartnerId(booking)
    if (!partnerId) return
    window.location.assign(`/messages?user=${partnerId}`)
  }

  const handleAction = async (bookingId: number | string, action: 'confirm' | 'decline' | 'cancel') => {
    setActionLoading(true)
    setError('')
    try {
      if (action === 'confirm') await proBookingsApi.confirm(bookingId)
      if (action === 'decline') await proBookingsApi.decline(bookingId)
      if (action === 'cancel') await proBookingsApi.cancel(bookingId)
      await loadBookings()
      showToast({
        tone: 'success',
        title: 'Rendez-vous mis à jour',
        message: 'La réservation a été actualisée.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de mettre à jour ce rendez-vous.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Action impossible',
        message,
      })
    } finally {
      setActionLoading(false)
    }
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
            <CalendarDays className="h-3.5 w-3.5" />
            Mes rendez-vous
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            Regroupez vos demandes, vos réponses et vos créneaux au même endroit.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Suivez les rendez-vous que vous avez demandés et les demandes que vous avez reçues, avec un accès direct à la messagerie pour se coordonner rapidement.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold text-night/55">Total</p>
            <p className="mt-2 text-3xl font-bold text-night">{counts.total.toLocaleString('fr-FR')}</p>
          </article>
          <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold text-night/55">En attente</p>
            <p className="mt-2 text-3xl font-bold text-night">{counts.pending.toLocaleString('fr-FR')}</p>
          </article>
          <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold text-night/55">À venir</p>
            <p className="mt-2 text-3xl font-bold text-night">{counts.upcoming.toLocaleString('fr-FR')}</p>
          </article>
          <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold text-night/55">Demandes reçues</p>
            <p className="mt-2 text-3xl font-bold text-night">{counts.pro.toLocaleString('fr-FR')}</p>
          </article>
        </section>

        <section className="mt-6 flex flex-wrap gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
          {TABS.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-[#0A7EA4] text-white shadow-sm'
                    : 'text-night/60 hover:bg-[var(--color-background-secondary)] hover:text-night'
                }`}
              >
                <Filter className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-[1.75rem] bg-sand/70" />
              ))}
            </div>
          ) : visibleBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleBookings.map((booking) => (
                <RdvBookingCard
                  key={booking.id}
                  booking={booking}
                  onContact={() => handleContact(booking)}
                  onConfirm={(bookingId) => handleAction(bookingId, 'confirm')}
                  onDecline={(bookingId) => handleAction(bookingId, 'decline')}
                  onCancel={(bookingId) => handleAction(bookingId, 'cancel')}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-white p-8 text-center text-night/55">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A7EA4]/10 text-[#0A7EA4]">
                {tab === 'pro' ? <Clock3 className="h-6 w-6" /> : <Route className="h-6 w-6" />}
              </div>
              <p className="mt-4 text-lg font-semibold text-night">
                {tab === 'client' ? 'Aucune demande en cours' : tab === 'pro' ? 'Aucune demande reçue' : 'Aucun rendez-vous'}
              </p>
              <p className="mt-2 text-sm">
                {tab === 'client'
                  ? 'Vos demandes de rendez-vous apparaîtront ici après envoi.'
                  : tab === 'pro'
                    ? 'Les demandes reçues depuis votre vitrine Pro apparaîtront ici.'
                    : 'Réservez un rendez-vous depuis une vitrine Pro pour le voir apparaître ici.'}
              </p>
              <Link href="/pros" className="btn-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3">
                Trouver un professionnel
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </main>

      {actionLoading ? (
        <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm shadow-card">
          <Loader2 className="h-4 w-4 animate-spin text-[#0A7EA4]" />
          Action en cours...
        </div>
      ) : null}
    </div>
  )
}
