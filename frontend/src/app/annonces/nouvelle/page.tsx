'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock3, MapPin, Sparkles } from 'lucide-react'

import Header from '@/components/layout/Header'
import { bonPlansApi, metaApi } from '@/lib/api'
import { useAutosave, useBeforeUnload } from '@/hooks/useAutosave'
import { useAuthStore } from '@/store/authStore'

type CommuneOption = {
  id: number
  name: string
  province_name?: string | null
}

type FormState = {
  title: string
  description: string
  kind: 'promo' | 'event' | 'concert' | 'other'
  target_audience: 'particulier' | 'pro'
  duration_days: 3 | 7
  commune_id: string
  location_name: string
  event_date: string
  link_url: string
  normal_price_xpf: string
  promo_price_xpf: string
  discount_pct: string
  conditions: string
  contact_name: string
  contact_phone: string
  contact_email: string
  website_url: string
  opening_hours: string
}

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  kind: 'promo',
  target_audience: 'particulier',
  duration_days: 3,
  commune_id: '',
  location_name: '',
  event_date: '',
  link_url: '',
  normal_price_xpf: '',
  promo_price_xpf: '',
  discount_pct: '',
  conditions: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  website_url: '',
  opening_hours: '',
}

function computePrice(targetAudience: FormState['target_audience'], durationDays: FormState['duration_days']) {
  if (targetAudience === 'particulier') {
    return durationDays === 7 ? 590 : 290
  }
  return durationDays === 7 ? 1990 : 990
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XPF`
}

export default function NewListingPage() {
  const router = useRouter()
  const userId = useAuthStore((state) => state.user?.id ?? 'guest')
  const [communces, setCommunces] = useState<CommuneOption[]>([])
  const [loadingCommunes, setLoadingCommunes] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const autosave = useAutosave(`draft_listing_${userId}`, form, 30_000)

  useBeforeUnload(autosave.isDirty && !submitting)

  useEffect(() => {
    let alive = true
    metaApi
      .getCommunes()
      .then((res) => {
        if (!alive) return
        setCommunces(res.data?.data ?? [])
      })
      .catch(() => {
        if (!alive) return
        setCommunces([])
      })
      .finally(() => {
        if (alive) setLoadingCommunes(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const estimatedPrice = useMemo(
    () => computePrice(form.target_audience, form.duration_days),
    [form.target_audience, form.duration_days]
  )

  const selectedCommune = useMemo(
    () => communces.find((item) => String(item.id) === form.commune_id),
    [communces, form.commune_id]
  )

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    const requiredErrors = [
      !form.title.trim() && 'Veuillez renseigner un titre.',
      !form.description.trim() && 'Veuillez renseigner une description.',
      !form.commune_id && 'Veuillez choisir une commune.',
      !form.location_name.trim() && 'Veuillez préciser un lieu exact.',
      !form.event_date && 'Veuillez choisir une date.',
    ].filter(Boolean) as string[]

    if (requiredErrors.length > 0) {
      setError(requiredErrors[0])
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        kind: form.kind,
        target_audience: form.target_audience,
        duration_days: form.duration_days,
        commune_id: form.commune_id ? Number(form.commune_id) : null,
        location_name: form.location_name.trim() || null,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
        link_url: form.link_url.trim() || null,
        normal_price_xpf: form.normal_price_xpf ? Number(form.normal_price_xpf) : null,
        promo_price_xpf: form.promo_price_xpf ? Number(form.promo_price_xpf) : null,
        discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
        conditions: form.conditions.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        website_url: form.website_url.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
        photos: [],
        social_links: {},
      }

      const response = await Promise.race([
        bonPlansApi.create(payload),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), 8000)
        }),
      ]) as any
      const created = response.data?.data
      setCreatedId(created?.id ?? null)
      setSuccessMessage(
        created?.free_included
          ? 'Bon plan publié gratuitement dans le cadre de votre offre Pro Plus du mois.'
          : 'Bon plan publié avec succès.'
      )
      setForm(INITIAL_FORM)
      try {
        autosave.clearDraft()
      } catch {
        // Ignore localStorage issues after a successful publish.
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(
        err?.message === 'timeout'
          ? 'Le service de publication ne répond pas pour le moment. Réessayez dans quelques instants.'
          : err?.response?.data?.error || 'La publication du bon plan a échoué. Veuillez vérifier les champs puis recommencer.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const restoreDraft = () => {
    const draft = autosave.pendingDraft
    if (!draft) return
    setForm(draft.data)
    setError('')
    setSuccessMessage('')
    autosave.acceptDraft(draft)
  }

  const ignoreDraft = () => {
    autosave.discardDraft()
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-coral/15 bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              <Sparkles className="h-3.5 w-3.5" />
              Bon plan
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-night md:text-4xl">Publier un bon plan local</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60 md:text-base">
              Partagez une promo, un concert, une ouverture ou un petit événement local. Les particuliers paient peu,
              les pros ont plus de visibilité, et les Pro Plus ont un bon plan offert chaque mois.
            </p>
          </div>
          <Link href="/annonces" className="hidden items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night shadow-sm transition hover:-translate-y-0.5 md:inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>

        {autosave.pendingDraft ? (
          <div className="mb-6 rounded-[1.5rem] border border-lagoon/20 bg-lagoon/8 p-4 text-night shadow-sm">
            {/* TODO: test E2E */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Brouillon restaure</p>
                <p className="mt-1 text-sm text-night/70">
                  Brouillon restaure {autosave.draftAgeLabel ? `- ${autosave.draftAgeLabel}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="rounded-2xl bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-night/90"
                >
                  Restaurer
                </button>
                <button
                  type="button"
                  onClick={ignoreDraft}
                  className="rounded-2xl border border-night/10 bg-white px-4 py-2 text-sm font-semibold text-night transition hover:bg-sand"
                >
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="font-semibold">Bon plan publié</p>
            <p className="mt-1 text-sm">{successMessage}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/" className="btn-primary rounded-2xl px-4 py-2.5">
                Voir l&apos;accueil
              </Link>
              <Link href="/annonces" className="btn-secondary rounded-2xl px-4 py-2.5">
                Parcourir les annonces
              </Link>
            </div>
            {createdId ? <p className="mt-3 text-xs opacity-70">Référence: #{createdId}</p> : null}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-night/8 bg-white/95 p-5 shadow-card">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Profil payeur</span>
                <select
                  value={form.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value as FormState['target_audience'])}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                >
                  <option value="particulier">Particulier</option>
                  <option value="pro">Professionnel</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Durée</span>
                <select
                  value={form.duration_days}
                  onChange={(e) => handleChange('duration_days', Number(e.target.value) as 3 | 7)}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                >
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                </select>
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-night/8 bg-sand/30 p-4">
              <p className="text-sm font-semibold text-night">Infos promotionnelles et contact</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Prix normal</span>
                  <input
                    value={form.normal_price_xpf}
                    onChange={(e) => handleChange('normal_price_xpf', e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex. 5000"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Prix promo</span>
                  <input
                    value={form.promo_price_xpf}
                    onChange={(e) => handleChange('promo_price_xpf', e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex. 3000"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Remise (%)</span>
                  <input
                    value={form.discount_pct}
                    onChange={(e) => handleChange('discount_pct', e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex. 40"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Horaires</span>
                  <input
                    value={form.opening_hours}
                    onChange={(e) => handleChange('opening_hours', e.target.value)}
                    placeholder="Ex. Lun-Sam 9h-18h"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Contact</span>
                  <input
                    value={form.contact_name}
                    onChange={(e) => handleChange('contact_name', e.target.value)}
                    placeholder="Nom du contact"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Téléphone</span>
                  <input
                    value={form.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="Numéro de contact"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Email</span>
                  <input
                    value={form.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="contact@..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Site web</span>
                  <input
                    value={form.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-night">Conditions</span>
                  <textarea
                    value={form.conditions}
                    onChange={(e) => handleChange('conditions', e.target.value)}
                    rows={3}
                    placeholder="Conditions, date limite, réservation, accès..."
                    className="w-full rounded-3xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Titre</span>
              <input
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex. Concert acoustique au bord de mer"
                required
                className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Type de bon plan</span>
              <select
                value={form.kind}
                onChange={(e) => handleChange('kind', e.target.value as FormState['kind'])}
                className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              >
                <option value="promo">Promo</option>
                <option value="event">Événement</option>
                <option value="concert">Concert</option>
                <option value="other">Autre</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez l'offre, l'heure, le lieu, les conditions et tout ce qui aide le visiteur à comprendre."
                rows={6}
                required
                className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Commune</span>
                <select
                  value={form.commune_id}
                  onChange={(e) => handleChange('commune_id', e.target.value)}
                  disabled={loadingCommunes}
                  required
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                >
                  <option value="">{loadingCommunes ? 'Chargement...' : 'Choisir une commune'}</option>
                  {communces.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Lieu exact</span>
                <input
                  value={form.location_name}
                  onChange={(e) => handleChange('location_name', e.target.value)}
                  placeholder="Ex. Galerie, boutique, salle, plage..."
                  required
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-night">
                  <CalendarDays className="h-4 w-4 text-coral" />
                  Date de l&apos;événement
                </span>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => handleChange('event_date', e.target.value)}
                  required
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-night">
                  <MapPin className="h-4 w-4 text-coral" />
                  Lien utile
                </span>
                <input
                  value={form.link_url}
                  onChange={(e) => handleChange('link_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Publication...' : 'Publier le bon plan'}
              </button>
              <Link href="/pro" className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3">
                Voir les offres Pro
              </Link>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-night/8 bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(8,32,50,0.9))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
                <Sparkles className="h-3.5 w-3.5" />
                Apercu prix
              </div>
              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/45">Tarif estimatif</p>
              <p className="mt-2 text-4xl font-bold text-white">{formatPrice(estimatedPrice)}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Le prix est calculé selon le profil choisi et la durée. Si vous êtes Pro Plus et que votre bon plan offert
                du mois est encore disponible, le tarif peut tomber à 0 XPF.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Particulier</p>
                  <p className="mt-2 text-sm font-semibold text-white">290 XPF / 3 jours</p>
                  <p className="mt-1 text-sm text-white/65">590 XPF / 7 jours</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Professionnel</p>
                  <p className="mt-2 text-sm font-semibold text-white">990 XPF / 3 jours</p>
                  <p className="mt-1 text-sm text-white/65">1 990 XPF / 7 jours</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Résumé</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <p><span className="font-semibold text-night">Profil:</span> {form.target_audience === 'pro' ? 'Professionnel' : 'Particulier'}</p>
                <p><span className="font-semibold text-night">Durée:</span> {form.duration_days} jours</p>
                <p><span className="font-semibold text-night">Type:</span> {form.kind}</p>
                <p><span className="font-semibold text-night">Commune:</span> {selectedCommune?.name || 'Non renseignée'}</p>
                <p><span className="font-semibold text-night">Lieu:</span> {form.location_name.trim() || 'Non renseigné'}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-sand p-4 text-sm text-night/65">
                <Clock3 className="mb-2 h-4 w-4 text-coral" />
                La publication reste visible pendant la durée choisie, puis expire automatiquement.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
