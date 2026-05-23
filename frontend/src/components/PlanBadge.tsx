'use client'

import { Check } from 'lucide-react'

type PlanBadgeProps = {
  className?: string
}

export default function PlanBadge({ className = '' }: PlanBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-coral/20 bg-coral/10 px-2 py-0.5 text-[11px] font-semibold text-coral ${
        className
      }`}
    >
      <Check className="h-3 w-3" />
      Pro ✓
    </span>
  )
}
