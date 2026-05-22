'use client'

// TODO: test E2E for subscription confirmation reload and polling flow.

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Receipt, ShieldCheck, Star } from 'lucide-react'
import Header from '@/components/layout/Header'
import { api } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { useAuthStore } from '@/store/authStore'

type VerificationStatus = 'loading' | 'pending' | 'ok_subscription' | 'ok_trial' | 'invalid'

interface SubscriptionVerificationResult {
  status: VerificationStatus
  plan?: string | null
  period_end?: string | null
  trial_end?: string | null
  provider?: 'stripe' | 'payplug'
  error?: string
}

interface StoredConfirmation {
  confirmed: true
  payload: SubscriptionVerificationResult
  storedAt: string
}

const STORAGE_PREFIX = 'troca_subscription_confirmation:'

function buildStorageKey(sessionId: string | null, paymentId: string | null) {
  const identifier = sessionId || paymentId || 'unknown'
  return `${STORAGE_PREFIX}${identifier}`
}

function readStoredConfirmation(key: string): StoredConfirmation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredConfirmation>
    if (parsed?.confirmed !== true || !parsed.payload || typeof parsed.payload.status !== 'string') {
      return null
    }
    return parsed as StoredConfirmation
  } catch {
    return null
  }
}

function storeConfirmedPayload(key: string, payload: SubscriptionVerificationResult) {
  if (typeof window === 'undefined') return
  try {
    const value: StoredConfirmation = {
      confirmed: true,
      payload,
      storedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures and keep the confirmation flow working.
  }
}

function getOfferType(status: SubscriptionVerificationResult['status']) {
  return status === 'ok_trial' || status === 'ok_subscription' ? 'subscription' : 'subscription'
}

function ConfirmationContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const paymentId = params.get('payment_id')
  const provider = (params.get('provider') ?? (paymentId ? 'payplug' : 'stripe')) as 'stripe' | 'payplug'
  const storageKey = useMemo(() => buildStorageKey(sessionId, paymentId), [paymentId, sessionId])
  const { refreshMe } = useAuthStore()

  const [result, setResult] = useState<SubscriptionVerificationResult>({ status: 'loading' })
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    // TODO: test E2E for subscription confirmation reload and polling flow.
    const stored = readStoredConfirmation(storageKey)
    if (stored?.confirmed && stored.payload.status !== 'loading' && stored.payload.status !== 'pending') {
      setResult(stored.payload)
      refreshMe().catch(() => {})
      return
    }

    if (!sessionId && !paymentId) {
      setResult({ status: 'invalid', error: 'Paramètre de paiement manquant' })
      return
    }

    let cancelled = false
    let timeoutId: number | null = null
    let attempt = 0

    const verify = async () => {
      try {
        const { data } = await api.get('/subscriptions/verify', {
          params: sessionId ? { session_id: sessionId } : { payment_id: paymentId },
        })

        if (cancelled) return

        if (data.status === 'pending' && attempt < 10) {
          attempt += 1
          setAttempts(attempt)
          setResult({ status: 'pending', provider })
          timeoutId = window.setTimeout(() => {
            void verify()
          }, 3000)
          return
        }

        const nextResult: SubscriptionVerificationResult = {
          status: data.status as VerificationStatus,
          plan: data.plan ?? null,
          period_end: data.period_end ?? null,
          trial_end: data.trial_end ?? null,
          provider: data.provider ?? provider,
          error: typeof data.error === 'string' ? data.error : undefined,
        }

        setResult(nextResult)

        if (data.status === 'ok_subscription' || data.status === 'ok_trial') {
          storeConfirmedPayload(storageKey, nextResult)
          refreshMe().catch(() => {})
          void trackEvent('checkout_success', {
            provider: data.provider ?? provider,
            offer_type: getOfferType(data.status),
          })
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            status: 'invalid',
            provider,
            error: 'Nous n’avons pas pu confirmer votre abonnement. Réessayez ou contactez-nous.',
          })
        }
      }
    }

    void verify()

    return () => {
      cancelled = true
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [paymentId, provider, refreshMe, sessionId, storageKey])

  if (result.status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-sand-light flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-coral" />
            <p className="font-medium text-night/60">Validation en cours...</p>
          </div>
        </div>
      </>
    )
  }

  if (result.status === 'pending') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-sand-light flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-night">Validation en cours...</h1>
            <p className="mb-2 text-sm text-night/60">
              Nous vérifions votre abonnement Pro. Cela peut prendre quelques secondes sur réseau mobile lent.
            </p>
            <p className="mb-8 text-xs text-night/40">
              Tentative {attempts}/10
            </p>
            <div className="rounded-2xl border border-night/5 bg-white p-4 text-left text-sm text-night/60 shadow-sm">
              <p className="mb-2 font-semibold text-night">Pendant ce temps, gardez en tête :</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Votre paiement est déjà engagé.</li>
                <li>La synchronisation peut être un peu plus lente sur connexion mobile.</li>
                <li>La page se rafraîchira automatiquement quand le statut sera prêt.</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (result.status === 'invalid') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-sand-light flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-night">Abonnement non vérifié</h1>
            <p className="mb-8 text-sm text-night/60">
              {result.error || 'Nous n’avons pas pu confirmer votre abonnement. Réessayez ou contactez-nous.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary py-3"
              >
                Réessayer
              </button>
              <Link href="/contact" className="btn-secondary py-3">
                Contacter le support
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const isTrial = result.status === 'ok_trial'
  const periodEnd = result.period_end ? new Date(result.period_end).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : null
  const trialEnd = result.trial_end ? new Date(result.trial_end).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-sand-light">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            {isTrial ? (
              <Star className="h-10 w-10 fill-amber-500 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            )}
          </div>

          <h1 className="mb-4 text-3xl font-bold text-night">
            {isTrial ? "14 jours d'essai activés !" : 'Abonnement Pro activé !'}
          </h1>

          <div className="mb-8 rounded-2xl border border-night/5 bg-white p-5 text-left shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-night">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Ce que votre abonnement débloque
            </div>
            <ul className="space-y-3 text-sm text-night/70">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Publier des annonces Pro avec plus de visibilité
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Accéder aux outils de suivi et aux factures
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Renforcer la crédibilité de votre profil vendeur
              </li>
            </ul>
            {trialEnd && (
              <div className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
                Période d'essai active jusqu'au <strong>{trialEnd}</strong>.
              </div>
            )}
            {periodEnd && !trialEnd && (
              <div className="mt-4 rounded-xl bg-sand px-3 py-2 text-xs text-night/70">
                Renouvellement prévu le <strong>{periodEnd}</strong>.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/annonces/nouvelle" className="btn-primary flex items-center justify-center gap-2 py-3">
              Publier ma première annonce Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/parametres#factures" className="btn-secondary flex items-center justify-center gap-2 py-3">
              <Receipt className="h-4 w-4" />
              Voir mes factures
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AbonnementConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <ConfirmationContent />
    </Suspense>
  )
}
