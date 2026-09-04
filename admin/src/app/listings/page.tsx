import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { loadAdminJson } from '@/lib/load'
import { rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function ListingsPage() {
  const payload = await loadAdminJson<any>('/admin/listings?limit=50', { data: [], pagination: { total: 0 } })

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="admin-label">Annonces</p>
        <h1 className="mt-2 text-3xl font-semibold">Catalogue & modération</h1>
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
