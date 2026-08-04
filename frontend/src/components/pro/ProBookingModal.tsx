'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, MessageSquareQuote, Send, Sparkles, X } from 'lucide-react'

import { proBookingsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { showToast } from '@/lib/toast'
import type { ProPublicBookingSettings, ProPublicBookingSlot } from '@/app/pro/publicStorefrontData'

type BookingService = NonNullable<ProPublicBookingSettings['services']>[number]

type BookingFormState = {
  requester_name: string
  requester_email: string
  requester_phone: string
  commune: string
  subject: string
  details: string
}

type BookingCalendarDay = {
  date: string
  is_available: boolean
  is_blocked: boolean
  slots: ProPublicBookingSlot[]
}

const INITIAL_STATE: BookingFormState = {
  requester_name: '',
  requester_email: '',
  requester_phone: '',
  commune: '',
  subject: '',
  details: '',
}

function formatSlot(slot: ProPublicBookingSlot) {
  const startsAt = new Date(slot.starts_at)
  const endsAt = new Date(slot.ends_at)
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(startsAt)
  const startTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt)
  const endTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(endsAt)

  return `${date} ï¿½ ${startTime} ï¿½ ${endTime}`
}

function toMonthKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map((part) => Number(part))
  if (!year || !month) return monthKey
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function dayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type ProBookingModalProps = {
  proId: string | number
  proName: string
  open: boolean
  onClose: () => void
  settings?: ProPublicBookingSettings | null
  onSent?: (payload: {
    proId: string | number
    proName: string
    slot: ProPublicBookingSlot
    request: BookingFormState
  }) => void
}

export default function ProBookingModal({
  proId,
  proName,
  open,
  onClose,
  settings,
  onSent,
}: ProBookingModalProps) {
  const { user } = useAuthStore()
  const [form, setForm] = useState<BookingFormState>(INITIAL_STATE)
  const [slots, setSlots] = useState<ProPublicBookingSlot[]>([])
  const [calendarDays, setCalendarDays] = useState<BookingCalendarDay[]>([])
  const [calendarMonth, setCalendarMonth] = useState(() => toMonthKey(new Date()))
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setSent(false)
    setForm({
      requester_name: [user?.prenom, user?.nom].filter(Boolean).join(' ').trim(),
      requester_email: user?.email || '',
      requester_phone: user?.telephone || '',
      commune: user?.commune_name || '',
      subject: settings?.services?.find((service) => service.is_active !== false)?.title || settings?.title || 'Prendre rendez-vous',
      details: '',
    })
    const firstService = settings?.services?.find((service) => service.is_active !== false)
    setSelectedServiceTitle(firstService?.title || '')
  }, [open, settings?.title, user?.commune_name, user?.email, user?.nom, user?.prenom, user?.telephone])

  useEffect(() => {
    if (!open) return
    let alive = true

    const loadCalendar = async () => {
      setLoadingSlots(true)
      try {
        const response = await proBookingsApi.getCalendar(proId, calendarMonth)
        const payload = response.data?.data || {}
        const nextSlots = Array.isArray(payload.slots) ? payload.slots : []
        const nextDays = Array.isArray(payload.days) ? payload.days : []
        if (!alive) return
        setSlots(nextSlots)
        setCalendarDays(nextDays)
        const nextSelectedDate = (() => {
          const current = selectedDate
          if (current && nextDays.some((day: BookingCalendarDay) => day.date === current && day.is_available)) {
            return current
          }
          const firstAvailable = nextDays.find((day: BookingCalendarDay) => day.is_available)
          return firstAvailable?.date || nextDays[0]?.date || ''
        })()
        setSelectedDate(nextSelectedDate)
        setSelectedSlotId((current) => {
          const currentVisibleSlots = nextSlots.filter((slot: ProPublicBookingSlot) => {
            const candidateDate = String(slot.starts_at).slice(0, 10)
            return !nextSelectedDate || candidateDate === nextSelectedDate
          })
          if (current && currentVisibleSlots.some((slot: ProPublicBookingSlot) => String(slot.id) === String(current))) {
            return current
          }
          return currentVisibleSlots[0] ? String(currentVisibleSlots[0].id) : nextSlots[0] ? String(nextSlots[0].id) : ''
        })
      } catch {
        if (!alive) return
        setSlots([])
        setCalendarDays([])
        setSelectedSlotId('')
        setSelectedDate('')
      } finally {
        if (alive) setLoadingSlots(false)
      }
    }

    void loadCalendar()
    return () => {
      alive = false
    }
  }, [open, proId, calendarMonth])

  const selectedSlot = useMemo(
    () => slots.find((slot) => String(slot.id) === String(selectedSlotId)) || null,
    [selectedSlotId, slots],
  )

  const visibleSlots = useMemo(
    () => (selectedDate ? slots.filter((slot) => String(slot.starts_at).slice(0, 10) === selectedDate) : slots),
    [selectedDate, slots],
  )

  const visibleServices = useMemo(
    () => (Array.isArray(settings?.services) ? settings.services : []).filter((service) => service.is_active !== false),
    [settings?.services],
  )

  const selectedService = useMemo(
    () => visibleServices.find((service) => service.title === selectedServiceTitle) || null,
    [selectedServiceTitle, visibleServices],
  )

  if (!open) return null

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError('Merci de choisir un crï¿½neau.')
      return
    }
    if (!form.requester_name.trim()) {
      setError('Votre nom est requis.')
      return
    }
    if (!form.requester_email.trim() || !form.requester_email.includes('@')) {
      setError('Un email valide est requis.')
      return
    }
    if (!form.subject.trim()) {
      setError('Le sujet du rendez-vous est requis.')
      return
    }

    setSending(true)
    setError('')
    try {
      const subject = selectedService?.title || form.subject.trim()
      await proBookingsApi.book(proId, {
        slot_id: Number(selectedSlot.id),
        service_title: selectedService?.title || null,
        service_price_xpf: selectedService?.price_xpf == null ? null : Number(selectedService.price_xpf),
        service_duration_minutes: selectedService?.duration_minutes == null ? null : Number(selectedService.duration_minutes),
        requester_name: form.requester_name.trim(),
        requester_email: form.requester_email.trim(),
        requester_phone: form.requester_phone.trim() || null,
        commune: form.commune.trim() || null,
        subject,
        details: form.details.trim() || null,
      })
      onSent?.({
        proId,
        proName,
        slot: selectedSlot,
        request: { ...form },
      })
      setSent(true)
      showToast({
        tone: 'success',
        title: 'Rendez-vous demandï¿½',
        message: `${proName} a reï¿½u votre demande. Vous pouvez suivre son ï¿½volution dans Mes rendez-vous.`,
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible denvoyer votre demande.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Rendez-vous non envoyï¿½',
        message,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-[var(--color-surface)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Rendez-vous en ligne</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">
              {settings?.title || 'Prendre rendez-vous'}
            </h2>
            <p className="mt-1 text-sm text-night/55">
              {settings?.subtitle || 'Rï¿½servez un crï¿½neau directement avec ce professionnel.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-night/45 transition hover:bg-sand hover:text-night"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-8">
            <FeedbackAlert tone="success" title="Demande envoyï¿½e !">
              Votre rendez-vous a bien ï¿½tï¿½ transmis ï¿½ {proName}. Suivez son statut depuis votre espace <strong>Mes rendez-vous</strong>.
            </FeedbackAlert>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
        <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
          <div className="border-b border-[var(--color-border)] px-6 py-6 lg:border-b-0 lg:border-r">
            <div className="space-y-4">
              {visibleServices.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-night">Service</p>
                  <div className="grid gap-2">
                    {visibleServices.map((service) => (
                      <label
                        key={service.title}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          selectedServiceTitle === service.title
                            ? 'border-[#0A7EA4] bg-nc-lagonLight/60'
                            : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-background-secondary)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="booking-service"
                          checked={selectedServiceTitle === service.title}
                          onChange={() => {
                            setSelectedServiceTitle(service.title)
                            setForm((current) => ({
                              ...current,
                              subject: service.title,
                            }))
                          }}
                          className="mt-1 h-4 w-4 border-[var(--color-border)] text-[#0A7EA4] focus:ring-[#0A7EA4]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-night">{service.title}</span>
                          <span className="mt-1 block text-xs text-night/55">
                            {service.duration_minutes} min{service.price_xpf != null ? ` ï¿½ ${Number(service.price_xpf).toLocaleString('fr-FR')} XPF` : ''}
                          </span>
                          {service.description ? (
                            <span className="mt-1 block text-xs leading-relaxed text-night/60">{service.description}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Votre nom *</span>
                <input
                    value={form.requester_name}
                    onChange={(event) => setForm((current) => ({ ...current, requester_name: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="Votre nom"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Votre email *</span>
                    <input
                      type="email"
                      value={form.requester_email}
                      onChange={(event) => setForm((current) => ({ ...current, requester_email: event.target.value }))}
                      className="input w-full rounded-2xl"
                      placeholder="vous@email.com"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Tï¿½lï¿½phone</span>
                    <input
                      value={form.requester_phone}
                      onChange={(event) => setForm((current) => ({ ...current, requester_phone: event.target.value }))}
                      className="input w-full rounded-2xl"
                      placeholder="XX XX XX XX"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Commune</span>
                  <input
                    value={form.commune}
                    onChange={(event) => setForm((current) => ({ ...current, commune: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="NoumÃ©a, DumbÃ©a..."
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Objet du rendez-vous *</span>
                  <input
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder={selectedService?.title || 'Ex. devis, dï¿½pannage, visite...'}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Prï¿½cisions</span>
                  <textarea
                    value={form.details}
                    onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                    rows={4}
                    className="input w-full rounded-2xl py-3"
                    placeholder="Expliquez votre besoin, les contraintes, les documents ï¿½ prï¿½parer..."
                  />
                </label>

                {error ? (
                  <FeedbackAlert tone="error" title="Envoi impossible">
                    {error}
                  </FeedbackAlert>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sending || !selectedSlot}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                    Envoyer la demande
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-4 px-6 py-6">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">Calendrier</p>
                    <p className="mt-1 text-sm text-night/60">{formatMonthLabel(calendarMonth)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const current = new Date(`${calendarMonth}-01T00:00:00`)
                        current.setMonth(current.getMonth() - 1)
                        setCalendarMonth(toMonthKey(current))
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-night/70"
                      aria-label="Mois prï¿½cï¿½dent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = new Date(`${calendarMonth}-01T00:00:00`)
                        current.setMonth(current.getMonth() + 1)
                        setCalendarMonth(toMonthKey(current))
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-night/70"
                      aria-label="Mois suivant"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-night/40">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const active = selectedDate === day.date
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day.date)
                          setSelectedSlotId(day.slots[0] ? String(day.slots[0].id) : '')
                        }}
                        className={`min-h-[64px] rounded-2xl border px-2 py-2 text-left transition ${
                          active
                            ? 'border-[#0A7EA4] bg-nc-lagonLight text-[#0A7EA4]'
                            : day.is_blocked
                              ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                              : day.is_available
                                ? 'border-[var(--color-border)] bg-white text-night hover:border-[#0A7EA4]/30'
                                : 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                        }`}
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em]">
                          {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(`${day.date}T00:00:00`))}
                        </span>
                        <span className="mt-1 block text-lg font-bold">
                          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(new Date(`${day.date}T00:00:00`))}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em]">
                          {day.is_blocked ? 'Bloquï¿½' : day.slots.length ? `${day.slots.length} crï¿½neau${day.slots.length > 1 ? 'x' : ''}` : 'Aucun'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">Crï¿½neaux disponibles</p>
                <p className="mt-1 text-sm text-night/60">
                  {loadingSlots ? 'Chargement des crï¿½neaux...' : 'Choisissez lhoraire qui vous convient le mieux.'}
                </p>
                <div className="mt-4 space-y-2">
                  {visibleSlots.length ? (
                    visibleSlots.map((slot) => {
                      const active = String(selectedSlotId) === String(slot.id)
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(String(slot.id))}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            active
                              ? 'border-[#0A7EA4] bg-nc-lagonLight text-[#0A7EA4]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-night/70 hover:border-[#0A7EA4]/30'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{slot.label || formatSlot(slot)}</span>
                          <span className="mt-1 block text-xs opacity-80">{formatSlot(slot)}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-night/55">
                      {selectedDate
                        ? 'Aucun crï¿½neau disponible pour ce jour.'
                        : 'Aucun crï¿½neau nest encore publiï¿½. Le professionnel peut en ajouter depuis son espace.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,_rgba(214,240,246,0.55),_rgba(255,255,255,0.95))] p-4 text-sm text-night/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nc-emeraude">Rï¿½capitulatif</p>
                <div className="mt-3 space-y-2">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>
                      {settings?.location_label || 'Lieu du rendez-vous'} : {settings?.location_text || 'ï¿½ confirmer avec le professionnel'}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>{selectedSlot ? formatSlot(selectedSlot) : 'Choisissez un crï¿½neau pour continuer.'}</span>
                  </p>
                  {settings?.instructions ? (
                    <p className="flex items-start gap-2">
                      <MessageSquareQuote className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                      <span>{settings.instructions}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
