import clsx from 'clsx'

export function StatCard({
  label,
  value,
  delta,
  tone = 'default',
}: {
  label: string
  value: string
  delta?: string
  tone?: 'default' | 'good' | 'warning' | 'danger'
}) {
  return (
    <div className={clsx(
      'admin-card',
      tone === 'good' && 'border-emerald-400/30',
      tone === 'warning' && 'border-amber-400/30',
      tone === 'danger' && 'border-rose-400/30'
    )}>
      <p className="admin-label">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {delta ? <p className="mt-2 text-sm text-slate-400">{delta}</p> : null}
    </div>
  )
}

