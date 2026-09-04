import Link from 'next/link'
import { DataTable } from '@/components/DataTable'
import { CollectionNotice } from '@/components/CollectionNotice'
import { UserSearch } from '@/components/UserSearch'
import { loadAdminJson } from '@/lib/load'
import { displayCount, rowsOrEmpty } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

export default async function UsersPage({ searchParams }: { searchParams?: Promise<{ search?: string; page?: string }> }) {
  const params = await searchParams
  const search = String(params?.search || '')
  const path = `/admin/users?q=${encodeURIComponent(search)}`
  const users = await loadAdminJson<any>(path, { data: [], pagination: { total: 0 } })

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <p className="admin-label">Utilisateurs</p>
        <h1 className="mt-2 text-3xl font-semibold">Recherche et gestion</h1>
        <p className="mt-2 text-slate-400">Total: {displayCount(users?.pagination?.total)}</p>
      </section>

      <UserSearch initialValue={search} />

      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'email', label: 'Email' },
          { key: 'prenom', label: 'Prénom' },
          { key: 'nom', label: 'Nom' },
          { key: 'is_pro', label: 'Pro' },
          { key: 'created_at', label: 'Inscrit le' },
          { key: 'action', label: 'Fiche' },
        ]}
        rows={rowsOrEmpty(users?.data).map((user: any) => ({
          ...user,
          action: <Link className="text-emerald-300 underline" href={`/users/${user.id}`}>Voir</Link>,
        }))}
      />
      <CollectionNotice value={users?.data} emptyLabel="Aucun utilisateur dans ce résultat." />
    </div>
  )
}
