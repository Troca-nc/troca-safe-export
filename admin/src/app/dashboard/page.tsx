import { AutoRefresh } from '@/components/AutoRefresh'
import { AlertBanner } from '@/components/AlertBanner'
import { MetricChart } from '@/components/MetricChart'
import { StatCard } from '@/components/StatCard'
import { formatDateTimeNc, formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'

export const dynamic = 'force-dynamic'

function valueOrUnavailable(value: unknown) {
  return value === null || value === undefined || value === '' ? 'Non renseigné' : String(value)
}

function xpfOrUnavailable(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? formatXpf(value) : 'Non renseigné'
}

function measurementOrUnavailable(value: unknown, unit: string) {
  return value === null || value === undefined || value === '' ? 'Non renseigné' : `${value} ${unit}`
}

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
    { label: 'Conducteurs à vérifier', value: 'Non renseigné', href: '/moderation' },
    { label: 'Alertes actives', value: Array.isArray(alerts) ? String(alerts.length) : 'Non renseigné', href: '/moderation' },
    { label: 'Erreurs 1h', value: valueOrUnavailable(health?.errors_1h), href: '/errors' },
    { label: 'Abonnements résiliés', value: valueOrUnavailable(revenue?.pro_subscribers_churned), href: '/payments' },
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
          <p className="font-semibold text-white">État rapporté par les services</p>
          <p className="mt-1">Backend {valueOrUnavailable(health?.backend?.status)} · DB {valueOrUnavailable(health?.db?.status)} · Redis {valueOrUnavailable(health?.redis?.status)}</p>
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
        <StatCard label="Nouveaux inscrits" value={valueOrUnavailable(users?.new_today)} delta={`30j: ${valueOrUnavailable(users?.new_this_month)}`} tone="good" />
        <StatCard label="Annonces publiées" value={valueOrUnavailable(listings?.published_today)} delta={`Actives: ${valueOrUnavailable(listings?.total_active)}`} tone="good" />
        <StatCard label="Messages envoyés" value={valueOrUnavailable(engagement?.messages_today)} delta={`Semaine: ${valueOrUnavailable(engagement?.messages_this_week)}`} />
        <StatCard label="Revenus du mois" value={xpfOrUnavailable(revenue?.revenue_this_month?.total_xpf ?? revenue?.mrr_xpf)} delta={`MRR: ${xpfOrUnavailable(revenue?.mrr_xpf)}`} tone="warning" />
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
            <p>Backend: {valueOrUnavailable(health?.backend?.status)} · mémoire {measurementOrUnavailable(health?.backend?.memory_mb, 'MB')} · réponse {measurementOrUnavailable(health?.backend?.response_time_ms, 'ms')}</p>
            <p>DB: {valueOrUnavailable(health?.db?.status)} · {valueOrUnavailable(health?.db?.active_connections)} connexions actives</p>
            <p>Redis: {valueOrUnavailable(health?.redis?.status)} · mémoire {measurementOrUnavailable(health?.redis?.memory_mb, 'MB')}</p>
            <p>Worker: {valueOrUnavailable(health?.worker?.status)} · {valueOrUnavailable(health?.worker?.failed_jobs_24h)} jobs en erreur</p>
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
