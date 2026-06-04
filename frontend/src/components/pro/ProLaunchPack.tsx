'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Circle,
  ImageIcon,
  Megaphone,
  Package,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'

const steps = [
  {
    number: '1',
    title: 'Complétez la vitrine',
    description: 'Renseignez le nom, la commune, les coordonnées et la description de votre activité.',
    href: '/pro/dashboard/parametres',
    cta: 'Ouvrir les paramètres',
    icon: Store,
  },
  {
    number: '2',
    title: 'Ajoutez logo et bannière',
    description: 'Une identité visuelle claire rassure et donne un rendu plus professionnel dès la première visite.',
    href: '/pro/dashboard/parametres',
    cta: 'Importer des visuels',
    icon: ImageIcon,
  },
  {
    number: '3',
    title: 'Publiez une première annonce',
    description: 'Lancez une annonce phare pour apparaître dans les recherches et commencer à générer des contacts.',
    href: '/annonces/nouvelle',
    cta: 'Créer une annonce',
    icon: Megaphone,
  },
  {
    number: '4',
    title: 'Activez votre catalogue',
    description: 'Centralisez vos produits fixes pour distinguer l’offre durable des annonces ponctuelles.',
    href: '/pro/dashboard/produits',
    cta: 'Gérer les produits',
    icon: Package,
  },
  {
    number: '5',
    title: 'Préparez vos rendez-vous et devis',
    description: 'Configurez la prise de rendez-vous et votre template de devis pour convertir plus facilement.',
    href: '/pro/dashboard/rdv',
    cta: 'Voir les rendez-vous',
    icon: CalendarDays,
  },
  {
    number: '6',
    title: 'Lancez visibilité et statistiques',
    description: 'Boostez vos annonces importantes puis suivez vos vues, contacts et conversions dans le dashboard.',
    href: '/pro/dashboard#stats',
    cta: 'Voir les statistiques',
    icon: TrendingUp,
    highlighted: true,
  },
] as const

const STORAGE_KEY = 'troca-pro-launch-pack-progress'

function readStoredSteps() {
  if (typeof window === 'undefined') return ['1']
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['1']))
      return ['1']
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return ['1']
    const valid = parsed
      .map((value) => String(value))
      .filter((value) => steps.some((step) => step.number === value))
    return valid.length ? valid : ['1']
  } catch {
    return ['1']
  }
}

export default function ProLaunchPack() {
  const [completedSteps, setCompletedSteps] = useState<string[]>(['1'])

  useEffect(() => {
    setCompletedSteps(readStoredSteps())
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
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Pack de lancement</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Préparez votre démarrage Pro en 6 étapes</h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              Ce pack vous aide à configurer votre vitrine, publier vos premières offres, activer vos outils de conversion et suivre vos premiers résultats sans vous disperser.
            </p>
          </div>
          <div className="rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0A7EA4]">Livraison rapide</p>
            <p className="mt-1 text-sm font-semibold text-night">Environ 30 minutes pour poser les bases</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-night">
              Progression: {completedSteps.length}/{totalSteps} étapes complétées
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{completionRate}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#0A7EA4] transition-all duration-300" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 md:grid-cols-2">
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
                    aria-label={`${isCompleted ? 'Décocher' : 'Cocher'} l'étape ${step.number}`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/55">
                        Étape {step.number}
                      </span>
                      {isCompleted ? (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Complété
                        </span>
                      ) : (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
                          À faire
                        </span>
                      )}
                      {step.highlighted ? (
                        <span className="rounded-full bg-[#0A7EA4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Priorité
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-night">{step.title}</h2>
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

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Ce que vous obtenez</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Une vitrine prête à convertir</h2>
              </div>
            </div>

            <ul className="mt-4 space-y-3 text-sm text-night/70">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Un profil Pro clair, rassurant et complet
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Des premières annonces prêtes à recevoir des contacts
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Des rendez-vous et devis configurés pour convertir plus vite
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-nc-emeraude" />
                Un suivi clair des vues, contacts et boosts
              </li>
            </ul>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Raccourcis</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Aller plus vite</h2>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link href="/pro/dashboard/parametres" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                Finaliser la vitrine
              </Link>
              <Link href="/pro/dashboard/produits" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                Ajouter un produit
              </Link>
              <Link href="/pro/dashboard/rdv" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                Gérer les rendez-vous
              </Link>
              <Link href="/pro/dashboard/boosts" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                Voir les boosts
              </Link>
            </div>
          </article>
        </aside>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-night/55">
        <Circle className="h-3.5 w-3.5 text-nc-emeraude" />
        Le pack est enregistré localement sur cet appareil pour garder votre progression.
      </div>
    </section>
  )
}
