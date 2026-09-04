import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { StatCard } from '@/components/StatCard'
import { formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'
import { displayXpf, rowsOrEmpty } from '@/lib/presentation'

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
        <StatCard label="Total reçu" value={displayXpf(payload.totals?.total_xpf)} tone="good" />
        <StatCard label="Boosts" value={displayXpf(payload.totals?.boost_xpf)} />
        <StatCard label="Abonnements" value={displayXpf(payload.totals?.sub_xpf)} tone="warning" />
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
        rows={rowsOrEmpty(payload.data).map((row: any) => ({
          ...row,
          amount_xpf: formatXpf(row.amount_xpf),
        }))}
      />
      <CollectionNotice value={payload.data} emptyLabel="Aucun paiement dans ce résultat." />
    </div>
  )
}
