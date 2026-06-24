'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from 'lucide-react'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { metaApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthMapPanel from '@/components/auth/AuthMapPanel'

const schema = z
  .object({
    first_name: z.string().min(2, 'Prénom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Adresse e-mail invalide'),
    phone: z.string().regex(/^(\+687|0)[0-9]{6}$/, 'Numéro NC invalide'),
    commune_id: z.string().optional(),
    password: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
  })

type FormData = z.infer<typeof schema>
type Step = 1 | 2 | 3
type ProfileChoice = 'particulier' | 'pro'
type BillingCycle = 'monthly' | 'annual'

const STEPS: Array<{ id: Step; label: string; helper: string }> = [
  { id: 1, label: 'Profil', helper: 'Compte et accès' },
  { id: 2, label: 'Identité', helper: 'Vos informations' },
  { id: 3, label: 'Sécurité', helper: 'Choix du plan' },
]

const COMMUNE_PLACEHOLDER = 'Choisir une commune'

const PLAN_FEATURES = [
  { label: 'Annonces actives', free: '5', pro: '∞' },
  { label: 'Photos par annonce', free: '6', pro: '12' },
  { label: 'Badge visible', free: 'Non', pro: 'Oui' },
  { label: 'Statistiques', free: 'Non', pro: 'Oui' },
] as const

function passwordScore(password: string) {
  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  return rules.filter(Boolean).length
}

function strengthLabel(score: number) {
  if (score <= 1) return 'Faible'
  if (score === 2) return 'Moyen'
  if (score === 3) return 'Fort'
  return 'Très fort'
}

function PasswordRules({ password }: { password: string }) {
  const score = passwordScore(password)
  const labels = [
    { ok: password.length >= 8, label: '8 caractères' },
    { ok: /[A-Z]/.test(password), label: '1 majuscule' },
    { ok: /[0-9]/.test(password), label: '1 chiffre' },
    { ok: /[^A-Za-z0-9]/.test(password), label: '1 symbole' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Solidité du mot de passe</p>
        <p className="text-xs font-semibold text-night/55">{strengthLabel(score)}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => {
          const filled = index < score
          const barClass =
            score <= 1
              ? filled
                ? 'bg-red-500'
                : 'bg-night/10'
              : score === 2
                ? filled
                  ? 'bg-orange-400'
                  : 'bg-night/10'
                : score === 3
                  ? filled
                    ? 'bg-yellow-400'
                    : 'bg-night/10'
                  : filled
                    ? 'bg-jungle'
                    : 'bg-night/10'

          return <span key={index} className={`h-1.5 rounded-full ${barClass}`} />
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {labels.map((item) => (
          <span key={item.label} className={`flex items-center gap-1.5 text-xs ${item.ok ? 'text-jungle' : 'text-night/40'}`}>
            <CheckCircle2 className={`h-3.5 w-3.5 ${item.ok ? 'fill-jungle/10' : ''}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function StepPill({
  step,
  current,
  onClick,
}: {
  step: Step
  current: Step
  onClick: (step: Step) => void
}) {
  const active = step === current
  const completed = step < current
  const clickable = active || completed

  return (
    <button
      type="button"
      onClick={() => clickable && onClick(step)}
      disabled={!clickable}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-150 ${
        active
          ? 'border-coral/25 bg-coral/5 shadow-sm'
          : completed
            ? 'border-jungle/20 bg-jungle/5 hover:border-jungle/30'
            : 'border-night/10 bg-white/75 text-night/40'
      }`}
      aria-current={active ? 'step' : undefined}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200 ${
          active
            ? 'bg-coral text-white'
            : completed
              ? 'bg-jungle text-white'
              : 'bg-night/5 text-night/35'
        }`}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </span>
      <span>
        <span className={`block text-sm font-semibold ${active ? 'text-night' : 'text-night/70'}`}>
          {STEPS[step - 1].label}
        </span>
        <span className="block text-xs text-night/50">{STEPS[step - 1].helper}</span>
      </span>
    </button>
  )
}

function AccountTypeCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: typeof UserRound | typeof Store
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full flex-col rounded-[1.5rem] border p-5 text-left transition duration-150 ${
        active
          ? 'border-coral/30 bg-coral/5 shadow-sm'
          : 'border-night/10 bg-white hover:-translate-y-0.5 hover:border-coral/20 hover:bg-sand/40 hover:shadow-sm'
      }`}
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-coral/10 text-coral' : 'bg-night/5 text-night/55'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-4 text-base font-semibold text-night">{title}</span>
      <span className="mt-1 text-sm leading-6 text-night/60">{description}</span>
    </button>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward')
  const [selectedProfile, setSelectedProfile] = useState<ProfileChoice>('particulier')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [communes, setCommunes] = useState<Array<{ id: number; name?: string; nom?: string }>>([])
  const socialRedirect = selectedProfile === 'pro' ? '/bienvenue?role=pro' : '/bienvenue?role=particulier'
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const password = watch('password') || ''
  const profileName = watch('first_name') || watch('last_name') || 'Vous'

  useEffect(() => {
    metaApi
      .getCommunes()
      .then(({ data }) => setCommunes(data.data || []))
      .catch(() => setCommunes([]))
  }, [])

  const goToStep = (next: Step) => {
    setStepDirection(next > step ? 'forward' : 'backward')
    setStep(next)
  }

  const nextFromStep1 = async () => {
    const ok = await trigger(['email', 'password', 'password_confirm'])
    if (ok) goToStep(2)
  }

  const nextFromStep2 = async () => {
    const ok = await trigger(['first_name', 'last_name', 'phone', 'commune_id'])
    if (!ok) return

    if (selectedProfile === 'pro') {
      goToStep(3)
      return
    }

    await handleSubmit(onSubmit)()
  }

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const { password_confirm: _passwordConfirm, ...payload } = data
      if (turnstileEnabled && !turnstileToken) {
        setServerError('Veuillez compléter la vérification anti-bot.')
        return
      }

      await registerUser(
        {
          ...payload,
          telephone: payload.phone,
          commune_id: payload.commune_id ? parseInt(payload.commune_id, 10) : undefined,
          account_type: selectedProfile,
        },
        turnstileToken || undefined,
      )
      router.push(`/verification-email?email=${encodeURIComponent(payload.email)}&role=${selectedProfile}`)
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Erreur lors de la création du compte')
    }
  }

  const canSubmitAtStep2 = selectedProfile === 'particulier'

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 md:px-8 lg:px-12">
        <div className="flex w-full max-w-[540px] flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center">
            <p className="font-display text-3xl font-bold text-night">Kalico</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">Nouvelle-Calédonie</p>
          </Link>
          <p className="mt-3 text-sm text-night/55">Créez votre compte en douceur, sans surcharge et sans choix prématuré.</p>
        </div>

        <div className="card card-hover overflow-hidden p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Inscription progressive</p>
              <h1 className="mt-2 font-display text-4xl font-bold text-night md:text-5xl">Rejoindre Kalico</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-night/60 md:text-base">
                Commencez avec votre compte, complétez votre profil, puis choisissez votre formule au bon moment.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
              <BadgeCheck className="h-3.5 w-3.5" />
              Étapes guidées
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {STEPS.map((item) => (
              <StepPill key={item.id} step={item.id} current={step} onClick={goToStep} />
            ))}
          </div>

          {serverError ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div key={step} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}>
              {step === 1 ? (
                <section className="space-y-4 rounded-[1.75rem] border border-night/10 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape 1</p>
                      <h2 className="mt-2 text-2xl font-semibold text-night">Créez votre compte</h2>
                      <p className="mt-1 text-sm text-night/55">E-mail, mot de passe et accès rapide avec Google ou Apple si vous préférez.</p>
                    </div>
                    <span className="rounded-full bg-night/5 px-3 py-1 text-xs font-semibold text-night/60">Le choix du compte vient ensuite</span>
                  </div>

                  <div className="rounded-[1.5rem] border border-coral/15 bg-[linear-gradient(135deg,rgba(255,102,102,0.06),rgba(72,202,228,0.08),rgba(255,255,255,0.96))] p-4 shadow-[0_16px_40px_rgba(8,32,50,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">
                          <BadgeCheck className="h-4 w-4" />
                          Tout Kalico dans un seul compte
                        </div>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-night/70">
                          Une seule inscription pour publier, échanger, réserver, vendre et suivre ce qui compte pour vous.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        { icon: Store, title: 'Annonces', text: 'Publiez un produit ou un service' },
                        { icon: Store, title: 'Troc', text: 'Échangez sans passer à côté' },
                        { icon: ShieldCheck, title: 'Sécurité', text: 'Compte protégé et vérifié' },
                        { icon: CheckCircle2, title: 'Messages', text: 'Réponses et suivi des échanges' },
                        { icon: Store, title: 'Pro', text: 'Outils pour développer votre activité' },
                        { icon: Store, title: 'Local', text: 'Communauté et visibilité NC' },
                      ].map(({ icon: Icon, title, text }) => (
                        <div key={title} className="rounded-2xl border border-night/10 bg-white/90 px-3 py-3 shadow-[0_10px_24px_rgba(8,32,50,0.04)]">
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-night">{title}</p>
                              <p className="mt-1 text-xs leading-5 text-night/55">{text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <SocialAuthButtons mode="inscription" redirectTo={socialRedirect} showLegalFooter={false} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="field-label">Adresse e-mail</span>
                      <input {...register('email')} type="email" className="input h-12 w-full" placeholder="vous@exemple.nc" />
                      {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="field-label">Mot de passe</span>
                      <div className="relative">
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="input h-12 w-full pr-12"
                          placeholder="Créez un mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-night/45 transition hover:text-night/70"
                          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
                      <PasswordRules password={password} />
                    </label>

                    <label className="space-y-2">
                      <span className="field-label">Confirmer le mot de passe</span>
                      <input
                        {...register('password_confirm')}
                        type={showPassword ? 'text' : 'password'}
                        className="input h-12 w-full"
                        placeholder="Répétez le mot de passe"
                      />
                      {errors.password_confirm ? <p className="field-error">{errors.password_confirm.message}</p> : null}
                    </label>
                  </div>

                  <p className="pt-2 text-xs text-night/45">
                    En continuant, vous acceptez nos{' '}
                    <Link href="/cgu" className="underline underline-offset-2 hover:text-night/70">
                      CGU
                    </Link>{' '}
                    et notre{' '}
                    <Link href="/politique-de-confidentialite" className="underline underline-offset-2 hover:text-night/70">
                      politique de confidentialité
                    </Link>
                    .
                  </p>
                </section>
              ) : null}

              {step === 2 ? (
                <section className="space-y-5 rounded-[1.75rem] border border-night/10 bg-white p-5 shadow-sm md:p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape 2</p>
                    <h2 className="mt-2 text-2xl font-semibold text-night">Parlez-nous de vous</h2>
                    <p className="mt-1 text-sm text-night/55">Une base simple et claire, sans multiplier les champs.</p>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[1.5rem] border border-night/10 bg-sand/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-night/10 bg-white">
                          <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(72,202,228,0.22),transparent_65%)]" />
                          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-lg font-bold text-coral">
                            {profileName.trim().charAt(0).toUpperCase() || 'T'}
                          </span>
                          <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-night text-white shadow-sm">
                            <Camera className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-night/45">Avatar optionnel</p>
                          <p className="mt-1 text-sm leading-6 text-night/60">Votre photo peut venir plus tard. Un avatar clair s’affiche en attendant.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="field-label">Prénom</span>
                        <input {...register('first_name')} className="input h-12 w-full" placeholder="Votre prénom" />
                        {errors.first_name ? <p className="field-error">{errors.first_name.message}</p> : null}
                      </label>
                      <label className="space-y-2">
                        <span className="field-label">Nom</span>
                        <input {...register('last_name')} className="input h-12 w-full" placeholder="Votre nom" />
                        {errors.last_name ? <p className="field-error">{errors.last_name.message}</p> : null}
                      </label>

                      <label className="space-y-2 md:col-span-2">
                      <span className="field-label">Téléphone mobile</span>
                      <input {...register('phone')} className="input h-12 w-full" placeholder="+687..." />
                      {errors.phone ? <p className="field-error">{errors.phone.message}</p> : null}
                      <p className="text-xs text-night/45">Nécessaire pour la récupération de mot de passe si vous choisissez l’option SMS.</p>
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="field-label">Votre commune en NC</span>
                        <select {...register('commune_id')} className="input h-12 w-full">
                          <option value="">{COMMUNE_PLACEHOLDER}</option>
                          {communes.map((commune) => (
                            <option key={commune.id} value={commune.id}>
                              {commune.name ?? commune.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <AccountTypeCard
                      active={selectedProfile === 'particulier'}
                      icon={UserRound}
                      title="Particulier"
                      description="J'achète, je vends, je troque et je publie pour un usage personnel."
                      onClick={() => setSelectedProfile('particulier')}
                    />
                    <AccountTypeCard
                      active={selectedProfile === 'pro'}
                      icon={Store}
                      title="Professionnel"
                      description="Enseigne, commerce, agence ou vendeur régulier qui veut plus de visibilité."
                      onClick={() => setSelectedProfile('pro')}
                    />
                  </div>
                </section>
              ) : null}

              {step === 3 && selectedProfile === 'pro' ? (
                <section className="space-y-5 rounded-[1.75rem] border border-night/10 bg-white p-5 shadow-sm md:p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape 3</p>
                    <h2 className="mt-2 text-2xl font-semibold text-night">Choisissez votre plan</h2>
                    <p className="mt-1 text-sm text-night/55">
                      Vous pouvez commencer gratuitement ou profiter du Pro quand votre activité le justifie.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <article className="rounded-[1.75rem] border border-jungle/20 bg-jungle/5 p-5">
                      <div className="inline-flex items-center rounded-full bg-jungle/15 px-3 py-1 text-xs font-semibold text-jungle">
                        Gratuit
                      </div>
                      <p className="mt-4 text-3xl font-bold text-night">0 XPF / mois</p>
                      <ul className="mt-4 space-y-2 text-sm text-night/65">
                        <li className="flex items-center gap-2">
                          <X className="h-4 w-4 text-night/35" />
                          5 annonces actives
                        </li>
                        <li className="flex items-center gap-2">
                          <X className="h-4 w-4 text-night/35" />
                          6 photos par annonce
                        </li>
                        <li className="flex items-center gap-2">
                          <X className="h-4 w-4 text-night/35" />
                          60 jours de visibilité
                        </li>
                      </ul>
                      <button type="button" className="btn-secondary mt-5 w-full">
                        Commencer gratuitement
                      </button>
                    </article>

                    <article className="pulse-once rounded-[1.75rem] border border-coral/20 bg-[linear-gradient(180deg,rgba(10,126,164,0.08),rgba(255,255,255,1))] p-5 shadow-lg shadow-coral/10">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white">
                          Recommandé
                        </span>
                        <button
                          type="button"
                          onClick={() => setBillingCycle((value) => (value === 'monthly' ? 'annual' : 'monthly'))}
                          className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-white px-3 py-1.5 text-xs font-semibold text-night transition hover:border-coral/25 hover:text-coral"
                        >
                          <span className={billingCycle === 'monthly' ? 'text-coral' : 'text-night/50'}>Mensuel</span>
                          <span className="text-night/25">/</span>
                          <span className={billingCycle === 'annual' ? 'text-coral' : 'text-night/50'}>Annuel</span>
                        </button>
                      </div>

                      <p className="mt-4 text-3xl font-bold text-coral">
                        {billingCycle === 'monthly' ? '4 900 XPF / mois' : '44 900 XPF / an'}
                      </p>
                      {billingCycle === 'annual' ? (
                        <p className="mt-2 text-sm font-semibold text-jungle">2 mois offerts</p>
                      ) : (
                        <p className="mt-2 text-sm text-night/55">Paiement flexible, à tout moment.</p>
                      )}

                      <div className="mt-5 space-y-3">
                        {PLAN_FEATURES.map((feature) => (
                          <div key={feature.label} className="rounded-2xl border border-night/8 bg-white/80 p-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-night">{feature.label}</span>
                              <span className="font-semibold text-coral">Pro : {feature.pro}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-night/10">
                              <div
                                className="h-2 rounded-full bg-coral"
                                style={{
                                  width:
                                    feature.label === 'Annonces actives'
                                      ? '100%'
                                      : feature.label === 'Photos par annonce'
                                        ? '80%'
                                        : feature.label === 'Badge visible'
                                          ? '70%'
                                          : '90%',
                                }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-night/55">Gratuit : {feature.free}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 rounded-2xl border border-coral/15 bg-coral/5 p-4 text-sm text-night/65">
                        <div className="flex items-center justify-between gap-3">
                          <span>Annonces</span>
                          <strong className="text-coral">∞ vs 5</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Photos</span>
                          <strong className="text-coral">12 vs 6</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Badge et stats</span>
                          <strong className="text-coral">Visibles</strong>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                              <BarChart3 className="h-3.5 w-3.5" />
                              Statistiques
                            </span>
                            <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-semibold text-white">Badge Pro</span>
                          </div>
                          <div className="mt-3 h-20 rounded-2xl bg-[linear-gradient(180deg,rgba(72,202,228,0.16),rgba(10,126,164,0.04))] p-3">
                            <div className="flex h-full items-end gap-2">
                              <span className="h-6 w-4 rounded-t-full bg-night/15" />
                              <span className="h-10 w-4 rounded-t-full bg-night/15" />
                              <span className="h-14 w-4 rounded-t-full bg-coral" />
                              <span className="h-8 w-4 rounded-t-full bg-night/15" />
                              <span className="h-16 w-4 rounded-t-full bg-coral/70" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={isSubmitting} className="btn-primary mt-5 w-full">
                        {isSubmitting ? 'Création…' : 'Démarrer l’essai gratuit'}
                      </button>
                    </article>
                  </div>

                  <p className="text-center text-sm text-night/55">
                    Pas encore décidé ?{' '}
                    <button type="button" onClick={() => setSelectedProfile('particulier')} className="font-semibold text-coral hover:underline">
                      Commencez gratuitement →
                    </button>
                  </p>
                </section>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-night/10 pt-5">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) goToStep((step - 1) as Step)
                }}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:border-coral/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Retour</span>
              </button>

              {step === 1 ? (
                <button type="button" onClick={nextFromStep1} className="btn-primary px-5 py-3">
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : step === 2 ? (
                <button type="button" onClick={nextFromStep2} className="btn-primary px-5 py-3">
                  {canSubmitAtStep2 ? 'Créer mon compte' : 'Continuer'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="btn-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Création…' : 'Créer mon compte'}
                </button>
              )}
            </div>
          </form>
        </div>
        </div>
      </section>

      <AuthMapPanel />
    </div>
  )
}
