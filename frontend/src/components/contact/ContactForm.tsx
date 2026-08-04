'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2, Mail, PhoneCall, Send, ShieldCheck } from 'lucide-react'

import { contactApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { showToast } from '@/lib/toast'

type ContactCategory = 'support' | 'annonce' | 'pro' | 'covoiturage' | 'legal' | 'security' | 'other'

type ContactFormState = {
  name: string
  email: string
  category: ContactCategory
  subject: string
  message: string
  website: string
}

const CATEGORY_OPTIONS: Array<{ value: ContactCategory; label: string; hint: string }> = [
  { value: 'support', label: 'Support general', hint: 'Compte, annonces, navigation, bugs' },
  { value: 'annonce', label: 'Annonce', hint: 'Publication, modification, suppression' },
  { value: 'pro', label: 'Compte Pro', hint: 'Vitrine, devis, statistiques, factures' },
  { value: 'covoiturage', label: 'Covoiturage', hint: 'Reservations, trajets, conducteur' },
  { value: 'legal', label: 'Juridique', hint: 'RGPD, mentions legales, CGU' },
  { value: 'security', label: 'Securite', hint: 'Signalement, arnaque, urgence' },
  { value: 'other', label: 'Autre', hint: 'Une demande specifique' },
]

const INITIAL_STATE: ContactFormState = {
  name: '',
  email: '',
  category: 'support',
  subject: '',
  message: '',
  website: '',
}

function replyHint(category: ContactCategory) {
  switch (category) {
    case 'security':
      return 'Si votre demande est urgente, precisez-le dans le message.'
    case 'legal':
      return 'Les demandes RGPD et juridiques sont traitees en priorite.'
    case 'pro':
      return 'Ajoutez le nom de votre societe ou la vitrine concernee.'
    default:
      return 'Reponse sous 24 a 48 heures ouvrï¿½es en moyenne.'
  }
}

export default function ContactForm() {
  const { user, isAuthenticated } = useAuthStore()
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !isAuthenticated) return
    setForm((current) => ({
      ...current,
      name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.prenom || '',
      email: user.email || '',
    }))
  }, [isAuthenticated, user])

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.value === form.category) ?? CATEGORY_OPTIONS[0],
    [form.category]
  )

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await contactApi.send({
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        website: form.website.trim(),
      })

      setSuccess('Votre message a bien ï¿½tï¿½ envoyï¿½. Nous vous rï¿½pondrons dï¿½s que possible.')
      showToast({
        tone: 'success',
        title: 'Message envoyï¿½',
        message: 'Votre demande de support a bien ï¿½tï¿½ transmise ï¿½ lï¿½quipe Kalico.',
      })
      setForm((current) => ({
        ...INITIAL_STATE,
        name: current.name,
        email: current.email,
      }))
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Une erreur est survenue, veuillez rï¿½essayer.'
      setError(message)
      showToast({
        tone: 'error',
        title: 'Envoi impossible',
        message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Nous contacter</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Envoyez votre demande au support</h2>
          <p className="mt-2 text-sm leading-relaxed text-night/60">
            Remplissez le formulaire ci-dessous pour une rï¿½ponse structurï¿½e. Les comptes connectï¿½s ont leurs informations prï¿½-remplies.
          </p>
        </div>
        <div className="rounded-3xl border border-nc-lagon/15 bg-nc-lagonLight px-4 py-3 text-[#0A7EA4]">
          <p className="text-sm font-semibold">Rï¿½ponse rapide</p>
          <p className="mt-1 text-xs text-[#0A7EA4]/75">{replyHint(form.category)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Nom complet</span>
            <input
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="input w-full rounded-2xl"
              placeholder="Votre nom"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className="input w-full rounded-2xl"
              placeholder="vous@email.com"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">CatÃ©gorie</span>
            <select
              value={form.category}
              onChange={(event) => handleChange('category', event.target.value as ContactCategory)}
              className="input w-full rounded-2xl"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Sujet</span>
            <input
              value={form.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              className="input w-full rounded-2xl"
              placeholder={selectedCategory.hint}
              required
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-night">Message</span>
          <textarea
            value={form.message}
            onChange={(event) => handleChange('message', event.target.value)}
            className="input min-h-40 w-full rounded-2xl"
            placeholder="Dï¿½crivez votre demande avec un maximum de dï¿½tails utiles."
            required
          />
        </label>

        <input
          value={form.website}
          onChange={(event) => handleChange('website', event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-night/50">
            En envoyant ce formulaire, vous acceptez que lï¿½quipe Kalico traite votre demande pour vous rï¿½pondre.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer au support
          </button>
        </div>

        {success ? (
          <FeedbackAlert tone="success" title="Message envoyï¿½">
            {success}
          </FeedbackAlert>
        ) : null}

        {error ? (
          <FeedbackAlert tone="error" title="Envoi impossible">
            {error}
          </FeedbackAlert>
        ) : null}
      </form>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
          <Mail className="h-5 w-5 text-[#0A7EA4]" />
          <p className="mt-2 text-sm font-semibold text-night">contact@kalico.nc</p>
          <p className="mt-1 text-xs text-night/55">Support gï¿½nï¿½ral et questions produit.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
          <ShieldCheck className="h-5 w-5 text-nc-emeraude" />
          <p className="mt-2 text-sm font-semibold text-night">privacy@kalico.nc</p>
          <p className="mt-1 text-xs text-night/55">Demandes RGPD et confidentialitï¿½.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
          <PhoneCall className="h-5 w-5 text-coral" />
          <p className="mt-2 text-sm font-semibold text-night">24h ï¿½ 48h ouvrï¿½es</p>
          <p className="mt-1 text-xs text-night/55">Temps de rï¿½ponse moyen sur les demandes standard.</p>
        </div>
      </div>
    </section>
  )
}
