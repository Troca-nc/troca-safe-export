'use client'
// src/app/connexion/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { DEMO_ACCOUNTS } from '@/lib/demoApi'
import { consumeRedirectAfterLogin } from '@/lib/authRedirect'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      if (turnstileEnabled && !turnstileToken) {
        setServerError('Veuillez compléter la vérification anti-bot.')
        return
      }
      await login(data.email, data.password, turnstileToken || undefined)
      router.push(consumeRedirectAfterLogin('/'))
    } catch (err: any) {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verification-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      setServerError(err?.response?.data?.error || 'Erreur de connexion')
    }
  }

  const loginAsDemo = async (key: keyof typeof DEMO_ACCOUNTS) => {
    setServerError('')
    try {
      if (turnstileEnabled && !turnstileToken) {
        setServerError('Veuillez compléter la vérification anti-bot.')
        return
      }
      await login(DEMO_ACCOUNTS[key].email, DEMO_ACCOUNTS[key].password, turnstileToken || undefined)
      router.push(consumeRedirectAfterLogin(key === 'admin' ? '/admin/dashboard' : '/'))
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Connexion démo impossible')
    }
  }

  return (
    <div className="min-h-screen bg-sand-light px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-8 lg:w-[40%]">
          <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-[radial-gradient(circle_at_top_left,_rgba(72,202,228,0.24),_transparent_36%),linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.88))] p-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.16)]">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="relative h-14 w-14 overflow-hidden rounded-full border border-white/12 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.12)]">
                <Image src="/brand/troca-logo.png" alt="Troca" fill sizes="56px" className="object-cover" priority />
              </span>
              <span>
                <span className="block font-display text-2xl font-bold">Troca</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
                  Nouvelle-Calédonie
                </span>
              </span>
            </Link>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">
              <Sparkles className="h-3.5 w-3.5" />
              Connexion rapide
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              Connectez-vous pour publier, discuter et gérer vos annonces.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/72">
              Si vous êtes en mode démo local, vous pouvez entrer en un clic avec un compte prêt à l’emploi.
              Sinon, utilisez votre email et votre mot de passe habituels.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lagoon">Astuce</p>
                <p className="mt-2 text-sm text-white/80">
                  En local, le mot de passe commun des comptes de démonstration est{' '}
                  <span className="font-semibold">Demo1234!</span>.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lagoon">Accès direct</p>
                <p className="mt-2 text-sm text-white/80">
                  Utilisez les boutons ci-contre pour ouvrir un compte particulier, pro ou administrateur.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:mt-0">
          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold text-night mb-2">Connexion</h2>
            <p className="text-sm text-night/50 mb-6">
              Connectez-vous à votre compte ou utilisez la zone de test local.
            </p>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {serverError}
              </div>
            )}

            {demoModeEnabled && (
              <div className="mb-5 rounded-2xl border border-coral/15 bg-coral/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-coral shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-night">Connexion instantanée locale</p>
                    <p className="mt-1 text-xs leading-relaxed text-night/55">
                      Choisissez un rôle pour ouvrir directement un compte de démonstration sans créer de compte.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => loginAsDemo('particulier')}
                        disabled={isLoading}
                        className="rounded-xl border border-night/10 bg-white px-3 py-2 text-left text-sm font-medium text-night shadow-sm transition hover:border-coral/30 hover:bg-coral/5"
                      >
                        Particulier
                        <span className="mt-1 block text-[11px] text-night/45">Publier et discuter</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loginAsDemo('pro')}
                        disabled={isLoading}
                        className="rounded-xl border border-night/10 bg-white px-3 py-2 text-left text-sm font-medium text-night shadow-sm transition hover:border-coral/30 hover:bg-coral/5"
                      >
                        Compte Pro
                        <span className="mt-1 block text-[11px] text-night/45">Vues et abonnements</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loginAsDemo('bon_plan')}
                        disabled={isLoading}
                        className="rounded-xl border border-night/10 bg-white px-3 py-2 text-left text-sm font-medium text-night shadow-sm transition hover:border-coral/30 hover:bg-coral/5"
                      >
                        Bon plan
                        <span className="mt-1 block text-[11px] text-night/45">Promos et campagnes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loginAsDemo('admin')}
                        disabled={isLoading}
                        className="rounded-xl border border-night/10 bg-white px-3 py-2 text-left text-sm font-medium text-night shadow-sm transition hover:border-coral/30 hover:bg-coral/5"
                      >
                        Administrateur
                        <span className="mt-1 block text-[11px] text-night/45">Dashboard et modération</span>
                      </button>
                    </div>
                    <p className="mt-3 text-[11px] text-night/45">
                      Email de démonstration visible dans le hub QA, mot de passe{' '}
                      <span className="font-semibold">Demo1234!</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-5 rounded-2xl border border-night/10 bg-sand/40 p-4">
              <p className="text-sm font-semibold text-night">Vérification anti-bot</p>
              <p className="mt-1 text-xs text-night/55">
                Cette étape reste discrète en usage normal. En local, elle peut être désactivée sans bloquer la connexion.
              </p>
              <div className="mt-3">
                <TurnstileChallenge action="login" label="Connexion" onTokenChange={setTurnstileToken} />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-night mb-1.5">Adresse email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vous@exemple.nc"
                  className={`input ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-night">Mot de passe</label>
                  <Link href="/mot-de-passe-oublie" className="text-xs text-coral hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-night/40 hover:text-night/70"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6">
              <SocialAuthButtons redirectTo="/" mode="connexion" />
            </div>

            <div className="mt-4 text-center text-sm text-night/50">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="text-coral font-medium hover:underline">
                S'inscrire gratuitement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
