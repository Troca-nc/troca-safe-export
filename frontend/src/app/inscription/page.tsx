'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Store,
  UserRound,
} from 'lucide-react'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import ProfileDemoPreview from '@/components/ui/ProfileDemoPreview'
import { metaApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const schema = z
  .object({
    first_name: z.string().min(2, 'Prenom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Adresse email invalide'),
    phone: z.string().regex(/^(\+687|0)[0-9]{6}$/, 'Numero NC invalide').optional().or(z.literal('')),
    commune_id: z.string().optional(),
    password: z
      .string()
      .min(8, 'Au moins 8 caracteres')
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
  { id: 1, label: 'Profil', helper: 'Choisir particulier ou pro' },
  { id: 2, label: 'Identité', helper: 'Renseigner le compte' },
  { id: 3, label: 'Sécurité', helper: 'Valider et protéger' },
]

const PROFILE_OPTIONS: Array<{
  key: ProfileChoice
  label: string
  icon: typeof UserRound
  description: string
  bullets: string[]
  pricing: string
  modalite: string
}> = [
  {
    key: 'particulier',
    label: 'Particulier',
    icon: UserRound,
    description: 'Déposer une annonce simple, gérer ses messages et suivre ses favoris.',
    bullets: ['Annonce classique', 'Messagerie', 'Favoris'],
    pricing: 'Gratuit',
    modalite: 'Accès immédiat aux annonces, à la messagerie et aux favoris.',
  },
  {
    key: 'pro',
    label: 'Professionnel',
    icon: Store,
    description: 'Voir un espace vendeur plus complet avec statistiques et visibilité.',
    bullets: ['Statistiques', 'Boosts', 'Catalogue'],
    pricing: 'Création gratuite, options payantes ensuite',
    modalite: "Abonnement pro, boost d'annonce et mise en avant activables dans l'espace vendeur.",
  },
]

const COMPARISON_ROWS: Array<{ label: string; particulier: string; pro: string }> = [
  { label: "Prix d'entrée", particulier: 'Gratuit', pro: 'Création gratuite' },
  { label: 'Annonces incluses', particulier: 'Usage libre pour un particulier', pro: '5 annonces actives incluses' },
  { label: 'Email vérifié', particulier: 'Obligatoire', pro: 'Obligatoire' },
  { label: 'Téléphone vérifié', particulier: 'Optionnel', pro: 'Fortement recommandé' },
  { label: 'Badge confiance', particulier: 'Oui', pro: 'Oui, renforcé' },
  { label: 'Visibilité', particulier: 'Standard', pro: 'Mise en avant et boosts' },
]

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-jungle' : 'text-night/40'}`}>
      <CheckCircle2 className={`h-3.5 w-3.5 ${ok ? 'fill-jungle/20' : ''}`} />
      {label}
    </div>
  )
}

function StepBadge({ step, current }: { step: Step; current: Step }) {
  const active = step === current
  const completed = step < current

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
        active ? 'border-coral/30 bg-coral/5' : completed ? 'border-jungle/20 bg-jungle/5' : 'border-night/10 bg-white'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
          active ? 'bg-coral text-white' : completed ? 'bg-jungle text-white' : 'bg-night/5 text-night/55'
        }`}
      >
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-night">{STEPS[step - 1].label}</p>
        <p className="text-xs text-night/55">{STEPS[step - 1].helper}</p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [communes, setCommunes] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ProfileChoice>('particulier')
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

  const pwd = watch('password') || ''
  const profileConfig = useMemo(
    () => PROFILE_OPTIONS.find((option) => option.key === selectedProfile) ?? PROFILE_OPTIONS[0],
    [selectedProfile]
  )

  useEffect(() => {
    metaApi
      .getCommunes()
      .then(({ data }) => setCommunes(data.data || []))
      .catch(() => setCommunes([]))
  }, [])

  const nextFromStepTwo = async () => {
    const ok = await trigger(['first_name', 'last_name', 'email', 'phone', 'commune_id'])
    if (ok) setStep(3)
  }

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const { password_confirm: _passwordConfirm, ...payload } = data
      if (turnstileEnabled && !turnstileToken) {
        setServerError('Veuillez compléter la vérification anti-bot.')
        return
      }
      await registerUser({
        ...payload,
        commune_id: payload.commune_id ? parseInt(payload.commune_id, 10) : undefined,
        account_type: selectedProfile,
      }, turnstileToken || undefined)
      router.push(`/verification-email?email=${encodeURIComponent(payload.email)}&role=${selectedProfile}`)
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Erreur lors de la creation du compte')
    }
  }

  return (
    <div className="min-h-screen bg-sand-light px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm shadow-night/10">
                <Sparkles className="h-5 w-5 text-coral" />
              </span>
              <div>
                <p className="font-display text-3xl font-bold text-night">Troca</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">Nouvelle-Calédonie</p>
              </div>
            </Link>
            <p className="mt-3 text-sm text-night/55">Créez votre compte gratuitement avec un parcours simple et guidé.</p>
          </div>

          <div className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-bold text-night">Inscription guidée</h1>
                <p className="mt-1 text-sm text-night/55">Choisissez votre profil, renseignez vos informations, puis validez votre sécurité.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
                <BadgeCheck className="h-3.5 w-3.5" />
                Wizard en 3 étapes
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {STEPS.map((item) => (
                <StepBadge key={item.id} step={item.id} current={step} />
              ))}
            </div>

            {serverError ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
              {step === 1 && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-night">Vous êtes un particulier ou un professionnel ?</h2>
                    <p className="mt-1 text-sm text-night/55">
                      Le profil particulier est gratuit. Le profil professionnel est gratuit à la création, puis les options pro sont activées plus tard selon le plan choisi.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {PROFILE_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const active = selectedProfile === option.key
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSelectedProfile(option.key)}
                          className={`flex min-h-[360px] flex-col rounded-[1.75rem] border p-5 text-left transition ${
                            active
                              ? 'border-coral/35 bg-gradient-to-br from-coral/10 via-white to-white shadow-[0_14px_40px_rgba(231,111,81,0.12)]'
                              : 'border-night/10 bg-white hover:border-coral/20 hover:bg-sand/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-coral text-white' : 'bg-night/5 text-night/65'}`}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-night/45">
                                  {option.key === 'particulier' ? 'Usage personnel' : 'Usage professionnel'}
                                </p>
                                <p className="mt-1 text-lg font-bold text-night">{option.label}</p>
                              </div>
                            </div>
                            {active ? (
                              <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                Sélectionné
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-5 rounded-2xl bg-white/80 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral/80">Prix</p>
                            <p className="mt-1 text-2xl font-bold text-night">{option.key === 'particulier' ? 'Gratuit' : 'Création gratuite'}</p>
                            <p className="mt-1 text-sm text-night/55">
                              {option.key === 'particulier'
                                ? 'Accès libre à toutes les fonctions de base.'
                                : '5 annonces actives incluses, puis plan visibilité à activer selon vos besoins.'}
                            </p>
                          </div>

                          <p className="mt-5 text-sm text-night/60">{option.description}</p>
                          <div className="mt-4 space-y-2">
                            {option.bullets.map((bullet) => (
                              <div key={bullet} className="flex items-center gap-2 rounded-xl bg-night/5 px-3 py-2 text-sm text-night/70">
                                <BadgeCheck className="h-4 w-4 text-jungle" />
                                {bullet}
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Modalités</p>
                            <p className="mt-2 rounded-2xl bg-sand px-3 py-3 text-sm text-night/65">{option.modalite}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold text-night/65">Email vérifié requis</span>
                              <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold text-night/65">Téléphone vérifié optionnel</span>
                              <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold text-night/65">Badge confiance</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <details className="rounded-[1.75rem] border border-night/10 bg-white/90 p-4 shadow-sm">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Tableau comparatif</p>
                        <h3 className="mt-1 text-lg font-semibold text-night">Différences entre particulier et professionnel</h3>
                      </div>
                      <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">Plus de visibilité pour les pros</span>
                    </summary>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-night/10">
                      <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-sand/80 text-xs font-semibold uppercase tracking-[0.16em] text-night/55">
                        <div className="px-4 py-3">Différence</div>
                        <div className="px-4 py-3">Particulier</div>
                        <div className="px-4 py-3">Professionnel</div>
                      </div>
                      {COMPARISON_ROWS.map((row, index) => (
                        <div
                          key={row.label}
                          className={`grid grid-cols-[1.2fr_1fr_1fr] text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-sand/40'}`}
                        >
                          <div className="px-4 py-3 font-medium text-night">{row.label}</div>
                          <div className="px-4 py-3 text-night/65">{row.particulier}</div>
                          <div className="px-4 py-3 text-night/65">{row.pro}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-jungle/10 px-3 py-1 text-[11px] font-semibold text-jungle">
                        <Check className="h-3.5 w-3.5" />
                        Email vérifié requis
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-jungle/10 px-3 py-1 text-[11px] font-semibold text-jungle">
                        <Check className="h-3.5 w-3.5" />
                        Téléphone en badge de confiance
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-jungle/10 px-3 py-1 text-[11px] font-semibold text-jungle">
                        <Check className="h-3.5 w-3.5" />
                        Options pro pour plus de visibilité
                      </span>
                    </div>
                  </details>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-night">Renseignez votre identité</h2>
                    <p className="mt-1 text-sm text-night/55">Ces informations servent à créer votre compte et à protéger les échanges entre membres.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-night">Prénom</span>
                      <input {...register('first_name')} className="input h-12 w-full" placeholder="Votre prénom" />
                      {errors.first_name ? <p className="text-xs text-red-600">{errors.first_name.message}</p> : null}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-night">Nom</span>
                      <input {...register('last_name')} className="input h-12 w-full" placeholder="Votre nom" />
                      {errors.last_name ? <p className="text-xs text-red-600">{errors.last_name.message}</p> : null}
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-night">Email</span>
                      <input {...register('email')} type="email" className="input h-12 w-full" placeholder="vous@exemple.nc" />
                      {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-night">Téléphone (optionnel)</span>
                      <input {...register('phone')} className="input h-12 w-full" placeholder="+687..." />
                      {errors.phone ? <p className="text-xs text-red-600">{errors.phone.message}</p> : null}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-night">Commune</span>
                      <select {...register('commune_id')} className="input h-12 w-full">
                        <option value="">Choisir une commune</option>
                        {communes.map((commune) => (
                          <option key={commune.id} value={commune.id}>
                            {commune.name ?? commune.nom}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-night">Sécurisez votre compte</h2>
                    <p className="mt-1 text-sm text-night/55">
                      Nous envoyons un email de confirmation après inscription. Le téléphone reste optionnel, mais il renforce la confiance.
                    </p>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-night">Mot de passe</span>
                    <div className="relative">
                      <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input h-12 w-full pr-12" placeholder="Créez un mot de passe" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-night/45"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
                    <div className="flex flex-wrap gap-x-3 gap-y-2 pt-1">
                      <PasswordRule ok={pwd.length >= 8} label="8 caractères" />
                      <PasswordRule ok={/[A-Z]/.test(pwd)} label="1 majuscule" />
                      <PasswordRule ok={/[0-9]/.test(pwd)} label="1 chiffre" />
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-night">Confirmer le mot de passe</span>
                    <input {...register('password_confirm')} type={showPassword ? 'text' : 'password'} className="input h-12 w-full" placeholder="Répétez le mot de passe" />
                    {errors.password_confirm ? <p className="text-xs text-red-600">{errors.password_confirm.message}</p> : null}
                  </label>

                  <div className="rounded-2xl border border-jungle/15 bg-jungle/5 p-4 text-sm text-night/65">
                    <p className="font-semibold text-night">Vérification email</p>
                    <p className="mt-1">
                      Après création du compte, vous recevrez un lien de confirmation. Sans validation, certaines actions resteront limitées.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-night/10 bg-sand/40 p-4">
                    <p className="text-sm font-semibold text-night">Vérification anti-bot</p>
                    <p className="mt-1 text-xs text-night/55">
                      Cette vérification reste discrète pour les utilisateurs réels et protège la création massive de comptes.
                    </p>
                    <div className="mt-3">
                      <TurnstileChallenge action="register" label="Inscription" onTokenChange={setTurnstileToken} />
                    </div>
                  </div>

                  <SocialAuthButtons />
                </section>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-night/10 pt-5">
                <button
                  type="button"
                  onClick={() => setStep((value) => ((value - 1) < 1 ? 1 : ((value - 1) as Step)))}
                  disabled={step === 1}
                  className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:border-coral/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>Retour</span>
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={step === 1 ? () => setStep(2) : nextFromStepTwo}
                    className="inline-flex items-center gap-2 rounded-2xl bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-coral/25"
                  >
                    <span>Continuer</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-coral/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Création...' : 'Créer mon compte'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <ProfileDemoPreview mode="deposit" profile={selectedProfile} />
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Ce que vous verrez ensuite</p>
            <div className="mt-3 rounded-2xl bg-sand p-4 text-sm text-night/65">
              {selectedProfile === 'particulier'
                ? 'Un compte simple pour publier, chercher et discuter.'
                : 'Un tableau de bord vendeur avec visibilité et statistiques.'}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
