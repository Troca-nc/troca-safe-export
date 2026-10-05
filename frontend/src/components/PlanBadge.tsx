'use client'

import { AlertTriangle, Check, Clock3 } from 'lucide-react'

import type { AccountSubscriptionState } from '@/types/account'

type PlanBadgeProps = {
  className?: string
  plan?: 'free' | 'pro'
  status?: AccountSubscriptionState
}

export default function PlanBadge({ className = '', plan = 'pro', status = 'active' }: PlanBadgeProps) {
  const isAlert = status === 'payment_failed' || status === 'expired'
  const isWarning = status === 'expiring_soon'
  const Icon = isAlert ? AlertTriangle : isWarning ? Clock3 : Check
  const label = plan === 'free'
    ? 'Gratuit'
    : isAlert
      ? 'Pro à régulariser'
      : isWarning
        ? 'Pro expire bientôt'
        : status === 'trialing'
          ? 'Essai Pro'
          : 'Pro actif'
  const tone = isAlert
    ? 'border-[var(--color-error)] bg-[var(--color-error-soft)] text-[var(--color-error)]'
    : isWarning
      ? 'border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-accent-text'
      : 'border-success-border bg-success-soft text-success-text'

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${tone} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
