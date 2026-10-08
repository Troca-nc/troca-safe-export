import { MetricChart } from '@/components/MetricChart'
import { CollectionNotice } from '@/components/CollectionNotice'
import { StatCard } from '@/components/StatCard'
import { loadAdminJson } from '@/lib/load'
import { displayCount, displayXpf, percentageWidth, rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const [users, listings, revenue, engagement] = await Promise.all([
    loadAdminJson('/admin/stats/users?period=30d', null),
    loadAdminJson('/admin/stats/listings?period=30d', null),
    loadAdminJson('/admin/stats/revenue?period=30d', null),
    loadAdminJson('/admin/stats/engagement?period=30d', null),
  ]) as any[]

  return (
    <div className="space-y-8">
      <section className="border-b border-[var(--admin-line)] pb-7">
        <p className="admin-kicker">Analyse</p>
        <h1 className="admin-page-title mt-3">Statistiques</h1>
        <p className="admin-muted mt-3 text-sm">Période glissante de 30 jours</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="DAU" value={displayCount(users?.active_dau)} />
        <StatCard label="WAU" value={displayCount(users?.active_wau)} />
        <StatCard label="MAU" value={displayCount(users?.active_mau)} />
        <StatCard label="MRR" value={displayXpf(revenue?.mrr_xpf)} tone="warning" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <p className="admin-label">Utilisateurs</p>
          <h2 className="admin-section-title mt-2">Nouveaux inscrits</h2>
          <div className="mt-6">
            <MetricChart type="area" data={rowsOrEmpty(users?.chart_new_users)} xKey="date" yKey="count" />
            <CollectionNotice value={users?.chart_new_users} />
          </div>
        </div>
        <div className="admin-card">
          <p className="admin-label">Revenus</p>
          <h2 className="admin-section-title mt-2">MRR / ARR</h2>
          <div className="mt-6">
            <MetricChart type="line" data={rowsOrEmpty(revenue?.chart_revenue)} xKey="date" yKey="subscriptions" />
            <CollectionNotice value={revenue?.chart_revenue} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <p className="admin-label">Catalogue</p>
          <h2 className="admin-section-title mt-2">Annonces par catégorie</h2>
          <div className="mt-6 space-y-3">
            {rowsOrEmpty(listings?.by_category).map((entry: any) => (
              <div key={entry.category} className="rounded-xl border border-[var(--admin-line)] bg-[var(--admin-cream)]/55 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{entry.category}</p>
                  <p className="text-sm text-[var(--admin-ink-soft)]">{entry.count}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--admin-line)]">
                  <div className="h-full rounded-full bg-[var(--admin-lagoon-light)]" style={{ width: `${percentageWidth(entry.pct)}%` }} />
                </div>
              </div>
            ))}
            <CollectionNotice value={listings?.by_category} />
          </div>
        </div>
        <div className="admin-card">
          <p className="admin-label">Engagement</p>
          <h2 className="admin-section-title mt-2">Messages et troc</h2>
          <div className="mt-6">
            <MetricChart type="line" data={rowsOrEmpty(engagement?.chart_troc)} xKey="date" yKey="created" />
            <CollectionNotice value={engagement?.chart_troc} />
          </div>
        </div>
      </section>
    </div>
  )
}
