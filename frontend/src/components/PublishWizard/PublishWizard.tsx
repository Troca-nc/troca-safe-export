'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft,
  CalendarDays,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Layers3,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { listingsApi, metaApi, uploadApi } from '@/lib/api'
import { useAutosave, useBeforeUnload } from '@/hooks/useAutosave'
import { useAuthStore } from '@/store/authStore'
import CategoryFields from '@/components/annonces/CategoryFields'
import ListingCoachCard from '@/components/annonces/ListingCoachCard'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { getCategoryIcon } from '@/lib/categoryPresentation'
import { compressImage } from '@/lib/imageCompressor'
import { findCategoryNodeById, findCategoryPathById } from '@/shared-copy/categoryTaxonomy'

type CommuneOption = {
  id: number
  name: string
  province_name?: string | null
  slug?: string
}

type ProvinceOption = {
  id: number
  name: string
  slug: string
  code?: string
  communes: CommuneOption[]
}

type CategoryOption = {
  id: number
  name: string
  slug: string
  icon?: string
  children?: CategoryOption[]
  subcategories?: CategoryOption[]
}

type WizardDraft = {
  step: number
  title: string
  category_id: string
  description: string
  price: string
  commune_id: string
  quartier_zone: string
  duration_days: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts'
  price_negotiable: boolean
  is_free: boolean
  is_troc: boolean
  contre_quoi: string
  metadata: Record<string, unknown>
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
  quartier_zone: '',
  duration_days: '30',
  condition: 'good',
  price_negotiable: false,
  is_free: false,
  is_troc: false,
  contre_quoi: '',
  metadata: {},
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

function getCategoryChildren(category?: CategoryOption | null) {
  return category?.children || category?.subcategories || []
}

function flattenCommunes(provinces: ProvinceOption[]) {
  return provinces.flatMap((province) => (
    province.communes.map((commune) => ({
      ...commune,
      province_id: province.id,
      province_name: province.name,
      province_slug: province.slug,
    }))
  ))
}

function isLeafCategory(category?: CategoryOption | null) {
  return getCategoryChildren(category).length === 0
}

function snapTo10(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim())
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed / 10) * 10)
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
    { label: 'D�tails', index: 1 },
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
  onAddFiles: (files: FileList | File[]) => void | Promise<void>
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
            void onAddFiles(event.dataTransfer.files)
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
              {dragOver ? 'D�posez vos photos ici' : 'Ajoutez 1 � 8 photos'}
            </p>
            <p className="mt-1 text-sm text-night/55">
              Glissez-d�posez ou cliquez pour choisir vos images. Les 8 premi�res sont conserv�es.
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
            void onAddFiles(event.target.files)
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

function PublicationPreview({
  draft,
  selectedCategory,
  selectedCommune,
}: {
  draft: WizardDraft
  selectedCategory?: CategoryOption | null
  selectedCommune?: CommuneOption | null
}) {
  return (
    <div className="rounded-[2rem] border border-night/8 bg-[#0c2a35] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
        <Sparkles className="h-3.5 w-3.5" />
        Aper�u
      </div>

      <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/45">R�sum� rapide</p>
      <p className="mt-2 text-3xl font-bold text-white">
        {draft.price ? `${Number(draft.price || 0).toLocaleString('fr-FR')} XPF` : '0 XPF'}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        {draft.title.trim() || "Votre annonce s'affichera ici en temps r�el."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Cat�gorie</p>
          <p className="mt-2 text-sm font-semibold text-white">{selectedCategory?.name || '� choisir'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Commune</p>
          <p className="mt-2 text-sm font-semibold text-white">{selectedCommune?.name || '� compl�ter'}</p>
        </div>
      </div>
    </div>
  )
}

export default function PublishWizard() {
  const router = useRouter()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const userId = useAuthStore((state) => state.user?.id ?? 'guest')
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [communces, setCommunces] = useState<ProvinceOption[]>([])
  const [zoneOptions, setZoneOptions] = useState<string[]>([])
  const [zoneLoading, setZoneLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoryTrailIds, setCategoryTrailIds] = useState<number[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const metadataForm = useForm<{ metadata: Record<string, unknown> }>({ defaultValues: { metadata: {} } })
  const {
    register: registerMetadata,
    formState: { errors: metadataErrors },
  } = metadataForm
  const metadataValues = metadataForm.watch()
  const metadataPayload = metadataValues?.metadata ?? {}
  const metadataSignature = JSON.stringify(metadataPayload)

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
        setCategories(
          isDemoMode
            ? (FALLBACK_CATEGORIES as unknown as CategoryOption[])
            : (Array.isArray(rawCategories) ? rawCategories : [])
        )
      })
      .catch(() => {
        if (!alive) return
        setCommunces([])
        setCategories(FALLBACK_CATEGORIES as unknown as CategoryOption[])
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
    metadataForm.reset({ metadata: (pendingDraft.data.metadata as Record<string, unknown>) ?? {} })
  }, [pendingDraft])

  useEffect(() => {
    setDraft((current) => {
      const currentSignature = JSON.stringify(current.metadata ?? {})
      if (currentSignature === metadataSignature) {
        return current
      }
      return {
        ...current,
        metadata: metadataPayload,
      }
    })
  }, [metadataSignature, metadataPayload])

  useEffect(() => {
    if (!categories.length) return
    if (!draft.category_id) return

    const path = findCategoryPathById(categories as any, draft.category_id)
    if (!path.length) return

    setCategoryTrailIds(path.map((node) => Number(node.id)))

    const last = path[path.length - 1]
    if (last && !isLeafCategory(last)) {
      setDraft((current) => ({
        ...current,
        category_id: '',
      }))
    }
  }, [categories, draft.category_id])

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
    () => flattenCommunes(communces).find((item) => String(item.id) === draft.commune_id),
    [communces, draft.commune_id]
  )

  useEffect(() => {
    let alive = true

    if (!selectedCommune?.slug) {
      setZoneOptions([])
      setZoneLoading(false)
      return () => {
        alive = false
      }
    }

    setZoneLoading(true)
    metaApi.getZones(selectedCommune.slug)
      .then((response) => {
        if (!alive) return
        const zones = Array.isArray(response.data?.data?.zones) ? response.data.data.zones : []
        setZoneOptions(zones.filter(Boolean))
      })
      .catch(() => {
        if (!alive) return
        setZoneOptions([])
      })
      .finally(() => {
        if (alive) setZoneLoading(false)
      })

    return () => {
      alive = false
    }
  }, [selectedCommune?.slug])

  const selectedCategory = useMemo(
    () => findCategoryNodeById((isDemoMode ? FALLBACK_CATEGORIES : categories) as any, draft.category_id),
    [categories, draft.category_id, isDemoMode]
  )

  const activeCategoryNode = useMemo(() => {
    if (!categoryTrailIds.length) return null
    return findCategoryNodeById(categories as any, categoryTrailIds[categoryTrailIds.length - 1])
  }, [categories, categoryTrailIds])

  const activeCategoryChildren = useMemo(() => {
    if (!activeCategoryNode) return isDemoMode ? FALLBACK_CATEGORIES : categories
    return getCategoryChildren(activeCategoryNode)
  }, [activeCategoryNode, categories, isDemoMode])

  const categoryTrail = useMemo(() => {
    if (!categoryTrailIds.length) return []
    return categoryTrailIds
      .map((id) => findCategoryNodeById((isDemoMode ? FALLBACK_CATEGORIES : categories) as any, id))
      .filter(Boolean) as CategoryOption[]
  }, [categories, categoryTrailIds, isDemoMode])

  const selectedCategoryPath = useMemo(() => {
    if (!draft.category_id) return []
    return findCategoryPathById((isDemoMode ? FALLBACK_CATEGORIES : categories) as any, draft.category_id) as CategoryOption[]
  }, [categories, draft.category_id, isDemoMode])

  const canGoNext = useMemo(() => {
    if (draft.step === 1) {
      return Boolean(
        draft.title.trim() &&
        draft.category_id &&
        draft.description.trim() &&
        selectedCategory &&
        isLeafCategory(selectedCategory)
      )
    }
    if (draft.step === 2) {
      return photos.length >= 1 && photos.length <= 8
    }
    return Boolean(draft.price.trim() && draft.commune_id && draft.duration_days)
  }, [draft, photos.length, selectedCategory])

  const restoreDraft = () => {
    const pending = pendingDraft
    if (!pending) return
    setDraft((current) => ({
      ...current,
      ...pending.data,
      step: Number(pending.data.step || current.step),
    }))
    metadataForm.reset({ metadata: (pending.data.metadata as Record<string, unknown>) ?? {} })
    acceptDraft(pending)
    setError('')
    setSuccess(null)
  }

  const ignoreDraft = () => {
    discardDraft()
    metadataForm.reset({ metadata: {} })
  }

  const openCategoryNode = (category: CategoryOption) => {
    const nextPath = [...categoryTrailIds]
    const existingIndex = nextPath.indexOf(category.id)
    if (existingIndex >= 0) {
      setCategoryTrailIds(nextPath.slice(0, existingIndex + 1))
    } else {
      setCategoryTrailIds([...nextPath, category.id])
    }

    const children = getCategoryChildren(category)
    if (children.length === 0) {
      setDraft((current) => ({
        ...current,
        category_id: String(category.id),
      }))
      return
    }

    setDraft((current) => ({
      ...current,
      category_id: '',
    }))
  }

  const selectCategoryLeaf = (category: CategoryOption) => {
    const path = findCategoryPathById(categories as any, category.id)
    setCategoryTrailIds(path.map((node) => Number(node.id)))
    setDraft((current) => ({
      ...current,
      category_id: String(category.id),
    }))
  }

  const goToCategoryLevel = (index: number) => {
    setCategoryTrailIds((current) => current.slice(0, index + 1))
    const targetId = categoryTrailIds[index]
    const targetNode = targetId ? findCategoryNodeById(categories as any, targetId) : null
    if (targetNode && isLeafCategory(targetNode)) {
      setDraft((current) => ({
        ...current,
        category_id: String(targetNode.id),
      }))
    } else {
      setDraft((current) => ({
        ...current,
        category_id: '',
      }))
    }
  }

  const addPhotos = async (files: FileList | File[]) => {
    const incoming = Array.from(files)
    if (!incoming.length) return

    const optimizedFiles = await Promise.all(
      incoming.slice(0, 8).map(async (file) => {
        if (!file.type.startsWith('image/')) return file
        try {
          return await compressImage(file)
        } catch {
          return file
        }
      })
    )

    setPhotos((current) => {
      const combined = [...current]
      for (const file of optimizedFiles) {
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

  const handlePreview = async () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }

    if (selectedCategory?.slug && isLeafCategory(selectedCategory) && !(await metadataForm.trigger())) {
      setError('Merci de compl�ter les caract�ristiques sp�cifiques.')
      return
    }

    if (typeof window === 'undefined') return

    const payload = {
      draft: {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        contre_quoi: draft.contre_quoi.trim(),
        metadata: metadataPayload,
      },
      category_name: selectedCategory?.name ?? null,
      commune_name: selectedCommune?.name ?? null,
      quartier_zone: draft.quartier_zone || null,
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
      setError('Impossible douvrir la pr�visualisation pour le moment.')
    }
  }

  const validateStep = () => {
    if (draft.step === 1) {
      if (!draft.title.trim()) return 'Le titre est requis.'
      if (!draft.category_id) return 'La cat�gorie est requise.'
      if (!selectedCategory || !isLeafCategory(selectedCategory)) return 'Choisissez la sous-cat�gorie finale.'
      if (!draft.description.trim()) return 'La description est requise.'
    }
    if (draft.step === 2) {
      if (photos.length < 1) return 'Ajoutez au moins une photo.'
      if (photos.length > 8) return 'Vous ne pouvez pas d�passer 8 photos.'
    }
    if (draft.step === 3) {
      if (!draft.price.trim()) return 'Le prix est requis.'
      if (!draft.commune_id) return 'La localisation est requise.'
      if (!draft.duration_days) return 'La dur�e est requise.'
    }
    return ''
  }

  const handleNext = async () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }
    if (draft.step === 1 && selectedCategory?.slug && isLeafCategory(selectedCategory) && !(await metadataForm.trigger())) {
      setError('Merci de compl�ter les caract�ristiques sp�cifiques.')
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

    if (selectedCategory?.slug && isLeafCategory(selectedCategory) && !(await metadataForm.trigger())) {
      setError('Merci de compl�ter les caract�ristiques sp�cifiques.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const normalizedMetadata = Object.fromEntries(
        Object.entries(metadataPayload).map(([key, value]) => {
          if (!(/_xpf$|price|tarif/i.test(key))) return [key, value]
          if (value == null || value === '') return [key, value]
          const parsed = Number(value)
          return Number.isFinite(parsed) ? [key, snapTo10(parsed)] : [key, value]
        }),
      )

      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        category_id: Number(draft.category_id),
        commune_id: Number(draft.commune_id),
        condition: draft.condition,
        price: draft.is_free ? null : snapTo10(draft.price),
        is_free: draft.is_free,
        is_troc: draft.is_troc,
        contre_quoi: draft.is_troc ? draft.contre_quoi.trim() : '',
        price_negotiable: draft.price_negotiable,
        is_negotiable: draft.price_negotiable,
        duration_days: Number(draft.duration_days),
        metadata: {
          ...normalizedMetadata,
          quartier_zone: draft.quartier_zone || null,
        },
      }

      const response = await listingsApi.create(payload)
      const createdId = response.data?.data?.id
      if (!createdId) {
        throw new Error('Impossible de cr�er lannonce.')
      }

      if (photos.length) {
        await uploadApi.uploadImages(String(createdId), photos.map((photo) => photo.file))
      }

      clearDraft()
      setSuccess('Annonce publi�e avec succ�s.')
      router.push(`/annonces/${createdId}?published=1`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'La publication a �chou�.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitle = draft.step === 1
    ? 'D�crivez votre annonce'
    : draft.step === 2
      ? 'Ajoutez vos photos'
      : 'Derniers d�tails'

  return (
    <div className="min-h-screen bg-sand-light">
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mt-3 font-display text-3xl font-bold text-night md:text-4xl">{stepTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60 md:text-base">
              Un parcours en 3 �tapes pour publier vite, sans perdre de donn�es.
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
                <p className="text-sm font-semibold">Brouillon restaur�</p>
                <p className="mt-1 text-sm text-night/70">
                  Brouillon restaur� {draftAgeLabel ? `- ${draftAgeLabel}` : ''}
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
              <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
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
                    placeholder="Ex. iPhone 14 en excellent �tat"
                    className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-semibold text-night">Cat�gorie *</span>
                  <div className="rounded-[1.5rem] border border-night/10 bg-sand/30 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
                      <Layers3 className="h-3.5 w-3.5 text-lagoon" />
                      {categoryTrail.length > 0 ? (
                        categoryTrail.map((node, index) => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => goToCategoryLevel(index)}
                            className="rounded-full bg-white px-2.5 py-1 text-night/70 transition hover:bg-sand hover:text-night"
                          >
                            {(() => {
                              const TrailIcon = getCategoryIcon(node.slug, node.name, node.icon)
                              return <TrailIcon className="mr-1 inline-block h-3.5 w-3.5 align-[-2px] text-nc-lagon" />
                            })()}
                            {node.name}
                          </button>
                        ))
                      ) : (
                        <span>Choisissez une famille puis la sous-cat�gorie finale</span>
                      )}
                    </div>

                    {loadingMeta ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-night/10 bg-white/70 px-4 py-6 text-center text-sm text-night/45">
                        Chargement des cat�gories...
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-night">
                              {activeCategoryNode ? activeCategoryNode.name : 'Cat�gories principales'}
                            </p>
                            <p className="mt-1 text-xs text-night/45">
                              {activeCategoryNode
                                ? 'Choisissez une sous-cat�gorie finale.'
                                : 'Commencez par une famille.'}
                            </p>
                          </div>
                          {categoryTrail.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => goToCategoryLevel(Math.max(0, categoryTrail.length - 2))}
                              className="rounded-full border border-night/10 bg-white px-3 py-2 text-xs font-semibold text-night/70 transition hover:bg-sand"
                            >
                              {categoryTrail.length > 1 ? 'Retour' : 'Racine'}
                            </button>
                          ) : null}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {activeCategoryChildren.map((category) => {
                            const children = getCategoryChildren(category)
                            const selected = draft.category_id === String(category.id)
                            const parentActive = categoryTrail.some((node) => node.id === category.id)
                            const CategoryIcon = getCategoryIcon(category.slug, category.name, category.icon)

                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => (children.length > 0 ? openCategoryNode(category) : selectCategoryLeaf(category))}
                                className={`group flex min-h-[88px] items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                  selected
                                    ? 'border-nc-lagon bg-nc-lagon text-white shadow-[0_18px_35px_rgba(30,144,255,0.18)]'
                                    : parentActive
                                      ? 'border-lagoon/40 bg-lagoon/8 text-night'
                                      : 'border-night/10 bg-white hover:border-lagoon/25 hover:bg-sand'
                                }`}
                              >
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                  selected ? 'bg-white/15 text-white' : 'bg-sand text-lagoon'
                                }`}>
                                  <CategoryIcon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-semibold">{category.name}</span>
                                  <span className={`mt-1 block text-xs ${selected ? 'text-white/70' : 'text-night/45'}`}>
                                    {children.length > 0
                                      ? `${children.length} sous-cat�gorie${children.length > 1 ? 's' : ''}`
                                      : 'Cat�gorie finale'}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        {selectedCategoryPath.length > 0 ? (
                          <div className="rounded-2xl border border-nc-lagon/20 bg-nc-lagon/8 px-4 py-3 text-sm text-night">
                            <p className="font-semibold text-night">Cat�gorie finale s�lectionn�e</p>
                            <p className="mt-1 text-night/65">
                              {selectedCategoryPath.map((node) => node.name).join(' / ')}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Description *</span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    rows={6}
                    placeholder="D�crivez l'�tat, l'historique, les accessoires inclus et ce qui rassure l'acheteur."
                    className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                  />
                </label>

                {selectedCategory?.slug ? (
                  <CategoryFields
                    categorySlug={selectedCategory.slug}
                    register={registerMetadata}
                    errors={metadataErrors}
                  />
                ) : null}
              </div>
            )}

            {draft.step === 2 && (
              <div className="space-y-4">
                <PhotoGrid photos={photos} onAddFiles={addPhotos} onRemove={removePhoto} onMove={movePhoto} />
                <p className="text-xs text-night/45">
                  Ajoutez jusqu&apos;� 8 photos. Le r�ordonnancement conserve la premi�re photo comme couverture principale.
                </p>
              </div>
            )}

            {draft.step === 3 && (
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-nc-lagon/20 bg-nc-lagon/6 p-4 shadow-sm">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={draft.is_troc}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          is_troc: event.target.checked,
                          contre_quoi: event.target.checked ? current.contre_quoi : '',
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-night/20 text-nc-lagon focus:ring-nc-lagon/20"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-night">Troc possible</span>
                      <span className="mt-1 block text-xs leading-relaxed text-night/60">
                        Les autres utilisateurs pourront vous proposer un �change au lieu d&apos;un paiement.
                      </span>
                    </span>
                  </label>

                  {draft.is_troc ? (
                    <label className="mt-4 block space-y-2">
                      <span className="text-sm font-semibold text-night">Contre quoi souhaitez-vous �changer ?</span>
                      <input
                        type="text"
                        value={draft.contre_quoi}
                        onChange={(event) => setDraft((current) => ({ ...current, contre_quoi: event.target.value }))}
                        placeholder="Ex. v�lo, smartphone, console, outillage..."
                        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-nc-lagon focus:ring-4 focus:ring-nc-lagon/20"
                      />
                    </label>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Prix *</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={draft.price}
                      onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                      onBlur={(event) => setDraft((current) => ({ ...current, price: String(snapTo10(event.target.value || 0)) }))}
                      inputMode="numeric"
                      placeholder="Ex. 15000"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Localisation *</span>
                    <select
                      value={draft.commune_id}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        commune_id: event.target.value,
                        quartier_zone: '',
                      }))}
                      disabled={loadingMeta}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                    >
                      <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une commune'}</option>
                      {communces.map((province) => (
                        <optgroup key={province.slug} label={province.name}>
                          {province.communes.map((commune) => (
                            <option key={commune.id} value={commune.id}>
                              {commune.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Quartier / Zone</span>
                    <select
                      value={draft.quartier_zone}
                      onChange={(event) => setDraft((current) => ({ ...current, quartier_zone: event.target.value }))}
                      disabled={!draft.commune_id || zoneLoading}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                    >
                      <option value="">
                        {!draft.commune_id
                          ? 'Choisissez une commune'
                          : zoneLoading
                            ? 'Chargement...'
                            : ''}
                      </option>
                      {zoneOptions.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-2xl border border-dashed border-night/10 bg-white px-4 py-3 text-xs text-night/55">
                    Optionnel : vous pouvez pr�ciser un quartier ou une tribu.
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-night">
                      <CalendarDays className="h-4 w-4 text-coral" />
                      Dur�e de mise en ligne *
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
                    <span className="text-sm font-semibold text-night">�tat</span>
                    <select
                      value={draft.condition}
                      onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value as WizardDraft['condition'] }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    >
                      <option value="new">Neuf</option>
                      <option value="like_new">Comme neuf</option>
                      <option value="good">Bon �tat</option>
                      <option value="fair">Correct</option>
                      <option value="for_parts">Pour pi�ces</option>
                    </select>
                  </label>

                  <label className="flex items-end gap-3 rounded-2xl border border-night/10 bg-sand px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.price_negotiable}
                      onChange={(event) => setDraft((current) => ({ ...current, price_negotiable: event.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-night/20 text-coral focus:ring-coral/25"
                    />
                    <span className="text-sm text-night">Prix n�gociable</span>
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
                  Pr�c�dent
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
                  {submitting ? 'Publication...' : 'Publier lannonce'}
                </button>
              )}

              {draft.step === 3 ? (
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 rounded-2xl border border-lagoon/25 bg-lagoon/8 px-5 py-3 text-sm font-semibold text-night transition hover:bg-lagoon/12"
                >
                  Pr�visualiser
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

            {draft.step === 3 ? (
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobilePreview((current) => !current)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-sand"
                >
                  {showMobilePreview ? 'Masquer l&apos;aper�u' : 'Voir l&apos;aper�u'}
                </button>

                {showMobilePreview ? (
                  <div className="mt-4">
                    <PublicationPreview draft={draft} selectedCategory={selectedCategory} selectedCommune={selectedCommune} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <aside className="hidden space-y-5 lg:block">
            <ListingCoachCard photoCount={photos.length} description={draft.description} />
            <PublicationPreview draft={draft} selectedCategory={selectedCategory} selectedCommune={selectedCommune} />

            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Checklist</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Titre et cat�gorie renseign�s
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Photos pr�par�es pour l&apos;upload
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Prix, commune et dur�e valid�s
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
