// src/app/admin/annonces/page.tsx
// ── Gestion des annonces — recherche, filtres, suppression ────────────────────

'use client'

import { useState, useCallback } from 'react'
import { Search, Trash2, Eye, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAnnonces, useDeleteAnnonce } from '@/hooks/useAdmin'
import type { AdminAnnonce, AnnoncesFilters, StatutAnnonce } from '@/types/admin.types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<StatutAnnonce, string> = {
  active:    'bg-emerald-50 text-emerald-700',
  signalée:  'bg-red-50 text-red-600',
  suspendue: 'bg-red-50 text-red-500',
  expirée:   'bg-sand text-night/40',
  vendue:    'bg-blue-50 text-blue-600',
}

const formatXPF = (n: number | null) =>
  n === null ? '—' : `${n.toLocaleString('fr-FR')} XPF`

const FILTRES_STATUT: { label: string; value: StatutAnnonce | 'toutes' }[] = [
  { label: 'Toutes',    value: 'toutes' },
  { label: 'Actives',   value: 'active' },
  { label: 'Signalées', value: 'signalée' },
  { label: 'Suspendues',value: 'suspendue' },
  { label: 'Expirées',  value: 'expirée' },
]

// ── Colonne triable ───────────────────────────────────────────────────────────

function SortHeader({
  label, field, current, order, onSort,
}: {
  label: string
  field: AnnoncesFilters['sort']
  current: AnnoncesFilters['sort']
  order: 'asc' | 'desc'
  onSort: (f: AnnoncesFilters['sort']) => void
}) {
  const active = current === field
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-[10px] font-medium text-night/50 uppercase tracking-wide hover:text-night transition-colors"
    >
      {label}
      {active
        ? order === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
        : <span className="opacity-0 group-hover:opacity-100"><ChevronDown size={10} /></span>}
    </button>
  )
}

// ── Ligne annonce ─────────────────────────────────────────────────────────────

function AnnonceRow({
  annonce,
  onDelete,
}: {
  annonce: AdminAnnonce
  onDelete: (id: number) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'annonce "${annonce.titre}" ?`)) return
    setDeleting(true)
    await onDelete(annonce.id)
    setDeleting(false)
  }

  return (
    <tr className="border-b border-night/6 hover:bg-sand/40 transition-colors group">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-night truncate max-w-[200px]">#{annonce.id} {annonce.titre}</p>
          <p className="text-[10px] text-night/40 mt-0.5 flex items-center gap-1">
            <Eye size={10} /> {annonce.nb_vues.toLocaleString('fr-FR')} vues
            {annonce.nb_signalements > 0 && (
              <span className="text-red-500 ml-1">· {annonce.nb_signalements} signalement{annonce.nb_signalements > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs bg-sand text-night/60 px-2 py-0.5 rounded-full">{annonce.categorie}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center text-[10px] font-bold text-coral shrink-0">
            {annonce.user.nom.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-xs font-medium">{annonce.user.nom}</p>
            <p className="text-[10px] text-night/40">{annonce.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-medium">{formatXPF(annonce.prix)}</td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUT_STYLE[annonce.statut]}`}>
          {annonce.statut}
        </span>
      </td>
      <td className="px-4 py-3 text-[11px] text-night/40">
        {format(parseISO(annonce.created_at), 'd MMM yyyy', { locale: fr })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/annonces/${annonce.id}`}
            target="_blank"
            className="p-1.5 text-night/40 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Voir l'annonce"
          >
            <Eye size={13} />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-night/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 size={13} className={deleting ? 'animate-spin' : ''} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminAnnoncesPage() {
  const [filters, setFilters] = useState<AnnoncesFilters>({
    page: 1, limit: 20, sort: 'created_at', order: 'desc',
  })
  const [search, setSearch] = useState('')

  const { data, loading, refetch } = useAdminAnnonces(filters)
  const { deleteAnnonce } = useDeleteAnnonce()

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    const t = setTimeout(() => setFilters(f => ({ ...f, search: value || undefined, page: 1 })), 300)
    return () => clearTimeout(t)
  }, [])

  const handleSort = (field: AnnoncesFilters['sort']) => {
    setFilters(f => ({
      ...f,
      sort: field,
      order: f.sort === field && f.order === 'desc' ? 'asc' : 'desc',
    }))
  }

  const handleDelete = async (id: number) => {
    const ok = await deleteAnnonce(id, 'Suppression manuelle admin')
    if (ok) refetch()
  }

  const totalPages = Math.ceil((data?.total ?? 0) / filters.limit)

  return (
    <AdminLayout>
      {/* Topbar */}
      <div className="bg-white border-b border-night/8 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-night">Annonces</h1>
          {data?.total !== undefined && (
            <span className="text-xs text-night/40 bg-sand px-2 py-0.5 rounded-full">
              {data.total.toLocaleString('fr-FR')} au total
            </span>
          )}
        </div>
        <button onClick={refetch} disabled={loading} className="p-1.5 text-night/40 hover:text-night rounded-lg hover:bg-sand transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">

        {/* Recherche + Filtres */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-night/35" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Titre, catégorie, utilisateur…"
              className="input pl-9 text-sm w-full"
            />
          </div>
          <div className="flex gap-1">
            {FILTRES_STATUT.map(f => (
              <button
                key={f.value}
                onClick={() => setFilters(fi => ({ ...fi, statut: f.value === 'toutes' ? undefined : f.value, page: 1 }))}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  (filters.statut ?? 'toutes') === f.value
                    ? 'bg-coral/10 text-coral border-coral/30 font-medium'
                    : 'border-night/10 text-night/50 hover:bg-sand'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-night/8 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night/8 bg-sand/50">
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Annonce" field="created_at" current={filters.sort} order={filters.order} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-night/50 uppercase tracking-wide">Catégorie</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-night/50 uppercase tracking-wide">Vendeur</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-night/50 uppercase tracking-wide">Prix</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-night/50 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Date" field="created_at" current={filters.sort} order={filters.order} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-night/50 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-night/6">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-sand rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : (data?.data ?? []).map(a => (
                    <AnnonceRow key={a.id} annonce={a} onDelete={handleDelete} />
                  ))
              }
            </tbody>
          </table>

          {!loading && (data?.data.length ?? 0) === 0 && (
            <div className="text-center py-12 text-night/40">
              <p className="text-sm">Aucune annonce trouvée</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-night/40">
              Page {filters.page} / {totalPages} — {data?.total.toLocaleString('fr-FR')} annonces
            </p>
            <div className="flex gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-ghost text-xs py-1 px-3 disabled:opacity-30"
              >
                ← Précédent
              </button>
              <button
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-ghost text-xs py-1 px-3 disabled:opacity-30"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
