'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, Loader2, MessageCircle, Plus, Save, Trash2 } from 'lucide-react'

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
  subtitle: 'Réservez un créneau directement avec ce professionnel.',
  location_label: 'Lieu du rendez-vous',
  location_text: '',
  instructions: '',
  slot_duration_minutes: 30,
  advance_notice_hours: 24,
  max_days_ahead: 30,
}

const DEFAULT_SLOT: SlotForm = {
  starts_at: '',
  ends_at: '',
  label: '',
}

function toLocalDatetimeInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSlot(slot: ProPublicBookingSlot) {
  const startsAt = new Date(slot.starts_at)
  const endsAt = new Date(slot.ends_at)
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt)
  const endTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(endsAt)
  return `${date} · ${endTime}`
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
        subtitle: `${target.requester_name} · ${formatSlot(target)}`,
        href: '/mes-rdv',
        tone: 'bg-nc-lagonLight text-nc-lagon',
      }
    }

    const sentAt = reminderType === 'H-2' ? target.reminder_2h_sent_at : target.reminder_24h_sent_at
    const label = sentAt ? `${reminderType} envoyé` : `${reminderType} à venir`

    return {
      title: `Prochain rappel ${reminderType}`,
      subtitle: `${target.requester_name} · ${formatSlot(target)}`,
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
        title: 'Réglages enregistrés',
        message: 'Votre prise de rendez-vous est à jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible d’enregistrer les réglages.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Réglages non enregistrés',
        message,
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleCreateSlot = async () => {
    if (!slotForm.starts_at || !slotForm.ends_at) {
      setError('Merci de renseigner un créneau complet.')
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
        title: 'Créneau publié',
        message: 'Les visiteurs peuvent désormais réserver ce créneau.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de créer ce créneau.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Créneau non créé',
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
        title: 'Créneau supprimé',
        message: 'Le créneau a été retiré de la vitrine.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de supprimer ce créneau.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Créneau non supprimé',
        message,
      })
    } finally {
      setSlotDeletingId(null)
    }
  }

  const handleAddException = async () => {
    if (!exceptionForm.exception_date) {
      setError('Merci de choisir une date d’indisponibilité.')
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
        title: 'Indisponibilité ajoutée',
        message: 'Le calendrier public a été mis à jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de créer cette exception.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Exception non ajoutée',
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
        title: 'Indisponibilité supprimée',
        message: 'Le créneau redeviendra publiquement réservable.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de supprimer cette indisponibilité.'
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

  const handleBookingAction = async (bookingId: string | number, action: 'confirm' | 'decline' | 'cancel') => {
    setError('')
    try {
      if (action === 'confirm') await proBookingsApi.confirm(bookingId)
      if (action === 'decline') await proBookingsApi.decline(bookingId)
      if (action === 'cancel') await proBookingsApi.cancel(bookingId)
      await loadDashboard()
      showToast({
        tone: 'success',
        title: 'Rendez-vous actualisé',
        message: 'La réservation a été mise à jour.',
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible de mettre à jour cette réservation.'
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
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Gérez vos créneaux et vos demandes</h1>
            <p className="mt-2 text-sm text-night/60">
              Activez la réservation en ligne, publiez vos créneaux et traitez les demandes reçues depuis votre vitrine.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0A7EA4]/15 bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-[#0A7EA4]">
            <CalendarDays className="h-4 w-4" />
            {stats.slots} créneau{stats.slots > 1 ? 'x' : ''} publié{stats.slots > 1 ? 's' : ''}
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
          <p className="text-sm font-semibold text-night/55">Créneaux publiés</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.slots}</p>
        </article>
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">En attente</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.pending}</p>
        </article>
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">Confirmés</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.confirmed}</p>
        </article>
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold text-night/55">Terminés</p>
          <p className="mt-2 text-3xl font-bold text-night">{stats.completed}</p>
        </article>
      </section>

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
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Réglages</p>
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
                <span className="block text-sm font-semibold text-night">Activer la réservation en ligne</span>
                <span className="mt-1 block text-xs text-night/55">
                  Vos visiteurs pourront réserver un créneau visible depuis votre vitrine.
                </span>
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Titre de la réservation</span>
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
                  placeholder="Réservez un créneau directement..."
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Libellé du lieu</span>
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
                  placeholder="À l'atelier / au bureau / sur site"
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
                placeholder="Ajoutez les documents à préparer, les consignes, le stationnement..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Durée d'un créneau (min)</span>
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
                <span className="text-sm font-semibold text-night">Prévenance min. (h)</span>
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
                <span className="text-sm font-semibold text-night">Jours max. à l'avance</span>
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
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Nouveau créneau</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Publier un créneau visible</h2>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-night">Début</span>
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
                <span className="text-sm font-semibold text-night">Libellé (optionnel)</span>
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
                Publier le créneau
              </button>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Mes créneaux</p>
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
                Aucun créneau publié pour le moment.
              </div>
            )}
          </article>
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Indisponibilités</p>
            <p className="mt-1 text-sm text-night/60">
              Bloquez un jour entier ou notez une raison temporaire pour masquer la réservation en ligne.
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
                  placeholder="Vacances, fermeture, déplacement..."
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
                  Aucune indisponibilité enregistrée.
                </div>
              )}
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demandes reçues</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Traitez les réservations entrantes</h2>
            <p className="mt-2 text-sm text-night/60">
              Confirmez, refusez ou suivez les demandes envoyées depuis votre vitrine.
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
              Les demandes de rendez-vous reçues depuis votre vitrine apparaîtront ici dès qu&apos;un visiteur réservera un créneau.
            </FeedbackAlert>
          )}
        </div>
      </section>
    </div>
  )
}
