'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { BadgeCheck, Loader2, MessageCircle, Star } from 'lucide-react'

import Header from '@/components/layout/Header'
import ReviewSummary from '@/components/reviews/ReviewSummary'
import { reviewsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type InviteData = {
  token: string
  expires_at?: string | null
  used_at?: string | null
  pro: {
    id: number | string
    prenom?: string | null
    nom?: string | null
    pro_company_name?: string | null
    pro_category?: string | null
    pro_logo_url?: string | null
    pro_banner_url?: string | null
    pro_description?: string | null
    pro_commune?: string | null
    pro_website?: string | null
    pro_phone?: string | null
  }
}

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < value
        return (
          <button
            key={index}
            type="button"
            onClick={() => onChange(index + 1)}
            className="rounded-full p-1 transition hover:scale-110"
            aria-label={`${index + 1} étoiles`}
          >
            <Star className={`h-6 w-6 ${active ? 'fill-amber-400 text-amber-400' : 'text-night/20'}`} />
          </button>
        )
      })}
    </div>
  )
}

export default function ReviewInvitePage() {
  const params = useParams<{ token?: string }>()
  const token = params?.token || ''
  const { user, hasHydrated } = useAuthStore()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [summary, setSummary] = useState({ rating: 0, count: 0, verifiedCount: 0 })
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [reviewerPrenom, setReviewerPrenom] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let alive = true

    const load = async () => {
      try {
        const response = await reviewsApi.getInvite(token)
        if (!alive) return
        setInvite(response.data?.data || null)
      } catch {
        if (!alive) return
        setInvite(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [token])

  useEffect(() => {
    if (!invite?.pro?.id) return
    let alive = true

    const loadSummary = async () => {
      try {
        const response = await reviewsApi.getByPro(invite.pro.id, { limit: 3 })
        const payload = response.data?.data || {}
        const reviews = Array.isArray(payload.reviews) ? payload.reviews : []
        if (!alive) return
        setSummary({
          rating: Number(payload.avg_rating ?? 0),
          count: Number(payload.total ?? reviews.length ?? 0),
          verifiedCount: Number(payload.verified_count ?? reviews.filter((review: any) => review.verified_purchase).length ?? 0),
        })
      } catch {
        if (!alive) return
        setSummary({
          rating: 0,
          count: 0,
          verifiedCount: 0,
        })
      }
    }

    void loadSummary()
    return () => {
      alive = false
    }
  }, [invite?.pro?.id])

  useEffect(() => {
    if (!hasHydrated) return
    setReviewerPrenom(user?.prenom || user?.first_name || '')
    setReviewerEmail(user?.email || '')
  }, [hasHydrated, user?.email, user?.first_name, user?.prenom])

  const displayName = useMemo(() => {
    if (!invite) return 'Professionnel Troca'
    return invite.pro.pro_company_name
      || [invite.pro.prenom, invite.pro.nom].filter(Boolean).join(' ').trim()
      || 'Professionnel Troca'
  }, [invite])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!invite) return
    setSubmitting(true)
    setError('')
    try {
      await reviewsApi.createReview({
        token: invite.token,
        pro_id: invite.pro.id,
        rating,
        title,
        comment,
        reviewer_prenom: reviewerPrenom,
        reviewer_email: reviewerEmail,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d\'envoyer votre avis.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" />
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Avis vérifié</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-night">Lien introuvable</h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              Ce lien d&apos;avis est invalide, expiré ou a déjà été utilisé.
            </p>
            <Link href="/pro" className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm">
              Découvrir l&apos;espace Pro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="relative h-40 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.35))]">
            {invite.pro.pro_banner_url ? (
              <Image src={invite.pro.pro_banner_url} alt={displayName} fill className="object-cover opacity-80" />
            ) : null}
          </div>

          <div className="-mt-10 px-5 pb-6 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-md">
                  {invite.pro.pro_logo_url ? (
                    <Image src={invite.pro.pro_logo_url} alt={displayName} width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#0A7EA4]">
                      {displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2) || 'P'}
                    </span>
                  )}
                </div>
                <div className="pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-bold text-night">{displayName}</h1>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Avis vérifié
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-night/60">
                    {invite.pro.pro_category || 'Professionnel local'} · {invite.pro.pro_commune || 'Nouvelle-Calédonie'}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-night/65">
                    {invite.pro.pro_description || 'Partagez votre expérience avec ce professionnel local.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ReviewSummary
            rating={summary.rating}
            count={summary.count}
            verifiedCount={summary.verifiedCount}
          />

          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            {success ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <BadgeCheck className="h-8 w-8" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-night">Merci pour votre avis !</h2>
                <p className="mt-2 text-sm leading-relaxed text-night/60">
                  Votre retour a bien été envoyé au professionnel.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Votre avis</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">Partagez votre expérience</h2>
                  <p className="mt-1 text-sm text-night/55">
                    Votre avis vérifié aide la communauté Troca à faire le bon choix.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-night">Note</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-night" htmlFor="comment">
                    Commentaire
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    maxLength={1000}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-[#0A7EA4] focus:ring-4 focus:ring-[#0A7EA4]/10"
                    placeholder="Racontez votre expérience..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-night" htmlFor="title">
                    Titre de l&apos;avis
                  </label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-[#0A7EA4] focus:ring-4 focus:ring-[#0A7EA4]/10"
                    placeholder="Très satisfait du service"
                  />
                </div>

                {!user ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-night" htmlFor="reviewer-prenom">
                        Prénom
                      </label>
                      <input
                        id="reviewer-prenom"
                        value={reviewerPrenom}
                        onChange={(e) => setReviewerPrenom(e.target.value)}
                        maxLength={120}
                        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-[#0A7EA4] focus:ring-4 focus:ring-[#0A7EA4]/10"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-night" htmlFor="reviewer-email">
                        Email
                      </label>
                      <input
                        id="reviewer-email"
                        value={reviewerEmail}
                        onChange={(e) => setReviewerEmail(e.target.value)}
                        type="email"
                        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-[#0A7EA4] focus:ring-4 focus:ring-[#0A7EA4]/10"
                        placeholder="vous@exemple.nc"
                      />
                    </div>
                  </div>
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Envoyer mon avis
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
