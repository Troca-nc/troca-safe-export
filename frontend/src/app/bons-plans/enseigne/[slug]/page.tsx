'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Flag, MessageSquare, Star, Check } from 'lucide-react'

import Header from '@/components/layout/Header'
import BonPlanCard, { type BonPlanCardModel } from '@/components/bon-plans/BonPlanCard'
import { businessesApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type Review = {
  id: string
  rating: number
  comment?: string | null
  reply_text?: string | null
  created_at?: string
  user_prenom?: string | null
  user_avatar?: string | null
  reported?: boolean
}

export default function BusinessProfilePage() {
  const params = useParams<{ slug: string }>()
  const slug = String(params?.slug || '')
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [business, setBusiness] = useState<any>(null)
  const [bonPlans, setBonPlans] = useState<BonPlanCardModel[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          businessesApi.getBySlug(slug),
          businessesApi.getReviews(slug, { limit: 20 }),
        ])
        if (!alive) return
        setBusiness(profileRes.data?.data?.business ?? null)
        setBonPlans(profileRes.data?.data?.bon_plans ?? [])
        setReviews(reviewsRes.data?.data ?? [])
      } catch {
        if (!alive) return
        setBusiness(null)
        setBonPlans([])
        setReviews([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (slug) void load()
    return () => {
      alive = false
    }
  }, [slug])

  const averageLabel = useMemo(() => {
    if (!business?.review_count) return 'Aucun avis pour le moment'
    return `${Number(business.review_avg || 0).toFixed(1)} / 5 · ${business.review_count} avis`
  }, [business])

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAuthenticated) {
      openAuthModal({ type: 'publish_listing', redirectTo: `/bons-plans/enseigne/${slug}` })
      return
    }

    setSavingReview(true)
    try {
      const { data } = await businessesApi.addReview(slug, {
        rating: reviewRating,
        comment: reviewComment,
      })
      setReviews((current) => [data?.data || data, ...current.filter((review) => review.id !== (data?.data?.id || data?.id))])
      setReviewComment('')
      window.alert('Votre avis a bien été enregistré.')
    } catch (err: any) {
      window.alert(err?.response?.data?.error || 'Impossible de publier votre avis.')
    } finally {
      setSavingReview(false)
    }
  }

  if (!slug) return null

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-6">
        <Link href="/bons-plans" className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour aux bons plans
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.14))] px-6 py-8 text-white md:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white">
                {business?.logo_url ? (
                  <img src={business.logo_url} alt={business?.name || 'Enseigne'} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl opacity-40">🏢</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold">{business?.name || 'Enseigne'}</h1>
                  {business?.badge === 'verified' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-coral">
                      <Check className="h-3 w-3" />
                      Vérifié Troca
                    </span>
                  ) : business?.badge === 'active' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lagoon">
                      🔵 Actif
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-white/72">{averageLabel}</p>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/72">
              {business?.category || 'Commerce local'} · {business?.bon_plan_count || 0} bon plan{Number(business?.bon_plan_count || 0) > 1 ? 's' : ''} publié{Number(business?.bon_plan_count || 0) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid gap-6 p-6 md:p-8">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral/80">Bons plans en cours</p>
                  <h2 className="mt-1 text-2xl font-bold text-night">Les promos actives de cette enseigne</h2>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-[420px] animate-pulse rounded-[1.5rem] border border-night/8 bg-sand/50" />
                  ))}
                </div>
              ) : bonPlans.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {bonPlans.map((bonPlan) => (
                    <BonPlanCard key={bonPlan.id} bonPlan={bonPlan} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-6 text-center text-night/60">
                  Aucune promo en cours. Revenez bientôt.
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral/80">Avis clients</p>
                  <h2 className="mt-1 text-2xl font-bold text-night">La parole aux utilisateurs Troca</h2>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <article key={review.id} className="rounded-[1.25rem] border border-night/8 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-night">{review.user_prenom || 'Utilisateur Troca'}</p>
                            <p className="text-xs text-night/45">{review.created_at ? new Date(review.created_at).toLocaleDateString('fr-FR') : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment ? <p className="mt-3 text-sm leading-relaxed text-night/70">{review.comment}</p> : null}
                        {review.reply_text ? (
                          <div className="mt-3 rounded-2xl border border-coral/10 bg-coral/5 p-3 text-sm text-night/70">
                            <p className="font-semibold text-coral">Réponse de l&apos;enseigne</p>
                            <p className="mt-1">{review.reply_text}</p>
                          </div>
                        ) : null}
                        <button type="button" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-night/50 hover:text-coral">
                          <Flag className="h-3.5 w-3.5" />
                          Signaler
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-6 text-center text-night/60">
                      Aucun avis disponible pour le moment.
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitReview} className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-coral" />
                    <h3 className="text-lg font-bold">Laisser un avis</h3>
                  </div>
                  <p className="mt-2 text-sm text-night/60">
                    Compte âgé de 7 jours minimum requis. Un seul avis par utilisateur et par enseigne.
                  </p>

                  <div className="mt-4">
                    <p className="text-sm font-semibold">Votre note</p>
                    <div className="mt-2 flex gap-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const value = index + 1
                        const active = value <= reviewRating
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewRating(value)}
                            className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${active ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-night/10 bg-white text-night/35'}`}
                            aria-label={`${value} étoiles`}
                          >
                            <Star className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm font-semibold">Commentaire</span>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value.slice(0, 500))}
                      maxLength={500}
                      rows={5}
                      className="input mt-2 w-full"
                      placeholder="Décrivez votre expérience en quelques mots..."
                    />
                  </label>

                  <button type="submit" disabled={savingReview} className="btn-primary mt-4 w-full rounded-2xl px-4 py-3">
                    {savingReview ? 'Publication...' : 'Publier mon avis'}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
