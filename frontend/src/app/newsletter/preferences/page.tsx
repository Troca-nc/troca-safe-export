'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Eye } from 'lucide-react'

import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { newsletterApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const COMMUNES = [
  'Nouméa',
  'Dumbéa',
  'Mont-Dore',
  'Païta',
  'Boulouparis',
  'La Foa',
  'Bourail',
  'Koné',
  'Koumac',
  'Poindimié',
  'Lifou',
  'Maré',
  'Ouvéa',
  'Autre',
]

const FREQUENCIES = [
  { value: 'weekly', label: 'Hebdomadaire (recommandé)' },
  { value: 'monthly', label: 'Bimensuelle' },
  { value: 'off', label: 'Quotidienne' },
] as const

export default function NewsletterPreferencesPage() {
  const router = useRouter()
  const { user, hasHydrated, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState('')
  const [communes, setCommunes] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'off'>('weekly')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/connexion?next=/newsletter/preferences')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    let alive = true
    const load = async () => {
      try {
        const response = await newsletterApi.getSubscription()
        const sub = response.data?.data || null
        if (!alive || !sub) return
        setCommunes(Array.isArray(sub.communes) ? sub.communes : user?.commune_name ? [user.commune_name] : [])
        setCategories(Array.isArray(sub.categories) ? sub.categories : [])
        setFrequency(sub.frequency || 'weekly')
        setEnabled(Boolean(sub.enabled ?? true))
      } catch {
        if (!alive) return
        setCommunes(user?.commune_name ? [user.commune_name] : [])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [isAuthenticated, user?.commune_name])

  const categoryOptions = useMemo(() => FALLBACK_CATEGORIES.map((category) => category.name), [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await newsletterApi.subscribe({
        enabled,
        communes,
        categories,
        frequency,
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de sauvegarder vos préférences.')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!user?.id) return
    setPreviewLoading(true)
    try {
      const response = await newsletterApi.preview(user.id)
      setPreview(response.data?.data || null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setSaving(true)
    try {
      await newsletterApi.unsubscribe({})
      setEnabled(false)
      setFrequency('off')
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
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Newsletter</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-night">Personnalisez votre newsletter</h1>
        <p className="mt-2 text-sm leading-relaxed text-night/60">
          Recevez chaque semaine les meilleures annonces de votre secteur.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-night">Mes communes</h2>
          <p className="mt-1 text-sm text-night/55">Choisissez au moins une commune.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMUNES.map((commune) => {
              const active = communes.includes(commune)
              return (
                <button
                  key={commune}
                  type="button"
                  onClick={() => setCommunes((current) => (active ? current.filter((item) => item !== commune) : [...current, commune]))}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active ? 'border-[#0A7EA4] bg-nc-lagonLight text-nc-lagon' : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] text-night/65'
                  }`}
                >
                  {commune}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            <h3 className="font-display text-xl font-bold text-night">Mes catégories favorites</h3>
            <p className="mt-1 text-sm text-night/55">Laissez vide pour recevoir toutes les catégories.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryOptions.map((category) => {
                const active = categories.includes(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategories((current) => (active ? current.filter((item) => item !== category) : [...current, category]))}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      active ? 'border-[#0A7EA4] bg-nc-lagonLight text-nc-lagon' : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] text-night/65'
                    }`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-night">Fréquence</h2>
            <div className="mt-4 space-y-2">
              {FREQUENCIES.map((item) => (
                <label key={item.value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-3">
                  <input
                    type="radio"
                    checked={frequency === item.value}
                    onChange={() => setFrequency(item.value)}
                    name="frequency"
                  />
                  <span className="text-sm font-medium text-night">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-night">Aperçu</h2>
                <p className="text-sm text-night/55">Visualisez le contenu avant envoi.</p>
              </div>
              <button type="button" onClick={handlePreview} disabled={previewLoading} className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
                <Eye className="h-4 w-4" />
                {previewLoading ? 'Chargement...' : 'Voir un aperçu'}
              </button>
            </div>

            {preview ? (
              <div className="mt-4 space-y-3 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                <p className="text-sm font-semibold text-night">Annonces sélectionnées</p>
                <div className="grid gap-3">
                  {(preview.items || []).slice(0, 4).map((item: any, index: number) => (
                    <div key={index} className="rounded-2xl bg-[var(--color-surface)] p-3">
                      <p className="text-sm font-semibold text-night">{item.title}</p>
                      <p className="text-xs text-night/55">{item.meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary mt-4 w-full rounded-2xl px-4 py-3 text-sm"
            >
              <Check className="h-4 w-4" />
              Sauvegarder mes préférences
            </button>

            <button
              type="button"
              onClick={handleUnsubscribe}
              className="mt-3 w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-night/45 hover:text-night/70"
            >
              Se désabonner de toutes les newsletters
            </button>
          </section>
        </div>
      </section>

      <Link href="/newsletter/unsubscribe" className="text-sm text-night/45 hover:text-coral">
        Gérer le désabonnement via le lien email
      </Link>
    </div>
  )
}
