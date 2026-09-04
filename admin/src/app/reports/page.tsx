import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { loadAdminJson } from '@/lib/load'
import { displayCount, displayXpf } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ month?: string }> }) {
  const params = await searchParams
  const month = params?.month || new Date().toISOString().slice(0, 7)
  const data = await loadAdminJson<any>(`/admin/reports/monthly?month=${encodeURIComponent(month)}`, null)

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="admin-label">Rapport</p>
        <h1 className="mt-2 text-3xl font-semibold">Export mensuel</h1>
        <p className="mt-2 text-slate-400">Mois: {month}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Nouveaux inscrits" value={displayCount(data?.new_users)} tone="good" />
        <StatCard label="MRR" value={displayXpf(data?.mrr_xpf)} tone="warning" />
        <StatCard label="Annonces publiées" value={displayCount(data?.listings_published)} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link className="admin-button" href={`/api/reports/monthly/export?month=${encodeURIComponent(month)}&format=pdf`}>
          Exporter PDF
        </Link>
        <Link className="admin-button-secondary" href={`/api/reports/monthly/export?month=${encodeURIComponent(month)}&format=csv`}>
          Exporter CSV
        </Link>
      </div>
    </div>
  )
}
