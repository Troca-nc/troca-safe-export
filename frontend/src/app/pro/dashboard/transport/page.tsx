'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react'

import { proTransportApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type DashboardData = {
  transporter?: {
    id: number | string
    company_name?: string | null
    display_name?: string | null
    pro_logo_url?: string | null
    pro_banner_url?: string | null
    pro_commune?: string | null
    transport_type_labels?: string[]
    service_zones?: string[]
    rating?: number | null
    rides_completed?: number | null
  }
  rides_today?: Array<any>
  rides_upcoming?: Array<any>
  rides_completed_count?: number
  revenue_total_xpf?: number
  revenue_30d_xpf?: number
  avg_rating?: number
  pending_reviews?: number
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-sm font-semibold text-night/60">{label}</p>
      <p className="mt-2 text-3xl font-bold text-night">{value}</p>
      <p className="mt-2 text-sm text-night/55">{helper}</p>
    </article>
  )
}

export default function ProDashboardTransportPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      window.location.replace('/connexion')
      return
    }
    if (user && !user.is_pro) {
      window.location.replace('/pro')
    }
  }, [hasHydrated, isAuthenticated, user])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const response = await proTransportApi.getDashboard()
        if (!alive) return
        setData(response.data?.data ?? null)
      } catch {
        if (!alive) return
        setData(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const transporter = data?.transporter
  const todayRides = useMemo(() => data?.rides_today ?? [], [data])
  const upcomingRides = useMemo(() => data?.rides_upcoming ?? [], [data])

  if (!hasHydrated || !isAuthenticated || (user && !user.is_pro)) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-sand/80" />
          <p className="mt-4 text-sm text-night/55">Chargement du dashboard transport...</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Transport Pro</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Bienvenue dans votre espace transport</h1>
            <p className="mt-2 text-sm text-night/60">
              Gérez vos réservations, suivez vos revenus et vos courses du jour.
            </p>
          </div>
          <Link href="/covoiturage?tab=transport" className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
            Rechercher des courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5" />
            {transporter?.pro_commune || 'Nouvelle-Calédonie'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <Users className="h-3.5 w-3.5" />
            {Number(transporter?.rides_completed ?? 0)} courses
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses terminées" value={String(data?.rides_completed_count ?? 0)} helper="Depuis l’ouverture du compte" />
        <StatCard label="Revenu total" value={`${Number(data?.revenue_total_xpf ?? 0).toLocaleString('fr-FR')} XPF`} helper="Montants payés" />
        <StatCard label="Revenu 30 jours" value={`${Number(data?.revenue_30d_xpf ?? 0).toLocaleString('fr-FR')} XPF`} helper="Derniers encaissements" />
        <StatCard label="Note moyenne" value={`${Number(data?.avg_rating ?? 0).toFixed(1)}/5`} helper="Avis clients" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-emeraude">Aujourd&apos;hui</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Courses du jour</h2>
          <div className="mt-4 space-y-3">
            {todayRides.length > 0 ? todayRides.map((ride) => (
              <div key={ride.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-4">
                <p className="font-semibold text-night">{ride.departure} → {ride.destination}</p>
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
            )) : (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/40 p-4 text-sm text-night/55">Aucune course aujourd&apos;hui.</p>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">À venir</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Prochaines courses</h2>
          <div className="mt-4 space-y-3">
            {upcomingRides.length > 0 ? upcomingRides.map((ride) => (
              <div key={ride.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-4">
                <p className="font-semibold text-night">{ride.departure} → {ride.destination}</p>
                <p className="mt-1 text-sm text-night/60">{ride.ride_date} à {ride.ride_time}</p>
              </div>
            )) : (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-sand/40 p-4 text-sm text-night/55">Aucune course à venir.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
