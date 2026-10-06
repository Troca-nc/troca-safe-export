'use client'

import { CalendarDays, Car, Gift, RefreshCw, Tag } from 'lucide-react'

import { PUBLISHING_TYPES } from './publishingConfig'
import type { PublishingKind } from '@/types/publishing'

const ICONS = {
  sale: Tag,
  troc: RefreshCw,
  bonplan: Gift,
  carpool: Car,
  event: CalendarDays,
}

export default function PublishTypeChooser({ onSelect }: { onSelect: (kind: PublishingKind) => void }) {
  return (
    <section aria-labelledby="publish-type-title" className="mx-auto max-w-[1080px]">
      <p className="text-eyebrow font-semibold uppercase tracking-eyebrow text-accent-text">Déposer</p>
      <h1 id="publish-type-title" className="mt-3 max-w-[760px] font-display text-h1-form text-ink text-balance">
        Que souhaitez-vous publier ?
      </h1>
      <p className="mt-4 max-w-[720px] text-body text-ink/70 text-pretty">
        Choisissez un type pour afficher uniquement les étapes et les champs utiles.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLISHING_TYPES.map((type) => {
          const Icon = ICONS[type.id]
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className="group flex min-h-[210px] flex-col items-start rounded-card border border-sand bg-cream-surface p-6 text-left shadow-card transition hover:-translate-y-0.5 hover:border-ink/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-control bg-accent-soft text-accent-text transition group-hover:bg-accent group-hover:text-ink-deep">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mt-6 text-h4 font-semibold text-ink">{type.label}</span>
              <span className="mt-2 text-body-sm leading-relaxed text-ink/70">{type.description}</span>
              <span className="mt-auto pt-5 text-meta font-semibold text-lagoon-text">{type.info}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
