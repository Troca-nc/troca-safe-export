// src/app/admin/signalements/page.tsx
// ── Gestion des signalements avec modération en un clic ───────────────────────

'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Shield, Trash2, BellOff, Eye } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminSignalements, useModerationAction } from '@/hooks/useAdmin'
import type {
  AdminSignalement, TypeSignalement,
  UrgenceSignalement, SignalementsFilters,
} from '@/types/admin.types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Helpers UI ────────────────────────────────────────────────────────────────

const URGENCE_STYLE: Record<UrgenceSignalement, string> = {
  haute:   'bg-red-50 text-red-600 border-red-200',
  moyenne: 'bg-amber-50 text-amber-700 border-amber-200',
  basse:   'bg-sand text-night/50 border-night/10',
}

const TYPE_STYLE: Record<TypeSignalement, string> = {
  arnaque:  'bg-amber-50 text-amber-700',
  spam:     'bg-sand text-night/50',
  illicite: 'bg-red-50 text-red-600',
  haineux:  'bg-purple-50 text-purple-700',
  autre:    'bg-blue-50 text-blue-600',
}

const URGENCE_BORDER: Record<UrgenceSignalement, string> = {
  haute:   'border-l-red-500',
  moyenne: 'border-l-amber-400',
  basse:   'border-l-night/20',
}

function timeAgo(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: fr })
}

// ── Carte signalement ─────────────────────────────────────────────────────────

function SignalementCard({
  s,
  onAction,
}: {
  s: AdminSignalement
  onAction: (id: number, action: string, raison?: string) => void
}) {
  const [expanded, setExpanded] = useState(s.urgence === 'haute')
  const [raison, setRaison]     = useState('')
  const [pending, setPending]   = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setPending(action)
    await onAction(s.id, action, raison)
    setPending(null)
  }

  return (
    <div className={`bg-white border border-night/8 border-l-4 ${URGENCE_BORDER[s.urgence]} rounded-2xl overflow-hidden mb-3`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${URGENCE_STYLE[s.urgence]}`}>
            {s.urgence === 'haute' ? '⚡ Urgent' : s.urgence === 'moyenne' ? 'Modéré' : 'Faible'}
          </span>
          <div>
            <p className="font-medium text-sm text-night">
              #{s.annonce.id} — {s.annonce.titre}
            </p>
            <p className="text-xs text-night/50">
              {s.nb_reporters} signalement{s.nb_reporters > 1 ? 's' : ''} · {timeAgo(s.created_at)}
              {' · '}par <span className="font-medium">{s.user_signalé.nom}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLE[s.type]}`}>
            {s.type}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-night/40 hover:text-night rounded transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-night/8 pt-3 bg-sand/30">
          <p className="text-sm text-night/70 mb-3">"{s.description}"</p>

          {/* Reporters */}
          {s.reporters.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {s.reporters.map(r => (
                <span key={r.id} className="text-[10px] bg-white border border-night/10 rounded-full px-2 py-0.5 text-night/50">
                  {r.nom}
                </span>
              ))}
            </div>
          )}

          {/* Raison optionnelle */}
          <input
            type="text"
            value={raison}
            onChange={e => setRaison(e.target.value)}
            placeholder="Raison de la décision (optionnel)"
            className="input text-xs w-full mb-3"
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!!pending}
              onClick={() => handleAction('supprimer_annonce')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <Trash2 size={12} />
              {pending === 'supprimer_annonce' ? 'Suppression…' : 'Supprimer l\'annonce'}
            </button>
            <button
              disabled={!!pending}
              onClick={() => handleAction('suspendre_user')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <Shield size={12} />
              {pending === 'suspendre_user' ? 'Suspension…' : 'Suspendre l\'utilisateur'}
            </button>
            <button
              disabled={!!pending}
              onClick={() => handleAction('avertir')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-night/15 text-night/60 hover:bg-sand transition-all disabled:opacity-50"
            >
              <Eye size={12} />
              Avertir seulement
            </button>
            <button
              disabled={!!pending}
              onClick={() => handleAction('ignorer')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-night/15 text-night/40 hover:bg-sand transition-all disabled:opacity-50"
            >
              <BellOff size={12} />
              Ignorer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

const FILTRES_TYPE = ['tous', 'arnaque', 'spam', 'illicite', 'haineux', 'autre'] as const
const FILTRES_URGENCE = ['toutes', 'haute', 'moyenne', 'basse'] as const

export default function AdminSignalementsPage() {
  const [filters, setFilters] = useState<SignalementsFilters>({ traite: false })
  const { data, loading, refetch } = useAdminSignalements(filters)
  const { executeAction } = useModerationAction()

  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({})

  const handleAction = async (signalementId: number, action: string, raison?: string) => {
    const result = await executeAction({
      signalement_id: signalementId,
      action: action as Parameters<typeof executeAction>[0]['action'],
      raison,
    })
    if (result?.success) {
      setFeedbacks(f => ({ ...f, [signalementId]: result.message }))
      refetch()
    }
  }

  return (
    <AdminLayout>
      {/* Topbar */}
      <div className="bg-white border-b border-night/8 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-night">Signalements</h1>
          {(data?.en_attente ?? 0) > 0 && (
            <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-0.5">
              {data?.en_attente} en attente
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-night/50 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.traite ?? false}
              onChange={e => setFilters(f => ({ ...f, traite: e.target.checked ? undefined : false }))}
              className="rounded"
            />
            Inclure traités
          </label>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex gap-1">
            {FILTRES_TYPE.map(t => (
              <button
                key={t}
                onClick={() => setFilters(f => ({ ...f, type: t === 'tous' ? undefined : t as TypeSignalement }))}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  (filters.type ?? 'tous') === t
                    ? 'bg-coral/10 text-coral border-coral/30 font-medium'
                    : 'border-night/10 text-night/50 hover:bg-sand'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {FILTRES_URGENCE.map(u => (
              <button
                key={u}
                onClick={() => setFilters(f => ({ ...f, urgence: u === 'toutes' ? undefined : u as UrgenceSignalement }))}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  (filters.urgence ?? 'toutes') === u
                    ? 'bg-coral/10 text-coral border-coral/30 font-medium'
                    : 'border-night/10 text-night/50 hover:bg-sand'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading && (
          <div className="text-center py-12 text-night/40">
            <AlertTriangle size={24} className="mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Chargement des signalements…</p>
          </div>
        )}

        {!loading && data?.data.length === 0 && (
          <div className="text-center py-16 text-night/40">
            <Shield size={32} className="mx-auto mb-3 text-emerald-400" />
            <p className="font-medium text-emerald-600">Aucun signalement en attente</p>
            <p className="text-xs mt-1">La Plateforme est propre !</p>
          </div>
        )}

        {!loading && (data?.data ?? []).map(s => (
          <SignalementCard
            key={s.id}
            s={s}
            onAction={handleAction}
          />
        ))}

        {/* Pagination indicative */}
        {(data?.total ?? 0) > (data?.data.length ?? 0) && (
          <p className="text-center text-xs text-night/40 mt-4 flex items-center justify-center gap-1">
            <Clock size={12} />
            {data?.total} signalements au total — affichage des plus récents
          </p>
        )}
      </div>
    </AdminLayout>
  )
}
