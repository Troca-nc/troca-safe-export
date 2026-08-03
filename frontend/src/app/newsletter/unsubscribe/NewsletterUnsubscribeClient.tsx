'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Ban, CheckCircle2 } from 'lucide-react'

import { newsletterApi } from '@/lib/api'

export default function NewsletterUnsubscribeClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleUnsubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      await newsletterApi.unsubscribe(token ? { token } : {})
      setDone(true)
    } catch {
      setError('Impossible de traiter votre demande pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        {done ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-night">Vous �tes d�sabonn�</h1>
            <p className="mt-2 text-sm leading-relaxed text-night/60">
              Votre abonnement newsletter a bien �t� d�sactiv�.
            </p>
            <Link href="/newsletter/preferences" className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm">
              Modifier mes pr�f�rences
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Ban className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-night">�tes-vous s�r de vouloir vous d�sabonner ?</h1>
            <p className="mt-2 text-sm leading-relaxed text-night/60">
              Vous pouvez aussi ajuster vos pr�f�rences pour recevoir uniquement ce qui vous int�resse.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
              >
                {loading ? 'Traitement...' : 'Confirmer le d�sabonnement'}
              </button>
              <Link href="/newsletter/preferences" className="rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                Modifier mes pr�f�rences �
              </Link>
            </div>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </>
        )}
      </div>
    </div>
  )
}
