'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Database,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Monitor,
  Crown,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import ProfileDemoPreview from '@/components/ui/ProfileDemoPreview'
import { DEMO_ACCOUNTS, getDemoStatus, resetDemoDataset, seedDemoDataset } from '@/lib/demoApi'
import { useAuthStore } from '@/store/authStore'

const QUICK_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/annonces', label: 'Annonces' },
  { href: '/annonces/nouvelle', label: 'Bon plan' },
  { href: '/messages', label: 'Messages' },
  { href: '/parametres', label: 'Paramètres' },
  { href: '/profil', label: 'Profil' },
  { href: '/admin/dashboard', label: 'Admin' },
]

export default function DemoQaPage() {
  const router = useRouter()
  const { login, logout, isAuthenticated, user } = useAuthStore()
  const [status, setStatus] = useState<any>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const demoEmail = user?.email ?? ''
  const demoBadge = useMemo(() => demoEmail.endsWith('@demo.troca') ? 'Compte démo actif' : 'Mode réel', [demoEmail])

  const loadStatus = async () => {
    try {
      const data = await getDemoStatus()
      setStatus(data)
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleSeed = async () => {
    setBusy('seed')
    setMessage('')
    try {
      const result = await seedDemoDataset()
      setMessage(`Jeu de données généré: ${result?.counts?.users ?? 0} comptes, ${result?.counts?.listings ?? 0} annonces.`)
      await loadStatus()
    } finally {
      setBusy(null)
    }
  }

  const handleReset = async () => {
    setBusy('reset')
    setMessage('')
    try {
      const result = await resetDemoDataset()
      setMessage(result?.cleared ? 'Jeu de données démo supprimé.' : 'Jeu de données remis à zéro.')
      await loadStatus()
    } finally {
      setBusy(null)
    }
  }

  const loginAs = async (key: keyof typeof DEMO_ACCOUNTS) => {
    setBusy(key)
    setMessage('')
    try {
      await login(DEMO_ACCOUNTS[key].email, DEMO_ACCOUNTS[key].password)
      router.push(key === 'admin' ? '/admin/dashboard' : '/profil')
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? 'Connexion démo impossible.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-[radial-gradient(circle_at_top_left,_rgba(72,202,228,0.24),_transparent_38%),linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.88))] px-6 py-7 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)] md:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
                  <Sparkles className="h-3.5 w-3.5" />
                  Demo / QA local
                </div>
                <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
                  Environnement visuel complet pour tester Troca sans friction.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
                  Générez les données locales, ouvrez les rôles instantanés, puis naviguez dans toutes les pages critiques
                  comme un utilisateur réel, sur web et mobile.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">Statut</p>
                  <p className="mt-2 text-sm font-semibold">{status?.enabled ? 'Local activé' : 'Mode hors ligne'}</p>
                  <p className="text-xs text-white/60">{demoBadge}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">Comptes</p>
                  <p className="mt-2 text-2xl font-bold">{status?.counts?.users ?? 0}</p>
                  <p className="text-xs text-white/60">comptes démo</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">Annonces</p>
                  <p className="mt-2 text-2xl font-bold">{status?.counts?.listings ?? 0}</p>
                  <p className="text-xs text-white/60">annonces seedées</p>
                </div>
              </div>
            </div>
          </div>

          {message ? (
            <div className="rounded-2xl border border-night/10 bg-white p-4 text-sm text-night/70 shadow-sm">
              {message}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Bootstrap local</p>
                    <h2 className="text-xl font-bold text-night">Créer ou vider les données de démonstration</h2>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={busy !== null}
                    className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    {busy === 'seed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Générer le seed local
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={busy !== null}
                    className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    {busy === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Vider le seed
                  </button>
                  <Link href="/annonces" className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-4 py-2.5">
                    Explorer les annonces
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm text-night/65">
                  Les comptes démo utilisent le mot de passe commun <span className="font-semibold">Demo1234!</span>.
                  Le seed crée des annonces, messages, notifications, avis, paiements simulés et événements analytics.
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean/10 text-ocean">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ocean/80">Connexion instantanée</p>
                    <h2 className="text-xl font-bold text-night">Accéder aux rôles réels seedés</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loginAs(key as keyof typeof DEMO_ACCOUNTS)}
                      disabled={busy !== null}
                      className="rounded-2xl border border-night/10 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">{account.label}</p>
                          <p className="mt-1 text-sm text-night/55">{account.description}</p>
                        </div>
                        <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-coral">
                          Login
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-night/45">{account.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lagoon/15 text-night">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Navigation rapide</p>
                    <h2 className="text-xl font-bold text-night">Ouvrir les pages critiques en un clic</h2>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="rounded-full border border-night/10 bg-sand px-4 py-2 text-sm font-semibold text-night/70 transition hover:border-coral/30 hover:bg-coral/5 hover:text-coral">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ProfileDemoPreview mode="account" />

              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-night/5 text-night">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Surfaces visuelles</p>
                    <h2 className="text-xl font-bold text-night">Rendu desktop, tablette et mobile</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm font-semibold text-night">Desktop</p>
                    <p className="mt-1 text-sm text-night/60">Header, hero, listes, cartes et dashboards.</p>
                  </div>
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm font-semibold text-night">Tablette</p>
                    <p className="mt-1 text-sm text-night/60">Menus, filtres et colonnes adaptatives.</p>
                  </div>
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm font-semibold text-night">Mobile</p>
                    <p className="mt-1 text-sm text-night/60">Navigation tactile, retour arrière et état démo.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-night/10 bg-night/[0.03] p-4 text-sm text-night/60">
                  Sur mobile, installez le seed puis utilisez les boutons de connexion instantanée dans l’écran de login
                  pour basculer entre particulier, pro, bon plan et admin.
                </div>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="mt-4 btn-ghost inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    Déconnexion rapide
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
