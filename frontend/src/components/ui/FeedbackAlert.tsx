'use client'

import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from 'lucide-react'

type FeedbackTone = 'success' | 'error' | 'info'

type FeedbackAlertProps = {
  tone?: FeedbackTone
  title?: string
  children: ReactNode
  className?: string
}

const STYLES: Record<FeedbackTone, { root: string; icon: string; Icon: LucideIcon }> = {
  success: {
    root: 'border-reef/30 bg-reef/15 text-reef-text',
    icon: 'text-reef-text',
    Icon: CheckCircle2,
  },
  error: {
    root: 'border-alert-error/30 bg-alert-error/15 text-alert-error',
    icon: 'text-alert-error',
    Icon: AlertCircle,
  },
  info: {
    root: 'border-lagoon-text/15 bg-lagoon/15 text-lagoon-text',
    icon: 'text-lagoon-text',
    Icon: Info,
  },
}

export default function FeedbackAlert({ tone = 'info', title, children, className = '' }: FeedbackAlertProps) {
  const config = STYLES[tone]
  const Icon = config.Icon

  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-body-sm ${config.root} ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.icon}`} />
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          <div className={title ? 'mt-1' : ''}>{children}</div>
        </div>
      </div>
    </div>
  )
}
