'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock3,
  Cpu,
  FileText,
  MemoryStick,
  MessageCircle,
  RefreshCw,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  CarFront,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  useAdminChartData,
  useAdminObservability,
  useAdminStats,
} from '@/hooks/useAdmin'

const CAT_COLORS = ['#D85A30', '#378ADD', '#1D9E75', '#BA7517', '#888780']

interface KpiCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon: React.ReactNode
  danger?: boolean
}

function KpiCard({ label, value, delta, deltaLabel, icon, danger }: KpiCardProps) {
  const isUp = (delta ?? 0) > 0

  return (
    <div className="rounded-2xl border border-night/8 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-night/50">{label}</span>
        <span className={`rounded-lg p-1.5 ${danger ? 'bg-red-50 text-red-500' : 'bg-coral/10 text-coral'}`}>
          {icon}
        </span>
      </div>
      <p className={`mb-2 text-2xl font-bold leading-none ${danger ? 'text-red-500' : 'text-night'}`}>
        {value}
      </p>
      {delta !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>
            {isUp ? '+' : ''}
            {delta} {deltaLabel}
          </span>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-night/8 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-night/50">{label}</p>
          <p className="mt-1 text-xl font-bold text-night">{value}</p>
        </div>
        <span className="rounded-lg bg-sand px-2 py-2 text-coral">{icon}</span>
      </div>
      <p className="text-xs text-night/50">{hint}</p>
    </div>
  )
}

function formatBytes(bytes?: number) {
  if (!bytes || Number.isNaN(bytes)) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDuration(ms?: number) {
  if (ms == null || Number.isNaN(ms)) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`
  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} j ${hours % 24} h`
  if (hours > 0) return `${hours} h ${minutes % 60} min`
  return `${minutes} min`
}

function formatRequestId(value?: string | null) {
  if (!value) return '—'
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value
}

function formatShareChannelLabel(value: string) {
  const normalized = value.toLowerCase()
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    messenger: 'Messenger',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X / Twitter',
    email: 'Email',
    sms: 'SMS',
    native: 'Partage natif',
    copy: 'Copie du lien',
    instagram: 'Instagram',
    unknown: 'Inconnu',
  }
  return labels[normalized] ?? value
}

function formatShareContentTypeLabel(value: string) {
  const normalized = value.toLowerCase()
  const labels: Record<string, string> = {
    annonce: 'Annonce',
    profil: 'Profil',
    content: 'Contenu',
    unknown: 'Inconnu',
  }
  return labels[normalized] ?? value
}

function ObservabilitySection({
  categories,
}: {
  categories: Array<{ nom: string; count: number; pct: number }>
}) {
  const { data, loading, error, refetch, lastUpdatedAt } = useAdminObservability()
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  const statusBreakdown = useMemo(
    () =>
      Object.entries(data?.http.byStatus ?? {})
        .sort(([a], [b]) => Number(a) - Number(b)),
    [data],
  )

  const recentErrors = data?.errors ?? []
  const recentRequests = data?.http.last ?? []
  const nodes = data?.cluster?.nodes ?? []
  const alerts = data?.alerts ?? []
  const share = data?.share ?? { total: 0, byChannel: {}, byContentType: {}, recent: [] }
  const shareChannels = useMemo(
    () =>
      Object.entries(share.byChannel ?? {})
        .map(([channel, count]) => ({ channel, count }))
        .sort((a, b) => b.count - a.count),
    [share],
  )
  const shareContentTypes = useMemo(
    () =>
      Object.entries(share.byContentType ?? {})
        .map(([contentType, count]) => ({ contentType, count }))
        .sort((a, b) => b.count - a.count),
    [share],
  )
  const shareMax = shareChannels[0]?.count ?? 0
  const recentShares = share.recent ?? []
  const visibleAlerts = useMemo(() => {
    if (severityFilter === 'all') return alerts
    return alerts.filter((alert) => alert.severity === severityFilter)
  }, [alerts, severityFilter])
  const alertCounts = useMemo(() => ({
    critical: alerts.filter((alert) => alert.severity === 'critical').length,
    warning: alerts.filter((alert) => alert.severity === 'warning').length,
    info: alerts.filter((alert) => alert.severity === 'info').length,
  }), [alerts])

  return (
    <section className="mt-6 rounded-3xl border border-night/8 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-night/50">Observabilite</p>
          <h2 className="mt-1 text-lg font-semibold text-night">Centralisation admin</h2>
          <p className="mt-1 text-sm text-night/60">
            Vue locale des requetes, erreurs, websocket et jobs pour diagnostiquer vite un incident.
          </p>
          <p className="mt-2 text-xs text-night/40">
            {lastUpdatedAt ? `Mise a jour automatique: ${format(new Date(lastUpdatedAt), 'HH:mm:ss')}` : 'Mise a jour automatique en cours'}
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm font-medium text-night transition-colors hover:bg-sand/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Rafraichir
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-night/8 bg-sand/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-night">Alertes en direct</h3>
            <p className="text-xs text-night/50">Flux des alertes critiques, warnings et infos récentes</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-night/60">
              {alerts.length} alerte(s)
            </span>
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-night/10 bg-white p-1">
              {[
                { key: 'all' as const, label: 'Toutes', count: alerts.length },
                { key: 'critical' as const, label: 'Critiques', count: alertCounts.critical },
                { key: 'warning' as const, label: 'Warnings', count: alertCounts.warning },
                { key: 'info' as const, label: 'Infos', count: alertCounts.info },
              ].map((filter) => {
                const active = severityFilter === filter.key
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setSeverityFilter(filter.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      active ? 'bg-night text-white' : 'text-night/60 hover:bg-sand hover:text-night'
                    }`}
                    aria-pressed={active}
                  >
                    {filter.label} <span className="ml-1 opacity-70">({filter.count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          {(visibleAlerts.length
            ? visibleAlerts
            : [{
                ts: '—',
                severity: 'info',
                title: 'Aucune alerte active',
                message: 'Le flux restera visible ici dès qu’un incident remonte.',
                requestId: null,
              }]).map((alert, index) => {
            const palette = alert.severity === 'critical'
              ? 'border-red-200 bg-red-50 text-red-700'
              : alert.severity === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-sky-200 bg-sky-50 text-sky-700'

            return (
              <div key={`${alert.ts}-${index}`} className={`rounded-2xl border px-4 py-3 ${palette}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {alert.severity === 'critical' ? 'Critique' : alert.severity === 'warning' ? 'A surveiller' : 'Info'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-night">{alert.title ?? 'Alerte'}</p>
                  </div>
                  <div className="text-right text-[11px] text-night/50">
                    <p>{alert.category ?? 'system'}</p>
                    <p>{alert.ts !== '—' ? format(new Date(alert.ts), 'HH:mm:ss') : '—'}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-night/70">{alert.message ?? '—'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-night/50">
                  <span className="rounded-full bg-white px-2 py-0.5">request_id {formatRequestId(alert.requestId ?? null)}</span>
                  <span className="rounded-full bg-white px-2 py-0.5">node {alert.nodeId ?? '—'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Uptime"
          value={formatDuration(data?.uptime_ms)}
          hint="Depuis le dernier demarrage du service"
          icon={<Clock3 size={16} />}
        />
        <MetricCard
          label="Memoire"
          value={formatBytes(data?.memory?.heapUsed)}
          hint={`RSS ${formatBytes(data?.memory?.rss)} · heap total ${formatBytes(data?.memory?.heapTotal)}`}
          icon={<MemoryStick size={16} />}
        />
        <MetricCard
          label="Requetes HTTP"
          value={(data?.http.total ?? 0).toLocaleString('fr-FR')}
          hint={`${data?.http.slow ?? 0} lentes · ${data?.http.errors ?? 0} erreurs 5xx`}
          icon={<Activity size={16} />}
        />
        <MetricCard
          label="Temps reel"
          value={`${data?.websocket.connects ?? 0}/${data?.websocket.disconnects ?? 0}`}
          hint={`${data?.websocket.authErrors ?? 0} erreurs auth · ${data?.websocket.messages ?? 0} messages`}
          icon={<Wifi size={16} />}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-night/8 bg-white p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-night/50">Partages</p>
              <h3 className="mt-1 text-sm font-semibold text-night">Répartition par canal</h3>
              <p className="mt-1 text-xs text-night/50">{(share.total ?? 0).toLocaleString('fr-FR')} clic(s) de partage enregistrés</p>
            </div>
            <span className="rounded-lg bg-coral/10 p-2 text-coral">
              <Share2 size={16} />
            </span>
          </div>
          <div className="space-y-3">
            {shareChannels.length ? (
              shareChannels.slice(0, 6).map(({ channel, count }) => {
                const pct = shareMax > 0 ? Math.max(8, Math.round((count / shareMax) * 100)) : 0
                return (
                  <div key={channel}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-night">{formatShareChannelLabel(channel)}</span>
                      <span className="text-night/50">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-sand/60">
                      <div
                        className="h-2 rounded-full bg-coral transition-all"
                        style={{ width: `${pct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="rounded-xl border border-dashed border-night/10 bg-sand/30 px-3 py-2 text-xs text-night/50">
                Aucun partage enregistré pour le moment.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-night/8 bg-white p-4">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-night/50">Partages</p>
            <h3 className="mt-1 text-sm font-semibold text-night">Répartition par contenu</h3>
            <p className="mt-1 text-xs text-night/50">Annonce, profil ou contenu générique</p>
          </div>
          <div className="space-y-2">
            {shareContentTypes.length ? (
              shareContentTypes.map(({ contentType, count }) => (
                <div key={contentType} className="flex items-center justify-between rounded-xl bg-sand/30 px-3 py-2 text-sm">
                  <span className="text-night/70">{formatShareContentTypeLabel(contentType)}</span>
                  <span className="font-semibold text-night">{count}</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-night/10 bg-sand/30 px-3 py-2 text-xs text-night/50">
                Aucune donnée de contenu disponible.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-night/8 bg-white p-4">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-night/50">Partages</p>
            <h3 className="mt-1 text-sm font-semibold text-night">Derniers événements</h3>
            <p className="mt-1 text-xs text-night/50">Historique des clics de partage les plus récents</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-night/8">
            <table className="min-w-full divide-y divide-night/8 text-left text-[11px]">
              <thead className="bg-sand/40 text-night/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Heure</th>
                  <th className="px-3 py-2 font-medium">Canal</th>
                  <th className="px-3 py-2 font-medium">Contenu</th>
                  <th className="px-3 py-2 font-medium">Réf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night/8">
                {(recentShares.length
                  ? recentShares
                  : [{ ts: 'â€”', channel: 'unknown', contentType: 'unknown', requestId: null }]).map((item, index) => (
                  <tr key={`${item.ts}-${index}`}>
                    <td className="px-3 py-2 text-night/60">{item.ts !== 'â€”' ? format(new Date(item.ts), 'HH:mm:ss') : 'â€”'}</td>
                    <td className="px-3 py-2 text-night">{formatShareChannelLabel(String(item.channel ?? 'unknown'))}</td>
                    <td className="px-3 py-2 text-night/60">{formatShareContentTypeLabel(String(item.contentType ?? 'unknown'))}</td>
                    <td className="px-3 py-2 font-mono text-night/50">{formatRequestId(item.requestId ?? null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-night/8 bg-sand/30 p-4 xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-night">Erreurs recentes</h3>
            <p className="text-xs text-night/50">{recentErrors.length} evenements conserves en memoire</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-night/8 bg-white">
            <table className="min-w-full divide-y divide-night/8 text-left text-xs">
              <thead className="bg-sand/40 text-night/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Heure</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Message</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night/8">
                {(recentErrors.length
                  ? recentErrors
                  : [{ ts: '—', source: '—', message: 'Aucune erreur recente', requestId: null }]).map((item, index) => (
                  <tr key={`${item.ts}-${index}`}>
                    <td className="px-3 py-2 text-night/60">{item.ts !== '—' ? format(new Date(item.ts), 'HH:mm:ss') : '—'}</td>
                    <td className="px-3 py-2 text-night/60">{String(item.source ?? 'app')}</td>
                    <td className="px-3 py-2 text-night">{String(item.message ?? item.event ?? '—')}</td>
                    <td className="px-3 py-2 font-mono text-night/50">
                      {formatRequestId(item.requestId ?? item.request_id ?? null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-night/8 bg-sand/30 p-4">
          <h3 className="text-sm font-semibold text-night">Repartition HTTP</h3>
          <div className="mt-3 space-y-2">
            {statusBreakdown.length ? (
              statusBreakdown.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                  <span className="text-night/70">HTTP {status}</span>
                  <span className="font-semibold text-night">{count}</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-white px-3 py-2 text-sm text-night/50">Aucune donnee HTTP pour le moment.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-night/8 bg-sand/30 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-night">Nœuds actifs</h3>
          <p className="text-xs text-night/50">
            Vue multi-instance pour distinguer l’API, le worker et les autres réplicas.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-night/8 bg-white">
          <table className="min-w-full divide-y divide-night/8 text-left text-xs">
            <thead className="bg-sand/40 text-night/50">
              <tr>
                <th className="px-3 py-2 font-medium">Nœud</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Host</th>
                <th className="px-3 py-2 font-medium">PID</th>
                <th className="px-3 py-2 font-medium">Mise a jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night/8">
              {nodes.length ? nodes.map((node) => (
                <tr key={node.id}>
                  <td className="px-3 py-2 font-mono text-night/60">{node.id}</td>
                  <td className="px-3 py-2 text-night">{node.role ?? 'api'}</td>
                  <td className="px-3 py-2 text-night/60">{node.host ?? '—'}</td>
                  <td className="px-3 py-2 text-night/60">{node.pid ?? '—'}</td>
                  <td className="px-3 py-2 text-night/60">{node.updated_at ? format(new Date(node.updated_at), 'HH:mm:ss') : '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-3 py-2 text-night/50" colSpan={5}>
                    Aucun noeud Redis detecte pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-night/8 bg-white p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-night">Dernieres requetes</h3>
          <p className="text-xs text-night/50">Permet de retrouver rapidement la route et l impact utilisateur</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-night/8">
          <table className="min-w-full divide-y divide-night/8 text-left text-xs">
            <thead className="bg-sand/40 text-night/50">
              <tr>
                <th className="px-3 py-2 font-medium">Heure</th>
                <th className="px-3 py-2 font-medium">Methode</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Duree</th>
                <th className="px-3 py-2 font-medium">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night/8">
              {(recentRequests.length
                ? recentRequests
                : [{ ts: '—', method: '—', path: '—', statusCode: 0, durationMs: 0, requestId: null }]).map((item, index) => (
                <tr key={`${item.ts}-${index}`}>
                  <td className="px-3 py-2 text-night/60">{item.ts !== '—' ? format(new Date(item.ts), 'HH:mm:ss') : '—'}</td>
                  <td className="px-3 py-2 font-medium text-night">{item.method}</td>
                  <td className="px-3 py-2 text-night/70">{item.path}</td>
                  <td className="px-3 py-2 text-night">{item.statusCode ? item.statusCode : '—'}</td>
                  <td className="px-3 py-2 text-night/60">{item.durationMs ? formatDuration(item.durationMs) : '—'}</td>
                  <td className="px-3 py-2 font-mono text-night/50">{formatRequestId(item.requestId ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Websocket"
          value={`${data?.websocket.connects ?? 0} connexions`}
          hint={`${data?.websocket.disconnects ?? 0} deconnexions · ${data?.websocket.messages ?? 0} messages`}
          icon={<Wifi size={16} />}
        />
        <MetricCard
          label="Erreurs observees"
          value={(data?.http.errors ?? 0).toLocaleString('fr-FR')}
          hint="Erreurs HTTP 5xx en temps reel"
          icon={<AlertTriangle size={16} />}
        />
        <MetricCard
          label="Jobs"
          value={`${data?.jobs.errors ?? 0} erreurs`}
          hint={`${data?.jobs.started ?? 0} demarres · ${data?.jobs.skipped ?? 0} sautes`}
          icon={<Cpu size={16} />}
        />
        <MetricCard
          label="Instances"
          value={`${data?.cluster?.instances ?? 1}`}
          hint="Noeuds observes via Redis"
          icon={<Activity size={16} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-night/8 bg-white p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-night/50">Par categorie</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="count"
                nameKey="nom"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {categories.map((_, i) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #d3d1c7' }}
                formatter={(v: number, name: string) => [
                  `${v} (${categories.find((c) => c.nom === name)?.pct ?? 0}%)`,
                  name,
                ]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-night/8 bg-white p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-night/50">
            Top categories - activite
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categories} layout="vertical" barSize={10}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#888780' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fill: '#888780' }} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v} annonces`, '']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {categories.map((_, i) => (
                <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
              ))}
            </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-night/8 bg-white p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-night/50">Actions rapides</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Traiter les signalements en attente', href: '/admin/signalements', color: 'text-red-500 bg-red-50 border-red-200' },
              { label: 'Voir les nouvelles inscriptions', href: '/admin/utilisateurs?statut=en_attente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { label: 'Annonces signalees multiple', href: '/admin/annonces?statut=signalee', color: 'text-coral bg-coral/10 border-coral/20' },
              { label: 'Comptes suspendus a reactiver', href: '/admin/utilisateurs?statut=suspendu', color: 'text-night/50 bg-sand border-night/10' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all hover:opacity-80 ${action.color}`}
              >
                {action.label}
                <span className="ml-auto">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ServiceStatsSection({ services }: { services: any }) {
  const bonPlans = services ?? {}

  return (
    <section className="mt-6 rounded-3xl border border-night/8 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-night/50">Services</p>
        <h2 className="mt-1 text-lg font-semibold text-night">Bons plans, évènements et covoiturage</h2>
        <p className="mt-1 text-sm text-night/60">
          Vue synthétique des nouveaux modules pour piloter l&apos;activité, la croissance et la modération.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Bons plans"
          value={`${Number(bonPlans.bon_plans_actifs ?? 0).toLocaleString('fr-FR')} actifs`}
          hint={`${Number(bonPlans.promotions_total ?? 0).toLocaleString('fr-FR')} promos · ${Number(bonPlans.events_total ?? 0).toLocaleString('fr-FR')} évènements`}
          icon={<Sparkles size={16} />}
        />
        <MetricCard
          label="Évènements"
          value={`${Number(bonPlans.events_a_venir ?? 0).toLocaleString('fr-FR')} à venir`}
          hint={`${Number(bonPlans.events_views ?? 0).toLocaleString('fr-FR')} vues · ${Number(bonPlans.events_reservations ?? 0).toLocaleString('fr-FR')} réservations`}
          icon={<CalendarDays size={16} />}
        />
        <MetricCard
          label="Covoiturage"
          value={`${Number(bonPlans.rides_active ?? 0).toLocaleString('fr-FR')} trajets`}
          hint={`${Number(bonPlans.ride_bookings ?? 0).toLocaleString('fr-FR')} réservations · ${Number(bonPlans.rides_verified_drivers ?? 0).toLocaleString('fr-FR')} conducteurs vérifiés`}
          icon={<CarFront size={16} />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-night/8 bg-sand/30 p-4">
          <h3 className="text-sm font-semibold text-night">Bons plans & promotions</h3>
          <div className="mt-3 grid gap-2 text-sm text-night/70 sm:grid-cols-2">
            <div className="rounded-xl bg-white px-3 py-2">Vues: {Number(bonPlans.bon_plans_vues ?? 0).toLocaleString('fr-FR')}</div>
            <div className="rounded-xl bg-white px-3 py-2">Partages: {Number(bonPlans.bon_plans_partages ?? 0).toLocaleString('fr-FR')}</div>
            <div className="rounded-xl bg-white px-3 py-2">Contacts: {Number(bonPlans.bon_plans_contacts ?? 0).toLocaleString('fr-FR')}</div>
            <div className="rounded-xl bg-white px-3 py-2">Expirées: {Number(bonPlans.bon_plans_expired ?? 0).toLocaleString('fr-FR')}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-night/8 bg-sand/30 p-4">
          <h3 className="text-sm font-semibold text-night">Covoiturage</h3>
          <div className="mt-3 grid gap-2 text-sm text-night/70 sm:grid-cols-2">
            <div className="rounded-xl bg-white px-3 py-2">Places réservées: {Number(bonPlans.ride_seats_reserved ?? 0).toLocaleString('fr-FR')}</div>
            <div className="rounded-xl bg-white px-3 py-2">Places totales: {Number(bonPlans.ride_seats_total ?? 0).toLocaleString('fr-FR')}</div>
            <div className="rounded-xl bg-white px-3 py-2">Prix moyen: {Number(bonPlans.ride_avg_price ?? 0).toLocaleString('fr-FR')} XPF</div>
            <div className="rounded-xl bg-white px-3 py-2">Note moyenne: {Number(bonPlans.ride_avg_rating ?? 0).toFixed(1)}/5</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, loading: lStats, refetch: rStats } = useAdminStats()
  const { data: charts, loading: lCharts, refetch: rCharts } = useAdminChartData()
  const { loading: lObs, refetch: rObs } = useAdminObservability()

  const chartLabels = useMemo(
    () => charts?.daily.map((d) => format(parseISO(d.date), 'd MMM', { locale: fr })) ?? [],
    [charts],
  )

  const chartData = useMemo(
    () => charts?.daily.map((d, i) => ({ name: chartLabels[i], annonces: d.value })) ?? [],
    [charts, chartLabels],
  )

  const loading = lStats || lCharts || lObs

  return (
    <AdminLayout>
      <div className="flex items-center justify-between border-b border-night/8 bg-white px-6 py-3.5">
        <h1 className="font-semibold text-night">Vue d'ensemble</h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            API operationnelle
          </span>
          <button
            onClick={() => {
              rStats()
              rCharts()
              void rObs()
            }}
            disabled={loading}
            className="rounded-lg p-1.5 text-night/40 transition-all hover:bg-sand hover:text-night disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid grid-cols-4 gap-4">
          <KpiCard
            label="Annonces actives"
            value={stats?.annonces_actives.toLocaleString('fr-FR') ?? '—'}
            delta={stats?.annonces_delta_semaine}
            deltaLabel="cette semaine"
            icon={<FileText size={14} />}
          />
          <KpiCard
            label="Utilisateurs inscrits"
            value={stats?.utilisateurs_total.toLocaleString('fr-FR') ?? '—'}
            delta={stats?.utilisateurs_delta_mois}
            deltaLabel="ce mois"
            icon={<Users size={14} />}
          />
          <KpiCard
            label="Signalements en attente"
            value={stats?.signalements_attente ?? '—'}
            delta={stats?.signalements_delta_hier}
            deltaLabel="depuis hier"
            icon={<AlertTriangle size={14} />}
            danger={(stats?.signalements_attente ?? 0) > 3}
          />
          <KpiCard
            label="Messages echanges"
            value={stats?.messages_total.toLocaleString('fr-FR') ?? '—'}
            delta={stats?.messages_delta_pct}
            deltaLabel="% cette semaine"
            icon={<MessageCircle size={14} />}
          />
        </div>

        <ObservabilitySection categories={charts?.categories ?? []} />
        <ServiceStatsSection services={stats?.services ?? {}} />
      </div>
    </AdminLayout>
  )
}
