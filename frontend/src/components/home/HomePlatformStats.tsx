import type { HomePlatformStats as PlatformStats } from '@/types/home'

const numberFormatter = new Intl.NumberFormat('fr-FR')

export default function HomePlatformStats({ stats }: { stats: PlatformStats | null }) {
  const metrics = [
    { value: stats?.membersCount, label: 'membres sur le territoire' },
    { value: stats?.listingsCount, label: 'annonces en ligne' },
  ]

  return (
    <dl className="grid gap-4 border-t border-cream/20 pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-live="polite">
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0">
          <dd className="mb-1 font-display text-price text-cream" aria-label={metric.value === undefined ? 'Chargement' : undefined}>
            {metric.value === undefined ? '—' : numberFormatter.format(metric.value)}
          </dd>
          <dt className="text-body-sm text-cream/65">{metric.label}</dt>
        </div>
      ))}
    </dl>
  )
}
