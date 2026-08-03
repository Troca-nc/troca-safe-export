'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, MapPin, User2 } from 'lucide-react'

import Header from '@/components/layout/Header'
import { proTransportApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type RideItem = {
  id: number | string
  role?: 'client' | 'transporter'
  ride_date?: string
  ride_time?: string
  departure?: string
  destination?: string
  status?: string
  payment_status?: string
  passengers?: number
  price_xpf?: number
  transporter?: { company_name?: string | null; display_name?: string | null }
  client?: { prenom?: string | null; nom?: string | null; avatar_url?: string | null }
}

function statusLabel(status?: string) {
  switch (status) {
    case 'confirmed':
      return 'Confirm�e'
    case 'completed':
      return 'Termin�e'
    case 'pending':
      return 'En attente'
    case 'refused':
      return 'Refus�e'
    case 'cancelled':
      return 'Annul�e'
    default:
      return status || '� venir'
  }
}

function statusTone(status?: string) {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'refused':
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-sand text-night/70 border-[var(--color-border)]'
  }
}

export default function MesCoursesPage() {
  const { isAuthenticated, hasHydrated, user } = useAuthStore()
  const [rides, setRides] = useState<RideItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      window.location.replace('/connexion')
      return
    }
  }, [hasHydrated, isAuthenticated])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const response = await proTransportApi.getMyRides()
        if (!alive) return
        setRides(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setRides([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const passengerRides = useMemo(() => rides.filter((ride) => ride.role === 'client'), [rides])
  const driverRides = useMemo(() => rides.filter((ride) => ride.role === 'transporter'), [rides])

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-sand/80" />
          <p className="mt-4 text-sm text-night/55">Chargement de vos courses...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Link href="/covoiturage" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A7EA4] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour au covoiturage
        </Link>

        <section className="mt-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Mes courses</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-night">
            Bonjour {user?.first_name || user?.prenom || 'vous'}
          </h1>
          <p className="mt-2 text-sm text-night/60">Retrouvez ici vos demandes, vos trajets et vos confirmations.</p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-emeraude">En tant que passager</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Mes demandes / r�servations</h2>
              </div>
              <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">{passengerRides.length}</span>
            </div>
            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="h-40 animate-pulse rounded-[1.5rem] bg-sand/70" />
              ) : passengerRides.length > 0 ? (
                passengerRides.map((ride) => (
                  <article key={ride.id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-night">{ride.departure} � {ride.destination}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-night/55">
                          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {ride.ride_date}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {ride.ride_time}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(ride.status)}`}>
                        {statusLabel(ride.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-night/60">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-[#0A7EA4]" />
                        {ride.transporter?.display_name || ride.transporter?.company_name || 'Transporteur'}
                      </span>
                      <span>{Number(ride.price_xpf ?? 0).toLocaleString('fr-FR')} XPF</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-sand/40 p-5 text-sm text-night/55">
                  Aucune course passager pour le moment.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">En tant que conducteur</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Demandes re�ues</h2>
              </div>
              <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">{driverRides.length}</span>
            </div>
            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="h-40 animate-pulse rounded-[1.5rem] bg-sand/70" />
              ) : driverRides.length > 0 ? (
                driverRides.map((ride) => (
                  <article key={ride.id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-night">{ride.departure} � {ride.destination}</p>
                        <p className="mt-2 text-sm text-night/60">Passagers: {ride.passengers || 1}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(ride.status)}`}>
                        {statusLabel(ride.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-night/60">
                      <span className="inline-flex items-center gap-1">
                        <User2 className="h-4 w-4 text-[#0A7EA4]" />
                        {ride.client?.prenom || 'Client'}
                      </span>
                      <span>{ride.payment_status === 'paid' ? 'Pay�e' : '� confirmer'}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-sand/40 p-5 text-sm text-night/55">
                  Aucune demande conducteur pour le moment.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
