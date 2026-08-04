'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  FileText,
  MessageCircle,
  Menu,
  Package,
  Megaphone,
  Truck,
  Upload,
  Rocket,
  Settings2,
  Store,
  Users2,
  FileSignature,
  X,
  QrCode,
} from 'lucide-react'

import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { href: '/pro/dashboard', label: "Vue d'ensemble", icon: BarChart3 },
  { href: '/pro/dashboard/catalogue', label: 'Catalogue', icon: Package },
  { href: '/pro/dashboard/import', label: 'Import en masse', icon: Upload },
  { href: '/pro/dashboard/rdv', label: 'Rendez-vous', icon: CalendarDays },
  { href: '/pro/dashboard/annonces', label: 'Mes annonces', icon: Store },
  { href: '/pro/dashboard/boosts', label: 'Boosts', icon: Bell },
  { href: '/pro/dashboard/publicite', label: 'Publicitï¿½', icon: Megaphone },
  { href: '/pro/dashboard/factures', label: 'Factures', icon: FileText },
  { href: '/pro/dashboard/devis', label: 'Devis', icon: FileSignature },
  { href: '/pro/dashboard/coupons', label: 'Coupons', icon: QrCode },
  { href: '/pro/dashboard/parrainage', label: 'Parrainage', icon: Users2 },
  { href: '/pro/dashboard/pack-lancement', label: 'Pack lancement', icon: Rocket },
  { href: '/pro/dashboard/auto-reply', label: 'Rï¿½ponse auto', icon: MessageCircle },
  { href: '/pro/dashboard/transport', label: 'Transport', icon: Building2 },
  { href: '/pro/dashboard/envoi-livraison', label: 'Envoi & Livraison', icon: Truck },
  { href: '/pro/[id]', label: 'Ma vitrine', icon: Building2 },
  { href: '/pro/dashboard/parametres', label: 'ParamÃ¨tres Pro', icon: Settings2 },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === '/pro/[id]') return pathname.startsWith('/pro/') && pathname !== '/pro' && !pathname.startsWith('/pro/dashboard')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function ProDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const canAccessPubliciteOnly = pathname.startsWith('/pro/dashboard/publicite')
  const canAccessVerifiedPublicite = Boolean(user?.is_verified) && canAccessPubliciteOnly

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/connexion')
      return
    }
    if (user && !user.is_pro && !canAccessVerifiedPublicite) {
      router.replace('/pro')
    }
  }, [canAccessVerifiedPublicite, hasHydrated, isAuthenticated, router, user])

  if (!hasHydrated || !isAuthenticated || (user && !user.is_pro && !canAccessVerifiedPublicite)) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-sand/80" />
          <p className="mt-4 text-sm text-night/55">Chargement de votre espace Pro...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-0 px-0 md:px-4 md:py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-20 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
          <div className="mb-4 rounded-2xl bg-nc-lagonLight px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-lagon">Espace Pro</p>
            <p className="mt-1 text-sm font-semibold text-night">{user?.first_name || 'Bonjour'}</p>
          </div>

          <nav className="space-y-1" aria-label="Navigation dashboard Pro">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const href = item.href === '/pro/[id]' ? `/pro/${user?.id ?? ''}` : item.href
              const active = isActivePath(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-nc-lagonLight text-nc-lagon'
                      : 'text-night/70 hover:bg-[var(--color-background-secondary)] hover:text-night'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {active ? <ChevronRight className="h-4 w-4" /> : null}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="md:hidden">
          <div className="mb-4 flex items-center justify-between rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-lagon">Espace Pro</p>
              <p className="text-sm font-semibold text-night">{user?.first_name || 'Votre dashboard'}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileOpen ? (
            <div className="mb-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const href = item.href === '/pro/[id]' ? `/pro/${user?.id ?? ''}` : item.href
                  const active = isActivePath(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-nc-lagonLight text-nc-lagon'
                          : 'text-night/70 hover:bg-[var(--color-background-secondary)] hover:text-night'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {active ? <ChevronRight className="h-4 w-4" /> : null}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ) : null}
        </div>

        <main className="min-w-0 px-4 pb-8 md:px-0">{children}</main>
      </div>
    </div>
  )
}
