'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-night/8 bg-sand/50 px-6 py-5 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">Onboarding</p>
          <h2 className="mt-2 text-2xl font-bold text-night">Bienvenue, {user.first_name ?? user.prenom ?? 'vous'}.</h2>
          <p className="mt-2 text-sm leading-6 text-night/60">
            Trois petites étapes pour démarrer plus vite et profiter du plein potentiel de Troca.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {steps.map((step) => {
              const active = onboardingStep >= step.id
              return (
                <div
                  key={step.id}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                    active ? 'border-coral bg-coral text-white' : 'border-night/10 bg-white text-night/35'
                  }`}
                >
                  {active ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 p-6 sm:p-7 md:grid-cols-3">
          {steps.map((step) => {
            const completed = onboardingStep >= step.id
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 ${completed ? 'border-jungle/20 bg-jungle/5' : 'border-night/8 bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/35">Étape {step.id}</p>
                    <h3 className="mt-1 font-bold text-night">{step.title}</h3>
                  </div>
                  {completed ? <CheckCircle2 className="h-5 w-5 text-jungle" /> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-night/60">{step.description}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={step.href}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-night px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-night/90"
                  >
                    {step.cta}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  {!completed && (
                    <button
                      type="button"
                      onClick={() => void completeStep(step.id)}
                      disabled={savingStep === step.id}
                      className="inline-flex items-center justify-center rounded-xl border border-night/10 bg-white px-3 py-2.5 text-sm font-semibold text-night transition hover:bg-sand disabled:opacity-60"
                    >
                      {savingStep === step.id ? 'Enregistrement…' : 'J’ai terminé'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-night/8 bg-sand/40 px-6 py-4 sm:px-7">
          <p className="text-sm text-night/60">
            Vous pouvez revenir plus tard. Le suivi reprend là où vous l’avez laissé.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-night shadow-sm transition hover:bg-sand"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  )
}
