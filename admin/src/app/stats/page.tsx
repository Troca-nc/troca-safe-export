import { MetricChart } from '@/components/MetricChart'
import { StatCard } from '@/components/StatCard'
import { formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'

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
      <section className="admin-card">
        <p className="admin-label">Statistiques</p>
        <h1 className="mt-2 text-3xl font-semibold">Croissance et revenu</h1>
        <p className="mt-2 text-slate-400">Période glissante 30 jours</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="DAU" value={String(users?.active_dau ?? 0)} />
        <StatCard label="WAU" value={String(users?.active_wau ?? 0)} />
        <StatCard label="MAU" value={String(users?.active_mau ?? 0)} />
        <StatCard label="MRR" value={formatXpf(revenue?.mrr_xpf ?? 0)} tone="warning" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <p className="admin-label">Utilisateurs</p>
          <h2 className="mt-2 text-xl font-semibold">Nouveaux inscrits</h2>
          <div className="mt-6">
            <MetricChart type="area" data={users?.chart_new_users || []} xKey="date" yKey="count" />
          </div>
        </div>
        <div className="admin-card">
          <p className="admin-label">Revenus</p>
          <h2 className="mt-2 text-xl font-semibold">MRR / ARR</h2>
          <div className="mt-6">
            <MetricChart type="line" data={revenue?.chart_revenue || []} xKey="date" yKey="subscriptions" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <p className="admin-label">Catalogue</p>
          <h2 className="mt-2 text-xl font-semibold">Annonces par catégorie</h2>
          <div className="mt-6 space-y-3">
            {(listings?.by_category || []).map((entry: any) => (
              <div key={entry.category} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{entry.category}</p>
                  <p className="text-sm text-slate-400">{entry.count}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Number(entry.pct || 0))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <p className="admin-label">Engagement</p>
          <h2 className="mt-2 text-xl font-semibold">Messages et troc</h2>
          <div className="mt-6">
            <MetricChart type="line" data={engagement?.chart_troc || []} xKey="date" yKey="created" />
          </div>
        </div>
      </section>
    </div>
  )
}
