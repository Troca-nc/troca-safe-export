'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'

import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const DISMISS_KEY_PREFIX = 'kalico_onboarding_dismissed:'

function getDismissKey(userId?: string | number | null) {
  return `${DISMISS_KEY_PREFIX}${String(userId ?? 'guest')}`
}

type OnboardingStep = {
  id: number
  title: string
  description: string
  href: string
  cta: string
}

export default function OnboardingWizard() {
  const router = useRouter()
  const { user, refreshMe } = useAuthStore()
  const onboardingStep = user?.onboarding_step ?? 0
  const [open, setOpen] = useState(false)
  const [savingStep, setSavingStep] = useState<number | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const initializedUserIdRef = useRef<string | number | null>(null)

  const dismissKey = useMemo(() => getDismissKey(user?.id), [user?.id])

  const steps: OnboardingStep[] = [
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
      description: "Recevez un email dès qu'une annonce correspond à vos recherches.",
      href: '/annonces',
      cta: 'Créer une alerte',
    },
  ]

  const activeStep = steps[currentStepIndex] ?? steps[0]

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return
    if (initializedUserIdRef.current === user.id) return
    initializedUserIdRef.current = user.id

    if (onboardingStep >= 3) {
      setOpen(false)
      return
    }

    const dismissed = window.sessionStorage.getItem(dismissKey) === '1'
    setCurrentStepIndex(Math.min(Math.max(onboardingStep, 0), 2))
    setOpen(onboardingStep === 0 && !dismissed)
  }, [dismissKey, onboardingStep, user?.id])

  const persistStep = async (step: number) => {
    if (!user) return

    setSavingStep(step)
    try {
      await api.patch('/users/me/onboarding', { step })
      await refreshMe()

      if (step >= 3 && typeof window !== 'undefined') {
        window.sessionStorage.setItem(dismissKey, '1')
        setOpen(false)
        return
      }

      setCurrentStepIndex((value) => Math.min(value + 1, 2))
    } finally {
      setSavingStep(null)
    }
  }

  const handlePrimaryAction = async () => {
    if (!activeStep) return
    await persistStep(activeStep.id)
    router.push(activeStep.href)
  }

  const handleCompleteAction = async () => {
    if (!activeStep) return
    await persistStep(activeStep.id)
    if (activeStep.id >= 3) {
      setOpen(false)
    }
  }

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(dismissKey, '1')
    }
    setOpen(false)
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--color-text-primary)]/55 px-4 py-6 backdrop-blur-sm">
      <div className="onboarding-wizard-card relative w-full max-w-[480px] overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white shadow-[0_24px_80px_rgba(8,32,50,0.2)] dark:border-white/10 dark:bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]/50 transition hover:text-[var(--color-text-primary)] dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div key={activeStep.id} className="onboarding-wizard-step flex min-h-[520px] flex-col px-8 py-8 text-center sm:px-8 sm:py-8">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-[48px] font-semibold leading-none text-[var(--coral)]">0{activeStep.id}</div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-primary)]/35 dark:text-white/35">
              Étape {activeStep.id}/3
            </p>

            <h2
              className="mt-3 font-display text-[clamp(22px,2.8vw,30px)] font-bold leading-tight text-[var(--color-text-primary)] dark:text-white"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              {activeStep.title}
            </h2>

            <p className="mt-3 max-w-[360px] text-sm leading-6 text-[var(--color-text-primary)]/65 dark:text-white/70">
              {activeStep.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void handlePrimaryAction()}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"
              >
                {activeStep.cta}
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => void handleCompleteAction()}
                disabled={savingStep === activeStep.id}
                className="btn-secondary inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm disabled:opacity-60"
              >
                {savingStep === activeStep.id ? 'Enregistrement...' : "J'ai terminé"}
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <span
                key={step.id}
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === currentStepIndex
                    ? 'bg-[var(--coral)]'
                    : index < currentStepIndex
                      ? 'bg-[var(--color-success)]'
                      : 'bg-[var(--color-text-primary)]/20 dark:bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .onboarding-wizard-card,
        .onboarding-wizard-step {
          animation: onboardingWizardStep 300ms ease-out both;
        }

        @keyframes onboardingWizardStep {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .onboarding-wizard-card,
          .onboarding-wizard-step,
          .onboarding-wizard-card * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
