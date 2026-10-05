'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import Header from '@/components/layout/Header'
import AccountOverview, { AccountOverviewSkeleton } from '@/components/profil/AccountOverview'
import { ErrorState } from '@/components/ui/Skeleton'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'
import { getAccountOverview } from '@/lib/data/account'
import { inferDemoAccount } from '@/lib/demoApi'
import type { AccountKind, AccountSubscriptionState } from '@/types/account'

const DEMO_SUBSCRIPTIONS: AccountSubscriptionState[] = ['active', 'expiring_soon', 'payment_failed']

function ProfileContent() {
  const searchParams = useSearchParams()
  const { user, isAuthenticated, demoProfile, authReady } = useAuthSessionSync()
  const inferredDemo = inferDemoAccount(user?.email)
  const demoKind = (
    demoProfile === 'particulier' || demoProfile === 'pro' || demoProfile === 'bon_plan'
      ? demoProfile
      : inferredDemo === 'particulier' || inferredDemo === 'pro' || inferredDemo === 'bon_plan'
        ? inferredDemo
        : null
  ) as AccountKind | null
  const requestedSubscription = searchParams.get('demoSubscription') as AccountSubscriptionState | null
  const demoSubscription = requestedSubscription && DEMO_SUBSCRIPTIONS.includes(requestedSubscription)
    ? requestedSubscription
    : 'active'

  useEffect(() => {
    if (!authReady || isAuthenticated || demoKind) return
    window.location.assign('/connexion?next=/profil')
  }, [authReady, demoKind, isAuthenticated])

  const query = useQuery({
    queryKey: ['account', 'overview', user?.id, demoKind, demoSubscription],
    queryFn: () => getAccountOverview({
      session: user!,
      demoKind,
      demoSubscription,
    }),
    enabled: Boolean(authReady && user && (isAuthenticated || demoKind)),
    staleTime: 30_000,
    retry: 1,
  })

  if (!authReady || query.isLoading) return <AccountOverviewSkeleton />

  if (!user || (!isAuthenticated && !demoKind)) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-12">
        <section className="w-full rounded-block border border-warm-border bg-cream-surface p-8 text-center shadow-card">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.18em] text-accent-text">Mon compte</p>
          <h1 className="mt-3 font-display text-3xl font-normal text-ink">Connectez-vous pour accéder à votre espace</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink/65">Retrouvez vos annonces, messages, rendez-vous et informations de sécurité au même endroit.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/connexion?next=/profil" className="inline-flex min-h-11 items-center rounded-control bg-accent-strong px-5 text-[15px] font-semibold text-cream hover:bg-accent-strongHover">Se connecter</Link>
            <Link href="/inscription" className="inline-flex min-h-11 items-center rounded-control border border-warm-border px-5 text-[15px] font-semibold text-ink hover:border-ink/30">Créer un compte</Link>
          </div>
        </section>
      </main>
    )
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
        <ErrorState message="Impossible de charger votre espace pour le moment." onRetry={() => void query.refetch()} />
      </main>
    )
  }

  return <AccountOverview data={query.data} demo={Boolean(demoKind)} demoSubscription={demoSubscription} />
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <Suspense fallback={<AccountOverviewSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  )
}
