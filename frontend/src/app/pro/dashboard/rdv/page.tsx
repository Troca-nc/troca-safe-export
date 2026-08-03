'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, Clock3, Loader2, MessageCircle, Plus, Save, Trash2 } from 'lucide-react'

import FeedbackAlert from '@/components/ui/FeedbackAlert'
import RdvBookingCard, { type RdvBookingItem } from '@/components/pro/RdvBookingCard'
import { proBookingsApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import type { ProPublicBookingSettings, ProPublicBookingSlot } from '@/app/pro/publicStorefrontData'

type DashboardData = {
  settings: ProPublicBookingSettings
  slots: ProPublicBookingSlot[]
  bookings: RdvBookingItem[]
}

type BookingException = {
  id: number | string
  exception_date: string
  is_unavailable: boolean
  reason?: string | null
}

type SettingsForm = ProPublicBookingSettings

type SlotForm = {
  starts_at: string
  ends_at: string
  label: string
}

const DEFAULT_SETTINGS: SettingsForm = {
  is_enabled: false,
  title: 'Prendre rendez-vous',
  subtitle: 'R�servez un cr�neau directement avec ce professionnel.',
  location_label: 'Lieu du rendez-vous',
  location_text: '',
  instructions: '',
  slot_duration_minutes: 30,
  advance_notice_hours: 24,
  max_days_ahead: 30,
  services: [],
  weekly_hours: [],
}

const DEFAULT_SLOT: SlotForm = {
  starts_at: '',
  ends_at: '',
  label: '',
}

const WEEKDAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function createDefaultService() {
  return {
    title: '',
    duration_minutes: 30,
    price_xpf: null as number | null,
    description: '',
    is_active: true,
  }
}

function createDefaultWeeklyHour(dayIndex: number) {
  return {
    day_index: dayIndex,
    label: WEEKDAY_LABELS[dayIndex] || `Jour ${dayIndex + 1}`,
    is_open: dayIndex >= 0 && dayIndex <= 4,
    start_time: '08:00',
    end_time: '17:00',
  }
}

function toLocalDatetimeInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSlot(slot: Pick<ProPublicBookingSlot, 'starts_at'> & { ends_at?: string | null }) {
  const startsAt = new Date(slot.starts_at)
  const endsAt = slot.ends_at ? new Date(slot.ends_at) : null
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt)
  const endTime = endsAt
    ? new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(endsAt)
    : null
  return `${date} � ${endTime || '...'}`
}

export default function ProDashboardRdvPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingSlot, setSavingSlot] = useState(false)
  const [slotDeletingId, setSlotDeletingId] = useState<string | number | null>(null)
  const [savingException, setSavingException] = useState(false)
  const [exceptionDeletingId, setExceptionDeletingId] = useState<string | number | null>(null)
  const [error, setError] = useState('')
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(DEFAULT_SETTINGS)
  const [slotForm, setSlotForm] = useState<SlotForm>(DEFAULT_SLOT)
  const [exceptions, setExceptions] = useState<BookingException[]>([])
  const [exceptionForm, setExceptionForm] = useState({
    exception_date: '',
    reason: '',
    is_unavailable: true,
  })

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const [response, exceptionsResponse] = await Promise.all([
        proBookingsApi.getDashboard(),
        proBookingsApi.getExceptions(),
      ])
      const payload = response.data?.data || {}
      const nextData: DashboardData = {
        settings: payload.settings || DEFAULT_SETTINGS,
        slots: Array.isArray(payload.slots) ? payload.slots : [],
        bookings: Array.isArray(payload.bookings) ? payload.bookings : [],
      }
      setData(nextData)
      setExceptions(Array.isArray(exceptionsResponse.data?.data) ? exceptionsResponse.data.data : [])
      setSettingsForm({
        ...DEFAULT_SETTINGS,
        ...nextData.settings,
        services: Array.isArray(nextData.settings?.services) ? nextData.settings.services : [],
        weekly_hours: Array.isArray(nextData.settings?.weekly_hours) ? nextData.settings.weekly_hours : [],
      })
    } catch (err: any) {
      setData(null)
      setError(err?.response?.data?.error || 'Impossible de charger les rendez-vous.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const stats = useMemo(() => {
    const bookings = data?.bookings ?? []
    const slots = data?.slots ?? []
    return {
      slots: slots.length,
      pending: bookings.filter((booking) => booking.status === 'pending').length,
      confirmed: bookings.filter((booking) => ['confirmed', 'accepted', 'auto_confirmed'].includes(String(booking.status).toLowerCase())).length,
      completed: bookings.filter((booking) => String(booking.status).toLowerCase() === 'completed').length,
    }
  }, [data])

  const todayBookings = useMemo(() => {
    const todayKey = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Pacific/Noumea',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    return (data?.bookings ?? [])
      .filter((booking) => {
        const bookingKey = new Intl.DateTimeFormat('fr-CA', {
          timeZone: 'Pacific/Noumea',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(booking.starts_at))
        return bookingKey === todayKey
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [data])

  const nextReminder = useMemo(() => {
    const bookings = (data?.bookings ?? [])
      .filter((booking) => ['pending', 'confirmed', 'accepted', 'auto_confirmed'].includes(String(booking.status).toLowerCase()))
      .filter((booking) => new Date(booking.starts_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

    const target = bookings[0]
    if (!target) return null

    const startsAt = new Date(target.starts_at)
    const diffHours = (startsAt.getTime() - Date.now()) / (1000 * 60 * 60)
    const reminderType = diffHours <= 2.5
      ? 'H-2'
      : diffHours <= 24.5
        ? 'J-1'
        : null

    if (!reminderType) {
      return {
        title: 'Prochain rendez-vous',
        subtitle: `${target.requester_name} � ${formatSlot(target)}`,
        href: '/mes-rdv',
        tone: 'bg-nc-lagonLight text-nc-lagon',
      }
    }

    const sentAt = reminderType === 'H-2' ? target.reminder_2h_sent_at : target.reminder_24h_sent_at
    const label = sentAt ? `${reminderType} envoy�` : `${reminderType} � venir`

    return {
      title: `Prochain rappel ${reminderType}`,
      subtitle: `${target.requester_name} � ${formatSlot(target)}`,
      href: '/mes-rdv',
      tone: sentAt ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      label,
    }
  }, [data])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setError('')
    try {
      const response = await proBookingsApi.updateSettings({
        ...settingsForm,
        services: (settingsForm.services || [])
          .map((service) => ({
            title: String(service.title || '').trim(),
            duration_minutes: Number(service.duration_minutes || 30),
            price_xpf: service.price_xpf == null ? null : Number(service.price_xpf),
            description: String(service.description || '').trim() || null,
            is_active: service.is_active !== false,
          }))
          .filter((service) => service.title.length > 0),
        weekly_hours: (settingsForm.weekly_hours || [])
          .map((entry, index) => ({
            day_index: Number(entry.day_index ?? index),
            label: String(entry.label || WEEKDAY_LABELS[index] || '').trim() || WEEKDAY_LABELS[index] || `Jour ${index + 1}`,
            is_open: entry.is_open !== false,
            start_time: String(entry.start_time || '08:00'),
            end_time: String(entry.end_time || '17:00'),
          }))
          .filter((entry) => Number.isInteger(entry.day_index)),
        location_text: settingsForm.location_text?.trim() || null,
        instructions: settingsForm.instructions?.trim() || null,
      })
      const nextSettings = response.data?.data || settingsForm
      setSettingsForm({
        ...DEFAULT_SETTINGS,
        ...nextSettings,
      })
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'R�glages enregistr�s',
        message: 'Votre prise de rendez-vous est � jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible denregistrer les r�glages.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'R�glages non enregistr�s',
        message,
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleCreateSlot = async () => {
    if (!slotForm.starts_at || !slotForm.ends_at) {
      setError('Merci de renseigner un cr�neau complet.')
      return
    }

    setSavingSlot(true)
    setError('')
    try {
      await proBookingsApi.createSlot({
        starts_at: new Date(slotForm.starts_at).toISOString(),
        ends_at: new Date(slotForm.ends_at).toISOString(),
        label: slotForm.label.trim() || null,
      })
      setSlotForm(DEFAULT_SLOT)
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'Cr�neau publi�',
        message: 'Les visiteurs peuvent d�sormais r�server ce cr�neau.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de cr�er ce cr�neau.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Cr�neau non cr��',
        message,
      })
    } finally {
      setSavingSlot(false)
    }
  }

  const handleDeleteSlot = async (slotId: string | number) => {
    setSlotDeletingId(slotId)
    setError('')
    try {
      await proBookingsApi.deleteSlot(slotId)
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'Cr�neau supprim�',
        message: 'Le cr�neau a �t� retir� de la vitrine.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de supprimer ce cr�neau.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Cr�neau non supprim�',
        message,
      })
    } finally {
      setSlotDeletingId(null)
    }
  }

  const handleAddException = async () => {
    if (!exceptionForm.exception_date) {
      setError('Merci de choisir une date dindisponibilit�.')
      return
    }

    setSavingException(true)
    setError('')
    try {
      await proBookingsApi.createException({
        exception_date: exceptionForm.exception_date,
        reason: exceptionForm.reason.trim() || null,
        is_unavailable: exceptionForm.is_unavailable,
      })
      setExceptionForm({
        exception_date: '',
        reason: '',
        is_unavailable: true,
      })
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'Indisponibilit� ajout�e',
        message: 'Le calendrier public a �t� mis � jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de cr�er cette exception.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Exception non ajout�e',
        message,
      })
    } finally {
      setSavingException(false)
    }
  }

  const handleDeleteException = async (exceptionId: string | number) => {
    setExceptionDeletingId(exceptionId)
    setError('')
    try {
      await proBookingsApi.deleteException(exceptionId)
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'Indisponibilit� supprim�e',
        message: 'Le cr�neau redeviendra publiquement r�servable.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de supprimer cette indisponibilit�.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Suppression impossible',
        message,
      })
    } finally {
      setExceptionDeletingId(null)
    }
  }

  const handleAddService = () => {
    setSettingsForm((current) => ({
      ...current,
      services: [...(current.services || []), createDefaultService()],
    }))
  }

  const handleUpdateService = (index: number, patch: Partial<NonNullable<SettingsForm['services']>[number]>) => {
    setSettingsForm((current) => ({
      ...current,
      services: (current.services || []).map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service)),
    }))
  }

  const handleRemoveService = (index: number) => {
    setSettingsForm((current) => ({
      ...current,
      services: (current.services || []).filter((_, serviceIndex) => serviceIndex !== index),
    }))
  }

  const handleUpdateWeeklyHour = (dayIndex: number, patch: Partial<NonNullable<SettingsForm['weekly_hours']>[number]>) => {
    setSettingsForm((current) => {
      const currentHours = Array.isArray(current.weekly_hours) ? [...current.weekly_hours] : []
      const existingIndex = currentHours.findIndex((entry) => Number(entry.day_index) === dayIndex)
      const base = existingIndex >= 0
        ? currentHours[existingIndex]
        : createDefaultWeeklyHour(dayIndex)
      const next = { ...base, day_index: dayIndex, ...patch }
      if (existingIndex >= 0) {
        currentHours[existingIndex] = next
      } else {
        currentHours.push(next)
      }
      return {
        ...current,
        weekly_hours: currentHours.sort((a, b) => Number(a.day_index) - Number(b.day_index)),
      }
    })
  }

  const handleBookingAction = async (bookingId: string | number, action: 'confirm' | 'decline' | 'cancel') => {
    setError('')
    try {
      if (action === 'confirm') await proBookingsApi.confirm(bookingId)
      if (action === 'decline') await proBookingsApi.decline(bookingId)
      if (action === 'cancel') await proBookingsApi.cancel(bookingId)
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'Rendez-vous actualis�',
        message: 'La r�servation a �t� mise � jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de mettre � jour cette r�servation.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Action impossible',
        message,
      })
    }
  }

  const handleContact = (booking: RdvBookingItem) => {
    const partnerId = booking.role === 'pro' ? booking.requester.id : booking.pro.id
    if (!partnerId) return
    window.location.assign(`/messages?user=${partnerId}`)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Rendez-vous en ligne</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">G�rez vos cr�neaux et vos demandes</h1>
            <p className="mt-2 text-sm text-night/60">
              Activez la r�servation en ligne, publiez vos cr�neaux et traitez les demandes re�ues depuis votre vitrine.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0A7EA4]/15 bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-[#0A7EA4]">
            <CalendarDays className="h-4 w-4" />
            {stats.slots} cr�neau{stats.slots > 1 ? 'x' : ''} publi�{stats.slots > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {error ? (
        <FeedbackAlert tone="error" title="Alerte">
          {error}
        </FeedbackAlert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">Cr�neaux publi�s</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.slots}</p>
        </article>
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">En attente</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.pending}</p>
        </article>
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">Confirm�s</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.confirmed}</p>
        </article>
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">Termin�s</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.completed}</p>
        </article>
      </section>

      {todayBookings.length ? (
        <section className="rounded-[2rem] border border-[#0A7EA4]/15 bg-[linear-gradient(135deg,_rgba(214,240,246,0.72),_rgba(255,255,255,0.96))] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Aujourdhui</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Votre timeline du jour</h2>
              <p className="mt-1 text-sm text-night/60">Les rendez-vous � venir aujourdhui, class�s par heure.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-1.5 text-sm font-semibold text-[#0A7EA4] shadow-sm">
              <Clock3 className="h-4 w-4" />
              {todayBookings.length} rendez-vous
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {todayBookings.map((booking) => {
              const status = String(booking.status || '').toLowerCase()
              const isPending = status === 'pending'
              const isCompleted = status === 'completed'
              const isFuture = new Date(booking.starts_at).getTime() > Date.now()

              return (
                <article key={booking.id} className="rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                        {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(booking.starts_at))}
                      </p>
                      <h3 className="mt-1 font-semibold text-night">{booking.subject}</h3>
                      <p className="mt-1 text-sm text-night/60">
                        {booking.role === 'client' ? booking.pro.display_name : booking.requester_name}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#0A7EA4]/10 px-3 py-1 text-xs font-semibold text-[#0A7EA4]">
                      {isPending ? 'En attente' : isCompleted ? 'Termin�' : booking.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-night/65">
                    {booking.commune || booking.pro.pro_commune || 'Nouvelle-Cal�donie'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.role === 'pro' && isPending ? (
                      <button
                        type="button"
                        onClick={() => void handleBookingAction(booking.id, 'confirm')}
                        className="rounded-2xl bg-[#0A7EA4] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#065f7a]"
                      >
                        Confirmer
                      </button>
                    ) : null}
                    {booking.role === 'pro' && isPending ? (
                      <button
                        type="button"
                        onClick={() => void handleBookingAction(booking.id, 'decline')}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Refuser
                      </button>
                    ) : null}
                    {booking.role === 'client' && isFuture && !['cancelled', 'declined', 'completed'].includes(status) ? (
                      <button
                        type="button"
                        onClick={() => void handleBookingAction(booking.id, 'cancel')}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        Annuler
                      </button>
                    ) : null}
                    {booking.role === 'client' && isCompleted ? (
                      <button
                        type="button"
                        onClick={() => window.location.assign(`/pro/${booking.pro.id}?tab=avis&review_booking=${booking.id}`)}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Laisser un avis
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {nextReminder ? (
        <section className="rounded-[2rem] border border-[#0A7EA4]/15 bg-[linear-gradient(135deg,_rgba(214,240,246,0.75),_rgba(255,255,255,0.95))] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0A7EA4] shadow-sm">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Prochain rappel</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">{nextReminder.title}</h2>
                <p className="mt-2 text-sm text-night/65">{nextReminder.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {'label' in nextReminder && nextReminder.label ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${nextReminder.tone}`}>
                  {nextReminder.label}
                </span>
              ) : null}
              <Link href={nextReminder.href} className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]">
                Voir mes rendez-vous
                <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">R�glages</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Configurer la prise de rendez-vous</h2>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3">
              <input
                type="checkbox"
                checked={settingsForm.is_enabled}
                onChange={(event) => setSettingsForm((current) => ({ ...current, is_enabled: event.target.checked }))}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4] focus:ring-[#0A7EA4]/20"
              />
              <span>
                <span className="block text-sm font-semibold text-night">Activer la r�servation en ligne</span>
                <span className="mt-1 block text-xs text-night/55">
                  Vos visiteurs pourront r�server un cr�neau visible depuis votre vitrine.
                </span>
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Titre de la r�servation</span>
                <input
                  value={settingsForm.title}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, title: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Prendre rendez-vous"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Sous-titre</span>
                <input
                  value={settingsForm.subtitle}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, subtitle: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="R�servez un cr�neau directement..."
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Libell� du lieu</span>
                <input
                  value={settingsForm.location_label}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, location_label: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Lieu du rendez-vous"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Lieu textuel</span>
                <input
                  value={settingsForm.location_text || ''}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, location_text: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="� l'atelier / au bureau / sur site"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Instructions</span>
              <textarea
                value={settingsForm.instructions || ''}
                onChange={(event) => setSettingsForm((current) => ({ ...current, instructions: event.target.value }))}
                rows={4}
                className="input w-full rounded-2xl py-3"
                placeholder="Ajoutez les documents � pr�parer, les consignes, le stationnement..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Dur�e d'un cr�neau (min)</span>
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={settingsForm.slot_duration_minutes}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, slot_duration_minutes: Number(event.target.value) }))}
                  className="input w-full rounded-2xl"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Pr�venance min. (h)</span>
                <input
                  type="number"
                  min={0}
                  max={168}
                  value={settingsForm.advance_notice_hours}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, advance_notice_hours: Number(event.target.value) }))}
                  className="input w-full rounded-2xl"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Jours max. � l'avance</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settingsForm.max_days_ahead}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, max_days_ahead: Number(event.target.value) }))}
                  className="input w-full rounded-2xl"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-night">Services r�servable</p>
                  <p className="mt-1 text-xs text-night/55">Ajoutez vos prestations pour guider le client vers le bon cr�neau.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter un service
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(Array.isArray(settingsForm.services) ? settingsForm.services : []).length ? (
                  (Array.isArray(settingsForm.services) ? settingsForm.services : []).map((service, index) => (
                    <div key={`${service.title || 'service'}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Titre</span>
                          <input
                            value={service.title || ''}
                            onChange={(event) => handleUpdateService(index, { title: event.target.value })}
                            className="input w-full rounded-2xl"
                            placeholder="Consultation, devis, visite..."
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Prix XPF</span>
                          <input
                            type="number"
                            min={0}
                            value={service.price_xpf ?? ''}
                            onChange={(event) => handleUpdateService(index, { price_xpf: event.target.value ? Number(event.target.value) : null })}
                            className="input w-full rounded-2xl"
                            placeholder="15000"
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Dur�e (min)</span>
                          <input
                            type="number"
                            min={15}
                            max={240}
                            value={service.duration_minutes || 30}
                            onChange={(event) => handleUpdateService(index, { duration_minutes: Number(event.target.value) })}
                            className="input w-full rounded-2xl"
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Description</span>
                          <input
                            value={service.description || ''}
                            onChange={(event) => handleUpdateService(index, { description: event.target.value })}
                            className="input w-full rounded-2xl"
                            placeholder="Ce que couvre ce service..."
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-night/70">
                          <input
                            type="checkbox"
                            checked={service.is_active !== false}
                            onChange={(event) => handleUpdateService(index, { is_active: event.target.checked })}
                            className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4] focus:ring-[#0A7EA4]/20"
                          />
                          Service actif
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-4 py-5 text-sm text-night/55">
                    Aucun service ajout� pour le moment.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-night">Horaires hebdomadaires</p>
                  <p className="mt-1 text-xs text-night/55">Activez ou fermez chaque jour selon vos disponibilit�s.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {WEEKDAY_LABELS.map((label, dayIndex) => {
                  const currentHours = Array.isArray(settingsForm.weekly_hours) ? settingsForm.weekly_hours : []
                  const entry = currentHours.find((item) => Number(item.day_index) === dayIndex) || createDefaultWeeklyHour(dayIndex)
                  return (
                    <div key={label} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 md:grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr] md:items-center">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-night">
                          <input
                            type="checkbox"
                            checked={entry.is_open !== false}
                            onChange={(event) => handleUpdateWeeklyHour(dayIndex, { is_open: event.target.checked })}
                            className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4] focus:ring-[#0A7EA4]/20"
                          />
                          {label}
                        </label>
                      </div>
                      <input
                        value={entry.label || ''}
                        onChange={(event) => handleUpdateWeeklyHour(dayIndex, { label: event.target.value })}
                        className="input w-full rounded-2xl"
                        placeholder="Libell�"
                      />
                      <input
                        type="time"
                        value={entry.start_time || ''}
                        onChange={(event) => handleUpdateWeeklyHour(dayIndex, { start_time: event.target.value })}
                        className="input w-full rounded-2xl"
                        disabled={entry.is_open === false}
                      />
                      <input
                        type="time"
                        value={entry.end_time || ''}
                        onChange={(event) => handleUpdateWeeklyHour(dayIndex, { end_time: event.target.value })}
                        className="input w-full rounded-2xl"
                        disabled={entry.is_open === false}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Nouveau cr�neau</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Publier un cr�neau visible</h2>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">D�but</span>
                <input
                  type="datetime-local"
                  value={slotForm.starts_at}
                  onChange={(event) => {
                    const startsAt = event.target.value
                    setSlotForm((current) => {
                      const currentStart = current.starts_at ? new Date(current.starts_at).getTime() : 0
                      const currentEnd = current.ends_at ? new Date(current.ends_at).getTime() : 0
                      const duration = currentEnd > currentStart ? currentEnd - currentStart : settingsForm.slot_duration_minutes * 60 * 1000
                      const nextEnd = startsAt
                        ? toLocalDatetimeInputValue(new Date(new Date(startsAt).getTime() + duration))
                        : ''
                      return { ...current, starts_at: startsAt, ends_at: nextEnd }
                    })
                  }}
                  className="input w-full rounded-2xl"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Fin</span>
                <input
                  type="datetime-local"
                  value={slotForm.ends_at}
                  onChange={(event) => setSlotForm((current) => ({ ...current, ends_at: event.target.value }))}
                  className="input w-full rounded-2xl"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Libell� (optionnel)</span>
                <input
                  value={slotForm.label}
                  onChange={(event) => setSlotForm((current) => ({ ...current, label: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Ex. consultation, devis, visite..."
                />
              </label>

              <button
                type="button"
                onClick={() => void handleCreateSlot()}
                disabled={savingSlot}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
              >
                {savingSlot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Publier le cr�neau
              </button>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Mes cr�neaux</p>
            {data?.slots?.length ? (
              <div className="mt-4 space-y-3">
                {data.slots.map((slot) => (
                  <div key={slot.id} className="rounded-2xl border border-[var(--color-border)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-night">{slot.label || formatSlot(slot)}</p>
                        <p className="mt-1 text-xs text-night/55">{formatSlot(slot)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSlot(slot.id)}
                        disabled={slotDeletingId === slot.id}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {slotDeletingId === slot.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/60">
                Aucun cr�neau publi� pour le moment.
              </div>
            )}
          </article>
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Indisponibilit�s</p>
            <p className="mt-1 text-sm text-night/60">
              Bloquez un jour entier ou notez une raison temporaire pour masquer la r�servation en ligne.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Date</span>
                <input
                  type="date"
                  value={exceptionForm.exception_date}
                  onChange={(event) => setExceptionForm((current) => ({ ...current, exception_date: event.target.value }))}
                  className="input w-full rounded-2xl"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Raison</span>
                <input
                  value={exceptionForm.reason}
                  onChange={(event) => setExceptionForm((current) => ({ ...current, reason: event.target.value }))}
                  className="input w-full rounded-2xl"
                  placeholder="Vacances, fermeture, d�placement..."
                />
              </label>

              <button
                type="button"
                onClick={() => void handleAddException()}
                disabled={savingException}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
              >
                {savingException ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Bloquer la date
              </button>

              {exceptions.length ? (
                <div className="space-y-2">
                  {exceptions.map((exception) => (
                    <div key={exception.id} className="rounded-2xl border border-[var(--color-border)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">
                            {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date(`${exception.exception_date}T00:00:00`))}
                          </p>
                          {exception.reason ? <p className="mt-1 text-xs text-night/55">{exception.reason}</p> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteException(exception.id)}
                          disabled={exceptionDeletingId === exception.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          {exceptionDeletingId === exception.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-night/60">
                  Aucune indisponibilit� enregistr�e.
                </div>
              )}
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demandes re�ues</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Traitez les r�servations entrantes</h2>
            <p className="mt-2 text-sm text-night/60">
              Confirmez, refusez ou suivez les demandes envoy�es depuis votre vitrine.
            </p>
          </div>
          <Link href="/mes-rdv" className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10">
            Voir mes rendez-vous
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5">
          {data?.bookings?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.bookings.map((booking) => (
                <RdvBookingCard
                  key={booking.id}
                  booking={booking}
                  onContact={() => handleContact(booking)}
                  onConfirm={(bookingId) => void handleBookingAction(bookingId, 'confirm')}
                  onDecline={(bookingId) => void handleBookingAction(bookingId, 'decline')}
                  onCancel={(bookingId) => void handleBookingAction(bookingId, 'cancel')}
                />
              ))}
            </div>
          ) : (
            <FeedbackAlert tone="info" title="Aucune demande pour le moment">
              Les demandes de rendez-vous re�ues depuis votre vitrine appara�tront ici d�s qu&apos;un visiteur r�servera un cr�neau.
            </FeedbackAlert>
          )}
        </div>
      </section>
    </div>
  )
}
