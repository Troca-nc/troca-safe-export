// src/app/admin/utilisateurs/page.tsx
// ── Gestion des utilisateurs — recherche, suspension, réactivation ────────────

'use client'

import { useState, useCallback } from 'react'
import {
  Search, Shield, ShieldOff, RefreshCw,
  Mail, Phone, MapPin, AlertTriangle,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminUsers, useSuspendUser } from '@/hooks/useAdmin'
import type { AdminUser, UsersFilters, StatutUser } from '@/types/admin.types'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<StatutUser, { badge: string; label: string }> = {
  'vérifié':    { badge: 'bg-emerald-50 text-emerald-700', label: 'Vérifié' },
  'en_attente': { badge: 'bg-amber-50 text-amber-700',     label: 'En attente' },
  'suspendu':   { badge: 'bg-red-50 text-red-600',         label: 'Suspendu' },
  'pro':        { badge: 'bg-blue-50 text-blue-700',       label: 'Pro' },
}

const FILTRES_STATUT: { label: string; value: StatutUser | 'tous' }[] = [
  { label: 'Tous',        value: 'tous' },
  { label: 'Vérifiés',    value: 'vérifié' },
  { label: 'En attente',  value: 'en_attente' },
  { label: 'Suspendus',   value: 'suspendu' },
  { label: 'Pro',         value: 'pro' },
]

// ── Modale de suspension ──────────────────────────────────────────────────────

function SuspendModal({
  user,
  onConfirm,
  onCancel,
}: {
  user: AdminUser
  onConfirm: (raison: string, duree?: number) => void
  onCancel: () => void
}) {
  const [raison, setRaison] = useState('')
  const [duree, setDuree]   = useState<number | undefined>(undefined)

  return (
    <div
      style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className="fixed inset-0 z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-semibold text-night mb-1">Suspendre {user.prenom} {user.nom}</h2>
        <p className="text-sm text-night/50 mb-4">{user.email}</p>

        <label className="block text-xs text-night/50 mb-1">Raison de la suspension *</label>
        <input
          type="text"
          value={raison}
          onChange={e => setRaison(e.target.value)}
          placeholder="Ex : Annonces frauduleuses répétées"
          className="input w-full text-sm mb-4"
          autoFocus
        />

        <label className="block text-xs text-night/50 mb-1">Durée (laisser vide = définitif)</label>
        <select
          className="input w-full text-sm mb-6"
          value={duree ?? ''}
          onChange={e => setDuree(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Suspension définitive</option>
          <option value="7">7 jours</option>
          <option value="30">30 jours</option>
          <option value="90">90 jours</option>
        </select>

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1 text-sm">Annuler</button>
          <button
            disabled={!raison.trim()}
            onClick={() => onConfirm(raison, duree)}
            className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-40"
          >
            Confirmer la suspension
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ligne utilisateur ─────────────────────────────────────────────────────────

function UserRow({
  user,
  onSuspend,
  onReactiver,
}: {
  user: AdminUser
  onSuspend: (u: AdminUser) => void
  onReactiver: (id: number) => void
}) {
  const initiales = `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase()

  return (
    <tr className="border-b border-night/6 hover:bg-sand/40 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-xs font-bold text-coral shrink-0">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              : initiales
            }
          </div>
          <div>
            <p className="text-sm font-medium text-night">{user.prenom} {user.nom}</p>
            <p className="text-[10px] text-night/40 flex items-center gap-1">
              <Mail size={9} /> {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {user.commune
          ? <span className="text-xs text-night/60 flex items-center gap-1"><MapPin size={10} />{user.commune}</span>
          : <span className="text-night/25 text-xs">—</span>}
      </td>
      <td className="px-4 py-3">
        {user.telephone
          ? <span className="text-xs flex items-center gap-1"><Phone size={10} />{user.telephone}</span>
          : <span className="text-night/25 text-xs">—</span>}
        {!user.telephone_verifie && user.telephone && (
          <span className="text-[9px] text-amber-600 block">non vérifié</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        {user.nb_annonces}
        {user.nb_signalements_recus > 0 && (
          <span className="text-[10px] text-red-500 ml-1 flex items-center gap-0.5">
            <AlertTriangle size={9} />{user.nb_signalements_recus} signalement{user.nb_signalements_recus > 1 ? 's' : ''}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-[11px] text-night/40">
        <p>{format(parseISO(user.created_at), 'd MMM yyyy', { locale: fr })}</p>
        {user.last_login_at && (
          <p className="text-[9px]">
            vu {formatDistanceToNow(parseISO(user.last_login_at), { addSuffix: true, locale: fr })}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUT_STYLE[user.statut].badge}`}>
          {STATUT_STYLE[user.statut].label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {user.statut === 'suspendu' ? (
            <button
              onClick={() => onReactiver(user.id)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
            >
              <ShieldOff size={11} /> Réactiver
            </button>
          ) : (
            <button
              onClick={() => onSuspend(user)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
            >
              <Shield size={11} /> Suspendre
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<UsersFilters>({
    page: 1, limit: 20, sort: 'created_at', order: 'desc',
  })
  const [search, setSearch]           = useState('')
  const [userToSuspend, setUserToSuspend] = useState<AdminUser | null>(null)

  const { data, loading, refetch } = useAdminUsers(filters)
  const { suspendUser, reactiverUser, loading: actLoading } = useSuspendUser()

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    const t = setTimeout(() => setFilters(f => ({ ...f, search: value || undefined, page: 1 })), 300)
    return () => clearTimeout(t)
  }, [])

  const handleSuspendConfirm = async (raison: string, duree?: number) => {
    if (!userToSuspend) return
    const ok = await suspendUser(userToSuspend.id, raison, duree)
    if (ok) { refetch(); setUserToSuspend(null) }
  }

  const handleReactiver = async (id: number) => {
    if (!confirm('Réactiver ce compte ?')) return
    const ok = await reactiverUser(id)
    if (ok) refetch()
  }

  const totalPages = Math.ceil((data?.total ?? 0) / filters.limit)

  return (
    <AdminLayout>
      {/* Modale suspension */}
      {userToSuspend && (
        <SuspendModal
          user={userToSuspend}
          onConfirm={handleSuspendConfirm}
          onCancel={() => setUserToSuspend(null)}
        />
      )}

      {/* Topbar */}
      <div className="bg-white border-b border-night/8 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-night">Utilisateurs</h1>
          {data?.total !== undefined && (
            <span className="text-xs text-night/40 bg-sand px-2 py-0.5 rounded-full">
              {data.total.toLocaleString('fr-FR')} inscrits
            </span>
          )}
        </div>
        <button onClick={refetch} disabled={loading} className="p-1.5 text-night/40 hover:text-night rounded-lg hover:bg-sand transition-all">
          <RefreshCw size={14} className={loading || actLoading ? 'animate-spin' : ''} />
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
              placeholder="Nom, email, commune…"
              className="input pl-9 text-sm w-full"
            />
          </div>
          <div className="flex gap-1">
            {FILTRES_STATUT.map(f => (
              <button
                key={f.value}
                onClick={() => setFilters(fi => ({ ...fi, statut: f.value === 'tous' ? undefined : f.value, page: 1 }))}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  (filters.statut ?? 'tous') === f.value
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
                {['Utilisateur','Commune','Téléphone','Annonces','Inscription','Statut','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-night/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-night/6">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-sand rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : (data?.data ?? []).map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onSuspend={setUserToSuspend}
                      onReactiver={handleReactiver}
                    />
                  ))
              }
            </tbody>
          </table>

          {!loading && (data?.data.length ?? 0) === 0 && (
            <div className="text-center py-12 text-night/40">
              <p className="text-sm">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-night/40">
              Page {filters.page} / {totalPages} — {data?.total.toLocaleString('fr-FR')} utilisateurs
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
