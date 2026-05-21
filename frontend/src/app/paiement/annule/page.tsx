'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { XCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import { trackEvent } from '@/lib/analytics'

export default function PaiementAnnulePage() {
  useEffect(() => {
    void trackEvent('checkout_abandon', { source: 'payment_cancel_page' })
  }, [])

  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-night mb-2">Paiement annulé</h1>
        <p className="text-night/60 mb-8 text-sm">
          Aucun montant n'a été débité. Vous pouvez réessayer à tout moment.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/pro" className="btn-primary justify-center py-3">Réessayer</Link>
          <Link href="/" className="btn-secondary justify-center py-3">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
