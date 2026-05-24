import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DataTable } from '@/components/DataTable'
import { UserActionButtons } from '@/components/UserActionButtons'
import { StatCard } from '@/components/StatCard'
import { formatDateNc, formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'

export const dynamic = 'force-dynamic'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadAdminJson<any>(`/admin/users/${id}/full`, null)
  if (!data?.user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="admin-label">Fiche utilisateur</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {data.user.prenom} {data.user.nom}
        </h1>
        <p className="mt-2 text-slate-400">{data.user.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            {data.user.is_pro ? 'Pro' : 'Gratuit'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
            {data.user.phone_verified ? 'Téléphone vérifié' : 'Téléphone non vérifié'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
            {data.user.account_type || 'personal'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Annonces" value={String(data.listings?.length || 0)} />
        <StatCard label="Paiements" value={String(data.payments?.length || 0)} />
        <StatCard label="Signalements" value={String(data.reports_made?.length || 0)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card">
          <p className="admin-label">Actions</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/users/${id}`} className="admin-button-secondary">Rafraîchir</Link>
          </div>
          <div className="mt-4">
            <UserActionButtons userId={id} />
          </div>
        </div>
        <div className="admin-card text-sm text-slate-300">
          <p className="admin-label">Métadonnées</p>
          <div className="mt-4 space-y-2">
            <p>Inscrit le: {formatDateNc(data.user.created_at)}</p>
            <p>Total vues: {data.user.total_vues ?? 0}</p>
            <p>Total favoris: {data.user.total_favoris ?? 0}</p>
            <p>Announces actives: {data.user.active_listings_count ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Annonces</h2>
        <DataTable
          columns={[
            { key: 'titre', label: 'Titre' },
            { key: 'category_name', label: 'Catégorie' },
            { key: 'status', label: 'Statut' },
            { key: 'view_count', label: 'Vues' },
            { key: 'created_at', label: 'Créée le' },
          ]}
          rows={(data.listings || []).map((row: any) => ({ ...row, created_at: formatDateNc(row.created_at) }))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Paiements</h2>
        <DataTable
          columns={[
            { key: 'created_at', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'provider', label: 'Provider' },
            { key: 'amount_xpf', label: 'Montant' },
            { key: 'status', label: 'Statut' },
          ]}
          rows={(data.payments || []).map((row: any) => ({
            ...row,
            created_at: formatDateNc(row.created_at),
            amount_xpf: formatXpf(row.amount_xpf),
          }))}
        />
      </section>
    </div>
  )
}
