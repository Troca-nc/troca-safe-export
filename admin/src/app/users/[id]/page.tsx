import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { UserActionButtons } from '@/components/UserActionButtons'
import { StatCard } from '@/components/StatCard'
import { formatDateNc, formatXpf } from '@/lib/formatters'
import { loadAdminJson } from '@/lib/load'
import { displayArrayCount, displayCount, rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadAdminJson<any>(`/admin/users/${id}/full`, null)
  if (!data?.user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--admin-line)] pb-7">
        <p className="admin-kicker">Fiche membre</p>
        <h1 className="admin-page-title mt-3">
          {data.user.prenom} {data.user.nom}
        </h1>
        <p className="admin-muted mt-3">{data.user.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--admin-mint)] bg-[var(--admin-mint)]/20 px-3 py-1 text-xs font-semibold text-[var(--admin-green)]">
            {data.user.is_pro ? 'Pro' : 'Gratuit'}
          </span>
          <span className="rounded-full border border-[var(--admin-line)] bg-[var(--admin-paper)] px-3 py-1 text-xs font-semibold text-[var(--admin-ink-soft)]">
            {data.user.phone_verified ? 'Téléphone vérifié' : 'Téléphone non vérifié'}
          </span>
          <span className="rounded-full border border-[var(--admin-line)] bg-[var(--admin-paper)] px-3 py-1 text-xs font-semibold text-[var(--admin-ink-soft)]">
            {data.user.account_type || 'personal'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Annonces" value={displayArrayCount(data.listings)} />
        <StatCard label="Paiements" value={displayArrayCount(data.payments)} />
        <StatCard label="Signalements" value={displayArrayCount(data.reports_made)} />
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
        <div className="admin-card text-sm text-[var(--admin-ink-soft)]">
          <p className="admin-label">Métadonnées</p>
          <div className="mt-4 space-y-2">
            <p>Inscrit le: {formatDateNc(data.user.created_at)}</p>
            <p>Total vues: {displayCount(data.user.total_vues)}</p>
            <p>Total favoris: {displayCount(data.user.total_favoris)}</p>
            <p>Annonces actives: {displayCount(data.user.active_listings_count)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="admin-section-title">Annonces</h2>
        <DataTable
          columns={[
            { key: 'titre', label: 'Titre' },
            { key: 'category_name', label: 'Catégorie' },
            { key: 'status', label: 'Statut' },
            { key: 'view_count', label: 'Vues' },
            { key: 'created_at', label: 'Créée le' },
          ]}
          rows={rowsOrEmpty(data.listings).map((row: any) => ({ ...row, created_at: formatDateNc(row.created_at) }))}
        />
        <CollectionNotice value={data.listings} emptyLabel="Aucune annonce pour cet utilisateur." />
      </section>

      <section className="space-y-4">
        <h2 className="admin-section-title">Paiements</h2>
        <DataTable
          columns={[
            { key: 'created_at', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'provider', label: 'Provider' },
            { key: 'amount_xpf', label: 'Montant' },
            { key: 'status', label: 'Statut' },
          ]}
          rows={rowsOrEmpty(data.payments).map((row: any) => ({
            ...row,
            created_at: formatDateNc(row.created_at),
            amount_xpf: formatXpf(row.amount_xpf),
          }))}
        />
        <CollectionNotice value={data.payments} emptyLabel="Aucun paiement pour cet utilisateur." />
      </section>
    </div>
  )
}
