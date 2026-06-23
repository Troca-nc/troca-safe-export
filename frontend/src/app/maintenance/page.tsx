import type { Metadata } from 'next'
import Image from 'next/image'

import { buildPageMetadata } from '@/lib/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Maintenance — Kalico NC',
  description: 'Kalico est temporairement en maintenance. Merci de revenir un peu plus tard.',
  path: '/maintenance',
  noindex: true,
})

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)] px-4 py-16 text-night">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white shadow-sm">
          <Image src="/brand/kalico1.svg" alt="Kalico" width={80} height={80} className="h-full w-full object-cover" priority />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">Maintenance en cours</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-night/60">
          Nous préparons Kalico pour le lancement. Le service sera de retour prochainement.
        </p>
        <p className="mt-5 rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3 text-sm font-semibold text-night">
          Retour estimé : après validation de production.
        </p>
      </section>
    </main>
  )
}
