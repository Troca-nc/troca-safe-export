'use client'

import { AlertTriangle } from 'lucide-react'
import { isDemoMode } from '@/lib/demoMode'

type DemoModeNoticeProps = {
  className?: string
}

export default function DemoModeNotice({ className = '' }: DemoModeNoticeProps) {
  if (!isDemoMode()) return null

  return (
    // TODO: test E2E sur le bandeau mode démo avant confirmation paiement.
    <div
      className={`flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 ${className}`}
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
      <div>
        <p className="text-sm font-semibold">Mode démonstration</p>
        <p className="text-sm leading-6">
          Aucun paiement réel ne sera effectué. Le tunnel reste visible pour tester le parcours.
        </p>
      </div>
    </div>
  )
}
