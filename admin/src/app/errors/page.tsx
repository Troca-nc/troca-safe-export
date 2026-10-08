import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { loadAdminJson } from '@/lib/load'
import { rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function ErrorsPage() {
  const payload = await loadAdminJson<any>('/admin/health/errors?hours=24&limit=50', { data: [] })

  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--admin-line)] pb-7">
        <p className="admin-kicker">Observabilité</p>
        <h1 className="admin-page-title mt-3">État et erreurs</h1>
        <p className="admin-muted mt-3 text-sm">Événements techniques des dernières 24 heures</p>
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
