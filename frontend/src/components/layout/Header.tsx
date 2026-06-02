'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, MessageCircle, Plus, User, Menu, X, ChevronDown, LogOut, Heart, Home, Car, Settings2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'
import NotificationBell from '@/components/ui/NotificationBell'
import DemoModeSwitcher from '@/components/ui/DemoModeSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const items = [
    { href: '/', icon: Home, label: 'Accueil' },
    { href: '/annonces', icon: Search, label: 'Annonces' },
    { href: '/covoiturage', icon: Car, label: 'Covoit' },
    { href: '/annonces/nouvelle', icon: Plus, label: 'Déposer', isCta: true },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: isAuthenticated ? '/profil' : '/connexion', icon: User, label: isAuthenticated ? 'Profil' : 'Connexion' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {items.map(({ href, icon: Icon, label, isCta }) =>
          isCta ? (
            isAuthenticated ? (
              <Link key={href} href={href} className="mt-[-1.25rem] flex flex-col items-center gap-0.5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral shadow-lg shadow-coral/30 ring-4 ring-white">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-coral">{label}</span>
              </Link>
            ) : (
              <button
                key={href}
                type="button"
                onClick={() =>
                  openAuthModal({
                    type: 'publish_listing',
                    redirectTo: '/annonces/nouvelle',
                  })
                }
                className="mt-[-1.25rem] flex flex-col items-center gap-0.5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral shadow-lg shadow-coral/30 ring-4 ring-white">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-coral">{label}</span>
              </button>
            )
          ) : (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors ${
                isActive(href) ? 'bg-sand/70 text-night' : 'text-night/70 hover:bg-sand/60 hover:text-night'
              }`}
            >
              <Icon className="h-5 w-5 text-current" strokeWidth={isActive(href) ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive(href) ? 'font-semibold text-night' : ''}`}>
                {label}
              </span>
            </Link>
          )
        )}
      </div>
    </nav>
  )
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, demoProfile, logout } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const userMenuId = 'header-user-menu'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/annonces?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/annonces', label: 'Annonces' },
    { href: '/troc', label: 'Troc' },
    { href: '/covoiturage', label: 'Covoiturage' },
    { href: '/bons-plans', label: 'Bons plans & Événements' },
  ]

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_24px_rgba(8,32,50,0.12)]">
              <Image src="/brand/troca-logo.png" alt="Troca" fill sizes="40px" className="object-cover" priority />
            </span>
            <span className="hidden sm:block">
              <span className="block font-display text-lg font-bold text-night">Troca</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-coral/80">
                Nouvelle-Calédonie
              </span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="mx-auto hidden w-full max-w-lg md:block">
            <label htmlFor="header-search" className="sr-only">
              Rechercher sur Troca
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              <input
                id="header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher sur Troca…"
                aria-label="Rechercher sur Troca"
                className="input py-1.5 pl-9 pr-4 text-sm"
              />
            </div>
          </form>

          <div className="hidden xl:flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <Link
              href="/annonces/nouvelle"
              className="md:hidden flex shrink-0 items-center gap-1.5 rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-coral/30 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Déposer
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                openAuthModal({
                  type: 'publish_listing',
                  redirectTo: '/annonces/nouvelle',
                })
              }
              className="md:hidden flex shrink-0 items-center gap-1.5 rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-coral/30 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Déposer
            </button>
          )}

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {!demoProfile ? <NotificationBell /> : null}
                <Link href="/messages" className="btn-ghost relative p-2">
                  <MessageCircle className="h-5 w-5" />
                </Link>
                <Link href="/favoris" className="btn-ghost relative p-2" aria-label="Favoris">
                  <Heart className="h-5 w-5" />
                </Link>
                <Link href="/annonces/nouvelle" className="btn-primary px-5 py-2 text-sm shadow-sm">
                  <Plus className="h-4 w-4" />
      Déposer
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls={userMenuId}
                    className="btn-ghost flex items-center gap-2 px-3 py-2"
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral/15">
                        <span className="text-xs font-bold text-coral">
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{user?.first_name}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-night/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen ? (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div
                        id={userMenuId}
                        role="menu"
                        aria-label="Menu utilisateur"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setUserMenuOpen(false)
                        }}
                        className="absolute right-0 top-full z-20 mt-1 w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-modal animate-scale-in"
                      >
                        <Link href="/profil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <User className="h-4 w-4 text-night/50" />
                          Mon profil
                        </Link>
                        <Link href="/profil?tab=listings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Plus className="h-4 w-4 text-night/50" />
                          Mes annonces
                        </Link>
                        <Link href="/parametres" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Settings2 className="h-4 w-4 text-night/50" />
                          Paramètres
                        </Link>
                        <Link href="/favoris" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Heart className="h-4 w-4 text-night/50" />
                          Favoris
                        </Link>
                        <div className="my-1 border-t border-[var(--color-border)]" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-sand"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />
              Déconnexion
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal({
                      type: 'login',
                      redirectTo: '/connexion',
                    })
                  }
                  className="btn-ghost text-sm"
                >
                  Se connecter
                </button>
                <Link href="/inscription" className="btn-secondary py-2 text-sm">
                  S'inscrire
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal({
                      type: 'publish_listing',
                      redirectTo: '/annonces/nouvelle',
                    })
                  }
                  className="btn-primary px-5 py-2 text-sm shadow-sm"
                >
                  <Plus className="h-4 w-4" />
      Déposer
                </button>
              </>
            )}
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              className="btn-ghost shrink-0 p-2"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-secondary-menu"
              aria-haspopup="menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-secondary-menu" role="menu" aria-label="Menu mobile secondaire" className="md:hidden flex flex-col gap-1 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 animate-slide-up">
            {isAuthenticated ? (
              <>
                <Link href="/profil?tab=listings" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Mes annonces
                </Link>
                <Link href="/bons-plans" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Bons plans
                </Link>
                <Link href="/troc" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Troc
                </Link>
                <Link href="/evenements" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
      Événements
                </Link>
                <Link href="/covoiturage" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Covoiturage
                </Link>
                <Link href="/messages" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Messages
                </Link>
                <Link href="/favoris" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Favoris
                </Link>
                <Link href="/parametres" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
      Paramètres
                </Link>
                <Link href="/profil" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Mon profil
                </Link>
                <div className="my-1 border-t border-[var(--color-border)]" />
                <button onClick={handleLogout} className="btn-ghost justify-start text-red-500">
                  <LogOut className="h-4 w-4" />
      Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/troc" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                  Troc
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    openAuthModal({
                      type: 'login',
                      redirectTo: '/connexion',
                    })
                  }}
                  className="btn-secondary justify-center"
                  role="menuitem"
                >
                  Se connecter
                </button>
                <Link href="/inscription" onClick={() => setMenuOpen(false)} className="btn-primary justify-center" role="menuitem">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        ) : null}

        <div className="border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-2">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <DemoModeSwitcher />
              {demoModeEnabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/qa"
                    className="rounded-full border border-coral/15 bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold text-coral transition hover:border-coral/30 hover:bg-coral/5"
                  >
                    Ouvrir le dashboard QA
                  </Link>
                  <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/60">
                    Seed local actif
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <MobileBottomNav />
    </>
  )
}
