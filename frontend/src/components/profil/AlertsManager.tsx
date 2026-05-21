// src/app/alertes/page.tsx
// ── Page de gestion des alertes utilisateur ───────────────────────────────────

'use client'

import { useState } from 'react'
import { Bell, BellOff, Trash2, Pause, Play, Clock, Mail, RefreshCw } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { FREQUENCY_OPTIONS } from '@/types/alert.types'
import type { SearchAlert, AlertFrequency } from '@/types/alert.types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

// ── Carte alerte ──────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onDelete,
  onToggle,
  onFrequencyChange,
}: {
  alert:             SearchAlert
  onDelete:          (id: number) => void
  onToggle:          (id: number, active: boolean) => void
  onFrequencyChange: (id: number, freq: AlertFrequency) => void
}) {
  const [deleting,  setDeleting]  = useState(false)
  const [toggling,  setToggling]  = useState(false)
  const isActive = alert.status === 'active'

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'alerte "${alert.label}" ?`)) return
    setDeleting(true)
    await onDelete(alert.id)
  }

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(alert.id, !isActive)
    setToggling(false)
  }

  const freqLabel = FREQUENCY_OPTIONS.find(f => f.value === alert.frequency)?.label ?? alert.frequency

  // Reconstruit les filtres en URL params pour le lien "Voir les annonces"
  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(alert.filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString()

  return (
    <div className={`bg-white border rounded-2xl p-4 transition-all ${
      isActive ? 'border-night/8' : 'border-night/5 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icône statut */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isActive ? 'bg-coral/10 text-coral' : 'bg-sand text-night/30'
          }`}>
            {isActive ? <Bell size={16} /> : <BellOff size={16} />}
          </div>

          <div className="min-w-0">
            {/* Label */}
            <p className="font-medium text-sm text-night truncate">{alert.label}</p>

            {/* Filtres */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {alert.filters.categorie && (
                <span className="text-[10px] bg-sand text-night/60 px-2 py-0.5 rounded-full">
                  {alert.filters.categorie}
                </span>
              )}
              {alert.filters.commune && (
                <span className="text-[10px] bg-sand text-night/60 px-2 py-0.5 rounded-full">
                  📍 {alert.filters.commune}
                </span>
              )}
              {alert.filters.prix_max && (
                <span className="text-[10px] bg-sand text-night/60 px-2 py-0.5 rounded-full">
                  ≤ {alert.filters.prix_max.toLocaleString('fr-FR')} XPF
                </span>
              )}
            </div>

            {/* Méta */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-night/40">
              <span className="flex items-center gap-1">
                <Mail size={9} /> {freqLabel}
              </span>
              {alert.last_sent_at && (
                <span className="flex items-center gap-1">
                  <Clock size={9} />
                  Dernier envoi {format(parseISO(alert.last_sent_at), 'd MMM', { locale: fr })}
                </span>
              )}
              <Link
                href={`/annonces?${searchParams}`}
                className="text-coral hover:underline"
              >
                Voir les annonces →
              </Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Changement fréquence */}
          <select
            value={alert.frequency}
            onChange={e => onFrequencyChange(alert.id, e.target.value as AlertFrequency)}
            className="text-[10px] border border-night/10 rounded-lg px-1.5 py-1 bg-white text-night/60"
            aria-label="Fréquence de l'alerte"
          >
            {FREQUENCY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Pause / Reprendre */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={isActive ? 'Mettre en pause' : 'Reprendre'}
            className="p-1.5 text-night/40 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-40"
          >
            {toggling
              ? <RefreshCw size={14} className="animate-spin" />
              : isActive ? <Pause size={14} /> : <Play size={14} />
            }
          </button>

          {/* Supprimer */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Supprimer cette alerte"
            className="p-1.5 text-night/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
          >
            <Trash2 size={14} className={deleting ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AlertesPage() {
  const { alerts, loading, error, deleteAlert, updateAlert } = useAlerts()

  const handleDelete          = (id: number) => deleteAlert(id)
  const handleToggle          = (id: number, active: boolean) =>
    updateAlert(id, { status: active ? 'active' : 'paused' })
  const handleFrequencyChange = (id: number, frequency: AlertFrequency) =>
    updateAlert(id, { frequency })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-night">Mes alertes</h1>
          <p className="text-sm text-night/50 mt-1">
            Soyez notifié dès qu'une annonce correspond à vos critères
          </p>
        </div>
        {alerts.length > 0 && (
          <span className="text-xs text-night/40 bg-sand px-2.5 py-1 rounded-full">
            {alerts.length}/10
          </span>
        )}
      </div>

      {/* Chargement */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-night/8 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-sand rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-sand rounded w-1/2" />
                  <div className="h-3 bg-sand rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Liste */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onFrequencyChange={handleFrequencyChange}
            />
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && alerts.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 bg-sand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-night/20" />
          </div>
          <h2 className="font-semibold text-night mb-2">Aucune alerte</h2>
          <p className="text-sm text-night/50 mb-6">
            Sauvegardez une recherche pour être notifié dès qu'une nouvelle annonce correspond à vos critères.
          </p>
          <Link href="/annonces" className="btn-primary inline-flex">
            Parcourir les annonces
          </Link>
        </div>
      )}

      {/* Hint */}
      {!loading && alerts.length > 0 && (
        <p className="text-center text-xs text-night/35 mt-6 flex items-center justify-center gap-1">
          <Mail size={11} />
          Les alertes sont envoyées à votre adresse email principale
        </p>
      )}
    </div>
  )
}
