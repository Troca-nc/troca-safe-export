'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, Eye, MapPin, Sparkles, X } from 'lucide-react'

import Header from '@/components/layout/Header'

type PreviewPhoto = {
  id: string
  name: string
  preview: string
  isPrimary: boolean
}

type PreviewDraft = {
  step: number
  title: string
  category_id: string
  description: string
  price: string
  commune_id: string
  duration_days: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts'
  price_negotiable: boolean
  is_free: boolean
}

type PreviewPayload = {
  draft: PreviewDraft
  category_name: string | null
  commune_name: string | null
  photos: PreviewPhoto[]
  updated_at: string
}

const PREVIEW_STORAGE_KEY = 'preview_listing'

function readPreviewPayload(): PreviewPayload | null {
  if (typeof window === 'undefined') return null

  const sources: Array<string | null> = [window.sessionStorage.getItem(PREVIEW_STORAGE_KEY)]
  try {
    sources.push(window.opener?.sessionStorage?.getItem(PREVIEW_STORAGE_KEY) ?? null)
  } catch {
    sources.push(null)
  }

  for (const raw of sources) {
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as PreviewPayload
      if (parsed?.draft?.title && Array.isArray(parsed.photos)) {
        return parsed
      }
    } catch {
      // Ignore malformed previews and continue to the next storage source.
    }
  }

  return null
}

function formatCondition(condition: PreviewDraft['condition']) {
  const labels: Record<PreviewDraft['condition'], string> = {
    new: 'Neuf',
    like_new: 'Comme neuf',
    good: 'Bon état',
    fair: 'Correct',
    for_parts: 'Pour pièces',
  }

  return labels[condition]
}

export default function ListingPreviewPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<PreviewPayload | null>(null)

  useEffect(() => {
    setPreview(readPreviewPayload())
  }, [])

  const primaryPhoto = preview?.photos[0] ?? null
  const priceLabel = useMemo(() => {
    if (!preview) return ''
    if (preview.draft.is_free) return 'Gratuit'
    if (!preview.draft.price) return 'Prix à débattre'
    return `${Number(preview.draft.price).toLocaleString('fr-FR')} XPF`
  }, [preview])

  const handleReturn = () => {
    try {
      window.opener?.focus?.()
      window.close()
    } catch {
      router.push('/annonces/nouvelle')
    }
  }

  if (!preview) {
    return (
      <div className="min-h-screen bg-sand-light">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm md:p-8">
            {/* TODO: test E2E sur la prévisualisation avant publication et la fermeture de l'onglet. */}
            <div className="inline-flex items-center gap-2 rounded-full border border-coral/15 bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              <Eye className="h-3.5 w-3.5" />
              Prévisualisation introuvable
            </div>
            <h1 className="mt-4 text-3xl font-bold text-night">Aucune annonce à prévisualiser</h1>
            <p className="mt-3 text-sm leading-6 text-night/60">
              Retournez à la publication pour générer un brouillon de prévisualisation.
            </p>
            <button
              type="button"
              onClick={() => router.push('/annonces/nouvelle')}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Revenir à la publication
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="sticky top-4 z-20 mb-6 rounded-[1.5rem] border border-coral/15 bg-coral/8 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-coral text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-night">Mode prévisualisation</p>
                <p className="text-sm text-night/60">
                  Cette annonce n&apos;est pas encore publiée.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-night px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-night/90"
            >
              <Check className="h-4 w-4" />
              Revenir et publier
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="space-y-4 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm md:p-6">
            <div className="overflow-hidden rounded-[1.75rem] border border-night/8 bg-sand">
              <div className="relative aspect-[4/3] bg-night/5">
                {primaryPhoto ? (
                  <img
                    src={primaryPhoto.preview}
                    alt={preview.draft.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl text-night/20">
                    📦
                  </div>
                )}
              </div>
              {preview.photos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-night/8 p-3">
                  {preview.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border ${
                        photo.isPrimary ? 'border-coral' : 'border-night/10'
                      }`}
                    >
                      <img src={photo.preview} alt={photo.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-night/45">
              <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1">
                <MapPin className="h-3 w-3" />
                {preview.commune_name ?? 'Nouvelle-Calédonie'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1">
                <CalendarDays className="h-3 w-3" />
                {preview.draft.duration_days} jours
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1">
                <Sparkles className="h-3 w-3" />
                {formatCondition(preview.draft.condition)}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-night">{preview.draft.title}</h1>
              <p className="text-2xl font-bold text-coral">{priceLabel}</p>
              <div className="rounded-2xl border border-night/8 bg-night/[0.03] p-4">
                <p className="text-sm leading-7 whitespace-pre-line text-night/75">
                  {preview.draft.description}
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Résumé</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-night/45">Catégorie</span>
                  <span className="font-semibold text-night">{preview.category_name ?? 'Non sélectionnée'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-night/45">Commune</span>
                  <span className="font-semibold text-night">{preview.commune_name ?? 'Non sélectionnée'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-night/45">Photos</span>
                  <span className="font-semibold text-night">{preview.photos.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-night/45">Prix négociable</span>
                  <span className="font-semibold text-night">{preview.draft.price_negotiable ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-night/45">Annonce gratuite</span>
                  <span className="font-semibold text-night">{preview.draft.is_free ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-night/8 bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(8,32,50,0.9))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lagoon">Conseil</p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Vérifiez le cadrage des photos et les informations de prix avant de publier.
              </p>
              <button
                type="button"
                onClick={handleReturn}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-sand"
              >
                <X className="h-4 w-4" />
                Revenir et publier
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

