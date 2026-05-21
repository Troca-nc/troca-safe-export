'use client'
// ============================================================
//  Troca — Page paiement/succes
//  FIX 5 : Vérifie le statut réel via session_id Stripe
// ============================================================

import { Suspense, useEffect, useState }  from 'react'
import { useSearchParams }      from 'next/navigation'
import Link                     from 'next/link'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Receipt, Star } from 'lucide-react'
import Header                   from '@/components/layout/Header'
import { api }                  from '@/lib/api'
import { useAuthStore }         from '@/store/authStore'
import { trackEvent }           from '@/lib/analytics'

type Status = 'loading' | 'ok_boost' | 'ok_subscription' | 'ok_trial' | 'invalid'

function PaiementSuccesContent() {
  const params       = useSearchParams()
  const sessionId    = params.get('session_id')
  const type         = params.get('type') ?? 'boost'
  const provider     = params.get('provider') ?? 'stripe'
  const ppPaymentId  = params.get('pp_payment_id')
  const ppSubId      = params.get('pp_sub_id')
  const { refreshMe } = useAuthStore()

  const [result, setResult]   = useState<any>({ status: 'loading' })
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    // Paiement PayPlug : utiliser pp_payment_id ou pp_sub_id
    if (provider === 'payplug') {
      const ppId = ppPaymentId || ppSubId
      if (!ppId) { setResult({ status: 'invalid' }); return }
      // Vérifier via la route dédiée
      let attempts = 0
      const verifyPP = async () => {
        try {
          const { data } = await api.get('/payment/verify-payplug', {
            params: { id: ppId, type, resource_type: ppSubId ? 'subscription' : 'payment' },
          })
          if (data.status === 'pending' && attempts < 8) {
            attempts++; setRetries(attempts)
            setTimeout(verifyPP, 2500); return
          }
          setResult(data)
          if (data.status === 'ok_subscription' || data.status === 'ok_trial' || data.status === 'ok_boost') {
            void trackEvent('checkout_success', {
              provider,
              offer_type: data.status === 'ok_boost' ? 'boost' : 'subscription',
            })
          }
          if (data.status === 'ok_subscription') refreshMe().catch(() => {})
        } catch { setResult({ status: 'invalid' }) }
      }
      verifyPP(); return
    }

    if (!sessionId) { setResult({ status: 'invalid' }); return }

    let cancelled = false
    let attempt   = 0

    const verify = async () => {
      try {
        const { data } = await api.get('/payment/verify-session', { params: { session_id: sessionId, type } })
        if (cancelled) return
        if (data.status === 'pending' && attempt < 6) {
          attempt++; setRetries(attempt)
          setTimeout(verify, 2000); return
        }
        setResult(data)
        if (data.status === 'ok_subscription' || data.status === 'ok_trial' || data.status === 'ok_boost') {
          void trackEvent('checkout_success', {
            provider,
            offer_type: data.status === 'ok_boost' ? 'boost' : 'subscription',
          })
        }
        if (data.status === 'ok_subscription' || data.status === 'ok_trial') {
          refreshMe().catch(() => {})
        }
      } catch { if (!cancelled) setResult({ status: 'invalid' }) }
    }

    verify()
    return () => { cancelled = true }
  }, [sessionId, type, provider, ppPaymentId, ppSubId, refreshMe])

  if (result.status === 'loading') return (
    <>
      <Header />
      <div className="min-h-screen bg-sand-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-coral animate-spin mx-auto mb-4" />
          <p className="text-night/60 font-medium">Confirmation du paiement…</p>
          {retries > 0 && <p className="text-sm text-night/40 mt-1">Synchronisation ({retries}/6)</p>}
        </div>
      </div>
    </>
  )

  if (result.status === 'invalid') return (
    <>
      <Header />
      <div className="min-h-screen bg-sand-light flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-night mb-2">Paiement non vérifié</h1>
          <p className="text-night/60 text-sm mb-8">Nous n'avons pas pu confirmer votre paiement. Réessayez ou contactez-nous.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary py-3">Rafraîchir</button>
            <Link href="/parametres" className="btn-secondary py-3">Mes paramètres</Link>
          </div>
        </div>
      </div>
    </>
  )

  const isSubscription = result.status === 'ok_subscription' || result.status === 'ok_trial'
  const isTrial        = result.status === 'ok_trial'
  const trialEndStr    = result.trial_end ? new Date(result.trial_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const periodEndStr   = result.period_end ? new Date(result.period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-sand-light">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            {isSubscription
              ? <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
              : <CheckCircle2 className="w-10 h-10 text-green-500" />
            }
          </div>

          <h1 className="font-display text-3xl font-bold text-night mb-4">
            {isSubscription ? isTrial ? "14 jours d'essai activés !" : 'Abonnement Pro activé !' : 'Boost activé !'}
          </h1>

          {/* Détails */}
          <div className="bg-white rounded-2xl p-5 mb-8 text-left shadow-sm border border-night/5 space-y-3">
            {isSubscription ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-night/50">Plan</span>
                  <span className="font-semibold text-night capitalize">{result.plan?.replace('_', ' ')}</span>
                </div>
                {trialEndStr && <div className="flex justify-between text-sm"><span className="text-night/50">Fin d'essai</span><span className="font-semibold text-green-600">{trialEndStr}</span></div>}
                {periodEndStr && <div className="flex justify-between text-sm"><span className="text-night/50">Prochain renouvellement</span><span className="font-semibold text-night">{periodEndStr}</span></div>}
                {isTrial && <div className="bg-green-50 text-green-700 text-xs rounded-xl px-3 py-2">Aucun débit pendant la période d'essai. Annulation possible à tout moment.</div>}
              </>
            ) : (
              <>
                {result.annonce_titre && <div className="flex justify-between text-sm"><span className="text-night/50">Annonce</span><span className="font-semibold text-night truncate max-w-[200px]">{result.annonce_titre}</span></div>}
                {result.boost_type && <div className="flex justify-between text-sm"><span className="text-night/50">Type</span><span className="font-semibold text-night capitalize">{result.boost_type}</span></div>}
                {result.boost_days && <div className="flex justify-between text-sm"><span className="text-night/50">Durée</span><span className="font-semibold text-night">{result.boost_days} jours</span></div>}
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isSubscription ? (
              <>
                <Link href="/annonces/nouvelle" className="btn-primary justify-center py-3 flex items-center gap-2">
                  Publier une annonce <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/parametres#factures" className="btn-secondary justify-center py-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Mes factures
                </Link>
              </>
            ) : (
              <>
                <Link href={result.annonce_id ? `/annonces/${result.annonce_id}` : '/annonces'} className="btn-primary justify-center py-3 flex items-center gap-2">
                  Voir mon annonce boostée <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/" className="btn-secondary justify-center py-3">Retour à l'accueil</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <PaiementSuccesContent />
    </Suspense>
  )
}
