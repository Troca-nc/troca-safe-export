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
        'rounded-[1.25rem] border p-4',
        level === 'critical' && 'border-[var(--admin-red)]/35 bg-[var(--admin-red)]/10 text-[var(--admin-red-dark)]',
        level === 'warning' && 'border-[var(--admin-orange)]/40 bg-[var(--admin-orange)]/10 text-[var(--admin-ink)]',
        level === 'info' && 'border-[var(--admin-lagoon-light)]/40 bg-[var(--admin-lagoon-light)]/10 text-[var(--admin-ink)]'
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

