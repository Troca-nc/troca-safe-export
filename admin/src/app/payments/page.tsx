import { DataTable } from '@/components/DataTable'
import { StatCard } from '@/components/StatCard'
import { formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const payload = await loadAdminJson<any>('/admin/payments?limit=50', { data: [], totals: {} })

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="admin-label">Paiements</p>
        <h1 className="mt-2 text-3xl font-semibold">Revenus & abonnements</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total reçu" value={formatXpf(payload.totals?.total_xpf || 0)} tone="good" />
        <StatCard label="Boosts" value={formatXpf(payload.totals?.boost_xpf || 0)} />
        <StatCard label="Abonnements" value={formatXpf(payload.totals?.sub_xpf || 0)} tone="warning" />
      </section>

      <DataTable
        columns={[
          { key: 'created_at', label: 'Date' },
          { key: 'type', label: 'Type' },
          { key: 'provider', label: 'Provider' },
          { key: 'amount_xpf', label: 'Montant' },
          { key: 'status', label: 'Statut' },
          { key: 'email', label: 'Utilisateur' },
        ]}
        rows={(payload.data || []).map((row: any) => ({
          ...row,
          amount_xpf: formatXpf(row.amount_xpf),
        }))}
      />
    </div>
  )
}
