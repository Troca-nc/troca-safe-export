'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Car,
  Clock3,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import { covoiturageApi } from '@/lib/api'

type DriverRide = {
  id: string | number
  departure?: string | null
  destination?: string | null
  departure_commune_name?: string | null
  destination_commune_name?: string | null
  ride_date?: string | null
  ride_time?: string | null
  price_xpf?: number | null
  seats_total?: number | null
  seats_remaining?: number | null
  booking_mode?: 'auto' | 'manual' | null
  vehicle?: string | null
  status?: string | null
  trust_score?: number | null
  avg_rating?: number | null
}

type DriverReview = {
  id: string | number
  rating: number
  comment?: string | null
  created_at?: string | null
  reviewer_prenom?: string | null
  reviewer_nom?: string | null
  reviewer_avatar_url?: string | null
  ride_id?: string | number | null
  departure?: string | null
  destination?: string | null
  ride_date?: string | null
  ride_time?: string | null
}

type DriverProfilePayload = {
  profile: {
    id: string | number
    prenom?: string | null
    nom?: string | null
    avatar_url?: string | null
    bio?: string | null
    member_since?: string | null
    rides_as_driver?: number | null
    rides_as_passenger?: number | null
    trust_score?: number | null
    is_pro?: boolean | null
    nb_avis?: number | null
    note_moyenne?: number | null
    commune_name?: string | null
    province_name?: string | null
    phone_verified?: boolean | null
    email_verified?: boolean | null
    rides_total?: number | null
    rides_active?: number | null
    reviews_count?: number | null
    avg_rating?: number | null
    created_at?: string | null
  }
  vehicle?: {
    vehicle?: string | null
    vehicle_description?: string | null
    vehicle_capacity?: number | null
    luggage_allowed?: string | null
    music_allowed?: boolean | null
    no_smoking?: boolean | null
    animals_allowed?: boolean | null
  } | null
  rides?: DriverRide[]
  latest_ride?: DriverRide | null
  reviews?: DriverReview[]
}

function formatDate(value?: string | null) {
  if (!value) return 'Date non renseign�e'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date non renseign�e'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatTime(value?: string | null) {
  if (!value) return 'Heure libre'
  return value.slice(0, 5)
}

function formatRoute(ride: DriverRide) {
  const departure = ride.departure_commune_name || ride.departure || 'D�part'
  const destination = ride.destination_commune_name || ride.destination || 'Arriv�e'
  return `${departure} � ${destination}`
}

function getInitials(value?: string | null) {
  const text = (value || 'Conducteur').trim()
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
  return initials || 'C'
}

function getRatingLabel(value?: number | null) {
  const rating = Number(value ?? 0)
  if (!Number.isFinite(rating) || rating <= 0) return 'Nouveau'
  return `${rating.toFixed(1)}/5`
}

function getTrustTone(score: number) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

export default function DriverPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const driverId = params?.id
  const [payload, setPayload] = useState<DriverProfilePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const load = async () => {
      if (!driverId) return
      setLoading(true)
      setError('')

      try {
        const response = await covoiturageApi.getDriverProfile(driverId)
        if (!alive) return
        setPayload(response.data?.data ?? null)
      } catch {
        if (!alive) return
        setPayload(null)
        setError('Conducteur introuvable.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [driverId])

  const reviews = payload?.reviews ?? []
  const rides = payload?.rides ?? []
  const profile = payload?.profile ?? null
  const vehicle = payload?.vehicle ?? null
  const trustScore = Number(profile?.trust_score ?? 0)
  const memberSince = profile?.member_since ? formatDate(profile.member_since) : 'Membre r�cent'

  const reviewCount = useMemo(() => {
    return Number(profile?.reviews_count ?? reviews.length ?? 0)
  }, [profile?.reviews_count, reviews.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="h-96 animate-pulse rounded-[2rem] bg-sand/70" />
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <Link href="/covoiturage" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A7EA4] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour aux trajets
          </Link>
          <div className="mt-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-night">{error || 'Conducteur introuvable'}</p>
            <p className="mt-2 text-sm text-night/60">Ce profil public nest pas disponible.</p>
          </div>
        </main>
      </div>
    )
  }

  const displayName = [profile.prenom, profile.nom].filter(Boolean).join(' ') || 'Conducteur local'
  const score = Number.isFinite(trustScore) ? trustScore : 0

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Link href="/covoiturage" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A7EA4] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour aux trajets
        </Link>

        <section className="mt-4 overflow-hidden rounded-[2rem] border border-night/8 bg-[var(--color-surface)] shadow-sm">
          <div className="relative h-40 bg-[linear-gradient(135deg,_rgba(8,32,50,0.95),_rgba(10,126,164,0.55))]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover opacity-25" />
            ) : null}
          </div>
          <div className="-mt-10 px-6 pb-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#0A7EA4]">{getInitials(displayName)}</span>
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Profil conducteur
                  </div>
                  <h1 className="mt-2 font-display text-3xl font-bold text-night">{displayName}</h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-night/60">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.commune_name || profile.province_name || 'Nouvelle-Calédonie'}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${getTrustTone(score)}`}>
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Confiance {Math.round(score)}/100
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {memberSince}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                      <Users className="h-3.5 w-3.5" />
                      {Number(profile.rides_as_driver ?? 0)} trajets conducteur
                    </span>
                  </div>
                </div>
                </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/messages?user=${profile.id}`} className="btn-secondary rounded-2xl px-4 py-2.5">
                  <MessageCircle className="h-4 w-4" />
                  Contacter
                </Link>
                <Link href="/covoiturage" className="btn-primary rounded-2xl px-4 py-2.5">
                  Voir les trajets
                </Link>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-night/65">{profile.bio}</p>
            ) : (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-night/55">
                Ce conducteur partage ses trajets en Nouvelle-Calédonie. Consultez son v�hicule, son historique et les avis avant de r�server.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.email_verified ? (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                  Email v�rifi�
                </span>
              ) : null}
              {profile.phone_verified ? (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                  T�l�phone v�rifi�
                </span>
              ) : null}
              {profile.is_pro ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  Conducteur Pro
                </span>
              ) : null}
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                {reviewCount} avis
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-night/70">
                {Number(profile.rides_active ?? 0)} trajets actifs
              </span>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.92fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">V�hicule</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">Ce quil propose</h2>
                </div>
                <Car className="h-6 w-6 text-[#0A7EA4]" />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">V�hicule</p>
                  <p className="mt-2 text-lg font-semibold text-night">{vehicle?.vehicle || 'V�hicule non renseign�'}</p>
                  <p className="mt-2 text-sm leading-relaxed text-night/60">{vehicle?.vehicle_description || 'Informations v�hicule � venir.'}</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Capacit� & confort</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/70 shadow-sm">
                      {vehicle?.vehicle_capacity ? `${vehicle.vehicle_capacity} places` : 'Capacit� non pr�cis�e'}
                    </span>
                    {vehicle?.luggage_allowed ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/70 shadow-sm">
                        Bagages: {vehicle.luggage_allowed}
                      </span>
                    ) : null}
                    {vehicle?.music_allowed ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/70 shadow-sm">
                        Musique autoris�e
                      </span>
                    ) : null}
                    {vehicle?.no_smoking ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/70 shadow-sm">
                        Non-fumeur
                      </span>
                    ) : null}
                    {vehicle?.animals_allowed ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-night/70 shadow-sm">
                        Animaux accept�s
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">Historique</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">Ses derniers trajets</h2>
                </div>
                <Users className="h-6 w-6 text-[#0A7EA4]" />
              </div>

              {rides.length > 0 ? (
                <div className="mt-5 grid gap-4">
                  {rides.map((ride) => (
                    <article key={String(ride.id)} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">{formatRoute(ride)}</p>
                          <p className="mt-1 text-xs text-night/55">
                            {formatDate(ride.ride_date)} � {formatTime(ride.ride_time)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-nc-corailLight px-3 py-2 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-corailText">Prix</p>
                          <p className="mt-1 text-base font-bold text-nc-corailText">
                            {Number(ride.price_xpf ?? 0).toLocaleString('fr-FR')} XPF
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                        <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                          {ride.seats_remaining != null ? `${ride.seats_remaining} place${ride.seats_remaining > 1 ? 's' : ''} restante${ride.seats_remaining > 1 ? 's' : ''}` : 'Places disponibles'}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                          {ride.booking_mode === 'manual' ? 'Sur acceptation' : 'R�servation imm�diate'}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                          {ride.status || 'Publi�'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-sm text-night/60">
                  Aucun trajet r�cent nest encore affich�.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">Avis</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">Ce que disent les passagers</h2>
                </div>
                <BadgeCheck className="h-6 w-6 text-amber-500" />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-night">{getRatingLabel(profile.note_moyenne ?? profile.avg_rating ?? 0)}</p>
                    <p className="text-xs text-night/55">{reviewCount} avis au total</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Confiance</p>
                    <p className="text-lg font-bold text-[#0A7EA4]">{Math.round(score)}/100</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#0A7EA4]" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {reviews.slice(0, 4).map((review) => (
                    <article key={String(review.id)} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">{review.reviewer_prenom || 'Passager'}</p>
                          <p className="text-xs text-night/50">{review.created_at ? formatDate(review.created_at) : 'Avis r�cent'}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <BadgeCheck
                              key={`${review.id}-${index}`}
                              className={`h-3.5 w-3.5 ${index < review.rating ? 'text-amber-500' : 'text-amber-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment ? <p className="mt-3 text-sm leading-relaxed text-night/65">{review.comment}</p> : null}
                      {review.departure || review.destination ? (
                        <p className="mt-3 text-xs text-night/45">
                          {review.departure || 'D�part'} � {review.destination || 'Arriv�e'}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-6 text-sm text-night/60">
                  Aucun avis public pour le moment.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-[#0A7EA4]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">R�sum�</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">� retenir avant de r�server</h2>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-night/65">
                <p>" {Number(profile.rides_as_driver ?? 0)} trajets r�alis�s comme conducteur.</p>
                <p>" {Number(profile.rides_as_passenger ?? 0)} trajets r�alis�s comme passager.</p>
                <p>" {Number(profile.rides_total ?? rides.length ?? 0)} trajets publics visibles.</p>
                <p>" Le v�hicule et les habitudes de trajet sont d�taill�s au-dessus.</p>
              </div>

              <Link href="/covoiturage" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]">
                <Clock3 className="h-4 w-4" />
                Revenir aux offres
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
