'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import AuthMapPanel from '@/components/auth/AuthMapPanel'
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

export default function ConnexionClient({ nextPath }: ConnexionClientProps) {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [awaitingPassword, setAwaitingPassword] = useState(false)
  const [serverError, setServerError] = useState('')
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
    try {
      const demoProfile = inferDemoAccount(data.email)
      const isDemoLogin =
        demoProfile &&
        (demoProfile === 'particulier' || demoProfile === 'pro' || demoProfile === 'bon_plan') &&
        data.password === DEMO_ACCOUNTS[demoProfile].password

      if (turnstileEnabled && !turnstileToken && !isDemoLogin) {
        setServerError('Veuillez compléter la vérification anti-bot.')
        return
      }

      await login(data.email, data.password, turnstileToken || undefined)
      router.push(isDemoLogin ? '/profil' : consumeRedirectAfterLogin(nextPath || '/'))
    } catch (err: any) {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verification-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      setServerError(err?.response?.data?.error || 'Erreur de connexion')
    }
  }

  const handlePrimaryAction = async () => {
    if (!awaitingPassword) {
      setServerError('')
      const ok = await trigger('email')
      if (ok) setAwaitingPassword(true)
      return
    }

    await handleSubmit(onSubmit)()
  }

  const handleDemoQuickLogin = async () => {
    if (!demoProfile || (demoProfile !== 'particulier' && demoProfile !== 'pro' && demoProfile !== 'bon_plan')) return

    setServerError('')
    try {
      useAuthStore.getState().setDemoProfile(demoProfile)
      router.push('/profil')
    } catch {
      setServerError("Impossible d'activer le compte démo pour le moment.")
    }
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <main className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.08)]">
              <Image src="/brand/kalico1.svg" alt="Kalico" fill sizes="48px" className="object-cover" priority />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold text-night">Kalico</span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-coral/80">
                Nouvelle-Calédonie
              </span>
            </span>
          </Link>

          <div className="mt-10">
            <h1 className="text-[24px] font-semibold leading-tight text-night">
              Connectez-vous ou créez votre compte Kalico
            </h1>
            <p className="mt-1.5 text-sm text-night/60">Annonces entre Calédoniens.</p>
          </div>

          {serverError ? (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
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
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs font-medium text-coral hover:underline"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
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
                    Connexion…
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
                Vous pouvez entrer dans l&apos;application sans vérification supplémentaire.
              </p>
              <button type="button" onClick={() => void handleDemoQuickLogin()} className="btn-primary mt-3 w-full py-3">
                Se connecter en mode démo
              </button>
              <p className="mt-2 text-[11px] text-night/45">
                Email: {demoProfile === 'particulier' ? 'particulier@demo.kalico.nc' : demoProfile === 'pro' ? 'pro@demo.kalico.nc' : 'bonplan@demo.kalico.nc'}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <SocialAuthButtons redirectTo="/" mode="connexion" showLegalFooter={false} />
          </div>

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

      <AuthMapPanel />
    </div>
  )
}
