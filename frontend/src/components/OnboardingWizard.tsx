'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const DISMISS_KEY_PREFIX = 'troca_onboarding_dismissed:'

function getDismissKey(userId?: string | number | null) {
  return `${DISMISS_KEY_PREFIX}${String(userId ?? 'guest')}`
}

export default function OnboardingWizard() {
  const { user, refreshMe } = useAuthStore()
  const onboardingStep = user?.onboarding_step ?? 0
  const [open, setOpen] = useState(false)
  const [savingStep, setSavingStep] = useState<number | null>(null)

  const dismissKey = useMemo(() => getDismissKey(user?.id), [user?.id])
  const currentStep = Math.min(Math.max(onboardingStep + 1, 1), 3)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user || onboardingStep >= 3) {
      setOpen(false)
      return
    }

    const dismissed = window.sessionStorage.getItem(dismissKey) === '1'
    setOpen(onboardingStep === 0 && !dismissed)
  }, [dismissKey, onboardingStep, user])

  const completeStep = async (step: number) => {
    if (!user) return
    setSavingStep(step)
    try {
      await api.patch('/users/me/onboarding', { step })
      await refreshMe()
      if (step >= 3 && typeof window !== 'undefined') {
        window.sessionStorage.setItem(dismissKey, '1')
        setOpen(false)
      }
    } finally {
      setSavingStep(null)
    }
  }

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(dismissKey, '1')
    }
    setOpen(false)
  }

  if (!open || !user) return null

  const steps = [
    {
      id: 1,
      title: 'Ajouter une photo de profil',
      description: 'Rendez votre compte plus rassurant pour les autres membres.',
      href: '/parametres',
      cta: 'Ouvrir mon profil',
    },
    {
      id: 2,
      title: 'Créer votre première annonce',
      description: 'Publiez vite un article, un service ou un bon plan.',
      href: '/annonces/nouvelle',
      cta: 'Créer une annonce',
    },
    {
      id: 3,
      title: 'Activer les alertes',
      description: 'Recevez un email dès qu’une annonce correspond à vos recherches.',
      href: '/annonces',
      cta: 'Créer une alerte',
    },
  ]

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.2)] dark:border-white/10 dark:bg-night">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-night/8 bg-sand/50 px-6 py-5 sm:px-7 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">Onboarding</p>
          <h2 className="mt-2 text-2xl font-bold text-night dark:text-white">
            Bienvenue, {user.first_name ?? user.prenom ?? 'vous'}.
          </h2>
          <p className="mt-2 text-sm leading-6 text-night/60 dark:text-white/65">
            Trois petites étapes pour démarrer plus vite et profiter du plein potentiel de Troca.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            {steps.map((step) => {
              const status = step.id < currentStep ? 'completed' : step.id === currentStep ? 'active' : 'future'
              return (
                <div
                  key={step.id}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition ${
                    status === 'completed'
                      ? 'border-jungle bg-jungle text-white'
                      : status === 'active'
                        ? 'border-coral bg-coral text-white'
                        : 'border-night/10 bg-white text-night/35 dark:border-white/10 dark:bg-white/5 dark:text-white/35'
                  }`}
                >
                  {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 p-6 sm:p-7">
          {steps.map((step) => {
            const completed = currentStep > step.id
            const active = currentStep === step.id
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 transition ${
                  completed
                    ? 'border-jungle/20 bg-jungle/5 dark:border-jungle/30 dark:bg-jungle/10'
                    : active
                      ? 'border-coral/20 bg-coral/5 dark:border-coral/30 dark:bg-coral/10'
                      : 'border-night/8 bg-white dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold ${
                        completed
                          ? 'border-jungle bg-jungle text-white'
                          : active
                            ? 'border-coral bg-coral text-white'
                            : 'border-night/10 bg-white text-night/45 dark:border-white/10 dark:bg-white/5 dark:text-white/45'
                      }`}
                    >
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/35 dark:text-white/35">
                        Étape {step.id}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-night dark:text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-night/60 dark:text-white/65">{step.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:shrink-0">
                    <Link
                      href={step.href}
                      className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                    >
                      {step.cta}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    {!completed ? (
                      <button
                        type="button"
                        onClick={() => void completeStep(step.id)}
                        disabled={savingStep === step.id}
                        className="btn-secondary inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm disabled:opacity-60"
                      >
                        {savingStep === step.id ? 'Enregistrement…' : 'J’ai terminé'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-night/8 bg-sand/40 px-6 py-4 sm:px-7 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-night/60 dark:text-white/65">
            Vous pouvez revenir plus tard. Le suivi reprend là où vous l’avez laissé.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="btn-ghost rounded-xl px-4 py-2.5 text-sm"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  )
}
