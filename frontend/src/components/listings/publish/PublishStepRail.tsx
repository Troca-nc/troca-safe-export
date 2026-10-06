'use client'

import { Check } from 'lucide-react'
import clsx from 'clsx'

import type { PublishingStep } from './publishingConfig'

export default function PublishStepRail({ steps, current }: { steps: PublishingStep[]; current: number }) {
  return (
    <nav aria-label="Étapes de publication" className="overflow-x-auto pb-2">
      <ol className="flex min-w-max items-start gap-2 md:min-w-0">
        {steps.map((step, index) => {
          const active = current === index
          const done = current > index
          return (
            <li key={step.id} className="flex min-w-[112px] flex-1 items-start gap-2">
              <div className="flex min-w-[88px] flex-col items-center gap-2 text-center">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full border text-label-sm font-semibold',
                    done && 'border-reef bg-reef text-ink-deep',
                    active && 'border-ink bg-ink text-cream',
                    !done && !active && 'border-sand bg-cream-sunken text-ink/55',
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-label="Terminée" /> : index + 1}
                </span>
                <span className={clsx('text-caption font-semibold', active ? 'text-ink' : 'text-ink/55')}>{step.label}</span>
              </div>
              {index < steps.length - 1 ? <span className="mt-[18px] h-px flex-1 bg-sand" aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
