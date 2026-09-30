'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Check,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  User,
  X,
} from 'lucide-react'

import HeaderNotifications from '@/components/layout/HeaderNotifications'
import { getLayoutHeaderData, normalizeLayoutAccount } from '@/lib/data/layout'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { LayoutHeaderData } from '@/types/layout'

const NAV_LINKS = [
  { href: '/annonces', label: 'Annonces' },
  { href: '/bons-plans', label: 'Bons plans' },
  { href: '/pros', label: 'Pros' },
  { href: '/covoiturage', label: 'Covoiturage' },
  { href: '/troc', label: 'Troc' },
] as const

const PRO_NAV_LINKS = [
  { href: '/pro/dashboard/annonces', label: 'Annonces' },
  { href: '/pro/dashboard/devis', label: 'Services' },
  { href: '/pro/dashboard', label: 'Tableau de bord' },
] as const

const EMPTY_DATA: LayoutHeaderData = {
  unreadMessages: 0,
  unreadNotifications: 0,
  companyName: null,
}

export type HeaderProps = {
  variant?: 'standard' | 'reduced' | 'pro'
  title?: string
  draftStorageKey?: string
  exitHref?: string
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong">
      <Image
        src="/brand/kalico1.svg"
        alt="Kalico"
        width={160}
        height={46}
        priority
        className={compact ? 'h-10 w-auto' : 'h-[46px] w-auto'}
      />
      <span className={`font-display font-normal leading-none text-ink ${compact ? 'text-[26px]' : 'text-[28px]'}`}>Kalico</span>
    </Link>
  )
}

export default function Header({
  variant = 'standard',
  title = 'Déposer une annonce',
  draftStorageKey,
  exitHref = '/profil',
}: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, hasHydrated, demoProfile, logout } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const account = useMemo(() => normalizeLayoutAccount(user), [user])
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [headerData, setHeaderData] = useState<LayoutHeaderData>(EMPTY_DATA)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const loadHeaderData = useCallback(async () => {
    if (!account || variant === 'reduced') {
      setHeaderData(EMPTY_DATA)
      setDataError(null)
      return
    }

    setDataLoading(true)
    setDataError(null)
    try {
      setHeaderData(await getLayoutHeaderData({ account, demoProfile }))
    } catch {
      setHeaderData(EMPTY_DATA)
      setDataError('Les compteurs sont temporairement indisponibles.')
    } finally {
      setDataLoading(false)
    }
  }, [account, demoProfile, variant])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    void loadHeaderData()
  }, [hasHydrated, isAuthenticated, loadHeaderData])

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (variant !== 'reduced' || !draftStorageKey) return

    const readDraft = () => {
      try {
        const raw = window.localStorage.getItem(draftStorageKey)
        const parsed = raw ? JSON.parse(raw) as { savedAt?: unknown } : null
        setDraftSaved(typeof parsed?.savedAt === 'string' && Boolean(parsed.savedAt))
      } catch {
        setDraftSaved(false)
      }
    }

    readDraft()
    const interval = window.setInterval(readDraft, 2_000)
    return () => window.clearInterval(interval)
  }, [draftStorageKey, variant])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) router.push(`/annonces?q=${encodeURIComponent(query)}`)
  }

  const handleLogout = async () => {
    await logout()
    setAccountOpen(false)
    router.push('/')
  }

  const publish = () => {
    if (isAuthenticated) {
      router.push('/annonces/nouvelle')
      return
    }
    openAuthModal({ type: 'publish_listing', redirectTo: '/annonces/nouvelle' })
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  if (variant === 'reduced') {
    return (
      <header data-kalico-header className="sticky top-0 z-40 border-b border-warm-border bg-cream">
        <div className="mx-auto flex h-[72px] max-w-container items-center gap-3 px-4 sm:px-6 lg:px-12">
          <Logo compact />
          <span className="hidden h-6 w-px bg-warm-border sm:block" aria-hidden="true" />
          <span className="hidden text-label text-ink sm:block">{title}</span>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {draftSaved ? (
              <span className="hidden items-center gap-2 text-meta text-ink/70 sm:inline-flex" role="status">
                <Check className="h-4 w-4 text-reef-text" aria-hidden="true" />
                Brouillon enregistré
              </span>
            ) : null}
            <Link href={exitHref} className="inline-flex min-h-11 items-center rounded-control border border-warm-border px-4 text-label text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong">
              Quitter
            </Link>
          </div>
        </div>
      </header>
    )
  }

  const navigation = variant === 'pro' ? PRO_NAV_LINKS : NAV_LINKS
  const companyName = headerData.companyName || account?.firstName || 'Espace professionnel'

  return (
    <header data-kalico-header className="sticky top-0 z-40 border-b border-warm-border bg-cream">
      <div className="mx-auto flex h-[88px] max-w-container items-center gap-4 px-4 sm:px-6 lg:px-12">
        <Logo />
        {variant === 'pro' ? (
          <span className="hidden rounded-pill bg-ink-deep px-3 py-1.5 text-caption text-cream-surface sm:inline-flex">Espace Pro</span>
        ) : (
          <form onSubmit={handleSearch} className="hidden w-full max-w-[440px] lg:block">
            <label htmlFor="header-search" className="sr-only">Rechercher une annonce</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" aria-hidden="true" />
              <input
                id="header-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher une annonce"
                className="h-[46px] w-full rounded-control border border-warm-border bg-cream-surface pl-10 pr-4 text-[15px] text-ink outline-none placeholder:text-ink/45 focus:border-ink focus:ring-2 focus:ring-accent-strong/25"
              />
            </div>
          </form>
        )}

        <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label={variant === 'pro' ? 'Navigation professionnelle' : 'Navigation principale'}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-11 rounded-control px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${isActive(item.href) ? 'bg-cream-sunken font-semibold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {variant === 'pro' && account?.id ? (
            <Link href={`/pro/${account.id}`} className="min-h-11 rounded-control px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong">
              Voir ma vitrine
            </Link>
          ) : null}
        </nav>

        <div className="hidden shrink-0 items-center gap-1 border-l border-warm-border pl-3 md:flex">
          {!hasHydrated ? (
            <div className="flex items-center gap-2" role="status" aria-label="Chargement du compte">
              <span className="h-11 w-11 animate-pulse rounded-control bg-cream-sunken motion-reduce:animate-none" />
              <span className="h-11 w-28 animate-pulse rounded-control bg-cream-sunken motion-reduce:animate-none" />
            </div>
          ) : isAuthenticated && account ? (
            <>
              {variant !== 'pro' ? (
                <Link href="/favoris" className="inline-flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong" aria-label="Mes favoris">
                  <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
                </Link>
              ) : null}
              {dataLoading ? (
                <span className="h-11 w-11 animate-pulse rounded-control bg-cream-sunken motion-reduce:animate-none" aria-label="Chargement des messages" />
              ) : (
                <Link href="/messages" className="relative inline-flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong" aria-label={`Messages${headerData.unreadMessages ? ` (${headerData.unreadMessages} non lus)` : ''}`}>
                  <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                  {headerData.unreadMessages > 0 ? (
                    <span className="absolute right-0.5 top-0.5 inline-flex min-w-[17px] items-center justify-center rounded-pill bg-accent-strong px-1 text-caption font-semibold leading-[17px] text-cream-surface">
                      {headerData.unreadMessages > 99 ? '99+' : headerData.unreadMessages}
                    </span>
                  ) : null}
                </Link>
              )}
              {variant !== 'pro' ? (
                dataLoading ? <span className="h-11 w-11 animate-pulse rounded-control bg-cream-sunken motion-reduce:animate-none" aria-label="Chargement des notifications" /> : (
                  <HeaderNotifications
                    initialUnread={headerData.unreadNotifications}
                    onUnreadChange={(unreadNotifications) => setHeaderData((current) => ({ ...current, unreadNotifications }))}
                  />
                )
              ) : null}

              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((current) => !current)}
                  className="flex min-h-11 items-center gap-2 rounded-control border border-warm-border bg-cream-surface px-1.5 pr-3 text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  {account.avatarUrl ? (
                    <Image src={account.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-pill object-cover" />
                  ) : (
                    <span className={`inline-flex h-8 w-8 items-center justify-center text-caption font-semibold ${variant === 'pro' ? 'rounded-control bg-accent-soft text-accent-text' : 'rounded-pill bg-info/15 text-info-text'}`}>
                      {variant === 'pro' ? companyName[0]?.toLocaleUpperCase('fr-FR') : account.initials}
                    </span>
                  )}
                  {variant === 'pro' && dataLoading ? (
                    <span className="h-5 w-28 animate-pulse rounded-control bg-cream-sunken motion-reduce:animate-none" aria-label="Chargement du nom de l'entreprise" />
                  ) : (
                    <span className="max-w-36 truncate text-[15px] font-semibold">{variant === 'pro' ? companyName : account.firstName}</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-ink/55 transition-transform ${accountOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {accountOpen ? (
                  <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-card border border-warm-border bg-cream-surface p-1.5 shadow-modal" onKeyDown={(event) => {
                    if (event.key === 'Escape') setAccountOpen(false)
                  }}>
                    <Link href="/profil" role="menuitem" className="flex min-h-11 items-center gap-3 rounded-control px-3 text-body-sm text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong"><User className="h-4 w-4" />Mon compte</Link>
                    <Link href="/parametres" role="menuitem" className="flex min-h-11 items-center gap-3 rounded-control px-3 text-body-sm text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong"><Settings2 className="h-4 w-4" />Paramètres</Link>
                    <button type="button" role="menuitem" onClick={() => void handleLogout()} className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-body-sm text-[var(--color-error)] hover:bg-[var(--color-error-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong"><LogOut className="h-4 w-4" />Déconnexion</button>
                  </div>
                ) : null}
              </div>

              {variant !== 'pro' ? (
                <button type="button" onClick={publish} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent-strong px-5 text-[15px] font-semibold text-cream-surface shadow-accent transition-colors hover:bg-accent-strongHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                  <Plus className="h-4 w-4" aria-hidden="true" />Déposer
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button type="button" onClick={() => openAuthModal({ type: 'login', redirectTo: '/connexion' })} className="min-h-11 rounded-control px-3 text-[15px] font-semibold text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong">Se connecter</button>
              <button type="button" onClick={publish} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent-strong px-5 text-[15px] font-semibold text-cream-surface shadow-accent transition-colors hover:bg-accent-strongHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"><Plus className="h-4 w-4" />Déposer</button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 md:hidden">
          <button type="button" onClick={publish} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent-strong px-3 text-label text-cream-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"><Plus className="h-4 w-4" />Déposer</button>
          <button type="button" onClick={() => setMobileOpen((current) => !current)} className="inline-flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong" aria-label="Menu" aria-expanded={mobileOpen} aria-controls="header-mobile-menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {variant === 'standard' ? (
        <form onSubmit={handleSearch} className="border-t border-warm-border px-4 py-2 lg:hidden">
          <label htmlFor="header-search-mobile" className="sr-only">Rechercher une annonce</label>
          <div className="relative mx-auto max-w-container">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" aria-hidden="true" />
            <input id="header-search-mobile" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher une annonce" className="h-11 w-full rounded-control border border-warm-border bg-cream-surface pl-10 pr-4 text-[16px] text-ink outline-none placeholder:text-ink/45 focus:border-ink focus:ring-2 focus:ring-accent-strong/25" />
          </div>
        </form>
      ) : null}

      {dataError ? (
        <div className="border-t border-[var(--color-error)] bg-[var(--color-error-soft)] px-4 py-2 text-center text-meta text-[var(--color-error)]" role="alert">
          {dataError}{' '}
          <button type="button" onClick={() => void loadHeaderData()} className="min-h-11 rounded-control px-2 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong">Réessayer</button>
        </div>
      ) : null}

      {mobileOpen ? (
        <div id="header-mobile-menu" className="border-t border-warm-border bg-cream px-4 py-4 md:hidden">
          <nav className="mx-auto grid max-w-container gap-1" aria-label="Navigation mobile">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-control px-3 text-[15px] font-medium text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong">{item.label}</Link>)}
            {isAuthenticated ? (
              <>
                <Link href="/favoris" className="flex min-h-11 items-center gap-3 rounded-control px-3 text-[15px] font-medium text-ink hover:bg-cream-sunken"><Heart className="h-4 w-4" />Favoris</Link>
                <Link href="/messages" className="flex min-h-11 items-center gap-3 rounded-control px-3 text-[15px] font-medium text-ink hover:bg-cream-sunken"><MessageCircle className="h-4 w-4" />Messages{headerData.unreadMessages > 0 ? ` (${headerData.unreadMessages})` : ''}</Link>
                <Link href="/profil" className="flex min-h-11 items-center gap-3 rounded-control px-3 text-[15px] font-medium text-ink hover:bg-cream-sunken"><User className="h-4 w-4" />Mon compte</Link>
              </>
            ) : (
              <button type="button" onClick={() => openAuthModal({ type: 'login', redirectTo: '/connexion' })} className="min-h-11 rounded-control px-3 text-left text-[15px] font-semibold text-ink hover:bg-cream-sunken">Se connecter</button>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
