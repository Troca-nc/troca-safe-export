import type { LucideIcon } from 'lucide-react'

export function OfferTypeCard({ active, symbol, label, hint, icon: Icon, onClick }: {
  active: boolean
  symbol: string
  label: string
  hint: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-40 rounded-card border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${active ? 'border-ink-deep bg-ink-deep text-cream shadow-panel' : 'border-warm-border bg-cream-surface text-ink hover:border-accent'}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-control ${active ? 'bg-cream/10 text-accent' : 'bg-cream-sunken text-accent-text'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <span className="mt-4 block font-display text-h4">{symbol}</span>
      <span className="mt-1 block text-label font-semibold">{label}</span>
      <span className={`mt-2 block text-meta ${active ? 'text-cream/70' : 'text-ink/65'}`}>{hint}</span>
    </button>
  )
}
