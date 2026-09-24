'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[kalico] app_error', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)] px-4 py-16 text-night">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white shadow-sm">
          <Image src="/brand/kalico1.svg" alt="Kalico" width={80} height={80} className="h-full w-full object-cover" priority />
        </div>
        <AlertTriangle className="mx-auto mt-5 h-14 w-14 text-amber-500" />
        <h1 className="mt-4 font-display text-3xl font-bold">Une erreur inattendue s'est produite</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-night/60">
          Notre équipe a été notifiée. Vous pouvez essayer de rafraîchir la page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center rounded-2xl px-5 py-3"
          >
            Réessayer
          </button>
          <Link href="/" className="btn-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3">
            Retour à l'accueil
          </Link>
        </div>
      </section>
    </div>
  )
}
