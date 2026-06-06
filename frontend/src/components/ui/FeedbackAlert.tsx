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
    root: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    root: 'border-red-200 bg-red-50 text-red-700',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  info: {
    root: 'border-[#0A7EA4]/15 bg-nc-lagonLight text-[#0A7EA4]',
    icon: 'text-[#0A7EA4]',
    Icon: Info,
  },
}

export default function FeedbackAlert({ tone = 'info', title, children, className = '' }: FeedbackAlertProps) {
  const config = STYLES[tone]
  const Icon = config.Icon

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${config.root} ${className}`.trim()}>
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
