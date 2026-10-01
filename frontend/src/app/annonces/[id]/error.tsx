'use client'

import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

export default function ListingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <><Header /><main className="mx-auto flex min-h-[60vh] max-w-container items-center justify-center px-4 py-20"><div className="max-w-xl text-center"><p className="text-eyebrow uppercase text-alert-error">Erreur de chargement</p><h1 className="mt-3 font-display text-h1-form text-ink">Impossible de charger cette annonce.</h1><p className="mt-5 text-body text-ink/65">Vérifiez votre connexion puis réessayez.</p><Button className="mt-8" onClick={reset}>Réessayer</Button></div></main></>
}
