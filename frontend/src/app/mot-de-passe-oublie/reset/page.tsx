'use client'
// ============================================================
//  Troca Web — Page réinitialisation mot de passe
//  URL : /mot-de-passe-oublie/reset?token=xxx
// ============================================================

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import Header from '@/components/layout/Header'
import axios from 'axios'
import { API_ORIGIN } from '@/lib/api'

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [showPwd,   setShowPwd]   = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')
  const [tokenErr,  setTokenErr]  = useState(false)

  useEffect(() => {
    if (!token) setTokenErr(true)
  }, [token])

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }: FormData) => {
    setError('')
    try {
      await axios.post(`${API_ORIGIN}/api/auth/reset-password`, { token, password })
      setSuccess(true)
      setTimeout(() => router.push('/connexion'), 3000)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Lien invalide ou expiré.'
      setError(msg)
      if (msg.toLowerCase().includes('expiré') || msg.toLowerCase().includes('invalide')) {
        setTokenErr(true)
      }
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Lien expiré / invalide */}
          {tokenErr && !success && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
              <p className="text-gray-500 mb-6 text-sm">
                Ce lien de réinitialisation est invalide ou a expiré (validité 1 heure).
              </p>
              <Link
                href="/mot-de-passe-oublie"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Recevoir un nouveau lien
              </Link>
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Mot de passe modifié !</h1>
              <p className="text-gray-500 text-sm">
                Vous allez être redirigé vers la connexion dans 3 secondes…
              </p>
            </div>
          )}

          {/* Formulaire */}
          {!tokenErr && !success && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Nouveau mot de passe</h1>
                  <p className="text-sm text-gray-500">Choisissez un mot de passe sécurisé</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="8 caractères minimum"
                      className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition
                        ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirm')}
                      type={showConf ? 'text' : 'password'}
                      placeholder="Répétez le mot de passe"
                      className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition
                        ${errors.confirm ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  {isSubmitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            <Link href="/connexion" className="hover:text-blue-600 transition">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
