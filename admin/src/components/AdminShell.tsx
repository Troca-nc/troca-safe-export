'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { BarChart3, Bell, FileText, Home, LogOut, Menu, MessageSquareMore, ShieldAlert, Users, WalletCards, X } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: Home },
  { href: '/moderation', label: 'Modération', icon: ShieldAlert },
  { href: '/users', label: 'Membres', icon: Users },
  { href: '/listings', label: 'Annonces', icon: MessageSquareMore },
  { href: '/payments', label: 'Paiements', icon: WalletCards },
  { href: '/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/errors', label: 'État et erreurs', icon: Bell },
  { href: '/reports', label: 'Rapports', icon: FileText },
]

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Vue d'ensemble",
  moderation: 'Modération',
  users: 'Membres',
  listings: 'Annonces',
  payments: 'Paiements',
  stats: 'Statistiques',
  errors: 'État et erreurs',
  reports: 'Rapports',
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const showChrome = pathname !== '/login' && pathname !== '/setup'
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootSegment = pathname.split('/').filter(Boolean)[0] || 'dashboard'
  const pageTitle = PAGE_TITLES[rootSegment] || 'Administration'

  const logout = async () => {
    setLogoutError(null)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('La session n’a pas pu être révoquée. Réessayez.')
      router.replace('/login')
      router.refresh()
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Déconnexion impossible.')
    }
  }

  if (!showChrome) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen lg:flex">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-[var(--admin-ink)]/55 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 flex w-[min(19rem,86vw)] -translate-x-full flex-col bg-[var(--admin-ink)] px-5 py-5 text-[var(--admin-ivory)] shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none',
        menuOpen && 'translate-x-0'
      )}>
        <div className="flex items-center justify-between border-b border-white/15 pb-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[var(--admin-ivory)] font-serif text-2xl font-bold text-[var(--admin-ink)]">K</span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--admin-mint)]">Kalico</span>
              <span className="mt-0.5 block text-base font-semibold">Espace d’administration</span>
            </span>
          </Link>
          <button type="button" onClick={() => setMenuOpen(false)} className="rounded-md p-2 text-white/75 hover:bg-white/10 lg:hidden" aria-label="Fermer le menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-1" aria-label="Navigation administration">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'flex min-h-11 items-center gap-3 rounded-md border-l-2 px-4 py-3 text-sm font-semibold transition',
                  active
                    ? 'border-[var(--admin-orange)] bg-white/10 text-white'
                    : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/15 pt-4">
          <p className="mb-3 text-xs text-white/55">Session administrateur sécurisée</p>
          <button onClick={logout} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
          {logoutError ? <p className="mt-2 text-sm text-[var(--admin-ivory)]">{logoutError}</p> : null}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--admin-line)] bg-[var(--admin-cream)]/95 px-4 backdrop-blur md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} className="rounded-md border border-[var(--admin-line)] bg-[var(--admin-paper)] p-2 text-[var(--admin-ink)] lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--admin-lagoon)]">Console sécurisée</p>
              <p className="text-sm font-semibold text-[var(--admin-ink)]">{pageTitle}</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-[var(--admin-mint)]/60 bg-[var(--admin-mint)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--admin-green)] sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-[var(--admin-green-light)]" />
            Accès contrôlé
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8 xl:px-8">{children}</main>
      </div>
    </div>
  )
}
