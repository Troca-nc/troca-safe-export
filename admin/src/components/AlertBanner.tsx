import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import clsx from 'clsx'

export function AlertBanner({
  level,
  title,
  message,
  actionLabel,
}: {
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  actionLabel?: string
}) {
  const Icon = level === 'critical' ? AlertTriangle : level === 'warning' ? AlertTriangle : Info
  return (
    <div
      className={clsx(
        'rounded-2xl border p-4',
        level === 'critical' && 'border-rose-500/30 bg-rose-500/10 text-rose-100',
        level === 'warning' && 'border-amber-400/30 bg-amber-400/10 text-amber-50',
        level === 'info' && 'border-sky-400/30 bg-sky-400/10 text-sky-100'
      )}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
        {actionLabel ? <span className="ml-auto rounded-full border border-current/20 px-3 py-1 text-xs font-semibold">{actionLabel}</span> : null}
      </div>
    </div>
  )
}

