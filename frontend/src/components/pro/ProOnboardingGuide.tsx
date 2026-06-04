'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, BadgeCheck, ImageIcon, Megaphone, Sparkles, Store, TrendingUp } from 'lucide-react'

const steps = [
  {
    number: '1',
    title: 'Complétez vos infos',
    description: 'Ajoutez le nom de votre entreprise, votre commune et vos coordonnées.',
    href: '/pro/dashboard/parametres',
    cta: 'Renseigner le profil',
    icon: Store,
  },
  {
    number: '2',
    title: 'Ajoutez votre logo',
    description: 'Une identité visuelle claire rassure et rend votre vitrine plus mémorable.',
    href: '/pro/dashboard/parametres',
    cta: 'Importer un logo',
    icon: ImageIcon,
  },
  {
    number: '3',
    title: 'Soignez votre vitrine',
    description: 'Rédigez une description courte, vos horaires et votre site web.',
    href: '/pro/dashboard/parametres',
    cta: 'Personnaliser',
    icon: BadgeCheck,
  },
  {
    number: '4',
    title: 'Publiez votre première annonce',
    description: 'Mettez en ligne une offre claire pour commencer à attirer des contacts.',
    href: '/pro/dashboard/annonces',
    cta: 'Voir mes annonces',
    icon: Megaphone,
  },
  {
    number: '5',
    title: 'Activez vos boosts',
    description: 'Donnez plus de visibilité à vos annonces les plus importantes.',
    href: '/pro/dashboard/boosts',
    cta: 'Découvrir les boosts',
    icon: TrendingUp,
  },
  {
    number: '6',
    title: 'Suivez vos statistiques',
    description: 'Consultez vos vues, contacts et performances pour piloter votre activité.',
    href: '/pro/dashboard#stats',
    cta: 'Voir les statistiques',
    icon: BarChart3,
    highlighted: true,
  },
] as const

export default function ProOnboardingGuide() {
  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Onboarding guidé</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Complétez votre profil en 6 étapes</h2>
          <p className="mt-2 max-w-2xl text-sm text-night/60">
            Suivez ce parcours une fois votre compte Pro créé pour lancer votre vitrine sereinement et garder un oeil sur vos performances.
          </p>
        </div>
        <Link
          href="/pro/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
        >
          Aller au dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon

          return (
            <article
              key={step.number}
              className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                step.highlighted
                  ? 'border-[#0A7EA4] bg-[#0A7EA4]/5 shadow-sm'
                  : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${step.highlighted ? 'bg-[#0A7EA4] text-white' : 'bg-white text-[#0A7EA4]'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/55">
                      Étape {step.number}
                    </span>
                    {step.highlighted ? (
                      <span className="rounded-full bg-[#0A7EA4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        Suivi live
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-night">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-night/60">{step.description}</p>
                </div>
              </div>

              <Link
                href={step.href}
                className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold transition ${
                  step.highlighted ? 'text-[#0A7EA4] hover:underline' : 'text-night hover:text-[#0A7EA4]'
                }`}
              >
                {step.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
