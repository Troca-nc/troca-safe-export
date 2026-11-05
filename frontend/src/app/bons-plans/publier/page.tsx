'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgePercent, Gift, KeyRound, Percent, ShieldCheck, Tag } from 'lucide-react'

import { DealPreviewCard } from '@/components/deals/DealPreviewCard'
import { DiscountReadout } from '@/components/deals/DiscountReadout'
import { OfferTypeCard } from '@/components/deals/OfferTypeCard'
import { EventFormSection } from '@/components/events/EventFormSection'
import { PublishChecklist } from '@/components/events/PublishChecklist'
import { PublishPanel } from '@/components/events/PublishPanel'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { FilterChip, SegmentedControl } from '@/components/ui/Controls'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { uploadApi } from '@/lib/api'
import { clearLocalDealDraft, computeDiscountPercent, createDealPublishDraft, DEAL_CATEGORIES, getDealPublishMetadata, loadLocalDealDraft, publishDeal, saveLocalDealDraft } from '@/lib/data/deals'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { DealDurationDays, DealOfferType, DealPaymentProvider, DealPlaceMode, DealPublishDraft } from '@/types/deals'

const OFFER_TYPES = [
  { value: 'price' as const, symbol: '− XPF', label: 'Prix réduit', hint: 'Ancien prix barré et nouveau prix.', icon: Tag },
  { value: 'percent' as const, symbol: '− %', label: 'Pourcentage', hint: 'Une remise sur un produit ou un rayon.', icon: Percent },
  { value: 'code' as const, symbol: 'CODE', label: 'Code promo', hint: 'Un code à donner en caisse ou en ligne.', icon: KeyRound },
  { value: 'multi' as const, symbol: '2 + 1', label: 'Offre spéciale', hint: 'Cadeau, lot ou livraison offerte.', icon: Gift },
]

type FieldErrors = Partial<Record<keyof DealPublishDraft | 'offerType' | 'placeMode', string>>

function snapshot(form: DealPublishDraft, offerType: DealOfferType, placeMode: DealPlaceMode, durationDays: DealDurationDays, paymentProvider: DealPaymentProvider) {
  return JSON.stringify({ form, offerType, placeMode, durationDays, paymentProvider })
}

function validHttpUrl(value: string) {
  return /^https?:\/\/.+/i.test(value.trim())
}

export default function PublishBonPlanPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [form, setForm] = useState<DealPublishDraft>(() => createDealPublishDraft())
  const [offerType, setOfferType] = useState<DealOfferType>('')
  const [placeMode, setPlaceMode] = useState<DealPlaceMode>('shop')
  const [durationDays, setDurationDays] = useState<DealDurationDays>(7)
  const [paymentProvider, setPaymentProvider] = useState<DealPaymentProvider>('stripe')
  const [communes, setCommunes] = useState<{ id: number; name: string }[]>([])
  const [metadataLoading, setMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const cleanSnapshot = useRef('')
  const successfulNavigation = useRef(false)

  const profileName = [user?.first_name || user?.prenom, user?.last_name || user?.nom].filter(Boolean).join(' ').trim()

  useEffect(() => {
    if (!hasHydrated || initialized) return
    const stored = loadLocalDealDraft(user?.id)
    const initialForm = stored?.form || createDealPublishDraft({ name: profileName, email: user?.email })
    setForm(initialForm)
    setOfferType(stored?.offerType || '')
    setPlaceMode(stored?.placeMode || 'shop')
    setDurationDays(stored?.durationDays || 7)
    setPaymentProvider(stored?.paymentProvider || 'stripe')
    cleanSnapshot.current = snapshot(initialForm, stored?.offerType || '', stored?.placeMode || 'shop', stored?.durationDays || 7, stored?.paymentProvider || 'stripe')
    setInitialized(true)
  }, [hasHydrated, initialized, profileName, user?.email, user?.id])

  const loadMetadata = () => {
    setMetadataLoading(true)
    setMetadataError('')
    getDealPublishMetadata()
      .then((value) => setCommunes(value.communes))
      .catch(() => setMetadataError('Impossible de charger les communes.'))
      .finally(() => setMetadataLoading(false))
  }

  useEffect(() => { loadMetadata() }, [])

  const currentSnapshot = snapshot(form, offerType, placeMode, durationDays, paymentProvider)
  const dirty = initialized && currentSnapshot !== cleanSnapshot.current

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !successfulNavigation.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const before = Number(form.originalPriceXpf)
  const after = Number(form.promoPriceXpf)
  const percent = Number(form.discountPercent)
  const priceOfferComplete = before > 0 && after >= 0 && after < before
  const offerComplete = offerType === 'price'
    ? priceOfferComplete
    : offerType === 'percent'
      ? Number.isInteger(percent) && percent >= 1 && percent <= 99
      : offerType === 'code'
        ? Boolean(form.promoCode.trim())
        : offerType === 'multi'
          ? Boolean(form.specialDetail.trim())
          : false
  const datesComplete = Boolean(form.validUntil) && (!form.validFrom || form.validFrom <= form.validUntil)
  const shopComplete = Boolean(form.locationName.trim() && form.communeId)
  const onlineComplete = validHttpUrl(form.offerUrl)
  const placeComplete = placeMode === 'shop' ? shopComplete : placeMode === 'online' ? onlineComplete : shopComplete && onlineComplete
  const identityComplete = Boolean(form.businessName.trim() && /.+@.+\..+/.test(form.contactEmail.trim()))
  const checks = [
    { label: 'Type d’offre et titre', complete: Boolean(offerType && form.title.trim()) },
    { label: 'Offre complète et catégorie', complete: Boolean(offerComplete && form.category) },
    { label: 'Dates de validité', complete: datesComplete },
    { label: placeMode === 'online' ? 'Lien vers l’offre' : placeMode === 'both' ? 'Lieu, commune et lien' : 'Lieu et commune', complete: placeComplete },
    { label: 'Enseigne et e-mail', complete: identityComplete },
  ]
  const remaining = checks.filter((check) => !check.complete).length
  const communeName = communes.find((commune) => String(commune.id) === form.communeId)?.name || ''
  const discount = useMemo(() => computeDiscountPercent(form.originalPriceXpf, form.promoPriceXpf), [form.originalPriceXpf, form.promoPriceXpf])

  const updateField = <K extends keyof DealPublishDraft>(key: K, value: DealPublishDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setError('')
    setSuccess('')
  }

  const focusFirstError = (errors: FieldErrors) => {
    const first = Object.keys(errors)[0]
    if (!first) return
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-deal-field="${first}"] input, [data-deal-field="${first}"] textarea, [data-deal-field="${first}"] button, [data-deal-field="${first}"] select`)?.focus())
  }

  const validate = () => {
    const errors: FieldErrors = {}
    if (!offerType) errors.offerType = 'Choisissez un type d’offre.'
    if (!form.title.trim()) errors.title = 'Le titre est requis.'
    if (offerType === 'price' && !priceOfferComplete) errors.promoPriceXpf = after >= before && before > 0 ? 'Le nouveau prix doit être inférieur à l’ancien.' : 'Renseignez deux prix cohérents.'
    if (offerType === 'percent' && !(Number.isInteger(percent) && percent >= 1 && percent <= 99)) errors.discountPercent = 'La remise doit être comprise entre 1 et 99 %.'
    if (offerType === 'code' && !form.promoCode.trim()) errors.promoCode = 'Le code promo est requis.'
    if (offerType === 'multi' && !form.specialDetail.trim()) errors.specialDetail = 'Décrivez l’offre spéciale.'
    if (!form.category) errors.category = 'Choisissez une catégorie.'
    if (!form.validUntil) errors.validUntil = 'La date de fin est requise.'
    else if (form.validFrom && form.validFrom > form.validUntil) errors.validUntil = 'La date de fin doit être postérieure à la date de début.'
    if (placeMode !== 'online' && !form.locationName.trim()) errors.locationName = 'Le lieu est requis.'
    if (placeMode !== 'online' && !form.communeId) errors.communeId = 'Choisissez une commune.'
    if (placeMode !== 'shop' && !validHttpUrl(form.offerUrl)) errors.offerUrl = 'Saisissez un lien commençant par http:// ou https://.'
    if (!form.businessName.trim()) errors.businessName = 'Le nom de l’enseigne est requis.'
    if (!/.+@.+\..+/.test(form.contactEmail.trim())) errors.contactEmail = 'Saisissez une adresse e-mail valide.'
    setFieldErrors(errors)
    focusFirstError(errors)
    return Object.keys(errors).length === 0
  }

  const saveDraft = () => {
    if (!isAuthenticated) {
      openAuthModal({ type: 'publish_listing', redirectTo: '/bons-plans/publier' })
      return
    }
    setSavingDraft(true)
    saveLocalDealDraft(user?.id, { form, offerType, placeMode, durationDays, paymentProvider, savedAt: new Date().toISOString() })
    cleanSnapshot.current = currentSnapshot
    setSuccess('Brouillon enregistré sur cet appareil.')
    setTimeout(() => setSavingDraft(false), 250)
  }

  const uploadCatalogPdf = async (file: File | null) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Le catalogue doit être un fichier PDF.')
      return
    }
    try {
      const response = await uploadApi.uploadChatDocument(file)
      const url = String(response.data?.data?.url || '')
      if (!url) throw new Error('URL manquante')
      updateField('catalogPdfUrl', url)
      setSuccess('Catalogue PDF prêt à être publié.')
    } catch {
      setError('Impossible de téléverser le catalogue PDF.')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!isAuthenticated) {
      openAuthModal({ type: 'publish_listing', redirectTo: '/bons-plans/publier' })
      return
    }
    if (!validate()) return
    setPublishing(true)
    try {
      const result = await publishDeal(form, offerType, placeMode, durationDays, paymentProvider)
      clearLocalDealDraft(user?.id)
      cleanSnapshot.current = currentSnapshot
      if (result.checkoutUrl) {
        successfulNavigation.current = true
        window.location.assign(result.checkoutUrl)
        return
      }
      setSuccess(result.message || 'Ton bon plan est enregistré.')
    } catch (reason: any) {
      successfulNavigation.current = false
      setError(reason?.response?.data?.error || reason?.message || 'Publication impossible. Réessaie sans perdre ta saisie.')
    } finally {
      setPublishing(false)
    }
  }

  if (!hasHydrated || !initialized) {
    return <><Header /><main className="min-h-screen bg-cream px-4 py-8 text-ink"><div className="mx-auto max-w-container animate-pulse space-y-5"><div className="h-28 rounded-block bg-cream-sunken" /><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_25rem]"><div className="h-[42rem] rounded-block bg-cream-sunken" /><div className="h-96 rounded-block bg-cream-sunken" /></div></div></main></>
  }

  const baseAmount = durationDays === 7 ? 2900 : 7900
  const proAmount = durationDays === 7 ? 2320 : 6320

  return (
    <><Header /><main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        <Link href="/bons-plans" className="text-label font-semibold text-accent-text hover:underline">← Retour aux bons plans</Link>
        <header className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl"><p className="text-eyebrow uppercase text-accent-text">Bon plan · Promotions et soldes</p><h1 className="mt-3 font-display text-h1-form leading-none sm:text-h1">Publie ton bon plan.</h1><p className="mt-4 max-w-2xl text-body text-ink/70">Présente une offre claire, choisis où elle s’applique et vérifie son rendu avant le paiement.</p></div>
          <p aria-live="polite" className="rounded-pill bg-cream-sunken px-4 py-2 text-label font-semibold">{5 - remaining} sur 5 blocs prêts</p>
        </header>

        {!isAuthenticated ? <section className="mt-7 rounded-card border border-info/30 bg-info/10 p-5"><p className="font-semibold">Connecte-toi pour publier ton bon plan.</p><p className="mt-1 text-body-sm text-ink/65">Ta saisie pourra ensuite être enregistrée comme brouillon local.</p><Button className="mt-4" onClick={() => openAuthModal({ type: 'publish_listing', redirectTo: '/bons-plans/publier' })}>Se connecter</Button></section> : null}
        {metadataError ? <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-alert-error/30 bg-cream-surface p-4" role="alert"><span>{metadataError}</span><Button variant="secondary" onClick={loadMetadata}>Réessayer</Button></section> : null}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-wrap items-start gap-6 lg:gap-8">
          <div className="min-w-0 flex-[1_1_560px] space-y-5">
            <EventFormSection number={1} title="Quel type d’offre ?">
              <div data-deal-field="offerType" className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                {OFFER_TYPES.map((item) => <OfferTypeCard key={item.value} active={offerType === item.value} {...item} onClick={() => { setOfferType(item.value); setFieldErrors((current) => ({ ...current, offerType: undefined })) }} />)}
              </div>
              {fieldErrors.offerType ? <p className="mt-2 text-meta text-alert-error" role="alert">{fieldErrors.offerType}</p> : null}
            </EventFormSection>

            <EventFormSection number={2} title="L’offre">
              <div data-deal-field="title"><Input label="Titre du bon plan" value={form.title} error={fieldErrors.title} maxLength={150} placeholder="Ex. Menu du midi à prix réduit" onChange={(event) => updateField('title', event.target.value)} /></div>
              <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                {offerType === 'price' ? <><Input label="Prix avant" suffix="XPF" type="number" min={0} step={10} value={form.originalPriceXpf} onChange={(event) => updateField('originalPriceXpf', event.target.value)} /><div data-deal-field="promoPriceXpf"><Input label="Prix maintenant" suffix="XPF" type="number" min={0} step={10} value={form.promoPriceXpf} error={fieldErrors.promoPriceXpf} onChange={(event) => updateField('promoPriceXpf', event.target.value)} /></div><DiscountReadout discount={discount} /></> : null}
                {offerType === 'percent' ? <div data-deal-field="discountPercent"><Input label="Remise" suffix="%" type="number" min={1} max={99} value={form.discountPercent} error={fieldErrors.discountPercent} onChange={(event) => updateField('discountPercent', event.target.value)} /></div> : null}
                {offerType === 'code' ? <div data-deal-field="promoCode"><Input label="Code promo" value={form.promoCode} error={fieldErrors.promoCode} className="uppercase tracking-[0.12em]" placeholder="Ex. KALICO10" onChange={(event) => updateField('promoCode', event.target.value.toUpperCase())} /></div> : null}
                {offerType === 'multi' ? <div data-deal-field="specialDetail" className="col-span-full"><Input label="Détail de l’offre" value={form.specialDetail} error={fieldErrors.specialDetail} placeholder="Ex. 2 achetés, le 3e offert" onChange={(event) => updateField('specialDetail', event.target.value)} /></div> : null}
              </div>
              <div className="mt-5"><p className="mb-2 text-label-sm font-semibold">Catégorie</p><div data-deal-field="category" className="flex flex-wrap gap-2">{DEAL_CATEGORIES.map((item) => <FilterChip key={item.value} selected={form.category === item.value} onClick={() => updateField('category', item.value)}>{item.label}</FilterChip>)}</div>{fieldErrors.category ? <p className="mt-2 text-meta text-alert-error" role="alert">{fieldErrors.category}</p> : null}</div>
              <div className="mt-5"><Textarea label="Conditions et détails · facultatif" value={form.description} maxLength={500} placeholder="Précise les produits concernés et les éventuelles exclusions." onChange={(event) => updateField('description', event.target.value)} /></div>
              <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"><Input label="Adresse de la photo · facultative" type="url" value={form.imageUrl} hint="Le téléversement d’image sera ajouté dans un lot séparé." placeholder="https://" onChange={(event) => updateField('imageUrl', event.target.value)} /><label className="flex min-w-0 flex-col gap-2"><span className="text-label-sm font-semibold">Catalogue PDF · facultatif</span><input type="file" accept="application/pdf" onChange={(event) => void uploadCatalogPdf(event.target.files?.[0] || null)} className="k-field min-h-12 file:mr-3 file:rounded-control file:border-0 file:bg-ink file:px-3 file:py-2 file:text-cream" />{form.catalogPdfUrl ? <span className="text-meta text-success-text">Catalogue prêt.</span> : <span className="text-meta text-ink/60">PDF uniquement.</span>}</label></div>
            </EventFormSection>

            <EventFormSection number={3} title="Quand et où">
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]"><Input label="Début · facultatif" type="date" value={form.validFrom} onChange={(event) => updateField('validFrom', event.target.value)} /><div data-deal-field="validUntil"><Input label="Fin de l’offre" type="date" value={form.validUntil} error={fieldErrors.validUntil} onChange={(event) => updateField('validUntil', event.target.value)} /></div></div>
              <div className="mt-5" data-deal-field="placeMode"><SegmentedControl label="Où profiter de l’offre ?" value={placeMode} onChange={(value) => setPlaceMode(value as DealPlaceMode)} options={[{ value: 'shop', label: 'En magasin' }, { value: 'online', label: 'En ligne' }, { value: 'both', label: 'Les deux' }]} /></div>
              {placeMode !== 'online' ? <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"><div data-deal-field="locationName"><Input label="Magasin ou adresse" value={form.locationName} error={fieldErrors.locationName} placeholder="Ex. Centre-ville" onChange={(event) => updateField('locationName', event.target.value)} /></div><div data-deal-field="communeId"><Select label="Commune" value={form.communeId} error={fieldErrors.communeId} disabled={metadataLoading} onChange={(event) => updateField('communeId', event.target.value)}><option value="">{metadataLoading ? 'Chargement…' : 'Choisir une commune'}</option>{communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select></div></div> : null}
              {placeMode !== 'shop' ? <div className="mt-5" data-deal-field="offerUrl"><Input label="Lien vers l’offre" type="url" value={form.offerUrl} error={fieldErrors.offerUrl} placeholder="https://" onChange={(event) => updateField('offerUrl', event.target.value)} /></div> : null}
            </EventFormSection>

            <EventFormSection number={4} title="Qui propose l’offre ?">
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"><div data-deal-field="businessName"><Input label="Enseigne ou commerce" value={form.businessName} error={fieldErrors.businessName} onChange={(event) => updateField('businessName', event.target.value)} /></div><div data-deal-field="contactEmail"><Input label="E-mail de contact" type="email" value={form.contactEmail} error={fieldErrors.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} /></div><Input label="Adresse du logo · facultative" type="url" value={form.businessLogoUrl} placeholder="https://" onChange={(event) => updateField('businessLogoUrl', event.target.value)} /></div>
              <p className="mt-3 text-meta text-ink/60">L’e-mail n’est pas affiché publiquement. Il sert au suivi de la publication et du paiement.</p>
              <div className="mt-5 rounded-control bg-cream-sunken p-4">{user?.is_pro ? <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-reef-text" /><div><p className="font-semibold">Compte Pro reconnu</p><p className="mt-1 text-body-sm text-ink/65">Ton tarif Pro sera appliqué automatiquement au paiement.</p></div></div> : <div><p className="font-semibold">Publiez régulièrement ?</p><p className="mt-1 text-body-sm text-ink/65">Le compte Pro bénéficie d’un tarif réduit et d’une vitrine dédiée.</p><Link href="/devenir-pro" className="mt-2 inline-flex text-label font-semibold text-accent-text hover:underline">Découvrir l’offre Pro</Link></div>}</div>
              <div className="mt-6 border-t border-sand pt-5"><h3 className="font-display text-h4">Diffusion et paiement</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{([{ days: 7, public: 2900, pro: 2320 }, { days: 30, public: 7900, pro: 6320 }] as const).map((item) => <button key={item.days} type="button" aria-pressed={durationDays === item.days} onClick={() => setDurationDays(item.days)} className={`min-h-28 rounded-card border p-4 text-left ${durationDays === item.days ? 'border-ink bg-ink text-cream' : 'border-warm-border bg-cream-surface'}`}><span className="text-label font-semibold">{item.days} jours</span><span className="mt-2 block font-display text-h4">{item.public.toLocaleString('fr-FR')} XPF</span><span className={`mt-1 block text-meta ${durationDays === item.days ? 'text-cream/70' : 'text-ink/60'}`}>Pro : {item.pro.toLocaleString('fr-FR')} XPF</span></button>)}</div><div className="mt-4"><SegmentedControl label="Moyen de paiement" value={paymentProvider} onChange={(value) => setPaymentProvider(value as DealPaymentProvider)} options={[{ value: 'stripe', label: 'Carte internationale' }, { value: 'payplug', label: 'Carte locale / OPT-NC' }]} /></div></div>
            </EventFormSection>

            <PublishPanel remaining={remaining} publishing={publishing} savingDraft={savingDraft} error={error} success={success} subject="bon plan" publishLabel="Publier le bon plan" readyMessage="Tout est renseigné. Le paiement ouvrira la diffusion de ton bon plan." onSaveDraft={saveDraft} />
          </div>

          <aside className="min-w-0 flex-[0_1_400px] space-y-5 min-[1000px]:min-w-[300px] min-[1000px]:sticky min-[1000px]:top-6">
            <DealPreviewCard form={form} offerType={offerType} placeMode={placeMode} communeName={communeName} />
            <PublishChecklist checks={checks} />
            <section className="rounded-card border border-dashed border-warm-border p-5"><BadgePercent className="h-6 w-6 text-accent-text" /><h2 className="mt-3 font-display text-h4">Une offre honnête</h2><p className="mt-2 text-body-sm text-ink/65">Le prix « avant » doit être celui réellement pratiqué. Un bon plan expiré est retiré automatiquement.</p></section>
            <section className="rounded-card border border-warm-border bg-cream-surface p-5"><p className="text-eyebrow uppercase text-accent-text">Récapitulatif</p><div className="mt-3 flex items-baseline justify-between gap-3"><span className="text-body-sm">Prix public</span><strong>{baseAmount.toLocaleString('fr-FR')} XPF</strong></div><div className="mt-2 flex items-baseline justify-between gap-3"><span className="text-body-sm">Prix Pro</span><strong>{proAmount.toLocaleString('fr-FR')} XPF</strong></div><p className="mt-3 text-meta text-ink/60">Le bon plan devient visible après confirmation du paiement.</p></section>
          </aside>
        </form>
      </div>
    </main></>
  )
}
