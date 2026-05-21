'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[frontend] global_error', error)
  }, [error])

  return (
    <html lang="fr">
      <body className="min-h-screen flex items-center justify-center px-6 py-16 bg-sand-light text-night">
        <div className="max-w-lg w-full rounded-3xl border border-night/10 bg-white shadow-xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-coral font-semibold mb-3">Erreur critique</p>
          <h1 className="text-3xl font-bold mb-3">Une erreur critique a interrompu l’application</h1>
          <p className="text-night/70 mb-6">
            Nous avons préparé un écran de secours pour éviter une page blanche. Tu peux réessayer ou revenir à l’accueil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-white font-semibold hover:bg-coral-dark transition-colors"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-night/15 px-5 py-3 text-night font-semibold hover:bg-night/5 transition-colors"
            >
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
