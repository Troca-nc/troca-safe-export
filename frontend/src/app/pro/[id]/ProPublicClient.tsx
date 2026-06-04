'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Store,
  Clock3,
  Package,
} from 'lucide-react'

import ListingCard from '@/components/listings/ListingCard'
import ReviewCard from '@/components/reviews/ReviewCard'
import ReviewSummary from '@/components/reviews/ReviewSummary'
import ProBookingModal from '@/components/pro/ProBookingModal'
import ProQuoteModal from '@/components/pro/ProQuoteModal'
import { normalizeQuoteTemplate } from '@/components/pro/quoteTemplate'
import { proApi } from '@/lib/api'
import { reviewsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { ProPublicProfile, ProPublicReview } from '@/app/pro/publicStorefrontData'

const TABS = [
  { id: 'annonces', label: 'Annonces', icon: Package },
  { id: 'avis', label: 'Avis', icon: Star },
  { id: 'apropos', label: 'Ã€ propos', icon: Store },
] as const

type ProPublicClientProps = {
  proId: string
  initialProfile: ProPublicProfile | null
  initialReviews: ProPublicReview[]
}

function formatRating(value?: number | null) {
  const rating = Number(value ?? 0)
  if (!Number.isFinite(rating) || rating <= 0) return '0.0'
  return rating.toFixed(1)
}

export default function ProPublicPage({ proId, initialProfile, initialReviews }: ProPublicClientProps) {
  const { user } = useAuthStore()

  const [profile, setProfile] = useState<ProPublicProfile | null>(initialProfile)
  const [reviews, setReviews] = useState<ProPublicReview[]>(initialReviews)
  const [loading, setLoading] = useState(!initialProfile)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('annonces')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    if (!proId || initialProfile) {
      return
    }
    let alive = true

    const load = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          proApi.getById(proId),
          proApi.getReviews(proId, { limit: 20 }),
        ])

        if (!alive) return
        const profileData = profileRes.data?.data || null
        setProfile(profileData)
        setReviews(Array.isArray(reviewsRes.data?.data) ? reviewsRes.data.data : Array.isArray(profileData?.reviews) ? profileData.reviews : [])
      } catch {
        if (!alive) return
        setProfile(null)
        setReviews([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [initialProfile, proId])

  const displayName = useMemo(() => {
    if (!profile) return 'Professionnel Troca'
    return (
      profile.display_name
      || profile.pro_company_name
      || [profile.prenom, profile.nom].filter(Boolean).join(' ').trim()
      || 'Professionnel Troca'
    )
  }, [profile])

  const initials = useMemo(() => {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || 'P'
  }, [displayName])

  const isOwner = Boolean(user && profile && String(user.id) === String(profile.id))
  const reviewSummary = useMemo(() => ({
    avg: Number(profile?.avg_rating ?? 0),
    count: Number(profile?.review_count ?? reviews.length ?? 0),
    verified: Number(reviews.filter((review) => review.verified_purchase).length ?? 0),
  }), [profile?.avg_rating, profile?.review_count, reviews])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-[2rem] bg-sand/70" />
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" />
              <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Profil pro</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-night">Professionnel introuvable</h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              Cette vitrine nâ€™est pas disponible ou nâ€™a pas encore Ã©tÃ© validÃ©e.
            </p>
            <Link href="/pro" className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm">
              Retour Ã  lâ€™espace Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const rating = Number(profile.avg_rating ?? 0)
  const reviewCount = Number(profile.review_count ?? 0)
  const listingCount = Number(profile.listing_count ?? 0)
  const quoteTemplate = normalizeQuoteTemplate(profile.pro_quote_template)
  const bookingSettings = profile.booking_settings
  const bookingSlots = profile.booking_slots ?? []
  const bookingEnabled = Boolean(bookingSettings?.is_enabled)
  const bookingPreviewSlots = bookingSlots.slice(0, 3)

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <main className="pb-20">
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="relative h-40 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.35))]">
              {profile.pro_banner_url ? (
                <Image
                  src={profile.pro_banner_url}
                  alt={displayName}
                  fill
                  sizes="100vw"
                  className="object-cover opacity-80"
                />
              ) : null}
            </div>

            <div className="-mt-10 px-5 pb-6 md:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-md">
                    {profile.pro_logo_url ? (
                      <Image
                        src={profile.pro_logo_url}
                        alt={displayName}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[#0A7EA4]">{initials}</span>
                    )}
                  </div>

                  <div className="pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-3xl font-bold text-night">{displayName}</h1>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Pro vÃ©rifiÃ©
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-night/60">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-coral" />
                        {profile.pro_commune || 'Nouvelle-CalÃ©donie'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Store className="h-4 w-4 text-coral" />
                        {profile.pro_category || 'Professionnel local'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-4 w-4 text-coral" />
                        {profile.pro_hours || 'Horaires Ã  venir'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-night/60">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {formatRating(rating)} ({reviewCount} avis)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                        <Package className="h-4 w-4 text-[#0A7EA4]" />
                        {listingCount} annonce{listingCount > 1 ? 's' : ''} active{listingCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {profile.pro_website ? (
                    <a
                      href={profile.pro_website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      <Globe className="h-4 w-4" />
                      Site web
                    </a>
                  ) : null}
                  {profile.pro_phone ? (
                    <a
                      href={`tel:${profile.pro_phone}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      <Phone className="h-4 w-4" />
                      Appeler
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setQuoteOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Demander un devis
                  </button>
                  {bookingEnabled ? (
                    <button
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Prendre rendez-vous
                    </button>
                  ) : null}
                </div>
              </div>

              {profile.pro_description ? (
                <p className="mt-6 max-w-4xl text-sm leading-relaxed text-night/65 md:text-base">
                  {profile.pro_description}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-6">
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <ReviewSummary
              rating={reviewSummary.avg}
              count={reviewSummary.count}
              verifiedCount={reviewSummary.verified}
            />

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Inviter un client</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Collectez plus d'avis vÃ©rifiÃ©s</h2>
              <p className="mt-2 text-sm leading-relaxed text-night/60">
                Envoyez un lien d&apos;avis aprÃ¨s une transaction pour faire remonter votre note plus rapidement.
              </p>
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-3 text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Inviter un client Ã  laisser un avis
                </button>
              ) : (
                <p className="mt-4 text-sm text-night/50">Connectez-vous avec ce compte Pro pour envoyer des invitations d&apos;avis.</p>
              )}
            </div>
          </div>
        </section>

        {bookingEnabled ? (
          <section className="mx-auto max-w-7xl px-4 pb-8">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(214,240,246,0.45),_rgba(255,255,255,0.98))] p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
                    Rendez-vous en ligne
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">
                    {bookingSettings?.title || 'Prendre rendez-vous'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60">
                    {bookingSettings?.subtitle || 'Réservez un créneau directement avec ce professionnel.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Voir les créneaux
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">Créneaux récents</p>
                  {bookingPreviewSlots.length ? (
                    <div className="mt-3 space-y-2">
                      {bookingPreviewSlots.map((slot) => {
                        const startsAt = new Date(slot.starts_at)
                        const endsAt = new Date(slot.ends_at)
                        const label = new Intl.DateTimeFormat('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(startsAt)
                        const endTime = new Intl.DateTimeFormat('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(endsAt)
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-night">
                                {slot.label || label}
                              </p>
                              <p className="mt-1 text-xs text-night/55">
                                {label} · {endTime}
                              </p>
                            </div>
                            <span className="rounded-full bg-nc-lagonLight px-2.5 py-1 text-[11px] font-semibold text-nc-lagon">
                              Disponible
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/55">
                      Ce professionnel n&apos;a pas encore publié de créneau visible.
                    </div>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nc-emeraude">
                    Informations pratiques
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-night/65">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                      <span>
                        {bookingSettings?.location_label || 'Lieu du rendez-vous'} :{' '}
                        {bookingSettings?.location_text || profile.pro_commune || 'À confirmer'}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                      <span>
                        Créneau minimum {bookingSettings?.advance_notice_hours ?? 24} h à l&apos;avance.
                      </span>
                    </p>
                    {bookingSettings?.instructions ? (
                      <p className="flex items-start gap-2">
                        <MessageCircle className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                        <span>{bookingSettings.instructions}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 pb-8">
          <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-[#0A7EA4] text-white shadow-sm'
                      : 'text-night/60 hover:bg-[var(--color-background-secondary)] hover:text-night'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4">
          {activeTab === 'annonces' ? (
            <div>
              {profile.listings?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {profile.listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Aucune annonce active</p>
                  <p className="mt-2 text-sm">Ce professionnel nâ€™a pas encore dâ€™annonce en ligne.</p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'avis' ? (
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => <ReviewCard key={review.id} review={review} />)
              ) : (
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Aucun avis pour le moment</p>
                  <p className="mt-2 text-sm">Les premiers retours clients apparaîtront ici.</p>
                </div>
              )}
            </div>
          ) : null}
          {activeTab === 'apropos' ? (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Ã€ propos</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-night">Votre vitrine professionnelle</h2>
                <p className="mt-3 text-sm leading-relaxed text-night/65">
                  {profile.pro_description || 'Ce professionnel prÃ©sente ses services, ses horaires et ses coordonnÃ©es sur Troca.'}
                </p>
              </div>
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">CoordonnÃ©es</p>
                <div className="mt-4 space-y-3 text-sm text-night/65">
                  <p><span className="font-semibold text-night">Commune :</span> {profile.pro_commune || 'Nouvelle-CalÃ©donie'}</p>
                  <p><span className="font-semibold text-night">TÃ©lÃ©phone :</span> {profile.pro_phone || 'Non renseignÃ©'}</p>
                  <p><span className="font-semibold text-night">Site web :</span> {profile.pro_website || 'Non renseignÃ©'}</p>
                  <p><span className="font-semibold text-night">Horaires :</span> {profile.pro_hours || 'Non renseignÃ©s'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setInviteOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-[var(--color-surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Invitation d&apos;avis</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Inviter un client à laisser un avis</h2>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-full px-2 py-1 text-night/45 hover:bg-sand">
                ×
              </button>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!profile || !inviteEmail.trim()) return
                setInviteLoading(true)
                setInviteError('')
                try {
                  await reviewsApi.createInvite({ pro_id: profile.id, reviewer_email: inviteEmail.trim() })
                  setInviteEmail('')
                  setInviteOpen(false)
                } catch (error: any) {
                  setInviteError(error?.response?.data?.error || 'Impossible d\'envoyer l\'invitation.')
                } finally {
                  setInviteLoading(false)
                }
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-night" htmlFor="review-invite-email">Email du client</label>
                <input
                  id="review-invite-email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none transition focus:border-[#0A7EA4] focus:ring-4 focus:ring-[#0A7EA4]/10"
                  placeholder="client@exemple.nc"
                />
              </div>

              {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setInviteOpen(false)} className="rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night/70 hover:bg-sand">
                  Annuler
                </button>
                <button type="submit" disabled={inviteLoading} className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
                  {inviteLoading ? 'Envoi...' : 'Envoyer l&apos;invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}      </main>

      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
        <div className={`grid gap-3 ${bookingEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <Link
            href={`/messages/new?to=${profile.id}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0A7EA4]/25"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Link>
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night shadow-lg shadow-black/5"
          >
            <Package className="h-4 w-4 text-[#0A7EA4]" />
            Devis
          </button>
          {bookingEnabled ? (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-black/5"
            >
              <CalendarDays className="h-4 w-4" />
              RDV
            </button>
          ) : null}
        </div>
      </div>
      <ProQuoteModal
        proId={profile.id}
        proName={displayName}
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        template={quoteTemplate}
      />
      <ProBookingModal
        proId={profile.id}
        proName={displayName}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        settings={bookingSettings}
      />
</div>
  )
}
