'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Bell, CheckCircle2, Eye, EyeOff, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { consumeRedirectAfterLogin } from '@/lib/authRedirect'
import { DEMO_ACCOUNTS, inferDemoAccount } from '@/lib/demoApi'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

type ConnexionClientProps = {
  nextPath: string
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''
const showGoogleAuth = GOOGLE_CLIENT_ID !== '' && !GOOGLE_CLIENT_ID.toLowerCase().includes('changeme')

function parseLoginError(raw?: string | null) {
  const normalized = (raw || '').toLowerCase()

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('timeout') ||
    normalized.includes('failed to fetch')
  ) {
    return { message: 'Connexion impossible. Vérifiez votre réseau.' }
  }

  if (
    normalized.includes('not found') ||
    normalized.includes('unknown email') ||
    normalized.includes('account not found') ||
    normalized.includes('user not found') ||
    normalized.includes('email does not exist') ||
    normalized.includes('no account')
  ) {
    return {
      message: 'Aucun compte avec cet email. Inscrivez-vous ?',
      href: '/inscription',
      linkLabel: "S'inscrire",
    }
  }

  if (
    normalized.includes('incorrect') ||
    normalized.includes('invalid') ||
    normalized.includes('password') ||
    normalized.includes('credentials')
  ) {
    return { message: 'Email ou mot de passe incorrect.' }
  }

  return { message: raw || 'Erreur de connexion' }
}

function RightPanel() {
  const items = [
    { icon: CheckCircle2, label: 'Vos annonces actives' },
    { icon: Bell, label: 'Vos alertes de recherche' },
    { icon: MessageCircle, label: 'Vos conversations en cours' },
  ] as const

  return (
    <aside className="hidden min-h-screen overflow-hidden bg-[#fdf8f1] dark:bg-[#0c2a35] lg:flex">
      <div className="flex w-full items-center justify-center px-8 py-8">
        <div className="connexion-panel flex w-full max-w-[760px] items-center justify-center rounded-[16px] bg-[#fdf8f1] p-8 text-night dark:bg-[#0c2a35] dark:text-white">
          <div className="flex w-full max-w-[560px] flex-col items-center justify-center text-center">
            <div className="connexion-logo-shell" style={{ animationDelay: '0ms' }}>
              <Image
                src="/brand/kalico1.svg"
                alt="Kalico"
                width={80}
                height={80}
                className="h-20 w-20 rounded-[16px] object-cover"
                priority
              />
            </div>

            <div className="connexion-anim mt-6" style={{ animationDelay: '150ms' }}>
              <h2
                className="font-display text-[clamp(22px,2.5vw,28px)] font-semibold leading-tight text-night dark:text-white"
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                Content de vous revoir.
              </h2>
            </div>

            <p
              className="connexion-anim mt-3 max-w-[300px] font-display text-[15px] italic leading-6 text-[var(--color-text-secondary)] dark:text-white/65"
              style={{ animationDelay: '220ms', fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              Nouvelle-Calédonie dans l'âme, Kalico dans la poche.
            </p>

            <div className="mt-6 flex w-full max-w-[300px] flex-col gap-3">
              {items.map(({ icon: Icon, label }, index) => {
                const delays = ['300ms', '360ms', '420ms']
                return (
                  <div
                    key={label}
                    className="connexion-anim flex items-center justify-center gap-2 text-sm font-medium text-night dark:text-white"
                    style={{ animationDelay: delays[index] }}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-nc-emeraude" />
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>

            <div className="connexion-anim mt-8" style={{ animationDelay: '480ms' }}>
              <Link href="/inscription" className="inline-flex items-center gap-1 text-sm font-semibold text-coral hover:underline">
                Pas encore de compte ? Rejoindre Kalico →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function ConnexionClient({ nextPath }: ConnexionClientProps) {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [awaitingPassword, setAwaitingPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [serverErrorLink, setServerErrorLink] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const email = watch('email') || ''
  const demoProfile = inferDemoAccount(email)

  useEffect(() => {
    if (awaitingPassword) {
      passwordInputRef.current?.focus()
    }
  }, [awaitingPassword])

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setServerErrorLink(null)
    try {
      const demoProfile = inferDemoAccount(data.email)
      const isDemoLogin =
        demoProfile &&
        (demoProfile === 'particulier' || demoProfile === 'pro' || demoProfile === 'bon_plan') &&
        data.password === DEMO_ACCOUNTS[demoProfile].password

      if (turnstileEnabled && !turnstileToken && !isDemoLogin) {
        setServerError("Merci de confirmer que vous n'êtes pas un robot.")
        return
      }

      await login(data.email, data.password, turnstileToken || undefined)
      router.push(isDemoLogin ? '/profil' : consumeRedirectAfterLogin(nextPath || '/'))
    } catch (err: any) {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verification-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      const parsed = parseLoginError(err?.response?.data?.error || err?.message)
      setServerError(parsed.message)
      setServerErrorLink(parsed.href || null)
    }
  }

  const handlePrimaryAction = async () => {
    if (!awaitingPassword) {
      setServerError('')
      setServerErrorLink(null)
      const ok = await trigger('email')
      if (ok) setAwaitingPassword(true)
      return
    }

    await handleSubmit(onSubmit)()
  }

  const handleDemoQuickLogin = async () => {
    if (!demoProfile || (demoProfile !== 'particulier' && demoProfile !== 'pro' && demoProfile !== 'bon_plan')) return

    setServerError('')
    setServerErrorLink(null)
    try {
      useAuthStore.getState().setDemoProfile(demoProfile)
      router.push('/profil')
    } catch {
      setServerError("Impossible d'activer le compte démo pour le moment.")
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--color-surface)] lg:grid lg:grid-cols-[45fr_55fr]">
      <main className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.08)]">
              <Image src="/brand/kalico1.svg" alt="Kalico" fill sizes="48px" className="object-cover" priority />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold text-night">Kalico</span>
            </span>
          </Link>

          <div className="mt-10">
            <h1 className="text-[24px] font-semibold leading-tight text-night">Bon retour sur Kalico.</h1>
          </div>

          {serverError ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p>{serverError}</p>
                  {serverErrorLink ? (
                    <Link href={serverErrorLink} className="inline-flex font-semibold underline underline-offset-2">
                      S'inscrire
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {turnstileEnabled ? (
            <div className="mt-5 rounded-2xl border border-night/10 bg-sand/40 p-4">
              <p className="text-sm font-semibold text-night">Vérification anti-bot</p>
              <div className="mt-3">
                <TurnstileChallenge action="login" label="Connexion" onTokenChange={setTurnstileToken} />
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handlePrimaryAction()
            }}
            className="mt-7 space-y-4"
          >
            <label className="space-y-2">
              <span className="field-label">Adresse e-mail</span>
              <input
                {...register('email')}
                type="email"
                placeholder="vous@exemple.nc"
                className="input h-12 w-full"
                autoComplete="email"
              />
              {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
            </label>

            {awaitingPassword ? (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between gap-3">
                  <label className="field-label mb-0">Mot de passe</label>
                  <Link href="/reset-password" className="text-sm font-medium text-coral hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input h-12 w-full pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-night/40 transition hover:text-night/70"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
              </div>
            ) : null}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {awaitingPassword ? (
                isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )
              ) : (
                'Continuer →'
              )}
            </button>
          </form>

          {demoProfile ? (
            <div className="mt-4 rounded-2xl border border-coral/20 bg-coral/5 p-4">
              <p className="text-sm font-semibold text-night">Compte démo détecté</p>
              <p className="mt-1 text-sm text-night/60">
                Vous pouvez entrer dans l'application sans vérification supplémentaire.
              </p>
              <button type="button" onClick={() => void handleDemoQuickLogin()} className="btn-primary mt-3 w-full py-3">
                Se connecter en mode démo
              </button>
              <p className="mt-2 text-[11px] text-night/45">
                Email: {demoProfile === 'particulier' ? 'particulier@demo.kalico.nc' : demoProfile === 'pro' ? 'pro@demo.kalico.nc' : 'bonplan@demo.kalico.nc'}
              </p>
            </div>
          ) : null}

          {showGoogleAuth ? (
            <div className="mt-6 space-y-4">
              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-night/10" />
                <span className="shrink-0 text-xs font-medium text-night/45">Ou continuer avec</span>
                <div className="h-px flex-1 bg-night/10" />
              </div>

              <div className="connexion-social-only-google">
                <SocialAuthButtons redirectTo="/" mode="connexion" showLegalFooter={false} />
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-[11px] leading-relaxed text-night/40">
            En continuant, vous acceptez nos{' '}
            <Link href="/cgu" className="transition hover:text-coral hover:underline">
              CGU
            </Link>
            ,{' '}
            <Link href="/mentions-legales" className="transition hover:text-coral hover:underline">
              mentions légales
            </Link>{' '}
            et notre{' '}
            <Link href="/politique-de-confidentialite" className="transition hover:text-coral hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </main>

      <RightPanel />

      <style jsx global>{`
        .connexion-anim {
          animation: connexionReveal 350ms ease-out both;
          animation-fill-mode: both;
        }

        .connexion-logo-shell {
          animation: connexionLogoReveal 600ms cubic-bezier(0.16, 1, 0.3, 1) both,
            connexionLogoFloat 3s ease-in-out 600ms infinite;
          animation-fill-mode: both;
        }

        .connexion-social-only-google > div.relative {
          display: none !important;
        }

        .connexion-social-only-google > div.space-y-3 > button:nth-of-type(2) {
          display: none !important;
        }

        @keyframes connexionReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes connexionLogoReveal {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.8) rotate(-5deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes connexionLogoFloat {
          0%,
          100% {
            transform: translateY(-4px) scale(1) rotate(0deg);
          }
          50% {
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes connexionPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .connexion-anim,
          .connexion-anim--logo,
          .connexion-pulse {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
