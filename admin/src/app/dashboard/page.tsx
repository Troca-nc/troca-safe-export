import { AutoRefresh } from '@/components/AutoRefresh'
import { AlertBanner } from '@/components/AlertBanner'
import { MetricChart } from '@/components/MetricChart'
import { StatCard } from '@/components/StatCard'
import { formatDateTimeNc, formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [health, alerts, users, listings, revenue, engagement] = await Promise.all([
    loadAdminJson('/admin/health/full', null),
    loadAdminJson('/admin/alerts/active', []),
    loadAdminJson('/admin/stats/users?period=30d', null),
    loadAdminJson('/admin/stats/listings?period=30d', null),
    loadAdminJson('/admin/stats/revenue?period=30d', null),
    loadAdminJson('/admin/stats/engagement?period=30d', null),
  ]) as any[]

  const todayActions = [
    { label: 'Conducteurs à vérifier', value: '0', href: '/moderation' },
    { label: 'Alertes actives', value: String((alerts as any[] | null)?.length ?? 0), href: '/moderation' },
    { label: 'Erreurs 1h', value: String(health?.errors_1h ?? 0), href: '/errors' },
    { label: 'Paiements bloqués', value: String(revenue?.pro_subscribers_churned ?? 0), href: '/payments' },
  ]

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <section className="admin-card flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="admin-label">Bonjour</p>
          <h1 className="mt-2 text-3xl font-semibold">Vue quotidienne</h1>
          <p className="mt-2 text-slate-400">
            Dernière mise à jour {formatDateTimeNc(new Date())}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <p className="font-semibold text-white">Système en ligne</p>
          <p className="mt-1">Backend {health?.backend?.status || 'ok'} · DB {health?.db?.status || 'ok'} · Redis {health?.redis?.status || 'ok'}</p>
        </div>
      </section>

      {Array.isArray(alerts) && alerts.length ? (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert: any) => (
            <AlertBanner
              key={alert.id || alert.ts}
              level={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}
              title={alert.title || 'Alerte'}
              message={alert.message || ''}
              actionLabel={alert.action_url ? 'Voir' : undefined}
            />
          ))}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Nouveaux inscrits" value={String(users?.new_today ?? 0)} delta={`30j: ${users?.new_this_month ?? 0}`} tone="good" />
        <StatCard label="Annonces publiées" value={String(listings?.published_today ?? 0)} delta={`Actives: ${listings?.total_active ?? 0}`} tone="good" />
        <StatCard label="Messages envoyés" value={String(engagement?.messages_today ?? 0)} delta={`Semaine: ${engagement?.messages_this_week ?? 0}`} />
        <StatCard label="Revenus du mois" value={formatXpf(revenue?.revenue_this_month?.total_xpf ?? revenue?.mrr_xpf ?? 0)} delta={`MRR: ${formatXpf(revenue?.mrr_xpf ?? 0)}`} tone="warning" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="admin-label">À faire aujourd'hui</p>
              <h2 className="mt-2 text-xl font-semibold">Priorités</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {todayActions.map((item) => (
              <a key={item.label} href={item.href} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <p className="admin-label">Santé système</p>
          <h2 className="mt-2 text-xl font-semibold">Backend / DB / Redis</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Backend: {health?.backend?.status || 'ok'} · {health?.backend?.memory_mb ?? 0} MB · {health?.backend?.response_time_ms ?? 0} ms</p>
            <p>DB: {health?.db?.status || 'ok'} · {health?.db?.active_connections ?? 0} connexions actives</p>
            <p>Redis: {health?.redis?.status || 'ok'} · {health?.redis?.memory_mb ?? 0} MB</p>
            <p>Worker: {health?.worker?.status || 'ok'} · {health?.worker?.failed_jobs_24h ?? 0} jobs en erreur</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label">Utilisateurs</p>
              <h2 className="mt-2 text-xl font-semibold">Croissance</h2>
            </div>
          </div>
          <div className="mt-6">
            <MetricChart type="area" data={users?.chart_new_users || []} xKey="date" yKey="count" />
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-label">Engagement</p>
              <h2 className="mt-2 text-xl font-semibold">Messages & troc</h2>
            </div>
          </div>
          <div className="mt-6">
            <MetricChart type="line" data={engagement?.chart_messages || []} xKey="date" yKey="count" />
          </div>
        </div>
      </section>
    </div>
  )
}
