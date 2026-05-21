// src/components/alertes/SaveSearchAlert.tsx
// ── Bouton "Sauvegarder cette recherche" affiché sur la page des résultats ────

'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Check, Loader2, ChevronDown } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { FREQUENCY_OPTIONS, buildAlertLabel } from '@/types/alert.types'
import type { AlertFilters, AlertFrequency } from '@/types/alert.types'

interface SaveSearchAlertProps {
  filters:    AlertFilters
  className?: string
}

export default function SaveSearchAlert({ filters, className = '' }: SaveSearchAlertProps) {
  const { createAlert } = useAlerts()

  const [open,      setOpen]      = useState(false)
  const [frequency, setFrequency] = useState<AlertFrequency>('daily')
  const [loading,   setLoading]   = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [resetTimer, setResetTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer) clearTimeout(resetTimer)
    }
  }, [resetTimer])

  const label = buildAlertLabel(filters)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    const ok = await createAlert({ filters, frequency })
    setLoading(false)
    if (ok) {
      setSaved(true)
      setOpen(false)
      if (resetTimer) clearTimeout(resetTimer)
      setResetTimer(setTimeout(() => setSaved(false), 4000))
    } else {
      setError('Impossible de créer l\'alerte. Réessayez.')
    }
  }

  if (saved) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm ${className}`}>
        <Check size={15} />
        Alerte créée — vous serez notifié par email
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border border-night/15 rounded-xl text-sm font-medium hover:border-coral/40 hover:bg-coral/5 hover:text-coral transition-all"
      >
        <Bell size={15} />
        Créer une alerte
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-night/10 rounded-2xl shadow-modal z-20 p-4 animate-scale-in">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-coral shrink-0" />
              <div>
                <p className="font-medium text-sm text-night">Alerte email</p>
                <p className="text-[11px] text-night/50 truncate">"{label}"</p>
              </div>
            </div>

            {/* Fréquence */}
            <p className="text-xs text-night/50 mb-2">Fréquence des notifications</p>
            <div className="flex flex-col gap-1.5 mb-4">
              {FREQUENCY_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    frequency === opt.value
                      ? 'border-coral bg-coral/8'
                      : 'border-night/10 hover:bg-sand'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    checked={frequency === opt.value}
                    onChange={() => setFrequency(opt.value)}
                    className="accent-coral"
                  />
                  <div>
                    <p className="text-xs font-medium text-night">{opt.label}</p>
                    <p className="text-[10px] text-night/50">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost flex-1 text-xs py-2"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="btn-primary flex-1 text-xs py-2 justify-center disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 size={13} className="animate-spin" /> Création…</>
                  : <><Bell size={13} /> Activer l'alerte</>
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
