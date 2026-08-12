'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { BadgeCheck, Mail, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { authApi } from '@/lib/api'

type Status = 'loading' | 'success' | 'error'

function VerificationEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || ''
  const role = searchParams.get('role') === 'pro' ? 'pro' : 'particulier'
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(
    token ? 'Vï¿½rification en cours...' : "Vï¿½rifiez votre boï¿½te mail pour confirmer votre compte."
  )
  const [resendBusy, setResendBusy] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const ctaHref = useMemo(() => (role === 'pro' ? '/bienvenue?role=pro' : '/bienvenue?role=particulier'), [role])

  useEffect(() => {
    if (!token) return

    let mounted = true
    authApi.verifyEmail(token)
      .then(() => {
        if (!mounted) return
        setStatus('success')
        setMessage('Votre email a ï¿½tï¿½ confirmï¿½. Votre compte est maintenant prï¿½t.')
      })
      .catch((err: any) => {
        if (!mounted) return
        setStatus('error')
        setMessage(err?.response?.data?.error || 'Lien invalide ou expirï¿½.')
      })

    return () => {
      mounted = false
    }
  }, [token])

  const handleResend = async () => {
    if (!email) {
      setMessage("Renseignez votre email pour recevoir un nouveau lien.")
      return
    }

    if (turnstileEnabled && !turnstileToken) {
      setStatus('error')
      setMessage('Veuillez complï¿½ter la vï¿½rification anti-bot.')
      return
    }

    setResendBusy(true)
    try {
      const { data } = await authApi.resendVerification(email, turnstileToken || undefined)
      setStatus('success')
      setMessage(data?.message || 'Un nouveau lien de confirmation a ï¿½tï¿½ envoyï¿½.')
      setTurnstileToken('')
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.response?.data?.error || 'Impossible de renvoyer le lien pour le moment.')
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-light px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-night/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kalico-blue/10 text-kalico-blue">
              <Mail className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Confirmation email</p>
              <h1 className="mt-1 font-display text-3xl font-bold text-night">
                {status === 'success' ? 'Compte confirmï¿½' : 'Confirmez votre email'}
              </h1>
              <p className="mt-2 text-sm text-night/60">{message}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-sand/70 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-jungle" />
                <p className="text-sm font-semibold text-night">Pourquoi cest important</p>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-night/65">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-jungle" />
                  Badge de confiance renforcï¿½
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-jungle" />
                  Moins de risque de faux comptes
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-jungle" />
                  Accï¿½s complet au compte Kalico
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-night/10 bg-white p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-kalico-blue" />
                <p className="text-sm font-semibold text-night">Votre parcours</p>
              </div>
              <p className="mt-2 text-sm text-night/60">
                {role === 'pro'
                  ? 'Aprï¿½s confirmation, vous pourrez configurer votre espace professionnel et activer vos options de visibilitï¿½.'
                  : 'Aprï¿½s confirmation, vous pourrez dï¿½poser votre premiï¿½re annonce et utiliser toutes les fonctions de base.'}
              </p>
              <p className="mt-3 text-xs text-night/50">
                Le tï¿½lï¿½phone reste optionnel ï¿½ ce stade, mais sa vï¿½rification amï¿½liore votre badge de confiance.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={status === 'success' ? ctaHref : '/inscription'} className="btn-primary justify-center px-5 py-3">
              {status === 'success' ? 'Continuer' : 'Retour ï¿½ linscription'}
            </Link>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendBusy}
              className="btn-ghost justify-center px-5 py-3"
            >
              {resendBusy ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Renvoi en cours...
                </span>
              ) : (
                'Renvoyer le lien'
              )}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-night/10 bg-sand/40 p-4">
            <p className="text-sm font-semibold text-night">Vï¿½rification anti-bot</p>
            <p className="mt-1 text-xs text-night/55">
              Le renvoi de lien est protï¿½gï¿½ par un challenge discret pour ï¿½viter les abus.
            </p>
            <div className="mt-3">
              <TurnstileChallenge action="resend_verification" label="Renvoi de lien" onTokenChange={setTurnstileToken} />
            </div>
          </div>

          {email ? (
            <p className="mt-4 text-sm text-night/50">
              Email utilisï¿½ : <span className="font-semibold text-night">{email}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function VerificationEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <VerificationEmailContent />
    </Suspense>
  )
}
