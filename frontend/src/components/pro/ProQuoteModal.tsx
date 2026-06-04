'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CreditCard, MapPin, MessageSquareQuote, Send, Sparkles, X } from 'lucide-react'

import { proApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import {
  DEFAULT_QUOTE_TEMPLATE,
  normalizeQuoteTemplate,
  type QuoteTemplate,
} from '@/components/pro/quoteTemplate'

type ProQuoteModalProps = {
  proId: string | number
  proName: string
  open: boolean
  onClose: () => void
  template?: QuoteTemplate | null
  onSent?: (payload: {
    proId: string | number
    proName: string
    request: QuoteFormState
    template: QuoteTemplate
  }) => void
}

type QuoteFormState = {
  requester_name: string
  requester_email: string
  requester_phone: string
  need_type: string
  commune: string
  budget_xpf: string
  desired_date: string
  details: string
}

const INITIAL_STATE: QuoteFormState = {
  requester_name: '',
  requester_email: '',
  requester_phone: '',
  need_type: '',
  commune: '',
  budget_xpf: '',
  desired_date: '',
  details: '',
}

function formatBudget(value: number) {
  return `${value.toLocaleString('fr-FR')} XPF`
}

export default function ProQuoteModal({ proId, proName, open, onClose, template, onSent }: ProQuoteModalProps) {
  const { user } = useAuthStore()
  const [form, setForm] = useState<QuoteFormState>(INITIAL_STATE)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const quoteTemplate = useMemo(() => normalizeQuoteTemplate(template), [template])

  useEffect(() => {
    if (!open) return
    setError('')
    setSent(false)
    setForm({
      requester_name: [user?.prenom, user?.nom].filter(Boolean).join(' ').trim(),
      requester_email: user?.email || '',
      requester_phone: '',
      need_type: quoteTemplate.need_type_placeholder || DEFAULT_QUOTE_TEMPLATE.need_type_placeholder,
      commune: quoteTemplate.commune_placeholder || DEFAULT_QUOTE_TEMPLATE.commune_placeholder,
      budget_xpf: '',
      desired_date: '',
      details: '',
    })
  }, [
    open,
    quoteTemplate.commune_placeholder,
    quoteTemplate.need_type_placeholder,
    user?.email,
    user?.nom,
    user?.prenom,
  ])

  const budgetLabel = useMemo(() => {
    const amount = Number(form.budget_xpf || 0)
    if (!Number.isFinite(amount) || amount <= 0) return 'Budget à définir'
    return formatBudget(amount)
  }, [form.budget_xpf])

  if (!open) return null

  const handleSubmit = async () => {
    if (!form.requester_name.trim()) {
      setError('Votre nom est requis.')
      return
    }
    if (!form.requester_email.trim() || !form.requester_email.includes('@')) {
      setError('Un email valide est requis.')
      return
    }
    if (!form.need_type.trim()) {
      setError('Le type de besoin est requis.')
      return
    }
    if (!form.commune.trim()) {
      setError('La commune est requise.')
      return
    }

    setSending(true)
    setError('')
    try {
      await proApi.requestQuote(proId, {
        requester_name: form.requester_name.trim(),
        requester_email: form.requester_email.trim(),
        requester_phone: quoteTemplate.show_phone && form.requester_phone.trim() ? form.requester_phone.trim() : null,
        need_type: form.need_type.trim(),
        commune: form.commune.trim(),
        budget_xpf: quoteTemplate.show_budget && form.budget_xpf.trim() ? Number(form.budget_xpf) : null,
        desired_date: quoteTemplate.show_date && form.desired_date ? form.desired_date : null,
        details: quoteTemplate.show_details && form.details.trim() ? form.details.trim() : null,
      })
      onSent?.({
        proId,
        proName,
        request: { ...form },
        template: quoteTemplate,
      })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d’envoyer votre demande.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-[var(--color-surface)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demande de devis rapide</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">{quoteTemplate.title}</h2>
            <p className="mt-1 text-sm text-night/55">
              {quoteTemplate.subtitle} Le professionnel {proName} reçoit la demande immédiatement.
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

        <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
          <div className="border-b border-[var(--color-border)] px-6 py-6 lg:border-b-0 lg:border-r">
            {sent ? (
              <div className="flex h-full flex-col justify-center">
                <FeedbackAlert tone="success" title="Demande envoyée !">
                  {proName} a reçu votre demande de devis. Vous pouvez suivre vos échanges depuis votre messagerie.
                </FeedbackAlert>
                <div className="mt-6 flex justify-center">
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

                {quoteTemplate.show_phone ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">{quoteTemplate.requester_phone_label}</span>
                    <input
                      value={form.requester_phone}
                      onChange={(event) => setForm((current) => ({ ...current, requester_phone: event.target.value }))}
                      className="input w-full rounded-2xl"
                      placeholder={quoteTemplate.requester_phone_placeholder}
                    />
                  </label>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">{quoteTemplate.need_type_label} *</span>
                    <input
                      value={form.need_type}
                      onChange={(event) => setForm((current) => ({ ...current, need_type: event.target.value }))}
                      className="input w-full rounded-2xl"
                      placeholder={quoteTemplate.need_type_placeholder}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">{quoteTemplate.commune_label} *</span>
                    <input
                      value={form.commune}
                      onChange={(event) => setForm((current) => ({ ...current, commune: event.target.value }))}
                      className="input w-full rounded-2xl"
                      placeholder={quoteTemplate.commune_placeholder}
                    />
                  </label>
                </div>

                {quoteTemplate.show_budget ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-night">{quoteTemplate.budget_label}</span>
                      <span className="text-xs text-night/45">Montants rapides modifiables par le pro</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quoteTemplate.budget_presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, budget_xpf: String(preset) }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            form.budget_xpf === String(preset)
                              ? 'border-[#0A7EA4] bg-nc-lagonLight text-[#0A7EA4]'
                              : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] text-night/70 hover:border-[#0A7EA4]/30'
                          }`}
                        >
                          {formatBudget(preset)}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={form.budget_xpf}
                      onChange={(event) => setForm((current) => ({ ...current, budget_xpf: event.target.value }))}
                      className="input w-full rounded-2xl"
                      placeholder={quoteTemplate.budget_placeholder}
                    />
                  </div>
                ) : null}

                {quoteTemplate.show_date ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">{quoteTemplate.desired_date_label}</span>
                    <input
                      type="date"
                      value={form.desired_date}
                      onChange={(event) => setForm((current) => ({ ...current, desired_date: event.target.value }))}
                      className="input w-full rounded-2xl"
                    />
                  </label>
                ) : null}

                {quoteTemplate.show_details ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">{quoteTemplate.details_label}</span>
                    <textarea
                      value={form.details}
                      onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                      rows={4}
                      className="input w-full rounded-2xl py-3"
                      placeholder={quoteTemplate.details_placeholder}
                    />
                  </label>
                ) : null}

                {error ? (
                  <FeedbackAlert tone="error" title="Envoi impossible">
                    {error}
                  </FeedbackAlert>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sending}
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
            )}
          </div>

          <aside className="space-y-4 px-6 py-6">
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">Récapitulatif</p>
              <div className="mt-3 space-y-3 text-sm text-night/65">
                <p className="flex items-start gap-2">
                  <MessageSquareQuote className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                  <span>Votre demande part directement au professionnel sélectionné.</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                  <span>Vous pouvez préciser la commune pour un retour plus rapide.</span>
                </p>
                {quoteTemplate.show_budget ? (
                  <p className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>Budget estimé actuel : {budgetLabel}.</span>
                  </p>
                ) : null}
                {quoteTemplate.show_date ? (
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#0A7EA4]" />
                    <span>La date souhaitée permet au pro de prioriser votre demande.</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-night/70">
              <p className="font-semibold text-emerald-800">Astuce</p>
              <p className="mt-2">
                Plus votre besoin est clair, plus le professionnel peut répondre vite et avec une estimation
                réaliste.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
