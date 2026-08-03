'use client'

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

type AvailabilityCalendarProps = {
  month?: number
  year?: number
  availableDates?: string[]
  unavailableDates?: string[]
  title?: string
  description?: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function formatMonthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1))
  )
}

function normalizeSet(values?: string[]) {
  return new Set((values || []).map((value) => String(value)))
}

export default function AvailabilityCalendar({
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  availableDates = [],
  unavailableDates = [],
  title = 'Calendrier de disponibilit�s',
  description = 'Jours disponibles et indisponibles sur le mois s�lectionn�.',
}: AvailabilityCalendarProps) {
  const availableSet = normalizeSet(availableDates)
  const unavailableSet = normalizeSet(unavailableDates)
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const leading = Array.from({ length: firstDay }, (_, index) => index)
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-lagon">{title}</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{formatMonthLabel(month, year)}</h3>
          <p className="mt-1 text-sm text-night/55">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
          <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
          Disponibilit�s
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((label) => (
          <span key={label} className="py-1">{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {leading.map((index) => (
          <div key={`empty-${index}`} className="h-11 rounded-2xl bg-transparent" />
        ))}
        {days.map((day) => {
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isAvailable = availableSet.has(iso)
          const isUnavailable = unavailableSet.has(iso)
          return (
            <div
              key={iso}
              className={`flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                isAvailable
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : isUnavailable
                    ? 'border-slate-200 bg-slate-100 text-slate-500'
                    : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] text-night/70'
              }`}
              title={iso}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-night/55">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Disponible
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-500">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Indisponible
        </span>
      </div>
    </section>
  )
}

export function AvailabilityMonthNav({
  month,
  year,
  onPrevious,
  onNext,
}: {
  month: number
  year: number
  onPrevious?: () => void
  onNext?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-night/70 transition hover:bg-[var(--color-background-secondary)]"
        aria-label="Mois pr�c�dent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-night">{formatMonthLabel(month, year)}</span>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-night/70 transition hover:bg-[var(--color-background-secondary)]"
        aria-label="Mois suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
