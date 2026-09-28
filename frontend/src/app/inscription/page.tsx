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
  BarChart3,
  CalendarHeart,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Megaphone,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from 'lucide-react'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { metaApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const schema = z
  .object({
    first_name: z.string().min(2, 'Prénom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Adresse e-mail invalide'),
    phone: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s.-]/g, ''))
      .refine((value) => value === '' || /^(\+687|0)[0-9]{6}$/.test(value), 'Numéro NC invalide')
      .default(''),
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

const STEPS: Array<{ id: Step; label: string; helper: string }> = [
  { id: 1, label: 'Compte', helper: 'E-mail et mot de passe' },
  { id: 2, label: 'Profil', helper: 'Quelques informations' },
  { id: 3, label: 'Offre Pro', helper: 'Seulement pour les pros' },
]

const COMMUNE_PLACEHOLDER = 'Choisir une commune'

const PLAN_FEATURES = [
  { label: 'Annonces actives', free: '5', pro: 'Illimitées' },
  { label: 'Photos par annonce', free: '6', pro: '12' },
  { label: 'Badge visible', free: 'Non', pro: 'Oui' },
  { label: 'Statistiques', free: 'Non', pro: 'Oui' },
] as const

const PANEL_FEATURES = [
  {
    icon: Megaphone,
    title: 'Annonces',
    description: 'Publiez en quelques minutes, visibles partout en NC.',
  },
  {
    icon: CalendarHeart,
    title: 'Tout près de chez vous',
    description: 'Annonces, bonnes adresses et événements partout en Nouvelle-Calédonie.',
  },
  {
    icon: ShieldCheck,
    title: 'Un compte simple',
    description: 'Ajoutez votre téléphone ou votre photo seulement si vous en avez envie.',
  },
] as const

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Inscription gratuite' },
  { icon: Lock, label: 'Pensé pour la NC' },
  { icon: CheckCircle2, label: 'Pros vérifiés' },
] as const

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''
const showGoogleAuth = GOOGLE_CLIENT_ID !== '' && !GOOGLE_CLIENT_ID.toLowerCase().includes('changeme')

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

type RegistrationError = {
  message: string
  ctaHref?: string
  ctaLabel?: string
}

function getRegistrationError(err: any): RegistrationError {
  const raw = String(err?.response?.data?.error ?? err?.message ?? '').toLowerCase()

  if (raw.includes('email') || raw.includes('already exists')) {
    return {
      message: 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.',
      ctaHref: '/connexion',
      ctaLabel: 'Se connecter',
    }
  }

  if (raw.includes('network') || raw.includes('fetch')) {
    return {
      message: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
    }
  }

  return {
    message: 'Une erreur est survenue. Réessayez dans un moment.',
  }
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
          ? 'border-accent-strong/30 bg-accent/10'
          : completed
            ? 'border-jungle/20 bg-jungle/5 hover:border-jungle/30'
            : 'border-night/10 bg-surface/70 text-night/40'
      }`}
      aria-current={active ? 'step' : undefined}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200 ${
          active
            ? 'bg-accent-strong text-on-deep'
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
          ? 'border-accent-strong/30 bg-accent/10'
          : 'border-night/10 bg-surface hover:border-accent-strong/25 hover:bg-sand/40'
      }`}
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-[12px] ${active ? 'bg-accent/15 text-accent-strong' : 'bg-night/5 text-night/55'}`}>
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
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<RegistrationError | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [communes, setCommunes] = useState<Array<{ id: number; name?: string; nom?: string }>>([])
  const [showProOptions, setShowProOptions] = useState(false)
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

  const submitRegistration = async (data: FormData, accountType: ProfileChoice = selectedProfile) => {
    setServerError(null)
    try {
      const {
        password_confirm: _passwordConfirm,
        first_name,
        last_name,
        phone,
        ...payload
      } = data
      if (turnstileEnabled && !turnstileToken) {
        setServerError({
          message: "Veuillez confirmer que vous n'êtes pas un robot.",
        })
        return
      }

      await registerUser(
        {
          ...payload,
          prenom: first_name.trim(),
          nom: last_name.trim(),
          telephone: phone?.trim() || undefined,
          commune_id: payload.commune_id ? parseInt(payload.commune_id, 10) : undefined,
          account_type: accountType,
        },
        turnstileToken || undefined,
      )
      router.push(`/verification-email?email=${encodeURIComponent(payload.email)}&role=${accountType}`)
    } catch (err: any) {
      setServerError(getRegistrationError(err))
    }
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

    await handleSubmit((data) => submitRegistration(data, 'particulier'))()
  }

  const onSubmit = async (data: FormData) => {
    await submitRegistration(data)
  }

  const canSubmitAtStep2 = selectedProfile === 'particulier'
  const visibleSteps = selectedProfile === 'pro' ? STEPS : STEPS.slice(0, 2)

  return (
    <div className="min-h-screen bg-sand-light lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-12">
        <div className="flex w-full max-w-[620px] flex-col gap-5">
          <div className="text-center">
            <Link href="/" className="inline-flex flex-col items-center">
              <p className="font-display text-3xl font-bold text-night">Kalico</p>
              <p className="mt-3 text-sm text-night/55">Bienvenue chez vous.</p>
            </Link>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-night/10 bg-surface p-5 shadow-card sm:p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="mt-2 font-display text-4xl font-bold text-night md:text-5xl">Créer votre compte</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-night/60 md:text-base">
                  Commencez avec votre e-mail. Vous pourrez compléter votre profil plus tard.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {visibleSteps.map((item) => (
                <StepPill key={item.id} step={item.id} current={step} onClick={goToStep} />
              ))}
            </div>

            {serverError ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{serverError.message}</p>
                  {serverError.ctaHref ? (
                    <Link href={serverError.ctaHref} className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                      {serverError.ctaLabel || 'Se connecter'}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <div key={step} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}>
                {step === 1 ? (
                  <section className="space-y-4 rounded-[16px] border border-night/10 bg-sand/25 p-5 md:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="eyebrow text-accent-strong">Étape 1</p>
                        <h2 className="mt-2 font-display text-2xl font-semibold text-night">Vos identifiants</h2>
                        <p className="mt-1 text-sm text-night/55">Utilisez votre e-mail ou continuez avec Google.</p>
                      </div>
                    </div>

                    {showGoogleAuth ? (
                      <div className="mt-5">
                        <div className="relative flex items-center gap-3">
                          <div className="h-px flex-1 bg-night/10" />
                          <span className="shrink-0 text-xs font-medium text-night/45">Ou continuer avec</span>
                          <div className="h-px flex-1 bg-night/10" />
                        </div>
                      </div>
                    ) : null}

                    <div className="signup-social-only-google mt-4">
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
                  <section className="space-y-5 rounded-[16px] border border-night/10 bg-sand/25 p-5 md:p-6">
                    <div>
                      <p className="eyebrow text-accent-strong">Étape 2</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-night">Votre profil</h2>
                      <p className="mt-1 text-sm text-night/55">Votre nom suffit pour créer le compte.</p>
                    </div>

                    <div className="grid gap-5">
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
                          <span className="field-label">Téléphone <span className="font-normal text-night/45">(facultatif)</span></span>
                          <input {...register('phone')} type="tel" inputMode="tel" className="input h-12 w-full" placeholder="Ex. +687 75 12 34" />
                          {errors.phone ? <p className="field-error">{errors.phone.message}</p> : null}
                          <p className="text-xs text-night/45">
                            Utile pour récupérer votre compte par SMS. Vous pourrez l’ajouter plus tard.
                          </p>
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
                  <section className="space-y-5 rounded-[16px] border border-night/10 bg-sand/25 p-5 md:p-6">
                    <div>
                      <p className="eyebrow text-accent-strong">Étape 3</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-night">Démarrez gratuitement</h2>
                      <p className="mt-1 text-sm text-night/55">
                        Passez à Pro maintenant ou plus tard, depuis votre compte.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => void handleSubmit((data) => submitRegistration(data, 'particulier'))()}
                        disabled={isSubmitting}
                        className="btn-primary w-full"
                      >
                        {isSubmitting ? 'Création...' : 'Commencer gratuitement'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowProOptions((value) => !value)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-kalico-blue hover:underline"
                        aria-expanded={showProOptions}
                      >
                        Comparer les offres
                      </button>
                    </div>

                    {showProOptions ? (
                      <div className="space-y-4 pt-2">
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
                          </article>

                          <article className="pulse-once rounded-[1.75rem] border border-kalico-blue/20 bg-[linear-gradient(180deg,rgba(10,126,164,0.08),rgba(255,255,255,1))] p-5 shadow-lg shadow-kalico-blue/10">
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center rounded-full bg-kalico-blue px-3 py-1 text-xs font-semibold text-white">
                                Recommandé
                              </span>
                              <span className="rounded-full border border-night/10 bg-white px-3 py-1.5 text-xs font-semibold text-kalico-blue">Mensuel</span>
                            </div>

                            <p className="mt-4 text-3xl font-bold text-kalico-blue">
                              2 900 XPF / mois
                            </p>
                            <p className="mt-2 text-sm text-night/55">Sans engagement.</p>

                            <div className="mt-5 space-y-3">
                              {PLAN_FEATURES.map((feature) => (
                                <div key={feature.label} className="rounded-2xl border border-night/8 bg-white/80 p-3">
                                  <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium text-night">{feature.label}</span>
                                    <span className="font-semibold text-kalico-blue">Pro : {feature.pro}</span>
                                  </div>
                                  <div className="mt-2 h-2 rounded-full bg-night/10">
                                    <div
                                      className="h-2 rounded-full bg-kalico-blue"
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

                            <div className="mt-5 grid gap-3 rounded-2xl border border-kalico-blue/15 bg-kalico-blue/5 p-4 text-sm text-night/65">
                              <div className="flex items-center justify-between gap-3">
                                <span>Annonces</span>
                                <strong className="text-kalico-blue">100 vs 5</strong>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Photos</span>
                                <strong className="text-kalico-blue">12 vs 6</strong>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Badge et stats</span>
                                <strong className="text-kalico-blue">Visibles</strong>
                              </div>
                              <div className="rounded-2xl bg-white/80 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    Statistiques
                                  </span>
                                  <span className="rounded-full bg-kalico-blue px-2.5 py-1 text-[11px] font-semibold text-white">Badge Pro</span>
                                </div>
                                <div className="mt-3 h-20 rounded-2xl bg-[linear-gradient(180deg,rgba(72,202,228,0.16),rgba(10,126,164,0.04))] p-3">
                                  <div className="flex h-full items-end gap-2">
                                    <span className="h-6 w-4 rounded-t-full bg-night/15" />
                                    <span className="h-10 w-4 rounded-t-full bg-night/15" />
                                    <span className="h-14 w-4 rounded-t-full bg-kalico-blue" />
                                    <span className="h-8 w-4 rounded-t-full bg-night/15" />
                                    <span className="h-16 w-4 rounded-t-full bg-kalico-blue/70" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                        </div>
                      </div>
                    ) : null}

                    <p className="text-center text-sm text-night/55">
                      Vous hésitez ?{' '}
                      <button type="button" onClick={() => setSelectedProfile('particulier')} className="font-semibold text-kalico-blue hover:underline">
                        Créer le compte gratuit
                      </button>
                    </p>
                  </section>
                ) : null}
              </div>

              {turnstileEnabled && (
                (step === 2 && selectedProfile === 'particulier')
                || (step === 3 && selectedProfile === 'pro')
              ) ? (
                <TurnstileChallenge
                  action="register"
                  label="Vérification de sécurité"
                  onTokenChange={setTurnstileToken}
                  className="rounded-2xl border border-night/10 bg-sand/30 p-4"
                />
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-night/10 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    if (step > 1) goToStep((step - 1) as Step)
                  }}
                  disabled={step === 1}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-40"
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
                    {isSubmitting ? 'Création...' : 'Créer mon compte'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      <aside className="motif-tressage hidden min-h-screen overflow-hidden bg-[var(--color-deep)] lg:flex">
        <div className="flex w-full items-center justify-center px-8 py-8">
          <div className="signup-panel relative w-full max-w-[560px] rounded-[24px] border border-on-deep/10 bg-on-deep/5 p-8 text-left text-on-deep backdrop-blur-sm">
            <div className="absolute inset-0 rounded-[16px] bg-transparent dark:bg-transparent" />

            <div className="relative z-10 space-y-6">
              <div className="signup-panel-anim signup-panel-anim--logo flex items-center gap-3" style={{ animationDelay: '0ms' }}>
                <Image
                  src="/brand/kalico1.svg"
                  alt="Kalico"
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-[10px] object-cover"
                  priority
                />
                <div>
                  <p className="text-[18px] font-medium leading-none text-on-deep">Kalico</p>

                </div>
              </div>



              <div className="signup-panel-anim space-y-1" style={{ animationDelay: '140ms' }}>
                <h2
                  className="font-display text-[clamp(24px,2.5vw,34px)] font-semibold leading-tight text-on-deep"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  <span className="block">La Nouvelle-Calédonie</span>
                  <span className="block text-accent">à portée de main.</span>
                </h2>
              </div>

              <div
                className="signup-panel-anim overflow-hidden rounded-[10px]"
                style={{ animationDelay: '200ms' }}
              >
                <div className="grid grid-cols-1 gap-3 overflow-hidden">
                  {PANEL_FEATURES.map((item, index) => {
                    const Icon = item.icon
                    const delays = ['260ms', '300ms', '340ms', '380ms', '420ms', '460ms']
                    return (
                      <div
                        key={item.title}
                        className="group rounded-[12px] border border-on-deep/10 bg-on-deep/10 p-4 text-left transition-colors duration-200 hover:border-accent/40"
                        style={{ animationDelay: delays[index] }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(29,158,117,0.08)] text-nc-emeraude transition-transform duration-200 group-hover:scale-[1.15]">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-on-deep">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-on-deep/65">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="signup-panel-anim flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-deep/60" style={{ animationDelay: '400ms' }}>
                {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-nc-emeraude" />
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .signup-panel-anim {
          animation: signupReveal 350ms ease-out both;
          animation-fill-mode: both;
        }

        .signup-panel-anim--logo {
          animation: signupLogoReveal 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-fill-mode: both;
        }

        .signup-panel-pulse {
          animation: signupPulse 2s ease-in-out infinite;
        }

        .signup-social-only-google > div > div.relative {
          display: none !important;
        }

        .signup-social-only-google > div.space-y-3 > button:nth-of-type(2) {
          display: none !important;
        }

        @keyframes signupReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes signupLogoReveal {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.8) rotate(-5deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes signupPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signup-panel-anim,
          .signup-panel-anim--logo,
          .signup-panel-pulse {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
