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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={saving ? undefined : onClose} />
      <div
        id="search-alert-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-alert-title"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-block border border-warm-border bg-cream-surface text-ink shadow-modal"
      >
        <div className="flex items-start justify-between gap-4 border-b border-warm-border px-5 py-4 md:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-control bg-info/15 text-ink">
              {isSuccess ? <Check className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-eyebrow uppercase text-ink">Alerte de recherche</p>
              <h2 id="search-alert-title" className="mt-1 font-display text-h3 text-ink">
                {isSuccess ? 'Alerte créée' : 'Créer une alerte'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-warm-border text-ink/55 transition hover:bg-cream-sunken hover:text-ink"
            aria-label="Fermer la modale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6">
          {!isSuccess ? (
            <>
              <div className="rounded-card border border-warm-border bg-cream-sunken p-4">
                <p className="text-body-sm font-semibold text-ink">« {alertLabel} »</p>
                <p className="mt-2 text-body-sm leading-6 text-ink/75">
                  {preview.loading
                    ? 'Calcul des résultats en cours...'
                    : preview.error || `${resultCount.toLocaleString('fr-FR')} annonces correspondent actuellement à ces critères.`}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-2">
                  <p className="text-eyebrow uppercase text-ink/75">
                    Fréquence de notification
                  </p>
                  <div className="space-y-2">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                          frequency === option.value
                            ? 'border-info bg-info/10'
                            : 'border-warm-border bg-cream-surface hover:bg-cream-sunken'
                        }`}
                      >
                        <input
                          type="radio"
                          name="search-alert-frequency"
                          checked={frequency === option.value}
                          onChange={() => setFrequency(option.value)}
                          className="accent-info"
                        />
                        <div>
                          <p className="text-body-sm font-semibold text-ink">{option.label}</p>
                          <p className="text-body-sm text-ink/75">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-info/30 bg-info/10 p-4">
                  <p className="text-eyebrow uppercase text-ink">Résumé</p>
                  <div className="mt-3 space-y-2 text-body-sm text-ink/75">
                    <p>
                      <span className="font-semibold text-ink">Résultats actuels</span>
                      <br />
                      {preview.loading
                        ? 'Chargement...'
                        : `${resultCount.toLocaleString('fr-FR')} annonces`}
                    </p>
                    <p>
                      <span className="font-semibold text-ink">Canal</span>
                      <br />
                      Email de confirmation
                    </p>
                    {communeLabel ? (
                      <p>
                        <span className="font-semibold text-ink">Commune</span>
                        <br />
                        {communeLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <p className="rounded-control border border-alert-error/30 bg-alert-error/10 px-4 py-3 text-body-sm text-alert-error">{error}</p>
              ) : null}
            </>
          ) : (
            <div className="rounded-card border border-success/30 bg-success-soft p-5">
              <p className="text-body-sm font-semibold text-success-text">
                {resultCount.toLocaleString('fr-FR')} annonces correspondent actuellement à ces critères.
              </p>
              <p className="mt-2 text-body-sm leading-6 text-success-text">
                Votre alerte a été activée. Un email de confirmation a été envoyé avec le résumé des critères et le lien de gestion.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/alertes"
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-success px-4 py-3 text-body-sm font-semibold text-cream transition hover:brightness-95"
                >
                  Gérer mes alertes
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center justify-center rounded-control border border-warm-border bg-cream-surface px-4 py-3 text-body-sm font-semibold text-ink transition hover:bg-cream-sunken"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {!isSuccess ? (
          <div className="flex flex-col-reverse gap-3 border-t border-warm-border px-5 py-4 sm:flex-row sm:justify-end md:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-warm-border bg-cream-surface px-4 py-3 text-body-sm font-semibold text-ink transition hover:bg-cream-sunken"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || preview.loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent-strong px-4 py-3 text-body-sm font-semibold text-cream transition hover:bg-accent-strongHover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-text"
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
