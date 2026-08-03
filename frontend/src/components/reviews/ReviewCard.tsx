'use client'

import { useState } from 'react'
import { AlertTriangle, BadgeCheck, Heart, MessageCircle } from 'lucide-react'

import { reviewsApi } from '@/lib/api'

export type ReviewCardModel = {
  id: string | number
  pro_id?: string | number
  reviewer_prenom?: string | null
  reviewer_nom?: string | null
  reviewer_avatar_url?: string | null
  rating: number
  title?: string | null
  comment?: string | null
  verified_purchase?: boolean
  helpful_count?: number | null
  report_count?: number | null
  reply_content?: string | null
  reply_author_name?: string | null
  reply_at?: string | null
  created_at?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function RatingRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < Math.round(rating)
        return <BadgeCheck key={index} className={`h-4 w-4 ${active ? 'text-amber-500' : 'text-night/20'}`} />
      })}
    </div>
  )
}

function initials(review: ReviewCardModel) {
  const first = review.reviewer_prenom?.trim().charAt(0) || ''
  const last = review.reviewer_nom?.trim().charAt(0) || ''
  return `${first}${last}`.trim() || 'C'
}

export default function ReviewCard({ review }: { review: ReviewCardModel }) {
  const [loadingHelpful, setLoadingHelpful] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(Number(review.helpful_count ?? 0))
  const [reported, setReported] = useState(false)

  const handleHelpful = async () => {
    if (loadingHelpful) return
    setLoadingHelpful(true)
    try {
      await reviewsApi.helpful(review.id, { helpful: true })
      setHelpfulCount((value) => value + 1)
    } catch {
      // ignore client-side
    } finally {
      setLoadingHelpful(false)
    }
  }

  const handleReport = async () => {
    if (loadingReport) return
    setLoadingReport(true)
    try {
      await reviewsApi.report(review.id, { reason: 'Signalement utilisateur' })
      setReported(true)
    } catch {
      // ignore client-side
    } finally {
      setLoadingReport(false)
    }
  }

  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-nc-lagonLight text-sm font-bold text-nc-lagon">
            {initials(review)}
          </div>
          <div>
            <p className="font-semibold text-night">
              {review.reviewer_prenom || 'Client'} {review.reviewer_nom || ''}
            </p>
            <p className="text-xs text-night/45">{formatDate(review.created_at)}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-night/65">
          {review.verified_purchase ? 'Achat v�rifi�' : 'Avis v�rifi�'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <RatingRow rating={review.rating} />
        <span className="text-sm font-semibold text-night">{review.rating}/5</span>
      </div>

      {review.title ? <p className="mt-3 text-sm font-semibold text-night">{review.title}</p> : null}
      {review.comment ? <p className="mt-3 text-sm leading-relaxed text-night/65">{review.comment}</p> : null}

      {review.reply_content ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            <MessageCircle className="h-3.5 w-3.5" />
            R�ponse du pro
          </p>
          <p className="mt-2 text-sm leading-relaxed text-night/70">{review.reply_content}</p>
          {(review.reply_author_name || review.reply_at) ? (
            <p className="mt-2 text-xs text-night/45">
              {review.reply_author_name ? ` ${review.reply_author_name}` : ' Le professionnel'}
              {review.reply_at ? ` � ${formatDate(review.reply_at)}` : ''}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={loadingHelpful}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-night/65 transition hover:border-nc-lagon/30 hover:bg-nc-lagonLight hover:text-nc-lagon disabled:opacity-50"
        >
          <Heart className="h-3.5 w-3.5" />
          Utile ({helpfulCount})
        </button>
        <button
          type="button"
          onClick={handleReport}
          disabled={loadingReport || reported}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {reported ? 'Signal�' : 'Signaler'}
        </button>
      </div>
    </article>
  )
}
