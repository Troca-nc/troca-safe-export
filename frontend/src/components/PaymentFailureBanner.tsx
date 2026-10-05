'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock3, CreditCard } from 'lucide-react'

import { subscriptionsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type SubscriptionStatusResponse = {
  data: {
    plan?: 'free' | 'pro' | null
    status?: 'active' | 'expiring_soon' | 'expired' | 'payment_failed' | null
    current_period_end?: string | null
    days_remaining?: number | null
    payment_provider?: 'stripe' | 'payplug' | null
    payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded' | null
  } | null
}

function getStatusCopy(status: SubscriptionStatusResponse['data']) {
  if (!status) return null

  if (status.status === 'payment_failed') {
    return {
      tone: 'danger' as const,
      icon: AlertTriangle,
      title: 'Votre paiement a échoué',
      description: 'Mettez à jour votre moyen de paiement pour conserver vos avantages Pro.',
      cta: {
        href: '/parametres#factures',
        label: 'Mettre à jour mon moyen de paiement',
      },
    }
  }

  if (status.status === 'expired') {
    return {
      tone: 'danger' as const,
      icon: AlertTriangle,
      title: 'Votre abonnement a expiré',
      description: 'Réactivez votre abonnement pour retrouver vos avantages Pro.',
      cta: {
        href: '/abonnement',
        label: 'Réactiver mon abonnement',
      },
    }
  }

  if (status.status === 'expiring_soon' && typeof status.days_remaining === 'number') {
    return {
      tone: 'warning' as const,
      icon: Clock3,
      title: `Votre abonnement expire dans ${status.days_remaining} jour${status.days_remaining > 1 ? 's' : ''}`,
      description: 'Renouvelez maintenant pour garder vos annonces et vos boosts actifs sans interruption.',
      cta: {
        href: '/abonnement',
        label: 'Renouveler maintenant',
      },
    }
  }

  return null
}

export default function PaymentFailureBanner() {
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoProfile = useAuthStore((state) => state.demoProfile)
  const user = useAuthStore((state) => state.user)

  const { data } = useQuery({
    queryKey: ['subscriptions', 'status'],
    queryFn: async () => {
      const response = await subscriptionsApi.getStatus()
      return response.data as SubscriptionStatusResponse
    },
    enabled: Boolean(isAuthenticated && !demoProfile),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 0,
  })

  const status = data?.data ?? null
  const onboardingStep = user?.onboarding_step ?? 0
  const copy = getStatusCopy(status)
  if (pathname === '/profil') return null
  if (!copy) return null
  if (onboardingStep < 3) return null
  if (!status || status.plan !== 'pro') return null
  if (!['expired', 'cancelled', 'payment_failed'].includes(String(status.status ?? ''))) return null

  const Icon = copy.icon
  const toneStyles =
    copy.tone === 'danger'
      ? 'border-[var(--color-error)] bg-[var(--color-error)] text-cream shadow-card'
      : 'border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-ink shadow-card'

  return (
    <div className={`sticky top-0 z-[60] border-b px-4 py-3 ${toneStyles}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-[15px] font-semibold">{copy.title}</p>
            <p className={`text-[15px] ${copy.tone === 'danger' ? 'text-cream/85' : 'text-ink/80'}`}>
              {copy.description}
            </p>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-cream/20 px-2 py-1 text-caption font-semibold uppercase tracking-[0.16em]">
              {copy.tone === 'danger' ? <AlertTriangle className="h-3 w-3" /> : null}
              {status?.plan === 'pro' ? 'Pro' : 'Gratuit'}
              {typeof status?.days_remaining === 'number' && status.days_remaining > 0
                ? ` · ${status.days_remaining} j restants`
                : null}
            </div>
          </div>
        </div>

        <Link
          href={copy.cta.href}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-[15px] font-semibold transition ${
            copy.tone === 'danger'
              ? 'bg-cream text-[var(--color-error)] hover:bg-cream-sunken'
              : 'bg-accent-strong text-cream hover:bg-accent-strongHover'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          {copy.cta.label}
        </Link>
      </div>
    </div>
  )
}
