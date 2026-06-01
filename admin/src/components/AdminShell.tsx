'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { BarChart3, Bell, FileText, HeartHandshake, Home, LogOut, Menu, MessageSquareMore, ShieldAlert, Users } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/users', label: 'Utilisateurs', icon: Users },
  { href: '/listings', label: 'Annonces', icon: MessageSquareMore },
  { href: '/payments', label: 'Paiements', icon: HeartHandshake },
  { href: '/moderation', label: 'Modération', icon: ShieldAlert },
  { href: '/errors', label: 'Erreurs', icon: Bell },
  { href: '/reports', label: 'Rapport', icon: FileText },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const showChrome = pathname !== '/login' && pathname !== '/setup'

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.replace('/login')
  }

  if (!showChrome) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Troca admin</p>
            <h1 className="mt-1 text-xl font-semibold">admin.troca.nc</h1>
          </div>
          <button className="lg:hidden rounded-xl border border-white/10 p-2 text-slate-200">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                  active ? 'bg-emerald-500 text-slate-950 shadow-glow' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Système OK</p>
          <p className="mt-1 text-emerald-100/80">Backend 99.9% - dernier job récent</p>
        </div>

        <button onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/5">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-6 xl:px-8">{children}</main>
    </div>
  )
}
