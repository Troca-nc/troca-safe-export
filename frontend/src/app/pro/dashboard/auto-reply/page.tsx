'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, MessageSquareReply, Save, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react'

import { proApi } from '@/lib/api'

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
] as const

const VARIABLE_CHIPS = ['{prénom_client}', '{nom_entreprise}', '{heure_retour}']
const TIME_OPTIONS = ['00:00', '06:00', '08:00', '09:00', '10:00', '12:00', '13:00', '14:00', '15:00', '17:00', '18:00', '20:00', '22:00']
const DELAY_OPTIONS = [
  { value: 0, label: 'Répondre immédiatement' },
  { value: 5, label: 'Après 5 min' },
  { value: 15, label: 'Après 15 min' },
  { value: 30, label: 'Après 30 min' },
] as const

type AutoReplyConfig = {
  is_active?: boolean
  enabled?: boolean
  message?: string
  active_from?: string | null
  active_until?: string | null
  active_days?: number[]
  reply_delay_minutes?: number
  delay_minutes?: number
}

function replacePreviewVariables(message: string) {
  return message
    .replaceAll('{prénom_client}', 'Emma')
    .replaceAll('{nom_entreprise}', 'Atelier Kalo')
    .replaceAll('{heure_retour}', '18:00')
}

export default function AutoReplyPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [message, setMessage] = useState(
    'Bonjour, merci pour votre message !\nJe suis actuellement indisponible mais je reviendrai vers vous dès que possible.\nCordialement, [Votre prénom]'
  )
  const [activeFrom, setActiveFrom] = useState('09:00')
  const [activeUntil, setActiveUntil] = useState('18:00')
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [delayMinutes, setDelayMinutes] = useState(0)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const response = await proApi.getAutoReply()
        const config = (response.data?.data || {}) as AutoReplyConfig
        if (!alive) return
        setIsActive(Boolean(config.is_active ?? config.enabled ?? false))
        setMessage(config.message || message)
        setActiveFrom(config.active_from || '09:00')
        setActiveUntil(config.active_until || '18:00')
        setActiveDays(Array.isArray(config.active_days) && config.active_days.length > 0 ? config.active_days : [1, 2, 3, 4, 5])
        setDelayMinutes(Number(config.reply_delay_minutes ?? config.delay_minutes ?? 0))
      } catch {
        if (!alive) return
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const preview = useMemo(() => replacePreviewVariables(message || ''), [message])

  const toggleDay = (day: number) => {
    setActiveDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b)
    )
  }

  const insertVariable = (value: string) => {
    setMessage((current) => `${current}${current.endsWith('\n') || current.length === 0 ? '' : ' '}${value}`)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await proApi.updateAutoReply({
        is_active: isActive,
        message,
        active_from: activeFrom,
        active_until: activeUntil,
        active_days: activeDays,
        reply_delay_minutes: delayMinutes,
      })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de sauvegarder la réponse automatique.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Réponse automatique</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Répondez même quand vous êtes occupé</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-night/60">
              Configurez un message automatique pour rassurer vos clients et garder le contact, même en dehors de vos horaires.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsActive((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[var(--color-border)] bg-sand text-night/65'
            }`}
          >
            {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {isActive ? 'Réponse automatique activée' : 'Réponse automatique désactivée'}
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className={`rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm ${isActive ? '' : 'opacity-80'}`}>
          <div className="flex items-center gap-2">
            <MessageSquareReply className="h-5 w-5 text-[#0A7EA4]" />
            <h2 className="font-display text-2xl font-bold text-night">Message automatique</h2>
          </div>
          <p className="mt-2 text-sm text-night/55">Variables disponibles: {VARIABLE_CHIPS.join(' · ')}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {VARIABLE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => insertVariable(chip)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-semibold text-night/65 transition hover:border-[#0A7EA4]/30 hover:text-[#0A7EA4]"
              >
                {chip}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 500))}
            rows={10}
            maxLength={500}
            className="mt-4 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-night outline-none transition focus:border-[#0A7EA4] focus:ring-4 focus:ring-[#0A7EA4]/10"
            placeholder="Bonjour, merci pour votre message..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-night/45">
            <span>{message.length}/500 caractères</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Aperçu en temps réel
            </span>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Aperçu du message</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-night/70">{preview}</p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-coral" />
              <div>
                <h2 className="font-display text-2xl font-bold text-night">Plages horaires actives</h2>
                <p className="text-sm text-night/55">La réponse se déclenche uniquement en dehors de ces horaires.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {DAYS.map((day) => {
                const enabled = activeDays.includes(day.value)
                return (
                  <div key={day.value} className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-3 md:grid-cols-[140px_1fr] md:items-center">
                    <button
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`inline-flex items-center gap-2 justify-self-start rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        enabled ? 'bg-nc-lagonLight text-nc-lagon' : 'bg-sand text-night/55'
                      }`}
                    >
                      {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      {day.label}
                    </button>

                    {enabled ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={activeFrom}
                          onChange={(e) => setActiveFrom(e.target.value)}
                          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        >
                          {TIME_OPTIONS.map((time) => <option key={`from-${time}`} value={time}>{time}</option>)}
                        </select>
                        <span className="text-sm text-night/45">→</span>
                        <select
                          value={activeUntil}
                          onChange={(e) => setActiveUntil(e.target.value)}
                          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        >
                          {TIME_OPTIONS.map((time) => <option key={`until-${time}`} value={time}>{time}</option>)}
                        </select>
                      </div>
                    ) : (
                      <p className="text-sm text-night/45">Inactif</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-night">Délai de réponse</h2>
            <p className="mt-2 text-sm text-night/55">Choisissez quand la réponse partira automatiquement.</p>
            <select
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="mt-4 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
            >
              {DELAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>

            {saved ? <p className="mt-3 text-sm font-semibold text-emerald-700">✅ Réponse automatique configurée</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </section>
        </div>
      </section>
    </div>
  )
}
