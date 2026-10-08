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
      'admin-card relative overflow-hidden',
      tone === 'good' && 'border-[var(--admin-mint)]',
      tone === 'warning' && 'border-[var(--admin-orange)]/50',
      tone === 'danger' && 'border-[var(--admin-red)]/45'
    )}>
      <span className={clsx(
        'absolute inset-x-0 top-0 h-1',
        tone === 'good' && 'bg-[var(--admin-green-light)]',
        tone === 'warning' && 'bg-[var(--admin-orange)]',
        tone === 'danger' && 'bg-[var(--admin-red)]',
        tone === 'default' && 'bg-[var(--admin-lagoon-light)]'
      )} />
      <p className="admin-label">{label}</p>
      <p className="mt-3 font-serif text-4xl font-normal tracking-tight text-[var(--admin-ink)]">{value}</p>
      {delta ? <p className="mt-2 text-sm text-[var(--admin-ink-soft)]">{delta}</p> : null}
    </div>
  )
}

