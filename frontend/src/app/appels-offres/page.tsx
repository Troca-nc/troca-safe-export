import Link from 'next/link'
import { ArrowRight, ClipboardList, Plus } from 'lucide-react'

import Header from '@/components/layout/Header'

export const metadata = {
  title: "Appels d'offres — Troca NC",
  description:
    'Publiez votre besoin en 2 minutes. Les pros calédoniens vous répondent directement.',
}

export default function AppelsOffresPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">
      <Header />

      <section className="relative overflow-hidden px-4 py-12 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#065f7a_0%,_#0A7EA4_100%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
            <ClipboardList className="h-3.5 w-3.5" />
            Appels d&apos;offres
          </div>
          <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
            Trouvez le bon professionnel
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
            Publiez votre besoin en 2 minutes - les pros calédoniens de votre secteur vous répondent directement.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/appels-offres?action=publish"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-nc-lagon shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Publier un besoin
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Je suis un pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
              Demandes ouvertes
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">
              Appels d&apos;offres disponibles
            </h2>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-night/20" />
          <p className="text-lg font-semibold text-night">
            Soyez le premier à publier un besoin !
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-night/55">
            Décrivez votre projet ou besoin en quelques lignes - plomberie, électricité, informatique, rénovation... Les pros locaux vous répondront directement.
          </p>
          <Link
            href="/appels-offres?action=publish"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
          >
            <Plus className="h-4 w-4" />
            Publier un besoin
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-night">
          Comment ça marche ?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: '1',
              title: 'Publiez votre besoin',
              desc: "Décrivez votre projet, votre budget et votre commune. C'est gratuit et rapide.",
            },
            {
              n: '2',
              title: 'Les pros vous répondent',
              desc: 'Les professionnels vérifiés de votre secteur reçoivent une notification et vous contactent.',
            },
            {
              n: '3',
              title: 'Choisissez le meilleur',
              desc: 'Comparez les propositions, consultez les avis et sélectionnez le pro qui vous convient.',
            },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-nc-lagonLight text-lg font-bold text-[#0A7EA4]">
                {step.n}
              </div>
              <h3 className="font-semibold text-night">{step.title}</h3>
              <p className="mt-2 text-sm text-night/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
