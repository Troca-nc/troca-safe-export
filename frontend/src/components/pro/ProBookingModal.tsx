'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, MapPin, MessageSquareQuote, Send, Sparkles, X } from 'lucide-react'

import { proBookingsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { showToast } from '@/lib/toast'
import type { ProPublicBookingSettings, ProPublicBookingSlot } from '@/app/pro/publicStorefrontData'

type BookingFormState = {
  requester_name: string
  requester_email: string
  requester_phone: string
  commune: string
  subject: string
  details: string
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

  return `${date} · ${startTime} → ${endTime}`
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
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
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
      subject: settings?.title || 'Prendre rendez-vous',
      details: '',
    })
  }, [open, settings?.title, user?.commune_name, user?.email, user?.nom, user?.prenom, user?.telephone])

  useEffect(() => {
    if (!open) return
    let alive = true

    const loadSlots = async () => {
      setLoadingSlots(true)
      try {
        const response = await proBookingsApi.getSlots(proId)
        const payload = response.data?.data || {}
        const nextSlots = Array.isArray(payload.slots) ? payload.slots : []
        if (!alive) return
        setSlots(nextSlots)
        setSelectedSlotId((current) => {
          if (current && nextSlots.some((slot: ProPublicBookingSlot) => String(slot.id) === String(current))) {
            return current
          }
          return nextSlots[0] ? String(nextSlots[0].id) : ''
        })
      } catch {
        if (!alive) return
        setSlots([])
        setSelectedSlotId('')
      } finally {
        if (alive) setLoadingSlots(false)
      }
    }

    void loadSlots()
    return () => {
      alive = false
    }
  }, [open, proId])

  const selectedSlot = useMemo(
    () => slots.find((slot) => String(slot.id) === String(selectedSlotId)) || null,
    [selectedSlotId, slots],
  )

  if (!open) return null

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError('Merci de choisir un créneau.')
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
      await proBookingsApi.book(proId, {
        slot_id: Number(selectedSlot.id),
        requester_name: form.requester_name.trim(),
        requester_email: form.requester_email.trim(),
        requester_phone: form.requester_phone.trim() || null,
        commune: form.commune.trim() || null,
        subject: form.subject.trim(),
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
        title: 'Rendez-vous demandé',
        message: `${proName} a reçu votre demande. Vous pouvez suivre son évolution dans Mes rendez-vous.`,
      })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Impossible d’envoyer votre demande.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Rendez-vous non envoyé',
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
              {settings?.subtitle || 'Réservez un créneau directement avec ce professionnel.'}
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
            <FeedbackAlert tone="success" title="Demande envoyée !">
              Votre rendez-vous a bien été transmis à {proName}. Suivez son statut depuis votre espace <strong>Mes rendez-vous</strong>.
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
                    <span className="text-sm font-semibold text-night">Téléphone</span>
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
                    placeholder="Nouméa, Dumbéa..."
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Objet du rendez-vous *</span>
                  <input
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    className="input w-full rounded-2xl"
                    placeholder="Ex. devis, dépannage, visite..."
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Précisions</span>
                  <textarea
                    value={form.details}
                    onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                    rows={4}
                    className="input w-full rounded-2xl py-3"
                    placeholder="Expliquez votre besoin, les contraintes, les documents à préparer..."
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">Créneaux disponibles</p>
                <p className="mt-1 text-sm text-night/60">
                  {loadingSlots ? 'Chargement des créneaux...' : 'Choisissez l’horaire qui vous convient le mieux.'}
                </p>
                <div className="mt-4 space-y-2">
                  {slots.length ? (
                    slots.map((slot) => {
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
                      Aucun créneau n’est encore publié. Le professionnel peut en ajouter depuis son espace.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,_rgba(214,240,246,0.55),_rgba(255,255,255,0.95))] p-4 text-sm text-night/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nc-emeraude">Récapitulatif</p>
                <div className="mt-3 space-y-2">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>
                      {settings?.location_label || 'Lieu du rendez-vous'} : {settings?.location_text || 'à confirmer avec le professionnel'}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>{selectedSlot ? formatSlot(selectedSlot) : 'Choisissez un créneau pour continuer.'}</span>
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
