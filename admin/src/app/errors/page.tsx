import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { loadAdminJson } from '@/lib/load'
import { rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function ErrorsPage() {
  const payload = await loadAdminJson<any>('/admin/health/errors?hours=24&limit=50', { data: [] })

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="admin-label">Erreurs</p>
        <h1 className="mt-2 text-3xl font-semibold">Timeline d’erreurs</h1>
      </section>

      <DataTable
        columns={[
          { key: 'ts', label: 'Date' },
          { key: 'level', label: 'Niveau' },
          { key: 'route', label: 'Route' },
          { key: 'message', label: 'Message' },
        ]}
        rows={rowsOrEmpty(payload.data)}
      />
      <CollectionNotice value={payload.data} emptyLabel="Aucune erreur dans ce résultat." />
    </div>
  )
}
