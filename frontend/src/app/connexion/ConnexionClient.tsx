'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { AuthFormSkeleton, AuthPageShell } from '@/components/auth/AuthPageShell'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { useAuthStore } from '@/store/authStore'
import { consumeRedirectAfterLogin } from '@/lib/authRedirect'
import { describeAuthError, getAuthErrorCode, getDemoLoginProfile } from '@/lib/data/auth'
import type { AuthErrorPresentation } from '@/types/auth'

const schema = z.object({ email: z.string().email('Saisissez une adresse e-mail valide.'), password: z.string().min(1, 'Saisissez votre mot de passe.') })
type FormData = z.infer<typeof schema>
type Props = { nextPath: string }

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''
const showGoogleAuth = Boolean(googleClientId && !googleClientId.toLowerCase().includes('changeme'))

export default function ConnexionClient({ nextPath }: Props) {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const setDemoProfile = useAuthStore((state) => state.setDemoProfile)
  const isLoading = useAuthStore((state) => state.isLoading)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [showPassword, setShowPassword] = useState(false)
  const [failure, setFailure] = useState<AuthErrorPresentation | null>(null)
  const [lastSubmission, setLastSubmission] = useState<FormData | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const alertRef = useRef<HTMLDivElement>(null)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.toLowerCase().includes('changeme'))
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' })
  const demoProfile = getDemoLoginProfile(watch('email') || '')

  useEffect(() => { if (failure) alertRef.current?.focus() }, [failure])

  async function submit(data: FormData) {
    setFailure(null)
    setLastSubmission(data)
    if (turnstileEnabled && !turnstileToken && !demoProfile) {
      setFailure({ kind: 'unknown', message: 'Merci de confirmer que vous n’êtes pas un robot.', retryable: false })
      return
    }
    try {
      await login(data.email, data.password, turnstileToken || undefined)
      router.push(demoProfile ? '/profil' : consumeRedirectAfterLogin(nextPath || '/'))
    } catch (error) {
      if (getAuthErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verification-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      setFailure(describeAuthError(error))
    }
  }

  return (
    <AuthPageShell>
      {!hasHydrated ? <AuthFormSkeleton /> : <>
        <p className="text-eyebrow uppercase text-accent-text">Votre espace</p>
        <h1 className="mt-3 font-display text-h1-form text-ink">Bon retour sur Kalico.</h1>
        <p className="mt-4 text-body text-ink/65">Connectez-vous pour retrouver vos annonces, vos messages et vos favoris.</p>

        {failure ? <div ref={alertRef} tabIndex={-1} className="mt-6 outline-none"><FeedbackAlert tone="error" title={failure.kind === 'locked' ? 'Compte temporairement bloqué' : 'Connexion impossible'}><p>{failure.message}</p>{failure.retryable && lastSubmission ? <Button variant="secondary" compact className="mt-3" onClick={() => void submit(lastSubmission)}>Réessayer</Button> : null}</FeedbackAlert></div> : null}

        <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5" noValidate>
          <Input {...register('email')} label="Adresse e-mail" type="email" placeholder="vous@exemple.nc" autoComplete="email" error={errors.email?.message} />
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4"><label htmlFor="login-password" className="text-label-sm font-semibold text-ink">Mot de passe</label><Link href="/mot-de-passe-oublie" className="text-label-sm text-accent-text hover:underline">Mot de passe oublié ?</Link></div>
            <div className={`k-field-group ${errors.password ? 'k-field-group-error' : ''}`}><input {...register('password')} id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Votre mot de passe" autoComplete="current-password" aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? 'login-password-error' : undefined} className="k-field min-w-0 pr-2" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="flex min-h-11 shrink-0 items-center gap-2 px-4 text-label-sm text-ink/60 hover:text-ink" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="hidden sm:inline">{showPassword ? 'Masquer' : 'Afficher'}</span></button></div>
            {errors.password ? <p id="login-password-error" role="alert" className="text-meta text-alert-error">{errors.password.message}</p> : null}
          </div>

          {turnstileEnabled ? <TurnstileChallenge action="login" label="Vérification anti-bot" onTokenChange={setTurnstileToken} /> : null}
          <Button type="submit" loading={isLoading} loadingLabel="Connexion…" className="w-full"><LogIn className="h-4 w-4" />Se connecter</Button>
        </form>

        {demoProfile ? <div className="mt-5 rounded-card border border-info/30 bg-info/10 p-4"><p className="font-semibold text-ink">Compte démo {demoProfile.label}</p><p className="mt-1 text-body-sm text-ink/65">{demoProfile.description}</p><Button variant="secondary" className="mt-3 w-full" onClick={() => { setDemoProfile(demoProfile.key); router.push('/profil') }}>Ouvrir ce compte démo</Button></div> : null}

        {showGoogleAuth ? <div className="mt-7"><div className="mb-5 flex items-center gap-4 text-meta text-ink/45"><span className="h-px flex-1 bg-warm-border" />ou<span className="h-px flex-1 bg-warm-border" /></div><SocialAuthButtons redirectTo={nextPath || '/'} mode="connexion" showLegalFooter={false} /></div> : null}

        <p className="mt-7 text-body-sm text-ink/60">Pas encore de compte ? <Link href="/inscription" className="font-semibold text-accent-text hover:underline">Créer un compte gratuit</Link></p>
      </>}
    </AuthPageShell>
  )
}
