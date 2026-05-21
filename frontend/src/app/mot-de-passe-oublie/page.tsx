'use client'
// src/app/mot-de-passe-oublie/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { authApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent,  setSent]  = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: FormData) => {
    setError('')
    try {
      if (turnstileEnabled && !turnstileToken) {
        setError('Veuillez compléter la vérification anti-bot.')
        return
      }
      await authApi.forgotPassword(email, turnstileToken || undefined)
      setSent(true)
    } catch (err: any) {
      // On affiche toujours "email envoyé" même si l'adresse n'existe pas
      // (évite l'énumération des comptes)
      setSent(true)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <Link href="/connexion" className="inline-flex items-center gap-1.5 text-sm text-night/50 hover:text-coral mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>

          {!sent ? (
            <div className="card p-8">
              <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-coral" />
              </div>
              <h1 className="font-display font-bold text-2xl text-night mb-2">Mot de passe oublié ?</h1>
              <p className="text-night/50 text-sm mb-6">
                Entrez votre adresse email. Si un compte existe, vous recevrez un lien de réinitialisation valable 1 heure.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-night mb-1.5">Adresse email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="vous@exemple.nc"
                    autoComplete="email"
                    className={`input ${errors.email ? 'border-red-400' : ''}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div className="rounded-2xl border border-night/10 bg-sand/40 p-4">
                  <p className="text-sm font-semibold text-night">Vérification anti-bot</p>
                  <p className="mt-1 text-xs text-night/55">
                    Cette étape protège la réinitialisation sans gêner les utilisateurs réels.
                  </p>
                  <div className="mt-3">
                    <TurnstileChallenge action="forgot_password" label="Réinitialisation" onTokenChange={setTurnstileToken} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 justify-center">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi…
                    </span>
                  ) : 'Envoyer le lien'}
                </button>
              </form>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-jungle/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-jungle" />
              </div>
              <h2 className="font-display font-bold text-xl text-night mb-2">Email envoyé !</h2>
              <p className="text-night/55 text-sm mb-6 leading-relaxed">
                Si un compte Troca est associé à <strong>{getValues('email')}</strong>, vous recevrez un email avec un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-xs text-night/35 mb-6">
                Vérifiez vos spams si vous ne recevez rien. Le lien expire dans 1 heure.
              </p>
              <Link href="/connexion" className="btn-primary justify-center py-2.5">
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
