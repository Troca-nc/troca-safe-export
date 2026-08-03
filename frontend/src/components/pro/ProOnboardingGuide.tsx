'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Circle,
  ImageIcon,
  Megaphone,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'

type OnboardingStep = {
  number: string
  title: string
  description: string
  href: string
  cta: string
  icon: typeof Store
  highlighted?: boolean
}

const steps: OnboardingStep[] = [
  {
    number: '1',
    title: 'Compl�tez vos infos',
    description: 'Ajoutez le nom de votre entreprise, votre commune et vos coordonn�es.',
    href: '/pro/dashboard/parametres',
    cta: 'Renseigner le profil',
    icon: Store,
  },
  {
    number: '2',
    title: 'Ajoutez votre logo',
    description: 'Une identit� visuelle claire rassure et rend votre vitrine plus m�morable.',
    href: '/pro/dashboard/parametres',
    cta: 'Importer un logo',
    icon: ImageIcon,
  },
  {
    number: '3',
    title: 'Soignez votre vitrine',
    description: 'R�digez une description courte, vos horaires et votre site web.',
    href: '/pro/dashboard/parametres',
    cta: 'Personnaliser',
    icon: BadgeCheck,
  },
  {
    number: '4',
    title: 'Publiez votre premi�re annonce',
    description: 'Mettez en ligne une offre claire pour commencer � attirer des contacts.',
    href: '/pro/dashboard/annonces',
    cta: 'Voir mes annonces',
    icon: Megaphone,
  },
  {
    number: '5',
    title: 'Activez vos boosts',
    description: 'Donnez plus de visibilit� � vos annonces les plus importantes.',
    href: '/pro/dashboard/boosts',
    cta: 'D�couvrir les boosts',
    icon: TrendingUp,
  },
  {
    number: '6',
    title: 'Suivez vos statistiques',
    description: 'Consultez vos vues, contacts et performances pour piloter votre activit�.',
    href: '/pro/dashboard#stats',
    cta: 'Voir les statistiques',
    icon: BarChart3,
    highlighted: true,
  },
]

const STORAGE_KEY = 'kalico-pro-onboarding-progress'

export default function ProOnboardingGuide() {
  const [completedSteps, setCompletedSteps] = useState<string[]>(['1'])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['1']))
        setCompletedSteps(['1'])
        return
      }

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const valid = parsed
          .map((value) => String(value))
          .filter((value) => steps.some((step) => step.number === value))
        setCompletedSteps(valid.length ? valid : ['1'])
      }
    } catch {
      setCompletedSteps(['1'])
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps))
  }, [completedSteps])

  const totalSteps = steps.length
  const completionRate = useMemo(
    () => Math.round((completedSteps.length / totalSteps) * 100),
    [completedSteps.length, totalSteps],
  )

  const toggleStep = (stepNumber: string) => {
    setCompletedSteps((current) => {
      const exists = current.includes(stepNumber)
      if (exists) {
        const next = current.filter((value) => value !== stepNumber)
        return next.length ? next : ['1']
      }

      return [...current, stepNumber].sort((a, b) => Number(a) - Number(b))
    })
  }

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Onboarding guid�</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Compl�tez votre profil en 6 �tapes</h2>
          <p className="mt-2 max-w-2xl text-sm text-night/60">
            Suivez ce parcours une fois votre compte Pro cr�� pour lancer votre vitrine sereinement et garder un oeil sur vos performances.
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

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-night">
            Progression: {completedSteps.length}/{totalSteps} �tapes compl�t�es
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{completionRate}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#0A7EA4] transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          const isCompleted = completedSteps.includes(step.number)

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
                <button
                  type="button"
                  onClick={() => toggleStep(step.number)}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : step.highlighted
                        ? 'bg-[#0A7EA4] text-white'
                        : 'bg-white text-[#0A7EA4]'
                  }`}
                  aria-label={`${isCompleted ? 'D�cocher' : 'Cocher'} l'�tape ${step.number}`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/55">
                      �tape {step.number}
                    </span>
                    {isCompleted ? (
                      <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        Compl�t�
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
                        � faire
                      </span>
                    )}
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

      <div className="mt-6 flex items-center gap-2 text-xs font-medium text-night/55">
        <Circle className="h-3.5 w-3.5 text-nc-emeraude" />
        La premi�re �tape est coch�e automatiquement lors de votre premi�re visite.
      </div>
    </section>
  )
}
