import type { HTMLAttributes } from 'react'
import { BadgeCheck } from 'lucide-react'
import clsx from 'clsx'
const tones = {
  success: 'border-reef/30 bg-reef/15 text-reef-text',
  info: 'border-lagoon/30 bg-lagoon/15 text-lagoon-text',
  warning: 'border-accent/30 bg-accent/15 text-accent-text',
  error: 'border-alert-error/30 bg-alert-error/15 text-alert-error',
  neutral: 'border-sand bg-cream-sunken text-ink/70',
}
export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      {...props}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
export function ProBadge() {
  return (
    <Badge tone="success">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Pro vérifié
    </Badge>
  )
}
