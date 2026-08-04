'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'
import AlertsManager from '@/components/profil/AlertsManager'
import { useAuthStore } from '@/store/authStore'

export default function AlertesPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore()

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-8">
        {!hasHydrated ? (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="skeleton h-8 w-48 rounded-full" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-20 rounded-2xl" />
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">Mes alertes</p>
            <h1 className="mt-2 text-3xl font-bold text-night font-display">Connectez-vous pour gï¿½rer vos alertes</h1>
            <p className="mt-3 text-sm text-night/55">
              Sauvegardez vos recherches et retrouvez vos alertes sur tous vos appareils.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/connexion?next=/alertes" className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
                Se connecter
              </Link>
              <Link href="/inscription?next=/alertes" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
                Crï¿½er un compte
              </Link>
            </div>
          </div>
        ) : (
          <AlertsManager />
        )}
      </section>
    </main>
  )
}
