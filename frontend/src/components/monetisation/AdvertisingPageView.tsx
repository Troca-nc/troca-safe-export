'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  ExternalLink,
  LayoutTemplate,
  Megaphone,
  Monitor,
  MousePointerClick,
  PanelTop,
  PhoneCall,
  RefreshCw,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { Placeholder } from '@/components/demo/Placeholder'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, DeepPanel } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  advertisingStudioDefaults,
  advertisingTouchpoints,
  formatStartingPrice,
  formatXpf,
} from '@/lib/advertisingPresentation'
import { getAdvertisingPageData, requestAdvertisingCallback } from '@/lib/data/advertising'
import { useAuthStore } from '@/store/authStore'
import type {
  AdvertisingCallbackDraft,
  AdvertisingFormat,
  AdvertisingFormatId,
  AdvertisingPageData,
  AdvertisingPreviewMode,
} from '@/types/advertising'

const formatIcons: Record<AdvertisingFormatId, LucideIcon> = {
  bon_plan: Sparkles,
  banner: PanelTop,
  popup: LayoutTemplate,
}

const touchpointIcons: Record<(typeof advertisingTouchpoints)[number]['id'], LucideIcon> = {
  create: Megaphone,
  track: BarChart3,
  join: Users,
}

type StudioDraft = {
  title: string
  description: string
  cta: string
  linkUrl: string
}

const initialCallback: AdvertisingCallbackDraft = {
  name: '',
  email: '',
  phone: '',
  message: '',
  website: '',
}

function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description: string; centered?: boolean }) {
  return (
    <div className={centered ? 'mx-auto max-w-title text-center' : 'max-w-title'}>
      <p className="text-eyebrow uppercase text-accent-text">{eyebrow}</p>
      <h2 className="mt-3 font-display text-h3 font-normal text-ink sm:text-h2">{title}</h2>
      <p className="mt-4 text-body text-ink/70">{description}</p>
    </div>
  )
}

function FormatDiagram({ id }: { id: AdvertisingFormatId }) {
  if (id === 'banner') {
    return (
      <div className="rounded-control border border-warm-border bg-cream-sunken p-3" aria-label="Schéma d’une bannière en tête de catégorie">
        <div className="h-3 w-24 rounded-pill bg-ink/15" />
        <div className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-control bg-accent-soft px-4">
          <span className="text-label-sm font-semibold text-accent-text">Bannière</span>
          <MousePointerClick className="h-5 w-5 text-accent-text" aria-hidden="true" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
          <span className="h-12 rounded-control bg-cream-surface" />
          <span className="h-12 rounded-control bg-cream-surface" />
          <span className="h-12 rounded-control bg-cream-surface" />
        </div>
      </div>
    )
  }

  if (id === 'popup') {
    return (
      <div className="relative min-h-36 rounded-control border border-warm-border bg-cream-sunken p-3" aria-label="Schéma d’un popup sur la page d’accueil">
        <div className="grid grid-cols-3 gap-2 opacity-50" aria-hidden="true">
          <span className="h-12 rounded-control bg-cream-surface" />
          <span className="h-12 rounded-control bg-cream-surface" />
          <span className="h-12 rounded-control bg-cream-surface" />
        </div>
        <div className="absolute inset-x-8 top-8 rounded-control border border-ink bg-cream-surface p-4 shadow-panel">
          <div className="h-3 w-20 rounded-pill bg-accent" />
          <div className="mt-3 h-2 rounded-pill bg-ink/15" />
          <div className="mt-2 h-2 w-2/3 rounded-pill bg-ink/10" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-control border border-warm-border bg-cream-sunken p-3" aria-label="Schéma d’un bon plan sponsorisé dans un fil">
      <div className="rounded-control border border-accent/40 bg-cream-surface p-3 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-pill bg-accent-soft px-3 py-1 text-label-sm font-semibold text-accent-text">Sponsorisé</span>
          <Sparkles className="h-4 w-4 text-accent-text" aria-hidden="true" />
        </div>
        <div className="mt-3 grid grid-cols-[64px_minmax(0,1fr)] gap-3">
          <span className="h-16 rounded-control bg-info/15" aria-hidden="true" />
          <span className="grid content-center gap-2" aria-hidden="true"><span className="h-3 rounded-pill bg-ink/15" /><span className="h-2 w-2/3 rounded-pill bg-ink/10" /></span>
        </div>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <main className="min-h-screen bg-cream text-ink" aria-busy="true" aria-label="Chargement de Kalico Pub">
      <section className="mx-auto max-w-site px-4 py-8 sm:px-6"><Skeleton className="h-[520px] rounded-block" /></section>
      <section className="mx-auto max-w-site px-4 py-16 sm:px-6"><Skeleton className="h-12 max-w-2xl" /><Skeleton className="mt-4 h-6 max-w-xl" /><div className="mt-10 grid gap-5 lg:grid-cols-3"><Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" /></div></section>
      <section className="mx-auto max-w-site px-4 pb-20 sm:px-6"><Skeleton className="h-[640px] rounded-block" /></section>
    </main>
  )
}

function CampaignPreview({ format, draft, mode }: { format: AdvertisingFormat; draft: StudioDraft; mode: AdvertisingPreviewMode }) {
  const Icon = formatIcons[format.id]
  return (
    <div className={`mx-auto overflow-hidden rounded-card border border-cream/15 bg-cream-surface text-ink shadow-panel transition-all ${mode === 'mobile' ? 'max-w-xs' : 'max-w-3xl'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-warm-border bg-cream-sunken px-4 py-3">
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-pill bg-alert-error/70" /><span className="h-3 w-3 rounded-pill bg-accent/70" /><span className="h-3 w-3 rounded-pill bg-reef/70" /></div>
        <span className="text-meta text-ink/55">kalico.nc</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 border-b border-warm-border pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-control bg-ink text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-label-sm font-semibold">Kalico</p><p className="text-meta text-ink/55">{format.placement}</p></div></div>
        <div className={`mt-4 grid gap-4 ${mode === 'desktop' ? 'sm:grid-cols-[minmax(0,1fr)_180px]' : ''}`}>
          <div className="min-w-0 rounded-control bg-cream-sunken p-4">
            <span className="inline-flex rounded-pill bg-accent-soft px-3 py-1 text-label-sm font-semibold text-accent-text">Contenu sponsorisé</span>
            <h3 className="mt-4 break-words font-display text-h4 font-semibold">{draft.title || advertisingStudioDefaults.title}</h3>
            <p className="mt-2 break-words text-body-sm text-ink/65">{draft.description || advertisingStudioDefaults.description}</p>
            <span className="mt-5 inline-flex min-h-11 items-center rounded-control bg-accent-strong px-4 text-label-sm font-semibold text-cream-surface">{draft.cta || advertisingStudioDefaults.cta}</span>
          </div>
          <div className="flex min-h-36 items-center justify-center rounded-control bg-info/15 text-info-text"><Megaphone className="h-10 w-10" aria-hidden="true" /></div>
        </div>
      </div>
    </div>
  )
}

export default function AdvertisingPageView() {
  const { user, isAuthenticated } = useAuthStore()
  const [data, setData] = useState<AdvertisingPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedFormatId, setSelectedFormatId] = useState<AdvertisingFormatId>('bon_plan')
  const [pricingKey, setPricingKey] = useState('')
  const [previewMode, setPreviewMode] = useState<AdvertisingPreviewMode>('desktop')
  const [studioDraft, setStudioDraft] = useState<StudioDraft>({ ...advertisingStudioDefaults })
  const [callbackDraft, setCallbackDraft] = useState<AdvertisingCallbackDraft>(initialCallback)
  const [callbackError, setCallbackError] = useState('')
  const [callbackSuccess, setCallbackSuccess] = useState(false)
  const [submittingCallback, setSubmittingCallback] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const pageData = await getAdvertisingPageData()
      setData(pageData)
      const firstFormat = pageData.formats[0]
      setSelectedFormatId(firstFormat?.id ?? 'bon_plan')
      setPricingKey(firstFormat?.pricingOptions[0]?.key ?? '')
    } catch {
      setData(null)
      setLoadError('Les formats publicitaires ne peuvent pas être chargés pour le moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    setCallbackDraft((current) => ({
      ...current,
      name: current.name || [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.prenom || '',
      email: current.email || user.email || '',
      phone: current.phone || user.telephone || '',
    }))
  }, [isAuthenticated, user])

  const selectedFormat = useMemo(
    () => data?.formats.find((format) => format.id === selectedFormatId) ?? data?.formats[0] ?? null,
    [data?.formats, selectedFormatId],
  )
  const selectedPricing = selectedFormat?.pricingOptions.find((option) => option.key === pricingKey) ?? selectedFormat?.pricingOptions[0] ?? null
  const selectedEstimate = data?.estimates?.find((estimate) => estimate.formatId === selectedFormat?.id) ?? null

  const chooseFormat = (format: AdvertisingFormat) => {
    setSelectedFormatId(format.id)
    setPricingKey(format.pricingOptions[0]?.key ?? '')
  }

  const updateStudio = (field: keyof StudioDraft, value: string) => {
    setStudioDraft((current) => ({ ...current, [field]: value }))
  }

  const updateCallback = (field: keyof AdvertisingCallbackDraft, value: string) => {
    setCallbackDraft((current) => ({ ...current, [field]: value }))
    setCallbackError('')
  }

  const submitCallback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCallbackError('')
    setCallbackSuccess(false)
    if (callbackDraft.name.trim().length < 2 || !callbackDraft.email.includes('@')) {
      setCallbackError('Renseignez votre nom et une adresse email valide.')
      return
    }
    setSubmittingCallback(true)
    try {
      await requestAdvertisingCallback(callbackDraft)
      setCallbackSuccess(true)
      setCallbackDraft((current) => ({ ...current, message: '', website: '' }))
    } catch (error) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : ''
      setCallbackError(message || 'La demande n’a pas pu être envoyée. Vérifiez votre connexion puis réessayez.')
    } finally {
      setSubmittingCallback(false)
    }
  }

  return (
    <>
      <Header />
      {loading ? <LoadingPage /> : null}
      {!loading && loadError ? (
        <main className="min-h-[70vh] bg-cream px-4 py-16 text-ink sm:px-6"><div className="mx-auto max-w-2xl"><FeedbackAlert tone="error" title="Chargement impossible"><p>{loadError}</p><Button variant="secondary" className="mt-4" onClick={() => void load()}><RefreshCw className="h-4 w-4" aria-hidden="true" />Réessayer</Button></FeedbackAlert></div></main>
      ) : null}
      {!loading && data && selectedFormat ? (
        <main className="overflow-hidden bg-cream text-ink">
          <section className="mx-auto max-w-site px-4 py-6 sm:px-6 sm:py-10">
            <DeepPanel className="p-6 sm:p-10 lg:p-12">
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div>
                  <p className="text-eyebrow uppercase text-accent">Kalico Pub</p>
                  <h1 className="mt-4 max-w-3xl font-display text-h2 font-normal text-cream sm:text-h1-form">Faites connaître votre activité auprès d’un public local</h1>
                  <p className="mt-5 max-w-2xl text-body-lg text-cream/75">Choisissez un format réellement disponible, préparez son contenu et retrouvez la gestion détaillée dans votre espace Pro.</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#studio" className="k-button k-button-primary"><span className="flex items-center justify-center gap-2">Préparer ma campagne<ArrowRight className="h-4 w-4" aria-hidden="true" /></span></a><Link href="/pro/dashboard/publicite" className="k-button k-button-ghost">Gérer mes campagnes</Link></div>
                  <p className="mt-6 text-body-sm text-cream/55">Repères d’audience provisoires, à confirmer avant lancement.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3" aria-label="Audience Kalico">
                  {data.audience.map((metric) => <div key={metric.placeholderKey} className="rounded-control border border-cream/15 bg-cream/5 p-4"><p className="font-display text-h3 text-accent"><Placeholder k={metric.placeholderKey} /></p><p className="mt-2 text-body-sm text-cream/65">{metric.label}</p></div>)}
                </div>
              </div>
            </DeepPanel>
          </section>

          <section id="formats" className="mx-auto max-w-site px-4 py-16 sm:px-6 sm:py-20">
            <SectionHeading eyebrow="Formats disponibles" title="Trois façons concrètes d’occuper les bons emplacements" description="La page présente uniquement les produits déjà pris en charge par la création, le paiement et la diffusion Kalico." />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {data.formats.map((format) => {
                const Icon = formatIcons[format.id]
                const selected = format.id === selectedFormat.id
                return (
                  <button key={format.id} type="button" aria-pressed={selected} onClick={() => chooseFormat(format)} className={`min-w-0 rounded-card border p-5 text-left shadow-card transition-colors ${selected ? 'border-ink bg-ink text-cream shadow-panel' : 'border-warm-border bg-cream-surface text-ink hover:border-ink'}`}>
                    <div className="flex items-start justify-between gap-4"><span className={`flex h-11 w-11 items-center justify-center rounded-control ${selected ? 'bg-accent text-ink' : 'bg-accent-soft text-accent-text'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>{selected ? <span className="inline-flex items-center gap-1 rounded-pill border border-cream/15 px-3 py-1 text-label-sm text-cream"><Check className="h-3 w-3" aria-hidden="true" />Sélectionné</span> : null}</div>
                    <h3 className="mt-5 font-display text-h4 font-semibold">{format.title}</h3>
                    <p className={`mt-3 text-body-sm ${selected ? 'text-cream/70' : 'text-ink/65'}`}>{format.description}</p>
                    <div className="mt-5"><FormatDiagram id={format.id} /></div>
                    <div className={`mt-5 grid gap-2 border-t pt-4 text-body-sm ${selected ? 'border-cream/15 text-cream/70' : 'border-warm-border text-ink/65'}`}><span className="flex gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{format.placement}</span><span className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{formatStartingPrice(format)}</span><span className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{format.availabilityLabel}</span></div>
                  </button>
                )
              })}
            </div>
          </section>

          <section id="studio" className="bg-ink py-16 text-cream sm:py-20">
            <div className="mx-auto max-w-site px-4 sm:px-6">
              <div className="max-w-title"><p className="text-eyebrow uppercase text-accent">Studio de préparation</p><h2 className="mt-3 font-display text-h3 font-normal sm:text-h2">Cadrez votre campagne avant de passer à la gestion Pro</h2><p className="mt-4 text-body text-cream/70">Cet aperçu ne publie rien et ne déclenche aucun paiement. La création finale reste dans votre espace sécurisé.</p></div>
              <div className="mt-10 grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="grid gap-5 rounded-card border border-warm-border bg-cream-surface p-5 text-ink shadow-panel">
                  <Select label="Format" value={selectedFormat.id} onChange={(event) => { const next = data.formats.find((format) => format.id === event.target.value); if (next) chooseFormat(next) }}><option value="bon_plan">Bon plan sponsorisé</option><option value="banner">Bannière catégorie</option><option value="popup">Popup homepage</option></Select>
                  <Input label="Ciblage disponible" value={selectedFormat.targetingLabel} disabled hint="Le ciblage détaillé se règle dans l’espace Pro selon le format." />
                  <Select label="Durée et tarif" value={selectedPricing?.key ?? ''} onChange={(event) => setPricingKey(event.target.value)} disabled={selectedFormat.pricingOptions.length === 0} hint={selectedFormat.pricingOptions.length === 0 ? 'Les tarifs réels sont volontairement masqués en mode démonstration.' : 'Tarifs chargés depuis la configuration serveur.'}>{selectedFormat.pricingOptions.length === 0 ? <option value="">Indisponible en démonstration</option> : selectedFormat.pricingOptions.map((option) => <option key={option.key} value={option.key}>{option.label} · {formatXpf(option.priceXpf)}</option>)}</Select>
                  <Input label="Titre" value={studioDraft.title} maxLength={150} onChange={(event) => updateStudio('title', event.target.value)} />
                  <Textarea label="Description" value={studioDraft.description} maxLength={500} rows={4} onChange={(event) => updateStudio('description', event.target.value)} />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><Input label="Bouton d’action" value={studioDraft.cta} maxLength={60} onChange={(event) => updateStudio('cta', event.target.value)} /><Input label="Lien de destination" type="url" value={studioDraft.linkUrl} placeholder="https://" onChange={(event) => updateStudio('linkUrl', event.target.value)} /></div>
                </div>
                <div className="min-w-0 rounded-card border border-cream/15 bg-cream/5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-eyebrow-sm uppercase text-accent">Aperçu</p><p className="mt-1 text-body-sm text-cream/65">{selectedFormat.title}</p></div><div className="flex rounded-pill border border-cream/15 bg-cream/5 p-1" aria-label="Taille de l’aperçu">{([{ id: 'desktop', label: 'Ordinateur', icon: Monitor }, { id: 'mobile', label: 'Mobile', icon: Smartphone }] as const).map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={previewMode === id} onClick={() => setPreviewMode(id)} className={`flex min-h-11 items-center gap-2 rounded-pill px-4 text-body-sm font-semibold transition-colors ${previewMode === id ? 'bg-cream-surface text-ink' : 'text-cream/70 hover:text-cream'}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>)}</div></div>
                  <div className="mt-6"><CampaignPreview format={selectedFormat} draft={studioDraft} mode={previewMode} /></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-control border border-cream/15 bg-cream/5 p-4"><p className="text-eyebrow-sm uppercase text-accent">Budget sélectionné</p><p className="mt-2 font-display text-h4 text-cream">{selectedPricing ? formatXpf(selectedPricing.priceXpf) : 'Non affiché en démo'}</p><p className="mt-1 text-body-sm text-cream/55">{selectedPricing?.label ?? 'Configuration réelle requise'}</p></div>
                    <div className="rounded-control border border-cream/15 bg-cream/5 p-4"><p className="text-eyebrow-sm uppercase text-accent">Projection</p>{selectedEstimate ? <><p className="mt-2 text-label-sm font-semibold text-reef-on-deep">{selectedEstimate.label}</p><p className="mt-2 text-body-sm text-cream/70">{selectedEstimate.impressionsMin.toLocaleString('fr-FR')} à {selectedEstimate.impressionsMax.toLocaleString('fr-FR')} impressions · {selectedEstimate.contactsMin} à {selectedEstimate.contactsMax} contacts</p></> : <><p className="mt-2 font-semibold text-cream">Estimation momentanément indisponible</p><p className="mt-2 text-body-sm text-cream/55">Aucun coefficient métier validé n’est appliqué.</p></>}</div>
                  </div>
                  <Link href="/pro/dashboard/publicite" className="k-button k-button-primary mt-6 w-full"><span className="flex items-center justify-center gap-2">Continuer dans l’espace Pro<ExternalLink className="h-4 w-4" aria-hidden="true" /></span></Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-site px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <SectionHeading eyebrow="Lecture des résultats" title="À quoi pourrait ressembler votre rapport" description="Kalico ne collecte pas encore les métriques nécessaires à un rapport publicitaire réel. Le tableau ci-contre est une illustration clairement isolée." />
              <Card className="hover:border-sand">
                <div className="flex flex-col gap-4 border-b border-warm-border pb-5 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex rounded-pill bg-accent-soft px-3 py-1 text-label-sm font-semibold text-accent-text">{data.reportExample.label}</span><h3 className="mt-3 font-display text-h4 font-semibold">{data.reportExample.campaignLabel}</h3><p className="mt-1 text-body-sm text-ink/55">{data.reportExample.periodLabel}</p></div><BarChart3 className="h-7 w-7 text-info-text" aria-hidden="true" /></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">{data.reportExample.metrics.map((metric) => <div key={metric.label} className="rounded-control bg-cream-sunken p-4"><p className="text-label-sm text-ink/55">{metric.label}</p><p className="mt-2 font-display text-h3 text-ink">{metric.value}</p><p className="mt-1 text-meta text-ink/50">{metric.detail}</p></div>)}</div>
                <FeedbackAlert className="mt-5" title="Données fictives"><p>Ces chiffres servent uniquement à expliquer la forme du rapport. Ils ne décrivent aucune campagne réelle.</p></FeedbackAlert>
              </Card>
            </div>
          </section>

          <section className="bg-cream-sunken py-16 sm:py-20">
            <div className="mx-auto max-w-site px-4 sm:px-6">
              <SectionHeading eyebrow="Depuis votre espace Pro" title="Créez, payez et suivez au même endroit" description="La page publique aide à choisir. L’espace authentifié conserve les actions engageantes et le suivi détaillé." centered />
              <div className="mt-10 grid gap-5 lg:grid-cols-3">{advertisingTouchpoints.map((item) => { const Icon = touchpointIcons[item.id]; return <Card key={item.id} className="flex h-full flex-col hover:border-ink"><span className="flex h-11 w-11 items-center justify-center rounded-control bg-info/15 text-info-text"><Icon className="h-5 w-5" aria-hidden="true" /></span><h3 className="mt-5 font-display text-h4 font-semibold">{item.title}</h3><p className="mt-3 flex-1 text-body-sm text-ink/65">{item.description}</p><Link href={item.href} className="mt-6 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-accent-text hover:underline">{item.linkLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card> })}</div>
            </div>
          </section>

          <section className="mx-auto max-w-site px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
              <div><SectionHeading eyebrow="Accompagnement" title="Parlons de votre campagne locale" description="L’équipe Kalico peut vous rappeler pour clarifier le format, le contenu et la prochaine étape." /><div className="mt-6 flex items-start gap-3 rounded-control bg-info/15 p-4 text-info-text"><PhoneCall className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p className="text-body-sm"><strong className="block">Réponse sous 24 à 48 heures ouvrées</strong><span className="mt-1 block opacity-80">La demande est transmise au canal de contact Pro existant.</span></p></div></div>
              <Card className="hover:border-sand">
                <form onSubmit={submitCallback} noValidate className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2"><Input label="Nom complet" value={callbackDraft.name} required autoComplete="name" onChange={(event) => updateCallback('name', event.target.value)} /><Input label="Email" type="email" value={callbackDraft.email} required autoComplete="email" onChange={(event) => updateCallback('email', event.target.value)} /></div>
                  <Input label="Téléphone" prefix="+687" value={callbackDraft.phone} autoComplete="tel-national" inputMode="tel" onChange={(event) => updateCallback('phone', event.target.value)} hint="Facultatif, utile si vous préférez être rappelé." />
                  <Textarea label="Votre projet" value={callbackDraft.message} rows={5} maxLength={3000} onChange={(event) => updateCallback('message', event.target.value)} hint="Format envisagé, objectif ou question particulière." />
                  <input value={callbackDraft.website} onChange={(event) => updateCallback('website', event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  {callbackSuccess ? <FeedbackAlert tone="success" title="Demande reçue"><p>Votre demande a bien été transmise. L’équipe vous répondra sous 24 à 48 heures ouvrées en moyenne.</p></FeedbackAlert> : null}
                  {callbackError ? <FeedbackAlert tone="error" title="Envoi impossible"><p>{callbackError}</p></FeedbackAlert> : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-meta text-ink/50">Les informations saisies sont utilisées uniquement pour traiter votre demande.</p><Button type="submit" loading={submittingCallback} loadingLabel="Envoi…"><PhoneCall className="h-4 w-4" aria-hidden="true" />Demander un rappel</Button></div>
                </form>
              </Card>
            </div>
          </section>
        </main>
      ) : null}
    </>
  )
}
