'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CreditCard } from 'lucide-react'

import { subscriptionsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type SubscriptionStatusResponse = {
  data: {
    payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded' | null
    plan_id?: string | null
    billing_period?: string | null
    provider?: string | null
  } | null
}

export default function PaymentFailureBanner() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoProfile = useAuthStore((state) => state.demoProfile)

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

  const status = data?.data?.payment_status ?? null
  if (status !== 'failed') return null

  // TODO: test E2E sur le bandeau d'échec de paiement et la disparition après résolution.
  return (
    <div className="sticky top-0 z-[60] border-b border-red-200 bg-red-600 px-4 py-3 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Votre paiement a échoué</p>
            <p className="text-sm text-white/85">
              Mettez à jour votre moyen de paiement pour conserver vos avantages Pro.
            </p>
          </div>
        </div>

        <Link
          href="/parametres#factures"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          <CreditCard className="h-4 w-4" />
          Mettre à jour le paiement
        </Link>
      </div>
    </div>
  )
}
