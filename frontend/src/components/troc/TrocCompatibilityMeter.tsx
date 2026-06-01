'use client'

import type { TrocCompatibility } from '@/types/troc'

type Props = {
  compatibility?: TrocCompatibility | null
  emptyLabel?: string
  className?: string
}

function toneForScore(score: number) {
  if (score >= 80) return 'from-jungle to-emerald-500'
  if (score >= 50) return 'from-amber-400 to-orange-500'
  if (score > 0) return 'from-coral to-amber-500'
  return 'from-night/20 to-night/35'
}

export default function TrocCompatibilityMeter({ compatibility, emptyLabel, className = '' }: Props) {
  if (!compatibility) {
    return (
      <div className={`rounded-2xl border border-dashed border-night/10 bg-sand/60 p-3 text-sm text-night/55 ${className}`}>
        {emptyLabel || 'Connectez-vous pour voir votre compatibilité'}
      </div>
    )
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(compatibility.score || 0))))

  return (
    <div className={`rounded-2xl border border-night/8 bg-white/95 p-3 shadow-sm ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-night/45">Troc-o-mètre</p>
          <p className="text-sm font-semibold text-night">{compatibility.label}</p>
        </div>
        <span className="text-sm font-bold text-night">{score}/100</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-night/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneForScore(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-night/55">
        {score > 0
          ? `${compatibility.matching_count} de vos annonces correspondent`
          : 'Faible, mais vous pouvez toujours proposer autre chose'}
      </p>
    </div>
  )
}
