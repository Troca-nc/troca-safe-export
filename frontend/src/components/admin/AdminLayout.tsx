// src/components/admin/AdminLayout.tsx
// ── Layout partagé pour toutes les pages admin ────────────────────────────────

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, AlertTriangle, FileText,
  Users, Star, LogOut, ShieldAlert,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAdminSignalements } from '@/hooks/useAdmin'

interface NavItem {
  href:   string
  label:  string
  icon:   React.ReactNode
  badge?: number
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active   = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-2 text-sm rounded-none border-l-2 transition-all ${
        active
          ? 'bg-coral/10 text-coral border-coral font-medium'
          : 'text-night/60 border-transparent hover:bg-sand hover:text-night'
      }`}
    >
      <span className="w-4 h-4 shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router   = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { data: signalements } = useAdminSignalements({ traite: false })

  // Guard : seuls les admins accèdent à ces pages
  useEffect(() => {
    if (!isAuthenticated) { router.replace('/connexion'); return }
    if (!user?.is_admin) { router.replace('/'); return }
  }, [isAuthenticated, user, router])

  const nbSignalements = signalements?.en_attente ?? 0

  const navItems: NavItem[] = [
    { href: '/admin',             label: "Vue d'ensemble", icon: <LayoutDashboard size={16} /> },
    { href: '/admin/signalements',label: 'Signalements',   icon: <AlertTriangle size={16} />, badge: nbSignalements },
    { href: '/admin/annonces',    label: 'Annonces',       icon: <FileText size={16} /> },
    { href: '/admin/utilisateurs',label: 'Utilisateurs',   icon: <Users size={16} /> },
    { href: '/admin/moderation',  label: 'File de modération', icon: <Star size={16} /> },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-light px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-night/8 bg-white p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-coral" />
          <h1 className="mt-4 text-2xl font-bold text-night">Accès administrateur requis</h1>
          <p className="mt-2 text-sm text-night/60">
            Cette zone est réservée aux comptes administrateurs. Vous allez être redirigé vers l’accueil ou la connexion.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/connexion" className="btn-primary px-4 py-2 text-sm">
              Se connecter
            </Link>
            <Link href="/" className="btn-ghost px-4 py-2 text-sm">
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-sand-light">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-52 bg-white border-r border-night/8 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-night/8">
          <Link href="/" className="flex items-center gap-2">
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
            <div>
              <p className="font-display font-bold text-coral leading-none">Troca</p>
              <p className="text-[10px] text-night/40 mt-0.5">Administration</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Alerte signalements urgents */}
        {nbSignalements > 0 && (
          <div className="mx-3 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert size={14} />
              <span className="text-xs font-medium">{nbSignalements} en attente</span>
            </div>
            <Link href="/admin/signalements" className="text-[10px] text-red-500 hover:underline mt-1 block">
              Traiter maintenant →
            </Link>
          </div>
        )}

        {/* Profil admin */}
        <div className="border-t border-night/8 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-coral/15 flex items-center justify-center text-coral text-xs font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-night/40">Administrateur</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-night/40 hover:text-red-500 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
