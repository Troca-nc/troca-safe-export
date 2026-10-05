'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import AuthMapPanel from '@/components/auth/AuthMapPanel'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import PhoneVerification from '@/components/profil/PhoneVerification'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Controls'
import { Input, Select } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  describeRegistrationError,
  getRegistrationCommunes,
  getRegistrationOffers,
  registrationSectors,
  saveProfessionalRegistration,
} from '@/lib/data/registration'
import { useAuthStore } from '@/store/authStore'
import type {
  RegistrationAccountType,
  RegistrationCommune,
  RegistrationDraft,
  RegistrationErrorPresentation,
  RegistrationOffer,
  RegistrationStep,
} from '@/types/registration'

const STORAGE_KEY = 'kalico-registration-v2'
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
const TURNSTILE_ENABLED = Boolean(TURNSTILE_KEY && !TURNSTILE_KEY.startsWith('CHANGEME'))
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''
const GOOGLE_ENABLED = Boolean(GOOGLE_KEY && !GOOGLE_KEY.toLowerCase().includes('changeme'))

const defaultDraft: RegistrationDraft = {
  accountType: 'particulier',
  step: 'type',
  firstName: '',
  lastName: '',
  communeId: '',
  communeName: '',
  phone: '',
  companyName: '',
  ridet: '',
  sector: '',
  newsletter: false,
  selectedPlan: 'free',
  accountCreated: false,
  phoneVerified: false,
}

const stepLabels: Record<Exclude<RegistrationStep, 'done'>, string> = {
  type: 'Type de compte',
  info: 'Informations',
  credentials: 'Identifiants',
  verify: 'Vérification',
  plan: 'Offre',
}

const brandByStep: Record<RegistrationStep, { eyebrow: string; title: string; body: string }> = {
  type: { eyebrow: 'Rejoindre Kalico', title: 'Votre marché local, dans une seule application.', body: 'Choisissez le compte qui correspond à votre activité. Vous pourrez faire évoluer votre profil plus tard.' },
  info: { eyebrow: 'Votre profil', title: 'Des échanges plus proches de chez vous.', body: 'Votre commune et votre téléphone servent à sécuriser le compte et à personnaliser votre expérience.' },
  credentials: { eyebrow: 'Accès sécurisé', title: 'Un compte simple, protégé dès le départ.', body: 'Votre e-mail reste votre identifiant. Nous vérifions ensuite votre téléphone sans l’afficher publiquement.' },
  verify: { eyebrow: 'Vérification', title: 'La confiance commence par un contact vérifié.', body: 'Le code reçu confirme que vous gardez le contrôle de votre numéro.' },
  plan: { eyebrow: 'Kalico Pro', title: 'Choisissez le rythme qui convient à votre activité.', body: 'Les tarifs et avantages affichés viennent du catalogue Kalico actuel.' },
  done: { eyebrow: 'Bienvenue', title: 'Votre compte Kalico est prêt.', body: 'Vous pouvez maintenant compléter votre profil ou commencer à publier.' },
}

const proofsByType: Record<RegistrationAccountType, string[]> = {
  particulier: [
    'Publiez sans commission entre particuliers.',
    'Échangez dans la messagerie locale sécurisée.',
    'Retrouvez annonces, troc et services avec le même compte.',
  ],
  pro: [
    'Présentez votre activité dans l’annuaire local.',
    'Centralisez annonces, devis et demandes de contact.',
    'Votre RIDET reste en attente jusqu’à sa validation.',
  ],
}

function sanitizeDraft(value: unknown): RegistrationDraft {
  if (!value || typeof value !== 'object') return defaultDraft
  const input = value as Partial<RegistrationDraft>
  const accountType = input.accountType === 'pro' ? 'pro' : 'particulier'
  const allowedSteps: RegistrationStep[] = ['type', 'info', 'credentials', 'verify', 'plan', 'done']
  let step = allowedSteps.includes(input.step as RegistrationStep) ? input.step as RegistrationStep : 'type'
  if (accountType === 'particulier' && step === 'plan') step = 'done'
  return {
    ...defaultDraft,
    ...input,
    accountType,
    step,
    accountCreated: Boolean(input.accountCreated),
    phoneVerified: Boolean(input.phoneVerified),
  }
}

function passwordRules(password: string) {
  return [
    { label: '8 caractères', valid: password.length >= 8 },
    { label: '1 majuscule', valid: /[A-Z]/.test(password) },
    { label: '1 chiffre', valid: /[0-9]/.test(password) },
    { label: '1 symbole', valid: /[^A-Za-z0-9]/.test(password) },
  ]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' XPF'
}

function RegistrationSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Chargement de l’inscription…</span>
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>
      <Skeleton className="h-12" />
    </div>
  )
}

export default function RegistrationFlow() {
  const registerUser = useAuthStore((state) => state.register)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [draft, setDraft] = useState<RegistrationDraft>(defaultDraft)
  const [draftReady, setDraftReady] = useState(false)
  const [communes, setCommunes] = useState<RegistrationCommune[]>([])
  const [communesLoading, setCommunesLoading] = useState(true)
  const [communesError, setCommunesError] = useState('')
  const [offers, setOffers] = useState<RegistrationOffer[]>([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [offersError, setOffersError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<RegistrationErrorPresentation | null>(null)

  const updateDraft = (values: Partial<RegistrationDraft>) => setDraft((current) => ({ ...current, ...values }))

  const loadCommunes = async () => {
    setCommunesLoading(true)
    setCommunesError('')
    try {
      setCommunes(await getRegistrationCommunes())
    } catch {
      setCommunesError('Impossible de charger les communes.')
    } finally {
      setCommunesLoading(false)
    }
  }

  const loadOffers = async () => {
    setOffersLoading(true)
    setOffersError('')
    try {
      setOffers(await getRegistrationOffers())
    } catch {
      setOffersError('Impossible de charger les offres professionnelles.')
    } finally {
      setOffersLoading(false)
    }
  }

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY)
      setDraft(stored ? sanitizeDraft(JSON.parse(stored)) : defaultDraft)
    } catch {
      setDraft(defaultDraft)
    } finally {
      setDraftReady(true)
    }
    void loadCommunes()
    void loadOffers()
  }, [])

  useEffect(() => {
    if (!draftReady) return
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft, draftReady])

  useEffect(() => {
    if (!draftReady || !hasHydrated) return
    if (draft.accountCreated && !isAuthenticated) updateDraft({ accountCreated: false, phoneVerified: false, step: 'credentials' })
  }, [draft.accountCreated, draftReady, hasHydrated, isAuthenticated])

  const steps = useMemo<Exclude<RegistrationStep, 'done'>[]>(
    () => draft.accountType === 'pro'
      ? ['type', 'info', 'credentials', 'verify', 'plan']
      : ['type', 'info', 'credentials', 'verify'],
    [draft.accountType],
  )
  const currentIndex = draft.step === 'done' ? steps.length : Math.max(0, steps.indexOf(draft.step as Exclude<RegistrationStep, 'done'>))
  const rules = passwordRules(password)
  const passwordValid = rules.every((rule) => rule.valid)
  const phoneDigits = draft.phone.replace(/\D/g, '').slice(-6)
  const ridetDigits = draft.ridet.replace(/\D/g, '')
  const infoValid = draft.firstName.trim().length >= 2
    && draft.lastName.trim().length >= 2
    && Boolean(draft.communeId)
    && phoneDigits.length === 6
    && (draft.accountType === 'particulier'
      || draft.companyName.trim().length >= 2 && ridetDigits.length === 10 && Boolean(draft.sector))
  const credentialsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && passwordValid
    && password === passwordConfirm
    && termsAccepted
    && (!TURNSTILE_ENABLED || Boolean(turnstileToken))

  const disabledReason = draft.step === 'info' && !infoValid
    ? draft.accountType === 'pro'
      ? 'Complétez vos coordonnées, votre entreprise, votre secteur et les 10 chiffres du RIDET.'
      : 'Complétez votre identité, votre commune et les 6 chiffres de votre mobile.'
    : draft.step === 'credentials' && !credentialsValid
      ? 'Utilisez un e-mail valide, respectez les quatre règles du mot de passe et acceptez les conditions.'
      : ''

  const goTo = (step: RegistrationStep) => {
    setError(null)
    updateDraft({ step })
  }

  const handleContinue = async () => {
    if (draft.step === 'type') {
      goTo('info')
      return
    }
    if (draft.step === 'info' && infoValid) {
      goTo('credentials')
      return
    }
    if (draft.step === 'plan') {
      goTo('done')
      return
    }
    if (draft.step !== 'credentials' || !credentialsValid) return

    setBusy(true)
    setError(null)
    try {
      if (!draft.accountCreated) {
        await registerUser({
          email: email.trim(),
          password,
          prenom: draft.firstName.trim(),
          nom: draft.lastName.trim(),
          commune_id: Number(draft.communeId),
          telephone: `+687${phoneDigits}`,
          account_type: draft.accountType,
        }, turnstileToken || undefined)
        updateDraft({ accountCreated: true })
      }

      if (draft.accountType === 'pro') {
        await saveProfessionalRegistration({
          companyName: draft.companyName.trim(),
          sector: draft.sector,
          ridet: ridetDigits,
          commune: draft.communeName,
          phone: `+687${phoneDigits}`,
        })
      }
      setPassword('')
      setPasswordConfirm('')
      setTurnstileToken('')
      goTo('verify')
    } catch (caught) {
      setError(describeRegistrationError(caught))
    } finally {
      setBusy(false)
    }
  }

  const handleBack = () => {
    if (draft.accountCreated) return
    if (draft.step === 'info') goTo('type')
    if (draft.step === 'credentials') goTo('info')
  }

  const resetFlow = () => {
    window.sessionStorage.removeItem(STORAGE_KEY)
    setDraft(defaultDraft)
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
    setTermsAccepted(false)
    setError(null)
  }

  const brand = brandByStep[draft.step]

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[560px_minmax(0,1fr)]">
      <AuthMapPanel eyebrow={brand.eyebrow} title={brand.title} body={brand.body} proofs={proofsByType[draft.accountType]} />
      <main className="flex min-h-screen min-w-0 flex-col px-4 py-5 sm:px-8 lg:px-10 lg:py-8 xl:px-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-body-sm font-medium text-ink/60 hover:text-ink"><ArrowLeft className="h-4 w-4" />Retour au site</Link>
          <p className="text-body-sm text-ink/60">Déjà membre ? <Link href="/connexion" className="font-semibold text-accent-text hover:underline">Se connecter</Link></p>
        </div>

        <div className="mx-auto flex w-full max-w-[760px] flex-1 items-center py-8 lg:py-10">
          <div className="w-full">
            {!draftReady ? <RegistrationSkeleton /> : (
              <>
                {draft.step !== 'done' ? (
                  <nav aria-label="Étapes de l’inscription" className="mb-8 overflow-x-auto pb-2">
                    <ol className="flex min-w-max items-start">
                      {steps.map((step, index) => {
                        const active = step === draft.step
                        const complete = index < currentIndex
                        const revisitable = complete && !draft.accountCreated
                        return (
                          <li key={step} className="flex items-start last:flex-none">
                            <button type="button" disabled={!revisitable} onClick={() => revisitable && goTo(step)} className="group flex min-h-11 items-center gap-2 text-left disabled:cursor-default" aria-current={active ? 'step' : undefined}>
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-label ${active ? 'border-ink bg-ink text-cream' : complete ? 'border-reef bg-reef/15 text-reef-text' : 'border-warm-border bg-cream-sunken text-ink/45'}`}>{complete ? <Check className="h-4 w-4" /> : index + 1}</span>
                              <span className={`max-w-28 text-label-sm ${active || complete ? 'text-ink' : 'text-ink/45'}`}>{stepLabels[step]}</span>
                            </button>
                            {index < steps.length - 1 ? <span className={`mx-3 mt-[18px] h-px w-8 sm:w-12 ${complete ? 'bg-reef' : 'bg-warm-border'}`} aria-hidden="true" /> : null}
                          </li>
                        )
                      })}
                    </ol>
                  </nav>
                ) : null}

                {draft.step === 'type' ? (
                  <section>
                    <p className="text-eyebrow text-accent-text">Inscription</p>
                    <h1 className="mt-3 font-display text-h1 text-ink">Créer votre compte</h1>
                    <p className="mt-3 text-body text-ink/65">Choisissez votre usage. Le parcours s’adapte immédiatement.</p>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      {([
                        { id: 'particulier' as const, icon: UserRound, title: 'Particulier', text: 'Acheter, vendre, troquer et donner entre voisins.' },
                        { id: 'pro' as const, icon: Store, title: 'Professionnel', text: 'Présenter votre activité et accéder aux outils Pro.' },
                      ]).map((choice) => {
                        const selected = draft.accountType === choice.id
                        const Icon = choice.icon
                        return <button key={choice.id} type="button" aria-pressed={selected} onClick={() => updateDraft({ accountType: choice.id, selectedPlan: choice.id === 'pro' ? 'pro-monthly' : 'free' })} className={`min-h-44 rounded-card border p-5 text-left transition ${selected ? 'border-ink bg-ink text-cream shadow-modal' : 'border-warm-border bg-cream-surface text-ink hover:border-ink/40'}`}><span className={`flex h-12 w-12 items-center justify-center rounded-control ${selected ? 'bg-accent/20 text-accent' : 'bg-cream-sunken text-ink'}`}><Icon className="h-5 w-5" /></span><span className="mt-5 block font-display text-2xl">{choice.title}</span><span className={`mt-2 block text-body-sm ${selected ? 'text-cream/70' : 'text-ink/65'}`}>{choice.text}</span></button>
                      })}
                    </div>
                  </section>
                ) : null}

                {draft.step === 'info' ? (
                  <section>
                    <p className="text-eyebrow text-accent-text">Informations</p>
                    <h1 className="mt-3 font-display text-h1 text-ink">{draft.accountType === 'pro' ? 'Votre entreprise et vous' : 'Parlez-nous de vous'}</h1>
                    <p className="mt-3 text-body text-ink/65">Ces informations servent à personnaliser et sécuriser votre compte.</p>
                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <Input label="Prénom" value={draft.firstName} onChange={(event) => updateDraft({ firstName: event.target.value })} autoComplete="given-name" />
                      <Input label="Nom" value={draft.lastName} onChange={(event) => updateDraft({ lastName: event.target.value })} autoComplete="family-name" />
                      {communesLoading ? <div className="sm:col-span-2"><Skeleton className="h-[74px]" /></div> : communesError ? <div role="alert" className="sm:col-span-2 rounded-control border border-alert-error/25 bg-alert-error/10 p-4 text-body-sm text-alert-error"><p>{communesError}</p><Button variant="tertiary" compact className="mt-3" onClick={() => void loadCommunes()}>Réessayer</Button></div> : <Select label="Commune" value={draft.communeId} onChange={(event) => { const commune = communes.find((item) => String(item.id) === event.target.value); updateDraft({ communeId: event.target.value, communeName: commune?.name || '' }) }} className="sm:col-span-2"><option value="">Choisir une commune</option>{communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}</Select>}
                      <Input label="Numéro mobile" prefix="+687" value={draft.phone} onChange={(event) => updateDraft({ phone: event.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" autoComplete="tel-national" placeholder="XX XX XX" hint="Un code de vérification sera envoyé à ce numéro." className="sm:col-span-2" />
                      {draft.accountType === 'pro' ? <><Input label="Raison sociale" value={draft.companyName} onChange={(event) => updateDraft({ companyName: event.target.value })} className="sm:col-span-2" /><Input label="Numéro RIDET" value={draft.ridet} onChange={(event) => updateDraft({ ridet: event.target.value })} inputMode="numeric" hint={ridetDigits.length === 10 ? 'Format valide. Validation administrative en attente.' : 'Saisissez les 10 chiffres du RIDET.'} /><Select label="Secteur" value={draft.sector} onChange={(event) => updateDraft({ sector: event.target.value })}><option value="">Choisir un secteur</option>{registrationSectors.map((sector) => <option key={sector}>{sector}</option>)}</Select></> : null}
                    </div>
                  </section>
                ) : null}

                {draft.step === 'credentials' ? (
                  <section>
                    <p className="text-eyebrow text-accent-text">Identifiants</p>
                    <h1 className="mt-3 font-display text-h1 text-ink">Sécurisez votre accès</h1>
                    <p className="mt-3 text-body text-ink/65">Un lien de confirmation sera envoyé à votre e-mail.</p>
                    {error ? <div role="alert" className="mt-5 rounded-control border border-alert-error/25 bg-alert-error/10 p-4 text-body-sm text-alert-error"><p>{error.message}</p>{error.emailAlreadyUsed ? <Link href="/connexion" className="mt-2 inline-flex font-semibold underline">Se connecter</Link> : null}</div> : null}
                    <div className="mt-7 space-y-5">
                      <Input label="Adresse e-mail" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Input label="Mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" suffix={<button type="button" onClick={() => setShowPassword((value) => !value)} className="flex min-h-11 min-w-11 items-center justify-center" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
                        <Input label="Confirmer le mot de passe" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" error={passwordConfirm && password !== passwordConfirm ? 'Les mots de passe ne correspondent pas.' : undefined} />
                      </div>
                      <div><div className="grid grid-cols-4 gap-2" aria-label="Solidité du mot de passe">{rules.map((rule) => <span key={rule.label} className={`h-2 rounded-full ${rule.valid ? 'bg-reef' : 'bg-warm-border'}`} />)}</div><div className="mt-3 flex flex-wrap gap-2">{rules.map((rule) => <span key={rule.label} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-meta ${rule.valid ? 'border-reef/35 bg-reef/10 text-reef-text' : 'border-warm-border text-ink/55'}`}><CheckCircle2 className="h-3.5 w-3.5" />{rule.label}</span>)}</div></div>
                      <Checkbox checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} label="J’accepte les conditions générales et la politique de confidentialité de Kalico." />
                      <p className="text-body-sm text-ink/60">Consultez les <Link href="/cgu" className="font-semibold text-accent-text underline">conditions générales</Link> et la <Link href="/confidentialite" className="font-semibold text-accent-text underline">politique de confidentialité</Link>.</p>
                      {TURNSTILE_ENABLED ? <TurnstileChallenge action="register" label="Vérification de sécurité" onTokenChange={setTurnstileToken} className="rounded-control border border-warm-border bg-cream-sunken p-4" /> : null}
                      {GOOGLE_ENABLED && !draft.accountCreated ? <div><div className="mb-4 flex items-center gap-3 text-meta text-ink/45"><span className="h-px flex-1 bg-warm-border" />Ou continuer avec<span className="h-px flex-1 bg-warm-border" /></div><SocialAuthButtons mode="inscription" redirectTo={draft.accountType === 'pro' ? '/bienvenue?role=pro' : '/bienvenue?role=particulier'} showLegalFooter={false} /></div> : null}
                    </div>
                  </section>
                ) : null}

                {draft.step === 'verify' ? (
                  <section>
                    <p className="text-eyebrow text-accent-text">Vérification</p>
                    <h1 className="mt-3 font-display text-h1 text-ink">Confirmez votre numéro</h1>
                    <p className="mt-3 text-body text-ink/65">Votre compte a été créé et l’e-mail de confirmation a été envoyé.</p>
                    <PhoneVerification initialPhone={`+687${phoneDigits}`} variant="inline" className="mt-7" onVerified={() => updateDraft({ phoneVerified: true, step: draft.accountType === 'pro' ? 'plan' : 'done' })} />
                  </section>
                ) : null}

                {draft.step === 'plan' ? (
                  <section>
                    <p className="text-eyebrow text-accent-text">Offre professionnelle</p>
                    <h1 className="mt-3 font-display text-h1 text-ink">Choisissez votre formule</h1>
                    <p className="mt-3 text-body text-ink/65">Votre choix prépare la suite. L’activation reste soumise à la validation du RIDET.</p>
                    {offersLoading ? <div className="mt-7 grid gap-4 lg:grid-cols-3"><Skeleton className="h-72" /><Skeleton className="h-72" /><Skeleton className="h-72" /></div> : offersError ? <div role="alert" className="mt-7 rounded-control border border-alert-error/25 bg-alert-error/10 p-4 text-body-sm text-alert-error"><p>{offersError}</p><Button variant="tertiary" compact className="mt-3" onClick={() => void loadOffers()}>Réessayer</Button></div> : <div className="mt-7 grid gap-4 lg:grid-cols-3">{offers.map((offer) => { const selected = draft.selectedPlan === offer.id; return <button key={offer.id} type="button" aria-pressed={selected} onClick={() => updateDraft({ selectedPlan: offer.id })} className={`relative rounded-card border p-5 text-left transition ${selected ? 'border-ink bg-cream-surface shadow-modal' : 'border-warm-border bg-cream-sunken hover:border-ink/35'}`}>{offer.recommended ? <span className="absolute right-4 top-4 rounded-full bg-accent-soft px-3 py-1 text-meta font-semibold text-accent-text">Recommandé</span> : null}<Building2 className="h-5 w-5 text-accent-text" /><h2 className="mt-5 font-display text-xl text-ink">{offer.name}</h2><p className="mt-3 text-2xl font-semibold text-ink">{formatPrice(offer.priceXpf)}</p><p className="text-meta text-ink/55">{offer.cadence}</p><ul className="mt-5 space-y-3">{offer.features.map((feature) => <li key={feature} className="flex gap-2 text-body-sm text-ink/70"><Check className="mt-0.5 h-4 w-4 shrink-0 text-reef-text" />{feature}</li>)}</ul></button> })}</div>}
                  </section>
                ) : null}

                {draft.step === 'done' ? (
                  <section className="text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-reef/15 text-reef-text"><CheckCircle2 className="h-8 w-8" /></span>
                    <p className="mt-6 text-eyebrow text-accent-text">Compte créé</p>
                    <h1 className="mt-3 font-display text-h1 text-ink">Bienvenue sur Kalico, {draft.firstName || 'vous'}.</h1>
                    <p className="mx-auto mt-3 max-w-xl text-body text-ink/65">Votre téléphone est vérifié. Consultez votre e-mail pour confirmer votre adresse{draft.accountType === 'pro' ? '; votre RIDET reste en attente de validation' : ''}.</p>
                    <div className="mt-7 flex flex-wrap justify-center gap-2"><span className="rounded-full border border-reef/30 bg-reef/10 px-3 py-1 text-meta font-semibold text-reef-text">E-mail envoyé</span><span className="rounded-full border border-reef/30 bg-reef/10 px-3 py-1 text-meta font-semibold text-reef-text">Téléphone vérifié</span>{draft.accountType === 'pro' ? <span className="rounded-full border border-accent/35 bg-accent-soft px-3 py-1 text-meta font-semibold text-accent-text">RIDET en attente</span> : null}</div>
                    <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">{(draft.accountType === 'pro' ? [{ title: 'Compléter ma vitrine', href: '/pro/dashboard/parametres' }, { title: 'Publier une annonce', href: '/deposer' }, { title: 'Voir les offres', href: `/abonnement?plan=${draft.selectedPlan}` }] : [{ title: 'Publier une annonce', href: '/deposer' }, { title: 'Créer une alerte', href: '/annonces' }, { title: 'Compléter mon profil', href: '/profil' }]).map((action, index) => <Link key={action.title} href={action.href} className="rounded-card border border-warm-border bg-cream-surface p-5 text-body-sm font-semibold text-ink shadow-card transition hover:border-ink/35"><span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-cream-sunken text-meta text-ink">{index + 1}</span>{action.title}<ArrowRight className="mt-4 h-4 w-4 text-accent-text" /></Link>)}</div>
                    <Button variant="ghost" className="mt-6" onClick={resetFlow}>Recommencer le parcours</Button>
                  </section>
                ) : null}

                {!['verify', 'done'].includes(draft.step) ? (
                  <div className="mt-8 border-t border-warm-border pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button variant="secondary" onClick={handleBack} disabled={draft.step === 'type' || draft.accountCreated}><ArrowLeft className="h-4 w-4" />Retour</Button>
                      <Button onClick={() => void handleContinue()} loading={busy} loadingLabel={draft.accountCreated ? 'Finalisation…' : 'Création…'} disabled={Boolean(disabledReason) || draft.step === 'plan' && (offersLoading || Boolean(offersError))}>{draft.step === 'credentials' ? draft.accountCreated ? 'Finaliser le profil' : 'Créer mon compte' : draft.step === 'plan' ? 'Terminer' : 'Continuer'}<ArrowRight className="h-4 w-4" /></Button>
                    </div>
                    {disabledReason ? <p className="mt-3 text-right text-meta text-ink/55">{disabledReason}</p> : null}
                    {draft.accountCreated && draft.step === 'credentials' ? <p className="mt-3 flex items-center justify-end gap-2 text-meta text-ink/60"><LockKeyhole className="h-4 w-4" />Le compte existe déjà; seule la finalisation du profil sera rejouée.</p> : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-warm-border pt-5 text-meta text-ink/55">{['Données protégées', 'Aucune revente de coordonnées', 'Compte supprimable'].map((label) => <span key={label} className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-reef-text" />{label}</span>)}</div>
      </main>
    </div>
  )
}
