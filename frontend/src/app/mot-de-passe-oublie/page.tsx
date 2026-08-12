'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import { authApi } from '@/lib/api'

const schema = z.object({
  identifier: z.string().trim().min(3, 'Entrez votre email ou numï¿½ro de tï¿½lï¿½phone'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    getValues,
  } = useForm<FormData>({ resolver: zodResolver(schema) })
  const identifierValue = watch('identifier') || ''
  const looksLikePhone = /^(?:\+|0)?[\d\s().-]+$/.test(identifierValue.trim()) && !identifierValue.includes('@')
  const LeadingIcon = looksLikePhone ? Phone : Mail

  const onSubmit = async ({ identifier }: FormData) => {
    setError('')
    try {
      if (turnstileEnabled && !turnstileToken) {
        setError('Veuillez complï¿½ter la vï¿½rification anti-bot.')
        return
      }

      await authApi.forgotPassword(identifier, turnstileToken || undefined)
      setSent(true)
    } catch {
      // On affiche toujours un message neutre pour ï¿½viter l'ï¿½numï¿½ration de comptes.
      setSent(true)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/connexion" className="inline-flex items-center gap-1.5 text-sm text-night/50 hover:text-kalico-blue mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour ï¿½ la connexion
          </Link>

          {!sent ? (
            <div className="card p-8">
              <div className="w-12 h-12 bg-kalico-blue/10 rounded-2xl flex items-center justify-center mb-5">
                <LeadingIcon className="w-6 h-6 text-kalico-blue" />
              </div>
              <h1 className="font-display font-bold text-2xl text-night mb-2">Mot de passe oubliï¿½ ?</h1>
              <p className="text-night/50 text-sm mb-6">
                Entrez votre email ou votre numï¿½ro de tï¿½lï¿½phone. Si le numï¿½ro est vï¿½rifiï¿½, nous privilï¿½gierons le SMS ; sinon, nous enverrons un email de rï¿½initialisation valable 1 heure.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-night mb-1.5">Email ou tï¿½lï¿½phone</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      {looksLikePhone ? (
                        <Phone className="w-4 h-4 text-night/35" />
                      ) : (
                        <Mail className="w-4 h-4 text-night/35" />
                      )}
                    </div>
                    <input
                      {...register('identifier')}
                      type="text"
                      placeholder="vous@exemple.nc ou +687 12 34 56"
                      autoComplete="off"
                      inputMode="text"
                      className={`input pl-10 ${errors.identifier ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
                </div>

                <div className="rounded-2xl border border-night/10 bg-sand/40 p-4">
                  <p className="text-sm font-semibold text-night">Vï¿½rification anti-bot</p>
                  <p className="mt-1 text-xs text-night/55">
                    Cette ï¿½tape protï¿½ge la rï¿½initialisation sans gï¿½ner les utilisateurs rï¿½els.
                  </p>
                  <div className="mt-3">
                    <TurnstileChallenge action="forgot_password" label="Rï¿½initialisation" onTokenChange={setTurnstileToken} />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 justify-center">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
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
              <h2 className="font-display font-bold text-xl text-night mb-2">Message envoyï¿½ !</h2>
              <p className="text-night/55 text-sm mb-6 leading-relaxed">
                Si un compte Kalico est associï¿½ ï¿½ <strong>{getValues('identifier')}</strong>, vous recevrez un lien de rï¿½initialisation par SMS ou par email selon vos coordonnï¿½es vï¿½rifiï¿½es.
              </p>
              <p className="text-xs text-night/35 mb-6">
                Vï¿½rifiez vos spams si vous ne recevez rien. Le lien expire dans 1 heure.
              </p>
              <Link href="/connexion" className="btn-primary justify-center py-2.5">
                Retour ï¿½ la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
