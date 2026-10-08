import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { loadAdminJson } from '@/lib/load'
import { rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function ListingsPage() {
  const payload = await loadAdminJson<any>('/admin/listings?limit=50', { data: [], pagination: { total: 0 } })

  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--admin-line)] pb-7">
        <p className="admin-kicker">Catalogue</p>
        <h1 className="admin-page-title mt-3">Annonces</h1>
        <p className="admin-muted mt-3 text-sm">Consultation des contenus publiés et de leur statut</p>
      </section>

      <DataTable
        columns={[
          { key: 'titre', label: 'Titre' },
          { key: 'category_name', label: 'Catégorie' },
          { key: 'status', label: 'Statut' },
          { key: 'prix', label: 'Prix' },
          { key: 'user_id', label: 'Auteur' },
        ]}
        rows={rowsOrEmpty(payload.data)}
      />
      <CollectionNotice value={payload.data} emptyLabel="Aucune annonce dans ce résultat." />
    </div>
  )
}
