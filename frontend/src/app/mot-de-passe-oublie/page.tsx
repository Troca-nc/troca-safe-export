'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { describeAuthError, requestPasswordReset } from '@/lib/data/auth'
import type { AuthErrorPresentation } from '@/types/auth'

const schema = z.object({ identifier: z.string().trim().min(3, 'Saisissez votre e-mail ou votre numéro de téléphone.') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('')
  const [failure, setFailure] = useState<AuthErrorPresentation | null>(null)
  const [lastIdentifier, setLastIdentifier] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.toLowerCase().includes('changeme'))
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function submit({ identifier }: FormData) {
    setFailure(null)
    setLastIdentifier(identifier)
    if (turnstileEnabled && !turnstileToken) {
      setFailure({ kind: 'unknown', message: 'Merci de compléter la vérification anti-bot.', retryable: false })
      return
    }
    try {
      await requestPasswordReset(identifier, turnstileToken || undefined)
      setSentTo(identifier)
    } catch (error) {
      setFailure(describeAuthError(error))
    }
  }

  return <AuthPageShell>
    {sentTo ? <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-reef/15 text-reef-text"><CheckCircle2 className="h-8 w-8" /></span><p className="mt-6 text-eyebrow uppercase text-reef-text">Demande envoyée</p><h1 className="mt-3 font-display text-h1-form text-ink">Consultez vos messages.</h1><p className="mt-5 text-body text-ink/65">Si un compte Kalico est associé à <strong className="text-ink">{sentTo}</strong>, vous recevrez un lien par e-mail ou SMS selon vos coordonnées vérifiées.</p><p className="mt-3 text-body-sm text-ink/50">Le lien expire après une heure. Pensez à vérifier vos courriers indésirables.</p><Link href="/connexion" className="k-button k-button-primary mt-8 inline-grid"><ArrowLeft className="h-4 w-4" />Retour à la connexion</Link></div> : <>
      <p className="text-eyebrow uppercase text-accent-text">Accès au compte</p><h1 className="mt-3 font-display text-h1-form text-ink">Mot de passe oublié ?</h1><p className="mt-4 text-body text-ink/65">Indiquez votre e-mail ou votre téléphone. Nous vous enverrons les instructions de réinitialisation si un compte correspondant existe.</p>
      {failure ? <div className="mt-6"><FeedbackAlert tone="error" title="Envoi impossible"><p>{failure.message}</p>{failure.retryable && lastIdentifier ? <Button variant="secondary" compact className="mt-3" onClick={() => void submit({ identifier: lastIdentifier })}>Réessayer</Button> : null}</FeedbackAlert></div> : null}
      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5" noValidate><Input {...register('identifier')} label="E-mail ou téléphone" type="text" placeholder="vous@exemple.nc ou +687 00 00 00" autoComplete="username" error={errors.identifier?.message} hint="Nous ne confirmerons jamais publiquement si un compte existe." />{turnstileEnabled ? <TurnstileChallenge action="forgot_password" label="Vérification anti-bot" onTokenChange={setTurnstileToken} /> : null}<Button type="submit" loading={isSubmitting} loadingLabel="Envoi…" className="w-full"><Send className="h-4 w-4" />Envoyer les instructions</Button></form>
      <Link href="/connexion" className="mt-6 inline-flex min-h-11 items-center gap-2 text-label text-accent-text hover:underline"><ArrowLeft className="h-4 w-4" />Retour à la connexion</Link>
    </>}
  </AuthPageShell>
}
