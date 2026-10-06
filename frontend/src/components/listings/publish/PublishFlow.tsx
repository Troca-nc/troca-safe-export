'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ExternalLink, Lock, RotateCcw, Sparkles } from 'lucide-react'

import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { ErrorState, LoadingState, Skeleton } from '@/components/ui/Skeleton'
import { useAutosave, useBeforeUnload } from '@/hooks/useAutosave'
import { compressImage } from '@/lib/imageCompressor'
import { createPublishingDraft, getPublishingErrorMessage, loadPublishingMetadata, publishDraft } from '@/lib/data/publishing'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { PublishingDraft, PublishingKind, PublishingMetadata, PublishingPhoto, PublishingResult } from '@/types/publishing'
import PublishPreview from './PublishPreview'
import PublishStepFields from './PublishStepFields'
import PublishStepRail from './PublishStepRail'
import PublishTypeChooser from './PublishTypeChooser'
import { PUBLISHING_STEPS, PUBLISHING_TYPES } from './publishingConfig'
import { validatePublishingStep, type MissingField } from './publishingValidation'

const VALID_KINDS: PublishingKind[] = ['sale', 'troc', 'bonplan', 'carpool', 'event']

function makePhotoId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function kindLabel(kind: PublishingKind) {
  return PUBLISHING_TYPES.find((item) => item.id === kind)?.label ?? 'Publication'
}

export default function PublishFlow() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const identity = useMemo(() => ({
    email: user?.email ?? '',
    name: [user?.first_name || user?.prenom, user?.last_name || user?.nom].filter(Boolean).join(' '),
    phone: user?.telephone ?? '',
  }), [user])
  const [draft, setDraft] = useState<PublishingDraft>(() => createPublishingDraft({ demoMode: false }))
  const [photos, setPhotos] = useState<PublishingPhoto[]>([])
  const [metadata, setMetadata] = useState<PublishingMetadata | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [metaError, setMetaError] = useState('')
  const [missing, setMissing] = useState<MissingField[]>([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PublishingResult | null>(null)
  const [initialQueryRead, setInitialQueryRead] = useState(false)
  const photosRef = useRef<PublishingPhoto[]>([])

  const draftKey = `draft_publishing_${user?.id ?? 'guest'}_${draft.kind ?? 'choice'}`
  const autosave = useAutosave(draftKey, draft, 30_000)
  useBeforeUnload(autosave.isDirty && !submitting && !result)

  const loadMetadata = useCallback(async () => {
    setMetaLoading(true)
    setMetaError('')
    try {
      setMetadata(await loadPublishingMetadata(demoMode))
    } catch (error) {
      setMetaError(getPublishingErrorMessage(error))
    } finally {
      setMetaLoading(false)
    }
  }, [demoMode])

  useEffect(() => { void loadMetadata() }, [loadMetadata])

  useEffect(() => {
    if (!isAuthenticated) openAuthModal({ type: 'publish_listing', redirectTo: '/deposer' })
  }, [isAuthenticated, openAuthModal])

  useEffect(() => {
    if (initialQueryRead || typeof window === 'undefined') return
    setInitialQueryRead(true)
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('type')
    const kind = VALID_KINDS.includes(requested as PublishingKind)
      ? requested as PublishingKind
      : params.get('mode') === 'simple' ? 'bonplan' : null
    if (kind) setDraft(createPublishingDraft({ kind, demoMode, ...identity }))
  }, [demoMode, identity, initialQueryRead])

  useEffect(() => { photosRef.current = photos }, [photos])

  useEffect(() => () => {
    photosRef.current.forEach((photo) => {
      if (photo.preview.startsWith('blob:')) URL.revokeObjectURL(photo.preview)
    })
  }, [])

  const steps = draft.kind ? PUBLISHING_STEPS[draft.kind] : []
  const currentStep = steps[draft.step]

  const update = <K extends keyof PublishingDraft>(key: K, value: PublishingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setMissing((current) => current.filter((item) => item.key !== key))
    setSubmitError('')
  }

  const selectKind = (kind: PublishingKind) => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview))
    setPhotos([])
    setDraft(createPublishingDraft({ kind, demoMode, ...identity }))
    setMissing([])
    setSubmitError('')
    setResult(null)
  }

  const restoreDraft = () => {
    if (!autosave.pendingDraft) return
    setDraft(autosave.pendingDraft.data)
    autosave.acceptDraft()
    setMissing([])
  }

  const addPhotos = async (files: FileList) => {
    const incoming = Array.from(files).slice(0, Math.max(0, 10 - photos.length))
    const optimized = await Promise.all(incoming.map(async (file) => {
      try { return file.type.startsWith('image/') ? await compressImage(file) : file } catch { return file }
    }))
    setPhotos((current) => [...current, ...optimized.map((file) => ({ id: makePhotoId(), file, preview: URL.createObjectURL(file) }))])
    setMissing((current) => current.filter((item) => item.key !== 'photos'))
  }

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const target = current[index]
      if (target?.preview.startsWith('blob:')) URL.revokeObjectURL(target.preview)
      return current.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const goNext = () => {
    if (!currentStep) return
    const currentMissing = validatePublishingStep(draft, currentStep.id, photos.length)
    setMissing(currentMissing)
    if (currentMissing.length) return
    setDraft((current) => ({ ...current, step: Math.min(steps.length - 1, current.step + 1) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setMissing([])
    setSubmitError('')
    if (draft.step === 0) setDraft(createPublishingDraft({ demoMode, ...identity }))
    else setDraft((current) => ({ ...current, step: Math.max(0, current.step - 1) }))
  }

  const submit = async () => {
    if (!draft.kind || !metadata) return
    const allMissing = steps.flatMap((step) => validatePublishingStep(draft, step.id, photos.length))
    if (allMissing.length) {
      const unique = allMissing.filter((item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index)
      const firstInvalidStep = steps.findIndex((step) => validatePublishingStep(draft, step.id, photos.length).length > 0)
      setMissing(unique)
      if (firstInvalidStep >= 0) setDraft((current) => ({ ...current, step: firstInvalidStep }))
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const published = await publishDraft({ draft, metadata, photos, demoMode })
      setResult(published)
      autosave.clearDraft()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setSubmitError(getPublishingErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview))
    setPhotos([])
    setDraft(createPublishingDraft({ demoMode, ...identity }))
    setResult(null)
    setMissing([])
    setSubmitError('')
  }

  if (!isAuthenticated) {
    return <><Header variant="reduced" title="Déposer une annonce" exitHref="/" /><main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-12"><div className="mx-auto max-w-[720px] rounded-card border border-sand bg-cream-surface p-6 shadow-card md:p-9"><Lock className="h-6 w-6 text-accent-text" /><h1 className="mt-5 font-display text-h1-form text-ink">Connexion requise</h1><p className="mt-4 text-body text-ink/70 text-pretty">Connectez-vous pour enregistrer votre brouillon, ajouter vos photos et publier.</p><Button className="mt-7" onClick={() => openAuthModal({ type: 'publish_listing', redirectTo: '/deposer' })}>Se connecter pour continuer</Button></div></main></>
  }

  if (result) {
    const listingKind = result.kind === 'sale' || result.kind === 'troc'
    return <><Header variant="reduced" title="Publication terminée" exitHref="/profil" /><main className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 lg:px-12 lg:py-16"><span className="inline-flex items-center gap-2 rounded-full bg-reef/20 px-3 py-1 text-caption font-semibold text-reef-text"><CheckCircle2 className="h-4 w-4" />{result.demo ? 'Démonstration' : 'En ligne'}</span><h1 className="mt-5 max-w-[760px] font-display text-h1-form text-ink text-balance">{result.message}</h1><p className="mt-4 max-w-[680px] text-body text-ink/70 text-pretty">Votre référence est <span className="font-mono text-meta">{result.id}</span>. Vous pouvez consulter la publication ou en créer une autre.</p>{result.paymentUrl ? <FeedbackAlert className="mt-7 max-w-[720px]" title="Activation du bon plan">Le serveur a préparé le paiement. Finalisez-le pour activer la diffusion publique.</FeedbackAlert> : null}{listingKind && !result.demo ? <section className="mt-8 max-w-[760px] rounded-card border border-sand bg-cream-sunken p-5"><div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-accent-text" /><div><h2 className="text-h5 font-semibold text-ink">Visibilité facultative</h2><p className="mt-1 text-body-sm text-ink/65">Les options À la une, Urgent et Remontée sont disponibles après publication. Aucun paiement n’a été lancé ici.</p></div></div></section> : null}<div className="mt-8 flex flex-wrap gap-3">{result.paymentUrl ? <a className="k-button k-button-primary" href={result.paymentUrl} rel="noreferrer"><span className="flex items-center gap-2">Finaliser le paiement<ExternalLink className="h-4 w-4" /></span></a> : <Link className="k-button k-button-primary" href={result.href}><span className="flex items-center gap-2">Voir la publication<ArrowRight className="h-4 w-4" /></span></Link>}<Button variant="secondary" onClick={restart}><RotateCcw className="h-4 w-4" />Déposer autre chose</Button></div></main></>
  }

  return (
    <>
      <Header variant="reduced" title="Déposer une annonce" draftStorageKey={draftKey} exitHref="/profil" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        {!draft.kind ? <PublishTypeChooser onSelect={selectKind} /> : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setDraft(createPublishingDraft({ demoMode, ...identity }))} className="inline-flex min-h-11 items-center gap-2 text-label font-semibold text-accent-text hover:text-ink"><ArrowLeft className="h-4 w-4" />Changer de type</button><span className="rounded-full border border-sand bg-cream-surface px-3 py-1 text-caption font-semibold text-ink/70">{kindLabel(draft.kind)}</span></div>
              <div className="mt-6 rounded-card border border-sand bg-cream-surface p-4 shadow-card md:p-6"><PublishStepRail steps={steps} current={draft.step} /></div>
              {autosave.pendingDraft ? <FeedbackAlert className="mt-5" title="Un brouillon existe"><div className="flex flex-wrap items-center justify-between gap-3"><p>Enregistré {autosave.draftAgeLabel ?? 'récemment'}.</p><div className="flex gap-2"><Button compact onClick={restoreDraft}>Restaurer</Button><Button compact variant="ghost" onClick={autosave.discardDraft}>Ignorer</Button></div></div></FeedbackAlert> : null}
              {metaLoading ? <div className="mt-6 rounded-card border border-sand bg-cream-surface p-6 shadow-card"><LoadingState><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5 w-full" /><Skeleton className="h-56" /></LoadingState></div> : metaError || !metadata ? <div className="mt-6"><ErrorState message={metaError || 'Les données de publication sont indisponibles.'} onRetry={() => void loadMetadata()} /></div> : currentStep ? (
                <section className="mt-6 rounded-card border border-sand bg-cream-surface p-5 shadow-card md:p-8" aria-labelledby="current-step-title">
                  <p className="text-eyebrow-sm font-semibold uppercase tracking-eyebrow-sm text-accent-text">Étape {draft.step + 1} sur {steps.length} · {kindLabel(draft.kind)}</p><h1 id="current-step-title" className="mt-3 font-display text-h1-form text-ink text-balance">{currentStep.title}</h1><p className="mt-3 max-w-[720px] text-body-sm text-ink/65 text-pretty">{currentStep.description}</p>
                  {missing.length ? <FeedbackAlert tone="error" className="mt-6" title="Informations à compléter"><ul className="mt-1 list-disc space-y-1 pl-5">{missing.map((item) => <li key={String(item.key)}>{item.label}</li>)}</ul></FeedbackAlert> : null}
                  {submitError ? <FeedbackAlert tone="error" className="mt-6" title="Publication impossible"><div className="flex flex-col items-start gap-3"><p>{submitError}</p><Button compact variant="secondary" onClick={() => void submit()}>Réessayer</Button></div></FeedbackAlert> : null}
                  <div className="mt-8"><PublishStepFields stepId={currentStep.id} draft={draft} metadata={metadata} photos={photos} missing={missing} update={update} onAddPhotos={(files) => void addPhotos(files)} onRemovePhoto={removePhoto} /></div>
                  {currentStep.id === 'publication' && user?.is_verified ? <div className="mt-5 flex items-start gap-3 rounded-card border border-reef/30 bg-reef/15 p-4 text-body-sm text-reef-text"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Compte vérifié.</strong> Cette preuve concerne votre profil ; elle ne constitue pas une certification de l’annonce.</p></div> : null}
                  <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sand pt-6"><Button variant="secondary" onClick={goBack}><ArrowLeft className="h-4 w-4" />Retour</Button>{draft.step < steps.length - 1 ? <Button onClick={goNext}>Continuer<ArrowRight className="h-4 w-4" /></Button> : <Button loading={submitting} loadingLabel="Publication…" onClick={() => void submit()}>Publier maintenant<ArrowRight className="h-4 w-4" /></Button>}<p className="text-meta text-ink/55">Brouillon enregistré automatiquement.</p></div>
                </section>
              ) : null}
            </div>
            <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start"><p className="mb-3 text-eyebrow-sm font-semibold uppercase tracking-eyebrow-sm text-ink/55">Aperçu dans les résultats</p>{metadata ? <PublishPreview draft={draft} metadata={metadata} /> : <Skeleton className="h-[420px]" />}<div className="mt-4 rounded-card border-l-[3px] border-l-lagoon bg-lagoon/10 p-4 text-body-sm text-ink/75">{currentStep?.id === 'photos' ? 'Privilégiez une lumière naturelle et montrez les éventuels défauts.' : currentStep?.id === 'publication' ? 'Relisez les montants, les dates et la commune avant de publier.' : 'Les modifications apparaissent dans cet aperçu au fur et à mesure.'}</div></aside>
          </div>
        )}
      </main>
    </>
  )
}
