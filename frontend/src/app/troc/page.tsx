import Link from 'next/link'
import { Handshake, Scale, Target } from 'lucide-react'

import Header from '@/components/layout/Header'
import Trocometer from '@/components/trocometer/Trocometer'

const steps = [
  {
    icon: Target,
    title: 'Choisissez votre annonce',
    description: 'Sélectionnez l’objet que vous voulez troquer parmi vos propres annonces actives.',
  },
  {
    icon: Scale,
    title: 'On trouve les équivalents',
    description: 'Le Trocômètre recherche 3 annonces de valeur comparable dans une fourchette de ±30%.',
  },
  {
    icon: Handshake,
    title: 'Contactez et troquez',
    description: 'Ouvrez l’annonce qui vous plaît et démarrez la discussion directement avec le vendeur.',
  },
]

export default function TrocPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />

      <section className="relative overflow-hidden px-4 py-10 text-white md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#0A7EA4_0%,_#065f7a_100%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 1200 520" aria-hidden="true">
          <defs>
            <pattern id="troc-dots" width="56" height="56" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="2.5" fill="white" />
            </pattern>
          </defs>
          <rect width="1200" height="520" fill="url(#troc-dots)" />
        </svg>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            🔄 Troc entre Calédoniens
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            Trocômètre
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
            Échangez malin — trouvez des objets de même valeur prêts à être troqués.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <Trocometer />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Comment ça marche</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Trois étapes simples pour trouver un échange</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <article
                key={step.title}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-coral/80">
                  Étape {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-night">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-night/60">{step.description}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-sm">
          <p className="text-sm text-night/60">
            Besoin d’un point de départ ?{' '}
            <Link href="/annonces/nouvelle" className="font-semibold text-coral hover:underline">
              Publiez votre première annonce
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
