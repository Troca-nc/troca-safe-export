'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Check, Loader2, X } from 'lucide-react'

import { alertsApi, listingsApi } from '@/lib/api'
import { buildAlertLabel, FREQUENCY_OPTIONS, type AlertFrequency } from '@/types/alert.types'
import type { ListingFilters } from '@/hooks/useListingFilters'

type SearchAlertModalProps = {
  open: boolean
  onClose: () => void
  filters: ListingFilters
  categoryLabel?: string | null
  communeLabel?: string | null
}

type PreviewState = {
  total: number
  loading: boolean
  error: string | null
}

function toSearchPreviewParams(filters: ListingFilters) {
  const params: Record<string, string | number> = {
    sort: filters.sort,
    page: 1,
    limit: 1,
  }

  if (filters.q) params.q = filters.q
  if (filters.category) params.category = filters.category
  if (filters.commune_id) params.commune_id = filters.commune_id
  if (filters.province_id) params.province_id = filters.province_id
  if (filters.price_min) params.price_min = filters.price_min
  if (filters.price_max) params.price_max = filters.price_max
  if (filters.condition) params.condition = filters.condition
  if (filters.troc === 'true') params.troc = 'true'
  if (filters.lat && filters.lng) {
    params.lat = filters.lat
    params.lng = filters.lng
    params.radius = filters.radius
  }

  return params
}

function toAlertPayload(filters: ListingFilters, categoryLabel?: string | null, communeLabel?: string | null) {
  return {
    filters: {
      q: filters.q || undefined,
      category_id: filters.category || undefined,
      categorie: categoryLabel || undefined,
      commune_id: filters.commune_id || undefined,
      commune: communeLabel || undefined,
      prix_min: filters.price_min ? Number(filters.price_min) : undefined,
      prix_max: filters.price_max ? Number(filters.price_max) : undefined,
      condition: filters.condition || undefined,
      troc: filters.troc === 'true' ? 'true' : undefined,
      lat: filters.lat || undefined,
      lng: filters.lng || undefined,
      radius: filters.radius,
    },
  }
}

export default function SearchAlertModal({
  open,
  onClose,
  filters,
  categoryLabel,
  communeLabel,
}: SearchAlertModalProps) {
  const [frequency, setFrequency] = useState<AlertFrequency>('daily')
  const [preview, setPreview] = useState<PreviewState>({ total: 0, loading: false, error: null })
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const alertLabel = useMemo(() => {
    const baseFilters = {
      ...filters,
      categorie: categoryLabel ?? undefined,
      commune: communeLabel ?? undefined,
    }
    return buildAlertLabel(baseFilters)
  }, [categoryLabel, communeLabel, filters])

  useEffect(() => {
    if (!open) return

    let alive = true
    setPreview({ total: 0, loading: true, error: null })

    listingsApi.search(toSearchPreviewParams(filters))
      .then((response) => {
        if (!alive) return
        const total = Number(response.data?.pagination?.total ?? 0)
        setPreview({ total, loading: false, error: null })
        setSavedCount(null)
        setError(null)
      })
      .catch(() => {
        if (!alive) return
        setPreview({ total: 0, loading: false, error: 'Impossible de calculer le nombre d’annonces pour le moment.' })
      })

    return () => {
      alive = false
    }
  }, [filters, open])

  useEffect(() => {
    if (!open) {
      setSaving(false)
      setSavedCount(null)
      setError(null)
      setPreview({ total: 0, loading: false, error: null })
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await alertsApi.create({
        label: alertLabel,
        frequency,
        filters: toAlertPayload(filters, categoryLabel, communeLabel).filters,
      })
      const created = response.data?.data ?? response.data
      setSavedCount(Number(created?.nb_results ?? preview.total ?? 0))
    } catch (err) {
      const response = err as { response?: { data?: { error?: string } } }
      setError(response.response?.data?.error ?? 'Impossible de créer l’alerte pour le moment.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const resultCount = savedCount ?? preview.total
  const isSuccess = savedCount != null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night/55 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={saving ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.22)]">
        {/* TODO: test E2E sur la création d’alerte, le compteur et la confirmation email. */}
        <div className="flex items-start justify-between gap-4 border-b border-night/8 px-5 py-4 md:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
              {isSuccess ? <Check className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/70">Alerte de recherche</p>
              <h2 className="mt-1 text-xl font-bold text-night">
                {isSuccess ? 'Alerte créée' : 'Créer une alerte'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-night/10 text-night/45 transition hover:bg-sand hover:text-night"
            aria-label="Fermer la modale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6">
          {!isSuccess ? (
            <>
              <div className="rounded-[1.5rem] border border-night/8 bg-sand/25 p-4">
                <p className="text-sm font-semibold text-night">"{alertLabel}"</p>
                <p className="mt-2 text-sm leading-6 text-night/65">
                  {preview.loading
                    ? 'Calcul des résultats en cours...'
                    : preview.error ?? `${resultCount.toLocaleString('fr-FR')} annonces correspondent actuellement à ces critères.`}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                    Fréquence de notification
                  </label>
                  <div className="space-y-2">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                          frequency === option.value
                            ? 'border-coral bg-coral/5'
                            : 'border-night/10 bg-white hover:bg-sand'
                        }`}
                      >
                        <input
                          type="radio"
                          name="search-alert-frequency"
                          checked={frequency === option.value}
                          onChange={() => setFrequency(option.value)}
                          className="accent-coral"
                        />
                        <div>
                          <p className="text-sm font-semibold text-night">{option.label}</p>
                          <p className="text-xs text-night/50">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-lagoon/20 bg-lagoon/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Résumé</p>
                  <div className="mt-3 space-y-2 text-sm text-night/65">
                    <p>
                      <span className="font-semibold text-night">Résultats actuels</span>
                      <br />
                      {preview.loading
                        ? 'Chargement...'
                        : `${resultCount.toLocaleString('fr-FR')} annonces`}
                    </p>
                    <p>
                      <span className="font-semibold text-night">Canal</span>
                      <br />
                      Email de confirmation
                    </p>
                    {communeLabel ? (
                      <p>
                        <span className="font-semibold text-night">Commune</span>
                        <br />
                        {communeLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              ) : null}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-900">
                {resultCount.toLocaleString('fr-FR')} annonces correspondent actuellement à ces critères.
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/75">
                Votre alerte a été activée. Un email de confirmation a été envoyé avec le résumé des critères et le lien de gestion.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/alertes"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Gérer mes alertes
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {!isSuccess ? (
          <div className="flex flex-col-reverse gap-3 border-t border-night/8 px-5 py-4 sm:flex-row sm:justify-end md:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-sand"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || preview.loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Création…' : 'Activer l’alerte'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

