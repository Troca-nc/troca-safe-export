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
      <section className="border-b border-[var(--admin-line)] pb-7">
        <p className="admin-kicker">Communauté</p>
        <h1 className="admin-page-title mt-3">Membres</h1>
        <p className="admin-muted mt-3 text-sm">{displayCount(users?.pagination?.total)} membres inscrits</p>
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
          action: <Link className="font-semibold text-[var(--admin-lagoon)] underline decoration-[var(--admin-lagoon)]/30 underline-offset-4 hover:text-[var(--admin-ink)]" href={`/users/${user.id}`}>Voir la fiche</Link>,
        }))}
      />
      <CollectionNotice value={users?.data} emptyLabel="Aucun utilisateur dans ce résultat." />
    </div>
  )
}
