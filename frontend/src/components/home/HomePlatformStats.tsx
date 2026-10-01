import { Placeholder } from '@/components/demo/Placeholder'

const metrics = [
  { key: 'membres' as const, label: 'membres sur le territoire' },
  { key: 'annoncesEnLigne' as const, label: 'annonces en ligne' },
]

export default function HomePlatformStats() {
  return (
    <dl className="grid gap-4 border-t border-cream/20 pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {metrics.map((metric) => (
        <div key={metric.key} className="min-w-0">
          <dd className="mb-1 font-display text-price text-cream">
            <Placeholder k={metric.key} />
          </dd>
          <dt className="text-body-sm text-cream/65">{metric.label}</dt>
        </div>
      ))}
    </dl>
  )
}
