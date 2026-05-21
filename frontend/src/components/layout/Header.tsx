'use client'
// src/components/layout/Header.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, MessageCircle, Plus, User, Menu, X, ChevronDown, LogOut, Heart, Home, Car } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import NotificationBell from '@/components/ui/NotificationBell'
import DemoModeSwitcher from '@/components/ui/DemoModeSwitcher'
import { ThemeToggle }    from '@/components/ui/ThemeProvider'

// ── Barre de navigation fixe en bas (mobile uniquement) ───────────────────────
// À inclure dans le layout racine : <MobileBottomNav />

export function MobileBottomNav() {
  const pathname       = usePathname()
  const { isAuthenticated } = useAuthStore()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const navItems = [
    { href: '/',          icon: Home,          label: 'Accueil'   },
    { href: '/annonces',  icon: Search,         label: 'Annonces'  },
    { href: '/covoiturage', icon: Car,         label: 'Covoit'    },
    // Bouton central "Déposer" — toujours visible, style pill
    { href: '/annonces/nouvelle', icon: Plus,   label: 'Déposer', isCta: true },
    { href: '/messages',  icon: MessageCircle,  label: 'Messages'  },
    { href: isAuthenticated ? '/profil' : '/connexion', icon: User, label: isAuthenticated ? 'Profil' : 'Connexion' },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-night/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Navigation principale"
    >
      {/* Safe area iOS */}
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {navItems.map(({ href, icon: Icon, label, isCta }) =>
          isCta ? (
            // Bouton Déposer — pill coral surélevé
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 -mt-5"
            >
              <span className="w-14 h-14 rounded-full bg-coral flex items-center justify-center shadow-lg shadow-coral/40 ring-4 ring-white">
                <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[10px] font-semibold text-coral mt-0.5">{label}</span>
            </Link>
          ) : (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive(href) ? 'text-coral' : 'text-night/70'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive(href) ? 'text-coral' : 'text-night/70'}`}
                strokeWidth={isActive(href) ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive(href) ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </Link>
          )
        )}
      </div>
    </nav>
  )
}

// ── Header principal ──────────────────────────────────────────────────────────

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const userMenuId = 'header-user-menu'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/annonces?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
    setUserMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-night/8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="relative h-10 w-10 overflow-hidden rounded-full border border-night/10 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.12)]">
              <Image
                src="/brand/troca-logo.png"
                alt="Troca"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </span>
            <span className="hidden sm:block">
              <span className="block font-display text-xl font-bold text-night">Troca</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-coral/80">
                Nouvelle-Calédonie
              </span>
            </span>
          </Link>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
            <label htmlFor="header-search" className="sr-only">
              Rechercher sur Troca
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-night/35 w-4 h-4" />
              <input
                id="header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher sur Troca…"
                aria-label="Rechercher sur Troca"
                className="input pl-9 pr-4 py-2 text-sm"
              />
            </div>
          </form>

          <div className="hidden xl:flex items-center gap-1 rounded-full border border-night/8 bg-sand/60 p-1">
            <Link href="/bons-plans" className="rounded-full px-3 py-2 text-sm font-semibold text-night/75 transition hover:bg-white hover:text-coral">
              Bons plans
            </Link>
            <Link href="/evenements" className="rounded-full px-3 py-2 text-sm font-semibold text-night/75 transition hover:bg-white hover:text-coral">
              Evenements
            </Link>
            <Link href="/covoiturage" className="rounded-full px-3 py-2 text-sm font-semibold text-night/75 transition hover:bg-white hover:text-coral">
              Covoiturage
            </Link>
          </div>

          {/* ── Bouton Déposer TOUJOURS VISIBLE sur mobile ── */}
          <Link
            href="/annonces/nouvelle"
            className="md:hidden flex items-center gap-1.5 bg-coral text-white text-sm font-semibold px-3 py-2 rounded-xl shadow-sm shadow-coral/30 active:scale-95 transition-transform shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Déposer
          </Link>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Thème */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationBell />

                {/* Messages */}
                <Link href="/messages" className="btn-ghost relative p-2">
                  <MessageCircle className="w-5 h-5" />
                </Link>

                {/* Déposer */}
                <Link href="/annonces/nouvelle" className="btn-primary py-2 px-4 text-sm">
                  <Plus className="w-4 h-4" />
                  Déposer
                </Link>

                {/* Menu utilisateur */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls={userMenuId}
                    className="flex items-center gap-2 btn-ghost px-3 py-2"
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-coral/15 flex items-center justify-center">
                        <span className="text-coral text-xs font-bold">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{user?.first_name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-night/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      {/* Overlay invisible pour fermer */}
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div
                        id={userMenuId}
                        role="menu"
                        aria-label="Menu utilisateur"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setUserMenuOpen(false)
                        }}
                        className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-modal border border-night/8 py-1 animate-scale-in z-20"
                      >
                        <Link href="/profil"       onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand text-sm" role="menuitem"><User className="w-4 h-4 text-night/50" /> Mon profil</Link>
                        <Link href="/mes-annonces" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand text-sm" role="menuitem"><Plus className="w-4 h-4 text-night/50" /> Mes annonces</Link>
                        <Link href="/favoris"      onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand text-sm" role="menuitem"><Heart className="w-4 h-4 text-night/50" /> Favoris</Link>
                        <div className="border-t border-night/8 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand text-sm w-full text-left text-red-500"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/connexion"  className="btn-ghost text-sm">Se connecter</Link>
                <Link href="/inscription" className="btn-secondary text-sm py-2">S'inscrire</Link>
                <Link href="/annonces/nouvelle" className="btn-primary text-sm py-2">
                  <Plus className="w-4 h-4" /> Déposer
                </Link>
              </>
            )}
          </div>

          {/* Burger — uniquement pour le menu secondaire, plus pour Déposer */}
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-secondary-menu"
            aria-haspopup="menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu mobile déroulant (liens secondaires) */}
        {menuOpen && (
          <div id="mobile-secondary-menu" role="menu" aria-label="Menu mobile secondaire" className="md:hidden bg-white border-t border-night/8 px-4 py-3 flex flex-col gap-1 animate-slide-up">
            {isAuthenticated ? (
              <>
                <Link href="/mes-annonces" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Mes annonces</Link>
                <Link href="/bons-plans" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Bons plans</Link>
                <Link href="/evenements" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Evenements</Link>
                <Link href="/covoiturage" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Covoiturage</Link>
                <Link href="/messages"     onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Messages</Link>
                <Link href="/favoris"      onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Favoris</Link>
                <Link href="/profil"       onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">Mon profil</Link>
                <div className="border-t border-night/8 my-1" />
                <button onClick={handleLogout} className="btn-ghost text-red-500 justify-start">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion"  onClick={() => setMenuOpen(false)} className="btn-secondary justify-center" role="menuitem">Se connecter</Link>
                <Link href="/inscription" onClick={() => setMenuOpen(false)} className="btn-primary justify-center" role="menuitem">S'inscrire</Link>
              </>
            )}
          </div>
        )}

        <div className="border-t border-night/8 bg-sand/50 px-4 py-3">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3">
              <DemoModeSwitcher />
              {demoModeEnabled && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/qa" className="rounded-full border border-coral/15 bg-white px-3 py-1.5 text-xs font-semibold text-coral transition hover:border-coral/30 hover:bg-coral/5">
                    Ouvrir le dashboard QA
                  </Link>
                  <span className="rounded-full bg-night/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/60">
                    Seed local actif
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barre de navigation fixe en bas — mobile uniquement */}
      <MobileBottomNav />
    </>
  )
}
