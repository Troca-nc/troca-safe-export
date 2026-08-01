'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { Search, MessageCircle, Plus, User, Menu, X, ChevronDown, LogOut, Heart, Home, Settings2, PlusCircle, Tag, Trophy, Car, PhoneCall, ArrowLeftRight, CalendarDays, ClipboardList } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'
import { proApi } from '@/lib/api'
import NotificationBell from '@/components/ui/NotificationBell'
import DemoModeSwitcher from '@/components/ui/DemoModeSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavLinkItem = {
  label: string
  href: string
}

type NavGroupItem = {
  label: string
  children: NavLinkItem[]
}

const GLOBAL_NAV_LINKS: NavLinkItem[] = [
  { href: '/', label: 'Accueil' },
  { href: '/bons-plans', label: 'Bons Plans' },
  { href: '/covoiturage', label: 'Covoiturage' },
  { href: '/pro', label: 'Devenir Pro' },
]

const GLOBAL_NAV_GROUPS: NavGroupItem[] = [
  {
    label: 'Acheter/Vendre',
    children: [
      { href: '/annonces', label: 'Annonces' },
      { href: '/troc', label: 'Troc' },
    ],
  },
  {
    label: 'Services',
    children: [
      { href: '/appels-offres', label: 'Faire un devis' },
      { href: '/pros', label: 'Professionnels' },
      { href: '/envoi-livraison', label: 'Envoi & Livraison' },
    ],
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [moreOpen, setMoreOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef<number | null>(null)

  if (pathname.startsWith('/pro/dashboard')) return null

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const items = [
    { href: '/', icon: Home, label: 'Accueil' },
    { href: '/annonces', icon: Search, label: 'Annonces' },
    { href: '/covoiturage', icon: Car, label: 'Covoit' },
    { href: '/annonces/nouvelle', icon: PlusCircle, label: 'Déposer', isCta: true },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '#more', icon: Menu, label: 'Plus', isDrawer: true },
  ]

  const drawerItems = [
    { href: '/troc', icon: ArrowLeftRight, label: 'Troc' },
    { href: '/pros', icon: Trophy, label: 'Pros' },
    { href: '/appels-offres', icon: ClipboardList, label: "Appels d'offres" },
    { href: '/covoiturage', icon: Car, label: 'Covoit' },
    { href: '/favoris', icon: Heart, label: 'Favoris' },
    { href: '/bons-plans', icon: Tag, label: 'Bons plans' },
    { href: '/contact', icon: PhoneCall, label: 'Contact' },
    { href: isAuthenticated && user?.id ? `/profil/${user.id}` : '/connexion', icon: User, label: isAuthenticated && user?.id ? 'Mon profil' : 'Connexion' },
  ]

  const closeDrawer = () => {
    setMoreOpen(false)
    setDragOffset(0)
    dragStartY.current = null
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    dragStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current == null) return
    const currentY = event.touches[0]?.clientY ?? dragStartY.current
    const offset = Math.max(0, currentY - dragStartY.current)
    setDragOffset(offset)
  }

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      closeDrawer()
      return
    }
    setDragOffset(0)
    dragStartY.current = null
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {items.map(({ href, icon: Icon, label, isCta, isDrawer }) =>
          isCta ? (
            isAuthenticated ? (
              <Link key={href} href={href} className="mt-[-1rem] flex flex-col items-center gap-0.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral shadow-lg shadow-coral/30 ring-4 ring-white">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
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
                className="mt-[-1rem] flex flex-col items-center gap-0.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral shadow-lg shadow-coral/30 ring-4 ring-white">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-coral">{label}</span>
              </button>
            )
          ) : isDrawer ? (
            <button
              key={href}
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                moreOpen ? 'bg-sand/70 text-night' : 'text-night/70 hover:bg-sand/60 hover:text-night'
              }`}
            >
              <Icon className="h-4 w-4 text-current" strokeWidth={moreOpen ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${moreOpen ? 'font-semibold text-night' : ''}`}>{label}</span>
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                isActive(href) ? 'bg-sand/70 text-night' : 'text-night/70 hover:bg-sand/60 hover:text-night'
              }`}
            >
              <Icon className="h-4 w-4 text-current" strokeWidth={isActive(href) ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive(href) ? 'font-semibold text-night' : ''}`}>
                {label}
              </span>
            </Link>
          )
        )}
      </div>

      {moreOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeDrawer} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-t-3xl bg-[var(--color-surface)] p-5 shadow-[0_-18px_60px_rgba(8,32,50,0.18)] overscroll-contain"
            style={{
              transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : 'translateY(0)',
              transition: dragOffset > 0 ? 'none' : 'transform 250ms ease',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-night/10" />
            <p className="mb-3 text-xs uppercase tracking-wide text-night/40">Navigation</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {drawerItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeDrawer}
                  className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] p-3 text-center transition hover:bg-sand/60"
                >
                  <Icon className="h-6 w-6 text-[#0A7EA4]" />
                  <span className="mt-2 text-xs font-medium text-night">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
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
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<string | null>(null)
  const [mobileGroupOpen, setMobileGroupOpen] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [proUnreadCount, setProUnreadCount] = useState(0)
  const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const runtimeEnv = process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV
  const showQaTools = runtimeEnv === 'development'
  const userMenuId = 'header-user-menu'
  const desktopNavRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let alive = true

    const loadUnreadCount = async () => {
      if (!isAuthenticated || !user?.is_pro || demoProfile) {
        if (alive) setProUnreadCount(0)
        return
      }

      try {
        const response = await proApi.getDashboard()
        const unreadMessages = Number(response.data?.data?.unread_messages_total ?? 0)
        if (alive) setProUnreadCount(unreadMessages)
      } catch {
        if (alive) setProUnreadCount(0)
      }
    }

    void loadUnreadCount()

    return () => {
      alive = false
    }
  }, [demoProfile, isAuthenticated, user?.is_pro])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
    setDesktopMenuOpen(null)
    setMobileGroupOpen(null)
  }, [pathname])

  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      const target = event.target as Node | null
      if (!target) return
      if (desktopNavRef.current && desktopNavRef.current.contains(target)) return
      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) return
      setDesktopMenuOpen(null)
      setUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/annonces?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isActiveGroup = (group: NavGroupItem) => group.children.some((item) => isActiveLink(item.href))

  const renderNavGroup = (group: NavGroupItem, mobile = false) => {
    const open = mobile ? mobileGroupOpen === group.label : desktopMenuOpen === group.label
    const active = isActiveGroup(group)

    if (mobile) {
      return (
        <div key={group.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]">
          <button
            type="button"
            onClick={() => setMobileGroupOpen((current) => (current === group.label ? null : group.label))}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              active ? 'text-nc-lagon' : 'text-night'
            }`}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span>{group.label}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open ? (
            <div className="px-2 pb-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 fade-in">
                {group.children.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm transition ${
                      isActiveLink(item.href)
                        ? 'bg-nc-lagonLight text-nc-lagon'
                        : 'text-night/75 hover:bg-[var(--color-background-secondary)] hover:text-night'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div key={group.label} className="relative">
        <button
          type="button"
          onClick={() => setDesktopMenuOpen((current) => (current === group.label ? null : group.label))}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            open || active
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
          }`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {group.label}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open ? (
          <div className="absolute left-0 top-full z-30 mt-3 min-w-[18rem] rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-2 shadow-modal fade-in">
            {group.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDesktopMenuOpen(null)}
                    className={`block whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActiveLink(item.href)
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                        : 'text-night/75 hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
                    }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <header data-kalico-header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div ref={desktopNavRef} className="mx-auto flex h-16 max-w-[120rem] items-center gap-3 px-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/brand/kalico1.svg"
              alt="Kalico"
              width={160}
              height={40}
              priority
              className="block h-10 w-auto shrink-0"
              style={{ width: 'auto', height: '40px' }}
            />
            <span className="block font-display text-lg font-bold leading-none text-night md:text-xl">Kalico</span>
          </Link>

          <form onSubmit={handleSearch} className="mx-auto hidden w-full max-w-lg md:block">
            <label htmlFor="header-search" className="sr-only">
              Rechercher sur Kalico
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              <input
                id="header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher sur Kalico…"
                aria-label="Rechercher sur Kalico"
                className="input py-1.5 pl-9 pr-4 text-sm"
              />
            </div>
          </form>

          <div className="hidden xl:flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-0.5">
            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {GLOBAL_NAV_GROUPS.filter((group) => group.label === 'Acheter/Vendre').map((group) => renderNavGroup(group))}

            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/bons-plans').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {GLOBAL_NAV_GROUPS.filter((group) => group.label === 'Services').map((group) => renderNavGroup(group))}

            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/covoiturage').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/pro').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-[var(--color-border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
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
                <Link href="/profil?tab=listings" className="btn-ghost px-3 py-2 text-sm">
                  Mes annonces
                </Link>
                <Link href="/messages" className="btn-ghost relative p-2" aria-label="Messages">
                  <MessageCircle className="h-5 w-5" />
                  {proUnreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                      {proUnreadCount > 99 ? '99+' : proUnreadCount}
                    </span>
                  ) : null}
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
                        <Link href="/covoiturage/reservations" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Car className="h-4 w-4 text-night/50" />
                          Mes réservations
                        </Link>
                        <Link href="/mes-rdv" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <CalendarDays className="h-4 w-4 text-night/50" />
                          Mes rendez-vous
                        </Link>
                        <Link href="/covoiturage/mes-courses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Car className="h-4 w-4 text-night/50" />
                          Mes courses
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
          <div
            ref={mobileMenuRef}
            id="mobile-secondary-menu"
            role="menu"
            aria-label="Menu mobile secondaire"
            className="md:hidden flex max-h-[calc(100dvh-4rem)] flex-col gap-3 overflow-y-auto overscroll-contain border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-4 fade-in"
          >
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActiveLink('/')
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-raised)] text-night/75'
              }`}
              role="menuitem"
            >
              Accueil
            </Link>

            {GLOBAL_NAV_GROUPS.map((group) => renderNavGroup(group, true))}

            <Link
              href="/pro"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl border border-[var(--color-border-strong)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
              role="menuitem"
            >
              Devenir Pro
            </Link>

            <div className="mt-1 grid gap-2 border-t border-[var(--color-border)] pt-3">
              {isAuthenticated ? (
                <>
                  <Link href="/profil?tab=listings" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                    Mes annonces
                  </Link>
                  <Link href="/messages" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                    Messages
                  </Link>
                  <Link href="/parametres" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                    Paramètres
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost justify-start text-red-500">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
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
          </div>
        ) : null}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-2">
        <div className="mx-auto max-w-[120rem] px-6 lg:px-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <DemoModeSwitcher />
              {demoModeEnabled && showQaTools ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/qa"
                    className="rounded-full border border-coral/15 bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold text-coral transition hover:border-coral/30 hover:bg-coral/5"
                  >
                    Ouvrir le dashboard QA
                  </Link>
                  <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/60">
                    SEED LOCAL ACTIF
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

    </>
  )
}
