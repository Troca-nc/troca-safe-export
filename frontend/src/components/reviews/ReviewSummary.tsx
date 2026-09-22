import { BadgeCheck } from 'lucide-react'

type Props = {
  rating?: number | null
  count?: number | null
  verifiedCount?: number | null
  className?: string
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

export default function ReviewSummary({ rating = 0, count = 0, verifiedCount = 0, className = '' }: Props) {
  const value = Number(rating ?? 0)
  return (
    <div className={`rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Résumé des avis</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-night">{value.toFixed(1)}/5</h3>
          <div className="mt-2">
            <RatingRow rating={value} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-night/45">Avis</p>
            <p className="mt-1 font-semibold text-night">{Number(count ?? 0).toLocaleString('fr-FR')}</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-night/45">Vérifiés</p>
            <p className="mt-1 font-semibold text-night">{Number(verifiedCount ?? 0).toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
