'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { listingsApi, metaApi, uploadApi } from '@/lib/api'
import { useAutosave, useBeforeUnload } from '@/hooks/useAutosave'
import { useAuthStore } from '@/store/authStore'

type CommuneOption = {
  id: number
  name: string
  province_name?: string | null
}

type CategoryOption = {
  id: number
  name: string
  slug: string
}

type WizardDraft = {
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

type PhotoItem = {
  id: string
  file: File
  preview: string
}

const INITIAL_DRAFT: WizardDraft = {
  step: 1,
  title: '',
  category_id: '',
  description: '',
  price: '',
  commune_id: '',
  duration_days: '30',
  condition: 'good',
  price_negotiable: false,
  is_free: false,
}

const PREVIEW_STORAGE_KEY = 'preview_listing'

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function StepBadge({ index, active, done }: { index: number; active: boolean; done: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
        done ? 'bg-jungle text-white' : active ? 'bg-night text-white' : 'bg-sand text-night/45'
      }`}
    >
      {done ? <Check className="h-4 w-4" /> : index}
    </div>
  )
}

function WizardStepper({ step }: { step: number }) {
  const items = [
    { label: 'Détails', index: 1 },
    { label: 'Photos', index: 2 },
    { label: 'Publication', index: 3 },
  ]

  return (
    <div className="rounded-[1.75rem] border border-night/8 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {items.map((item, idx) => {
          const active = step === item.index
          const done = step > item.index
          return (
            <div key={item.label} className="flex flex-1 items-center gap-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <StepBadge index={item.index} active={active} done={done} />
                <span className={`text-xs font-semibold ${active ? 'text-night' : 'text-night/45'}`}>{item.label}</span>
              </div>
              {idx < items.length - 1 && <div className="h-px flex-1 bg-night/10" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PhotoGrid({
  photos,
  onAddFiles,
  onRemove,
  onMove,
}: {
  photos: PhotoItem[]
  onAddFiles: (files: FileList | File[]) => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="space-y-4">
      <div
        className={`rounded-[1.75rem] border-2 border-dashed p-5 transition-colors ${
          dragOver ? 'border-coral bg-coral/5' : 'border-night/15 bg-sand/20'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          if (event.dataTransfer.files.length) {
            onAddFiles(event.dataTransfer.files)
          }
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-coral shadow-sm">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-night">
              {dragOver ? 'Déposez vos photos ici' : 'Ajoutez 1 à 8 photos'}
            </p>
            <p className="mt-1 text-sm text-night/55">
              Glissez-déposez ou cliquez pour choisir vos images. Les 8 premières sont conservées.
            </p>
          </div>
          <p className="text-xs text-night/40">JPEG, PNG, WebP, HEIC</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            onAddFiles(event.target.files)
          }
          event.target.value = ''
        }}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null && dragIndex !== index) {
                  onMove(dragIndex, index)
                }
                setDragIndex(null)
              }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-night/10 bg-sand"
            >
              <img src={photo.preview} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-night/70 to-transparent p-3 text-white">
                <span className="truncate text-xs font-medium">{photo.file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Supprimer la photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PublishWizard() {
  const router = useRouter()
  const userId = useAuthStore((state) => state.user?.id ?? 'guest')
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [communces, setCommunces] = useState<CommuneOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    pendingDraft,
    draftAgeLabel,
    isDirty,
    acceptDraft,
    discardDraft,
    clearDraft,
  } = useAutosave(`draft_listing_${userId}`, draft, 30_000)
  useBeforeUnload(isDirty && !submitting)

  useEffect(() => {
    let alive = true
    Promise.all([metaApi.getCommunes(), metaApi.getCategories()])
      .then(([communesRes, categoriesRes]) => {
        if (!alive) return
        setCommunces(communesRes.data?.data ?? [])
        const rawCategories = categoriesRes.data?.data ?? []
        setCategories(Array.isArray(rawCategories) ? rawCategories : [])
      })
      .catch(() => {
        if (!alive) return
        setCommunces([])
        setCategories([])
      })
      .finally(() => {
        if (alive) setLoadingMeta(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!pendingDraft) return
    setDraft((current) => ({
      ...current,
      ...pendingDraft.data,
      step: Number(pendingDraft.data.step || current.step),
    }))
  }, [pendingDraft])

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        if (photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview)
        }
      }
    }
  }, [photos])

  const selectedCommune = useMemo(
    () => communces.find((item) => String(item.id) === draft.commune_id),
    [communces, draft.commune_id]
  )

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === draft.category_id),
    [categories, draft.category_id]
  )

  const canGoNext = useMemo(() => {
    if (draft.step === 1) {
      return Boolean(draft.title.trim() && draft.category_id && draft.description.trim())
    }
    if (draft.step === 2) {
      return photos.length >= 1 && photos.length <= 8
    }
    return Boolean(draft.price.trim() && draft.commune_id && draft.duration_days)
  }, [draft, photos.length])

  const restoreDraft = () => {
    const pending = pendingDraft
    if (!pending) return
    setDraft((current) => ({
      ...current,
      ...pending.data,
      step: Number(pending.data.step || current.step),
    }))
    acceptDraft(pending)
    setError('')
    setSuccess(null)
  }

  const ignoreDraft = () => {
    discardDraft()
  }

  const addPhotos = (files: FileList | File[]) => {
    const incoming = Array.from(files)
    if (!incoming.length) return

    setPhotos((current) => {
      const combined = [...current]
      for (const file of incoming) {
        if (combined.length >= 8) break
        combined.push({
          id: makeId(),
          file,
          preview: URL.createObjectURL(file),
        })
      }
      return combined
    })
    setError('')
  }

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const target = current[index]
      if (target?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview)
      }
      return current.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const movePhoto = (from: number, to: number) => {
    setPhotos((current) => moveItem(current, from, to))
  }

  const handlePreview = () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }

    if (typeof window === 'undefined') return

    const payload = {
      draft: {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
      },
      category_name: selectedCategory?.name ?? null,
      commune_name: selectedCommune?.name ?? null,
      photos: photos.map((photo, index) => ({
        id: photo.id,
        name: photo.file.name,
        preview: photo.preview,
        isPrimary: index === 0,
      })),
      updated_at: new Date().toISOString(),
    }

    try {
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(payload))
      window.open('/annonces/preview', '_blank')
    } catch {
      setError('Impossible d’ouvrir la prévisualisation pour le moment.')
    }
  }

  // TODO: test E2E sur le wizard de publication, l'autosave et le mode simple.
  const validateStep = () => {
    if (draft.step === 1) {
      if (!draft.title.trim()) return 'Le titre est requis.'
      if (!draft.category_id) return 'La catégorie est requise.'
      if (!draft.description.trim()) return 'La description est requise.'
    }
    if (draft.step === 2) {
      if (photos.length < 1) return 'Ajoutez au moins une photo.'
      if (photos.length > 8) return 'Vous ne pouvez pas dépasser 8 photos.'
    }
    if (draft.step === 3) {
      if (!draft.price.trim()) return 'Le prix est requis.'
      if (!draft.commune_id) return 'La localisation est requise.'
      if (!draft.duration_days) return 'La durée est requise.'
    }
    return ''
  }

  const handleNext = () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }
    setError('')
    setDraft((current) => ({ ...current, step: Math.min(3, current.step + 1) }))
  }

  const handlePrevious = () => {
    setError('')
    setDraft((current) => ({ ...current, step: Math.max(1, current.step - 1) }))
  }

  const handleSubmit = async () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        category_id: Number(draft.category_id),
        commune_id: Number(draft.commune_id),
        condition: draft.condition,
        price: draft.is_free ? null : Number(draft.price),
        is_free: draft.is_free,
        price_negotiable: draft.price_negotiable,
        is_negotiable: draft.price_negotiable,
        duration_days: Number(draft.duration_days),
      }

      const response = await listingsApi.create(payload)
      const createdId = response.data?.data?.id
      if (!createdId) {
        throw new Error('Impossible de créer l’annonce.')
      }

      if (photos.length) {
        await uploadApi.uploadImages(String(createdId), photos.map((photo) => photo.file))
      }

      clearDraft()
      setSuccess('Annonce publiée avec succès.')
      router.push(`/annonces/${createdId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'La publication a échoué.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitle = draft.step === 1
    ? 'Décrivez votre annonce'
    : draft.step === 2
      ? 'Ajoutez vos photos'
      : 'Finalisez la publication'

  return (
    <div className="min-h-screen bg-sand-light">
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-coral/15 bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              <Sparkles className="h-3.5 w-3.5" />
              Publication guidée
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-night md:text-4xl">{stepTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60 md:text-base">
              Un parcours en 3 étapes pour publier vite, sans perdre de données, même avec une connexion mobile limitée.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/annonces/nouvelle?mode=simple')}
              className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night shadow-sm transition hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Mode simple
            </button>
          </div>
        </div>

        {pendingDraft ? (
          <div className="mb-6 rounded-[1.5rem] border border-lagoon/20 bg-lagoon/8 p-4 text-night shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Brouillon restauré</p>
                <p className="mt-1 text-sm text-night/70">
                  Brouillon restauré {draftAgeLabel ? `- ${draftAgeLabel}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={restoreDraft} className="rounded-2xl bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-night/90">
                  Restaurer
                </button>
                <button type="button" onClick={ignoreDraft} className="rounded-2xl border border-night/10 bg-white px-4 py-2 text-sm font-semibold text-night transition hover:bg-sand">
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="space-y-5 rounded-[2rem] border border-night/8 bg-white/95 p-5 shadow-card">
            <WizardStepper step={draft.step} />

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                {success}
              </div>
            ) : null}

            {draft.step === 1 && (
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Titre *</span>
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex. iPhone 14 en excellent état"
                    className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Catégorie *</span>
                  <select
                    value={draft.category_id}
                    onChange={(event) => setDraft((current) => ({ ...current, category_id: event.target.value }))}
                    disabled={loadingMeta}
                    className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                  >
                    <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une catégorie'}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Description *</span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    rows={6}
                    placeholder="Décrivez l'état, l'historique, les accessoires inclus et ce qui rassure l'acheteur."
                    className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                  />
                </label>
              </div>
            )}

            {draft.step === 2 && (
              <div className="space-y-4">
                <PhotoGrid photos={photos} onAddFiles={addPhotos} onRemove={removePhoto} onMove={movePhoto} />
                <p className="text-xs text-night/45">
                  Ajoutez jusqu&apos;à 8 photos. Le réordonnancement conserve la première photo comme couverture principale.
                </p>
              </div>
            )}

            {draft.step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Prix *</span>
                    <input
                      value={draft.price}
                      onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                      inputMode="numeric"
                      placeholder="Ex. 15000"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Localisation *</span>
                    <select
                      value={draft.commune_id}
                      onChange={(event) => setDraft((current) => ({ ...current, commune_id: event.target.value }))}
                      disabled={loadingMeta}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                    >
                      <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une commune'}</option>
                      {communces.map((commune) => (
                        <option key={commune.id} value={commune.id}>
                          {commune.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-night">
                      <CalendarDays className="h-4 w-4 text-coral" />
                      Durée de mise en ligne *
                    </span>
                    <select
                      value={draft.duration_days}
                      onChange={(event) => setDraft((current) => ({ ...current, duration_days: event.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    >
                      <option value="30">30 jours</option>
                      <option value="60">60 jours</option>
                      <option value="90">90 jours</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">État</span>
                    <select
                      value={draft.condition}
                      onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value as WizardDraft['condition'] }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    >
                      <option value="new">Neuf</option>
                      <option value="like_new">Comme neuf</option>
                      <option value="good">Bon état</option>
                      <option value="fair">Correct</option>
                      <option value="for_parts">Pour pièces</option>
                    </select>
                  </label>

                  <label className="flex items-end gap-3 rounded-2xl border border-night/10 bg-sand px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.price_negotiable}
                      onChange={(event) => setDraft((current) => ({ ...current, price_negotiable: event.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-night/20 text-coral focus:ring-coral/25"
                    />
                    <span className="text-sm text-night">Prix négociable</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {draft.step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-5 py-3 text-sm font-semibold text-night transition hover:bg-sand"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </button>
              ) : null}

              {draft.step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-night px-5 py-3 text-sm font-semibold text-white transition hover:bg-night/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Publication...' : 'Publier l’annonce'}
                </button>
              )}

              {draft.step === 3 ? (
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 rounded-2xl border border-lagoon/25 bg-lagoon/8 px-5 py-3 text-sm font-semibold text-night transition hover:bg-lagoon/12"
                >
                  Prévisualiser
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => router.push('/annonces')}
                className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-5 py-3 text-sm font-semibold text-night transition hover:bg-sand"
              >
                Voir les annonces
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-night/8 bg-[linear-gradient(180deg,_rgba(8,32,50,0.98),_rgba(8,32,50,0.9))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
                <Sparkles className="h-3.5 w-3.5" />
                Aperçu
              </div>

              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/45">Résumé rapide</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {draft.price ? `${Number(draft.price || 0).toLocaleString('fr-FR')} XPF` : '0 XPF'}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {draft.title.trim() || 'Votre annonce apparaîtra ici.'}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Catégorie</p>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedCategory?.name || 'Non sélectionnée'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Commune</p>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedCommune?.name || 'Non sélectionnée'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Checklist</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Titre et catégorie renseignés
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Photos préparées pour l&apos;upload
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Prix, commune et durée validés
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Publication optimisée pour les connexions mobiles lentes
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
