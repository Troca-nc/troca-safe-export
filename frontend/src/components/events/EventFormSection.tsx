import type { ReactNode } from 'react'

import { Card } from '@/components/ui/Card'

export function EventFormSection({ number, title, children, action }: { number: number; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-ink-deep text-label font-semibold text-cream">{number}</span>
          <h2 className="font-display text-h2 leading-none">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  )
}
