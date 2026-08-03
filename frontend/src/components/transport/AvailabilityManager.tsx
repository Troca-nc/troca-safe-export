'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Plus, Save, Trash2 } from 'lucide-react'

type WeeklySlot = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

type AvailabilityException = {
  exception_date: string
  is_unavailable: boolean
  start_time?: string | null
  end_time?: string | null
  reason?: string | null
}

const WEEKDAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

function createDefaultAvailability(): WeeklySlot[] {
  return WEEKDAYS.map((_, index) => ({
    day_of_week: index,
    start_time: index === 0 ? '00:00' : '08:00',
    end_time: index === 0 ? '00:00' : '18:00',
    is_active: index !== 0,
  }))
}

function normalizeSlot(slot: Partial<WeeklySlot>, day: number): WeeklySlot {
  return {
    day_of_week: day,
    start_time: slot.start_time || '08:00',
    end_time: slot.end_time || '18:00',
    is_active: Boolean(slot.is_active ?? true),
  }
}

export default function AvailabilityManager({
  title = 'Calendrier de disponibilit�s',
  description = 'D�finissez vos cr�neaux r�guliers et vos exceptions ponctuelles.',
  initialAvailability,
  initialExceptions,
  saveLabel = 'Sauvegarder la disponibilit�',
  onSave,
}: {
  title?: string
  description?: string
  initialAvailability?: WeeklySlot[]
  initialExceptions?: AvailabilityException[]
  saveLabel?: string
  onSave?: (payload: { availability: WeeklySlot[]; exceptions: AvailabilityException[] }) => Promise<void> | void
}) {
  const [availability, setAvailability] = useState<WeeklySlot[]>(
    () => {
      const source = initialAvailability?.length ? initialAvailability : createDefaultAvailability()
      return WEEKDAYS.map((_, index) => normalizeSlot(source.find((slot) => slot.day_of_week === index) || {}, index))
    }
  )
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(() => initialExceptions?.length ? initialExceptions : [])
  const [saving, setSaving] = useState(false)

  const activeCount = useMemo(() => availability.filter((slot) => slot.is_active).length, [availability])

  const updateAvailability = (day: number, patch: Partial<WeeklySlot>) => {
    setAvailability((current) =>
      current.map((slot) => (slot.day_of_week === day ? { ...slot, ...patch } : slot))
    )
  }

  const addException = () => {
    setExceptions((current) => [
      ...current,
      {
        exception_date: '',
        is_unavailable: true,
        start_time: '',
        end_time: '',
        reason: '',
      },
    ])
  }

  const updateException = (index: number, patch: Partial<AvailabilityException>) => {
    setExceptions((current) =>
      current.map((exception, currentIndex) => (currentIndex === index ? { ...exception, ...patch } : exception))
    )
  }

  const removeException = (index: number) => {
    setExceptions((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({
        availability,
        exceptions: exceptions.filter((entry) => Boolean(entry.exception_date)),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-lagon">{title}</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{description}</h3>
          <p className="mt-1 text-sm text-night/55">{activeCount} jour{activeCount > 1 ? 's' : ''} actifs</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
          <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
          Planning pro
        </div>
      </div>

      <div className="grid gap-3">
        {availability.map((slot) => (
          <div
            key={slot.day_of_week}
            className={`rounded-2xl border p-4 transition ${
              slot.is_active
                ? 'border-[#0A7EA4]/20 bg-nc-lagonLight'
                : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]/70'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-night">{WEEKDAYS[slot.day_of_week]}</p>
                <p className="text-xs text-night/55">
                  {slot.is_active ? `${slot.start_time} - ${slot.end_time}` : 'Ferm�'}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-night/60">
                <input
                  type="checkbox"
                  checked={slot.is_active}
                  onChange={(e) => updateAvailability(slot.day_of_week, { is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4]"
                />
                Actif
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-night/45">D�but</span>
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateAvailability(slot.day_of_week, { start_time: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Fin</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateAvailability(slot.day_of_week, { end_time: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-night">Exceptions</p>
            <p className="text-xs text-night/55">Ajoutez des fermetures ou des plages sp�ciales sur certaines dates.</p>
          </div>
          <button
            type="button"
            onClick={addException}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/5"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {exceptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)]/50 p-4 text-sm text-night/55">
              Aucune exception pour le moment.
            </div>
          ) : null}

          {exceptions.map((exception, index) => (
            <div key={`${exception.exception_date || 'exception'}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Date</span>
                  <input
                    type="date"
                    value={exception.exception_date}
                    onChange={(e) => updateException(index, { exception_date: e.target.value })}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Raison</span>
                  <input
                    type="text"
                    value={exception.reason || ''}
                    onChange={(e) => updateException(index, { reason: e.target.value })}
                    placeholder="Cong�s, maintenance, �v�nement..."
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-night/60">
                  <input
                    type="checkbox"
                    checked={exception.is_unavailable}
                    onChange={(e) => updateException(index, { is_unavailable: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4]"
                  />
                  Jour bloqu�
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-night/60">
                  <span className="text-xs uppercase tracking-[0.16em]">D�but</span>
                  <input
                    type="time"
                    value={exception.start_time || ''}
                    onChange={(e) => updateException(index, { start_time: e.target.value })}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-night/60">
                  <span className="text-xs uppercase tracking-[0.16em]">Fin</span>
                  <input
                    type="time"
                    value={exception.end_time || ''}
                    onChange={(e) => updateException(index, { end_time: e.target.value })}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeException(index)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onSave ? (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : saveLabel}
          </button>
        </div>
      ) : null}
    </section>
  )
}
