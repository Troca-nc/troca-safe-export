import { Check } from 'lucide-react'

export type PublishCheck = { label: string; complete: boolean }

export function PublishChecklist({ checks }: { checks: PublishCheck[] }) {
  return (
    <section aria-live="polite" className="rounded-card border border-sand bg-cream-surface p-5 shadow-card">
      <h2 className="font-display text-h4">Avant de publier</h2>
      <ul className="mt-4 space-y-3">
        {checks.map((check) => (
          <li key={check.label} className={`flex items-center gap-3 text-body-sm ${check.complete ? 'text-ink' : 'text-ink/60'}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-pill ${check.complete ? 'bg-reef text-cream' : 'bg-sand text-transparent'}`}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {check.label}
          </li>
        ))}
      </ul>
    </section>
  )
}
