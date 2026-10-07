'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Briefcase,
  Building2,
  Check,
  Clock3,
  FileCheck2,
  ImagePlus,
  MapPin,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, DeepPanel } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { getProUpgradePageData, submitProUpgrade } from '@/lib/data/pro-upgrade'
import { formatXpf, getDisplayedPrice, planFeatureHighlights } from '@/lib/proOffersPresentation'
import { formatRidet, normalizeRidet, validateProUpgradeDraft } from '@/lib/proUpgradePresentation'
import { useAuthStore } from '@/store/authStore'
import type { ProBillingCycle, ProPlanId } from '@/types/pro-offers'
import type { ProUpgradeDraft, ProUpgradeFieldErrors, ProUpgradePageData } from '@/types/pro-upgrade'

const EMPTY_DRAFT: ProUpgradeDraft = {
  companyName: '',
  sector: '',
  phone: '',
  ridet: '',
  commune: '',
  presentation: '',
  selectedPlanId: 'pro',
  billingCycle: 'monthly',
}

const preservedItems = [
  { icon: Store, label: 'Vos annonces' },
  { icon: Star, label: 'Vos avis' },
  { icon: MessageSquareText, label: 'Vos messages' },
  { icon: BellRing, label: 'Vos alertes' },
]

function LoadingPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 text-ink sm:px-6" aria-busy="true" aria-label="Chargement du parcours Devenir Pro">
      <div className="mx-auto max-w-site">
        <Skeleton className="h-64 rounded-block" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-6"><Skeleton className="h-80" /><Skeleton className="h-96" /></div>
          <Skeleton className="h-96" />
        </div>
      </div>
    </main>
  )
}

function SectionTitle({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ink font-display text-h5 text-cream">{number}</span>
      <div>
        <h2 className="font-display text-h4 font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-body-sm text-ink/65">{description}</p>
      </div>
    </div>
  )
}

function ErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-[70vh] bg-cream px-4 py-16 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl">
        <FeedbackAlert tone="error" title="Chargement impossible">
          <p>Les informations nécessaires au parcours Pro ne sont pas disponibles pour le moment.</p>
          <Button variant="secondary" className="mt-4" onClick={onRetry}><RefreshCw className="h-4 w-4" aria-hidden="true" />Réessayer</Button>
        </FeedbackAlert>
      </div>
    </main>
  )
}

export default function ProUpgradeFlow() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated, demoProfile } = useAuthStore()
  const [data, setData] = useState<ProUpgradePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [draft, setDraft] = useState<ProUpgradeDraft>(EMPTY_DRAFT)
  const [fieldErrors, setFieldErrors] = useState<ProUpgradeFieldErrors>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoError, setLogoError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState<{ logoSaved: boolean } | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const pageData = await getProUpgradePageData()
      setData(pageData)
      if (!initialized.current) {
        setDraft((current) => ({
          ...current,
          ...pageData.suggestedDraft,
          phone: pageData.suggestedDraft?.phone || user?.telephone || current.phone,
          selectedPlanId: pageData.plans.some((plan) => plan.id === 'pro') ? 'pro' : 'free',
        }))
        initialized.current = true
      }
    } catch {
      setData(null)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [user?.telephone])

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/connexion?next=%2Fdevenir-pro')
      return
    }
    if (user?.is_pro) {
      router.replace('/pro/dashboard')
      return
    }
    void load()
  }, [hasHydrated, isAuthenticated, load, router, user?.is_pro])

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  const selectedPlan = useMemo(
    () => data?.plans.find((plan) => plan.id === draft.selectedPlanId) ?? null,
    [data?.plans, draft.selectedPlanId],
  )

  const updateDraft = <Key extends keyof ProUpgradeDraft>(key: Key, value: ProUpgradeDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setLogoError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoError('Choisissez une image au format JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Le logo ne peut pas dépasser 5 Mo.')
      return
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validateProUpgradeDraft(draft)
    setFieldErrors(errors)
    setSubmitError('')
    if (Object.keys(errors).length > 0) {
      document.getElementById('pro-upgrade-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    setSubmitting(true)
    try {
      const result = await submitProUpgrade({ draft, logoFile })
      setSuccess({ logoSaved: result.logoSaved })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message = error && typeof error === 'object' && 'response' in error
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || '')
        : ''
      setSubmitError(message || 'Votre demande n’a pas pu être envoyée. Vérifiez votre connexion puis réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasHydrated || !isAuthenticated || user?.is_pro || loading) return <><Header /><LoadingPage /></>

  if (loadError || !data) return <><Header /><ErrorPage onRetry={() => void load()} /></>

  const accountPending = user?.account_type === 'professional'
  const firstName = user?.first_name || user?.prenom || 'Votre compte'

  if (success || accountPending) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] bg-cream px-4 py-10 text-ink sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <DeepPanel className="p-7 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-control bg-reef/20 text-reef-on-deep"><FileCheck2 className="h-7 w-7" aria-hidden="true" /></span>
              <p className="mt-6 text-eyebrow uppercase text-accent">Demande enregistrée</p>
              <h1 className="mt-3 font-display text-h2 font-normal text-cream">Votre entreprise passe en validation</h1>
              <p className="mx-auto mt-5 max-w-2xl text-body text-cream/75">L’équipe Kalico vérifie maintenant votre RIDET. Votre compte, vos annonces, vos avis, vos messages et vos alertes restent disponibles pendant cette étape.</p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
                {[
                  ['1', 'Demande reçue'],
                  ['2', 'RIDET vérifié'],
                  ['3', 'Essai Pro activable'],
                ].map(([number, label]) => <div key={number} className="rounded-control border border-cream/15 bg-cream/5 p-4"><span className="text-eyebrow-sm text-accent">Étape {number}</span><p className="mt-2 text-body-sm font-semibold text-cream">{label}</p></div>)}
              </div>
              {success && logoFile && !success.logoSaved ? <FeedbackAlert tone="info" title="Demande reçue, logo à reprendre" className="mx-auto mt-6 max-w-2xl text-left"><p>Votre demande est bien enregistrée, mais le logo n’a pas pu être sauvegardé. Vous pourrez l’ajouter depuis vos paramètres Pro après validation.</p></FeedbackAlert> : null}
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/profil" className="k-button k-button-primary">Retour à mon compte</Link><Link href="/pro" className="k-button k-button-ghost">Voir l’offre Pro</Link></div>
            </DeepPanel>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="overflow-hidden bg-cream text-ink">
        <section className="mx-auto max-w-site px-4 py-6 sm:px-6 sm:py-10">
          <DeepPanel className="p-6 sm:p-10 lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
              <div>
                <p className="text-eyebrow uppercase text-accent">Devenir Pro</p>
                <h1 className="mt-4 max-w-3xl font-display text-h2 font-normal text-cream sm:text-h1-form">{firstName}, transformez votre compte sans repartir de zéro</h1>
                <p className="mt-5 max-w-2xl text-body-lg text-cream/75">Ajoutez votre entreprise, préparez votre vitrine et choisissez votre formule. Votre historique Kalico reste attaché au même compte.</p>
              </div>
              <div className="grid grid-cols-2 gap-3" aria-label="Éléments conservés">
                {preservedItems.map(({ icon: Icon, label }) => <div key={label} className="rounded-control border border-cream/15 bg-cream/5 p-4"><Icon className="h-5 w-5 text-accent" aria-hidden="true" /><p className="mt-4 text-body-sm font-semibold text-cream">{label}</p><p className="mt-1 text-meta text-cream/55">Conservés</p></div>)}
              </div>
            </div>
          </DeepPanel>
        </section>

        <section className="mx-auto max-w-site px-4 pb-20 sm:px-6">
          <form id="pro-upgrade-form" onSubmit={handleSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6">
              <Card className="hover:border-sand">
                <SectionTitle number="1" title="Votre entreprise" description="Ces informations servent à préparer la vérification administrative de votre activité." />
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Input label="Raison sociale" value={draft.companyName} onChange={(event) => updateDraft('companyName', event.target.value)} error={fieldErrors.companyName} autoComplete="organization" />
                  <Select label="Secteur d’activité" value={draft.sector} onChange={(event) => updateDraft('sector', event.target.value)} error={fieldErrors.sector}><option value="">Choisir un secteur</option>{data.sectors.map((sector) => <option key={sector}>{sector}</option>)}</Select>
                  <Input label="Téléphone professionnel" prefix="+687" value={draft.phone} onChange={(event) => updateDraft('phone', event.target.value)} error={fieldErrors.phone} inputMode="tel" autoComplete="tel-national" />
                  <Input label="Numéro RIDET" value={formatRidet(draft.ridet)} onChange={(event) => updateDraft('ridet', normalizeRidet(event.target.value))} error={fieldErrors.ridet} inputMode="numeric" hint={normalizeRidet(draft.ridet).length === 10 ? 'Format valide. La vérification administrative aura lieu après l’envoi.' : 'Saisissez les 10 chiffres. Aucun registre externe n’est interrogé à cette étape.'} />
                  <div className="sm:col-span-2"><Select label="Commune principale" value={draft.commune} onChange={(event) => updateDraft('commune', event.target.value)} error={fieldErrors.commune} hint="Le profil actuel prend en charge une commune principale."><option value="">Choisir une commune</option>{data.communes.map((commune) => <option key={commune.id} value={commune.name}>{commune.name}</option>)}</Select></div>
                </div>
                <FeedbackAlert className="mt-6" title="Validation du RIDET"><p>Après l’envoi, votre dossier passe en vérification. Nous ne déclarons jamais une entreprise « trouvée » sans confirmation administrative.</p></FeedbackAlert>
              </Card>

              <Card className="hover:border-sand">
                <SectionTitle number="2" title="Votre future vitrine" description="Présentez clairement votre activité. La vitrine publique sera ouverte après validation." />
                <div className="mt-7 grid gap-6 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div>
                    <p className="text-label-sm font-semibold text-ink">Logo</p>
                    <label className="mt-2 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-card border border-dashed border-sand bg-cream-sunken text-center transition-colors hover:border-ink">
                      {logoPreview ? <span className="relative h-full w-full"><Image src={logoPreview} alt="Aperçu du logo sélectionné" fill unoptimized className="object-cover" /></span> : <span className="p-4 text-body-sm text-ink/65"><ImagePlus className="mx-auto mb-3 h-7 w-7 text-accent-text" aria-hidden="true" />Ajouter une image</span>}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleLogo} />
                    </label>
                    <p className={`mt-2 text-meta ${logoError ? 'text-alert-error' : 'text-ink/60'}`} role={logoError ? 'alert' : undefined}>{logoError || 'JPG, PNG ou WebP, 5 Mo maximum.'}</p>
                  </div>
                  <div className="grid content-start gap-5">
                    <Textarea label="Présentation" value={draft.presentation} onChange={(event) => updateDraft('presentation', event.target.value)} error={fieldErrors.presentation} maxLength={300} hint={`${draft.presentation.length}/300 caractères`} />
                    <div className="flex items-start gap-3 rounded-control border border-warm-border bg-cream-sunken p-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-info-text" aria-hidden="true" /><div><p className="text-body-sm font-semibold">Adresse publique après validation</p><p className="mt-1 text-meta text-ink/65">Votre profil utilisera l’adresse Kalico réelle `/pro/[id]`. Aucun slug fictif ne vous est réservé aujourd’hui.</p></div></div>
                  </div>
                </div>
              </Card>

              <Card className="hover:border-sand">
                <SectionTitle number="3" title="Votre formule" description="Les deux formules ci-dessous viennent du catalogue Kalico partagé avec la page Pro." />
                <div className="mt-7 flex w-fit rounded-pill border border-warm-border bg-cream-sunken p-1" aria-label="Période de facturation">
                  {(['monthly', 'yearly'] as ProBillingCycle[]).map((cycle) => <button key={cycle} type="button" aria-pressed={draft.billingCycle === cycle} onClick={() => updateDraft('billingCycle', cycle)} className={`min-h-11 rounded-pill px-5 text-body-sm font-semibold transition-colors ${draft.billingCycle === cycle ? 'bg-ink text-cream shadow-card' : 'text-ink hover:bg-cream-surface'}`}>{cycle === 'monthly' ? 'Mensuel' : 'Annuel'}</button>)}
                </div>
                {draft.billingCycle === 'yearly' ? <FeedbackAlert className="mt-5" title="Tarif annuel informatif"><p>Le catalogue fournit ce montant, mais l’activation annuelle n’est pas encore disponible. Aucun paiement ne sera lancé depuis cette page.</p></FeedbackAlert> : null}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {data.plans.map((plan) => {
                    const selected = draft.selectedPlanId === plan.id
                    return <button key={plan.id} type="button" aria-pressed={selected} onClick={() => updateDraft('selectedPlanId', plan.id as ProPlanId)} className={`rounded-card border p-5 text-left transition-colors ${selected ? 'border-ink bg-cream-surface shadow-panel' : 'border-warm-border bg-cream-sunken hover:border-ink'}`}><span className="flex items-center justify-between gap-4"><span className="font-display text-h4 font-semibold">{plan.name}</span>{selected ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-reef/15 text-reef-text"><Check className="h-4 w-4" aria-hidden="true" /></span> : null}</span><span className="mt-4 block font-display text-h3">{formatXpf(getDisplayedPrice(plan, draft.billingCycle))}</span><span className="mt-1 block text-meta text-ink/60">{draft.billingCycle === 'monthly' ? 'par mois' : 'par an'}</span><ul className="mt-5 grid gap-2 border-t border-warm-border pt-4">{planFeatureHighlights(plan).slice(0, 3).map((feature) => <li key={feature} className="flex gap-2 text-meta text-ink/70"><Check className="mt-0.5 h-4 w-4 shrink-0 text-reef-text" aria-hidden="true" />{feature}</li>)}</ul></button>
                  })}
                </div>
              </Card>

              <Card className="hover:border-sand">
                <SectionTitle number="4" title="Validation et essai" description="Aucun paiement n’est demandé lors du dépôt de votre dossier." />
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: FileCheck2, title: 'Dossier envoyé', copy: 'Vos informations sont enregistrées.' },
                    { icon: ShieldCheck, title: 'RIDET vérifié', copy: 'L’équipe contrôle votre justificatif.' },
                    { icon: Sparkles, title: '30 jours offerts', copy: 'L’essai devient activable après validation.' },
                  ].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-control bg-cream-sunken p-4"><Icon className="h-5 w-5 text-accent-text" aria-hidden="true" /><p className="mt-4 text-body-sm font-semibold">{title}</p><p className="mt-2 text-meta text-ink/65">{copy}</p></div>)}
                </div>
                <FeedbackAlert className="mt-6" title="Moyens de paiement"><p>Le prélèvement, le virement et l’activation annuelle ne sont pas proposés tant que leurs contrats ne sont pas disponibles. Vous ne saisissez aucune donnée bancaire ici.</p></FeedbackAlert>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-28" aria-label="Récapitulatif de la demande">
              <Card className="border-ink shadow-panel hover:border-ink">
                <p className="text-eyebrow uppercase text-accent-text">Votre récapitulatif</p>
                <h2 className="mt-3 font-display text-h3 font-normal">Prêt à devenir Pro</h2>
                <dl className="mt-6 grid gap-4 border-y border-warm-border py-5 text-body-sm">
                  <div className="flex items-start justify-between gap-4"><dt className="text-ink/60">Entreprise</dt><dd className="max-w-[60%] text-right font-semibold">{draft.companyName || 'À compléter'}</dd></div>
                  <div className="flex items-start justify-between gap-4"><dt className="text-ink/60">Commune</dt><dd className="max-w-[60%] text-right font-semibold">{draft.commune || 'À compléter'}</dd></div>
                  <div className="flex items-start justify-between gap-4"><dt className="text-ink/60">Formule souhaitée</dt><dd className="max-w-[60%] text-right font-semibold">{selectedPlan?.name || '—'} · {draft.billingCycle === 'monthly' ? 'mensuel' : 'annuel'}</dd></div>
                </dl>
                <div className="mt-6 rounded-control bg-reef/10 p-5"><div className="flex items-end justify-between gap-4"><span className="text-body-sm font-semibold text-reef-text">Dû aujourd’hui</span><strong className="font-display text-price text-reef-text">0 XPF</strong></div><p className="mt-2 text-meta text-reef-text">Aucun débit lors de la demande. L’essai de 30 jours sera activable après validation du RIDET.</p></div>
                {submitError ? <FeedbackAlert tone="error" title="Envoi impossible" className="mt-5"><p>{submitError}</p></FeedbackAlert> : null}
                <Button type="submit" loading={submitting} loadingLabel="Envoi de la demande…" className="mt-6 w-full"><Briefcase className="h-4 w-4" aria-hidden="true" />Envoyer ma demande Pro<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
                <p className="mt-4 flex items-start gap-2 text-meta text-ink/60"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Votre formule souhaitée ne déclenche aucun abonnement. Elle pourra être confirmée après la validation.</p>
              </Card>
              <div className="mt-4 flex items-start gap-3 rounded-control border border-warm-border bg-cream-surface p-4 text-meta text-ink/65"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-info-text" aria-hidden="true" /><p>En envoyant ce dossier, votre compte devient une demande professionnelle en attente. Vos contenus personnels restent accessibles.</p></div>
            </aside>
          </form>
        </section>
      </main>
    </>
  )
}
