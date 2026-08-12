'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Users,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import AvailabilityCalendar from '@/components/transport/AvailabilityCalendar'
import { proTransportApi } from '@/lib/api'

type TransporterDetail = {
  id: number | string
  company_name: string
  display_name?: string | null
  prenom?: string | null
  nom?: string | null
  pro_logo_url?: string | null
  pro_banner_url?: string | null
  pro_phone?: string | null
  pro_website?: string | null
  pro_hours?: string | null
  pro_siret?: string | null
  transport_type: string[]
  transport_type_labels?: string[]
  vehicle_description?: string | null
  vehicle_capacity?: number | null
  service_zones?: string[]
  base_price_xpf?: number | null
  price_per_km_xpf?: number | null
  avg_rating?: number | null
  total_rides?: number | null
  rides_completed?: number | null
  is_verified?: boolean
  is_available?: boolean
  pro_commune?: string | null
  reviews?: Array<{
    id: number | string
    rating: number
    comment?: string | null
    completed_at?: string | null
    reviewer_prenom?: string | null
    reviewer_nom?: string | null
  }>
  rides?: Array<{
    id: number | string
    ride_date?: string
    ride_time?: string
    departure?: string
    destination?: string
    status?: string
  }>
  availability?: Array<{ id: number | string; day_of_week: number; start_time: string; end_time: string; is_active: boolean }>
  exceptions?: Array<{ id: number | string; exception_date: string; is_unavailable: boolean }>
  available_dates?: string[]
  unavailable_dates?: string[]
}

export default function TransporterDetailPage() {
  const params = useParams<{ id: string }>()
  const transporterId = params?.id
  const [transporter, setTransporter] = useState<TransporterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [quoteForm, setQuoteForm] = useState({
    departure: '',
    destination: '',
    date: '',
    time: '',
    passengers: 1,
  })

  useEffect(() => {
    let alive = true

    const load = async () => {
      if (!transporterId) return
      try {
        const [detailRes, availabilityRes] = await Promise.all([
          proTransportApi.getById(transporterId),
          proTransportApi.getAvailability(transporterId),
        ])
        if (!alive) return
        const detail = detailRes.data?.data ?? null
        const availability = availabilityRes.data?.data ?? null
        setTransporter({
          ...detail,
          availability: availability?.weekly ?? detail?.availability ?? [],
          exceptions: availability?.exceptions ?? detail?.exceptions ?? [],
          available_dates: availability?.available_dates ?? [],
          unavailable_dates: availability?.unavailable_dates ?? [],
        })
      } catch {
        if (!alive) return
        setTransporter(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [transporterId])

  const todayCalendar = useMemo(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  }, [])

  const handleQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!transporterId) return
    setQuoteLoading(true)
    setError('')
    setQuoteResult(null)

    try {
      const response = await proTransportApi.quote(transporterId, quoteForm)
      setQuoteResult(response.data?.data ?? null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de calculer le devis.')
    } finally {
      setQuoteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12">
          <div className="h-96 animate-pulse rounded-[2rem] bg-sand/70" />
        </main>
      </div>
    )
  }

  if (!transporter) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-night">Transporteur introuvable</p>
            <Link href="/covoiturage?tab=transport" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
              <ArrowLeft className="h-4 w-4" />
              Retour aux transporteurs
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const rating = Number(transporter.avg_rating ?? 0)
  const reviews = transporter.reviews ?? []
  const serviceZones = transporter.service_zones ?? []

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Link href="/covoiturage?tab=transport" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A7EA4] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour à la recherche
        </Link>

        <section className="mt-4 overflow-hidden rounded-[2rem] border border-night/8 bg-[var(--color-surface)] shadow-sm">
          <div className="relative h-40 bg-[linear-gradient(135deg,_rgba(8,32,50,0.95),_rgba(10,126,164,0.5))]">
            {transporter.pro_banner_url ? (
              <Image src={transporter.pro_banner_url} alt="" fill className="object-cover opacity-80" />
            ) : null}
          </div>
          <div className="-mt-10 px-6 pb-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                  {transporter.pro_logo_url ? (
                    <Image src={transporter.pro_logo_url} alt="" width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#0A7EA4]">{(transporter.company_name || 'T')[0]}</span>
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Pro ✓
                  </div>
                  <h1 className="mt-2 font-display text-3xl font-bold text-night">{transporter.display_name || transporter.company_name}</h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-night/60">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {transporter.pro_commune || serviceZones[0] || 'Nouvelle-Calédonie'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-amber-500" />
                      {rating > 0 ? rating.toFixed(1) : '0.0'} ({reviews.length} avis)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <Users className="h-3.5 w-3.5" />
                      {Number(transporter.total_rides ?? transporter.rides_completed ?? 0)} courses
                    </span>
                  </div>
                </div>
              </div>
              <a href="#devis" className="btn-primary rounded-2xl px-4 py-2.5">
                Demander un devis
              </a>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-night/65">
              {transporter.vehicle_description || 'Transport local en Nouvelle-Calédonie.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(transporter.transport_type_labels || transporter.transport_type || []).map((label) => (
                <span key={label} className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                  {label}
                </span>
              ))}
              {transporter.pro_phone ? (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                  Téléphone: {transporter.pro_phone}
                </span>
              ) : null}
              {transporter.pro_hours ? (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                  Horaires: {transporter.pro_hours}
                </span>
              ) : null}
              {transporter.pro_website ? (
                <Link href={transporter.pro_website} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70 hover:text-[#0A7EA4]">
                  Site web
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <AvailabilityCalendar
              month={todayCalendar.month}
              year={todayCalendar.year}
              availableDates={transporter.available_dates ?? []}
              unavailableDates={transporter.unavailable_dates ?? []}
              title="Disponibilités"
              description="Consultez la disponibilité du transporteur sur le mois en cours."
            />

            <article id="devis" className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Devis rapide</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Estimez votre trajet</h2>
              </div>
              <form onSubmit={handleQuote} className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-night">Départ</span>
                  <input value={quoteForm.departure} onChange={(e) => setQuoteForm((current) => ({ ...current, departure: e.target.value }))} className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                  <input value={quoteForm.destination} onChange={(e) => setQuoteForm((current) => ({ ...current, destination: e.target.value }))} className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-night">Date</span>
                  <input type="date" value={quoteForm.date} onChange={(e) => setQuoteForm((current) => ({ ...current, date: e.target.value }))} className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-night">Heure</span>
                  <input type="time" value={quoteForm.time} onChange={(e) => setQuoteForm((current) => ({ ...current, time: e.target.value }))} className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-night">Passagers</span>
                  <input type="number" min={1} max={8} value={quoteForm.passengers} onChange={(e) => setQuoteForm((current) => ({ ...current, passengers: Number(e.target.value) }))} className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none" />
                </label>
                <div className="flex items-end">
                  <button type="submit" disabled={quoteLoading} className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 disabled:opacity-60">
                    <Search className="h-4 w-4" />
                    {quoteLoading ? 'Calcul du devis...' : 'Demander un devis'}
                  </button>
                </div>
              </form>
              {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
              {quoteResult ? (
                <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <p className="font-semibold">Devis estimé : {Number(quoteResult.total_price_xpf ?? 0).toLocaleString('fr-FR')} XPF</p>
                  <p className="mt-1">Durée estimée : {quoteResult.estimated_duration_minutes} minutes</p>
                  <p className="mt-1">Distance estimée : {Number(quoteResult.distance_km ?? 0).toFixed(1)} km</p>
                </div>
              ) : null}
            </article>
          </section>

          <aside className="space-y-6">
            <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-emeraude">Infos pratiques</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#0A7EA4]" />
                  Réponse rapide et réservation simple
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
                  Réservez un trajet directement depuis Kalico
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kalico-blue/80">Avis récents</p>
              <div className="mt-4 space-y-4">
                {reviews.length > 0 ? reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-night">{review.reviewer_prenom || 'Client'}</p>
                      <span className="text-xs font-semibold text-amber-600">★ {review.rating}/5</span>
                    </div>
                    <p className="mt-2 text-sm text-night/65">{review.comment || 'Avis sans commentaire.'}</p>
                  </div>
                )) : (
                  <p className="text-sm text-night/55">Aucun avis pour le moment.</p>
                )}
              </div>
            </article>
          </aside>
        </div>
      </main>
    </div>
  )
}
