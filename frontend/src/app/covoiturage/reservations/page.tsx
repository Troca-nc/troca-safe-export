import { Suspense } from 'react'

import Header from '@/components/layout/Header'

import ReservationsClient from './ReservationsClient'

export default function CovoiturageReservationsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">
      <Header />
      <Suspense
        fallback={(
          <section className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="h-32 animate-pulse rounded-[1.5rem] bg-sand/70" />
            </div>
          </section>
        )}
      >
        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
          <ReservationsClient />
        </section>
      </Suspense>
    </main>
  )
}
