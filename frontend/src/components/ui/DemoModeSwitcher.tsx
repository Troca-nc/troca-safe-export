'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Sparkles, UserRound, Store, Megaphone, UserCheck } from 'lucide-react'
import { useAuthStore, type DemoProfileKey } from '@/store/authStore'
import { inferDemoAccount } from '@/lib/demoApi'

const DEMO_OPTIONS: Array<{
  key: DemoProfileKey
  label: string
  description: string
  icon: typeof UserRound
}> = [
  { key: 'visitor', label: 'Visiteur', description: 'Voir le site sans être connecté', icon: UserRound },
  { key: 'particulier', label: 'Particulier', description: 'Déposer une annonce classique', icon: UserCheck },
  { key: 'pro', label: 'Compte Pro', description: 'Voir l’espace vendeur professionnel', icon: Store },
  { key: 'bon_plan', label: 'Bon plan', description: 'Simuler un annonceur sponsorisé', icon: Megaphone },
]

const PROFILE_TONE: Record<Exclude<DemoProfileKey, 'visitor'> | 'visitor', {
  pill: string
  chip: string
}> = {
  visitor: { pill: 'bg-night/5 text-night/60', chip: 'bg-night/5 text-night/70' },
  particulier: { pill: 'bg-coral/10 text-coral', chip: 'bg-coral text-white' },
  pro: { pill: 'bg-ocean/10 text-ocean', chip: 'bg-ocean text-white' },
  bon_plan: { pill: 'bg-lagoon/15 text-night', chip: 'bg-lagoon text-night' },
}

export default function DemoModeSwitcher() {
  const [open, setOpen] = useState(false)
  const { demoProfile, setDemoProfile, user } = useAuthStore()
  const inferredProfile = inferDemoAccount(user?.email)

  const activeOption = useMemo(() => {
    return DEMO_OPTIONS.find((option) => option.key === (demoProfile ?? inferredProfile)) ?? null
  }, [demoProfile, inferredProfile])

  const currentLabel = activeOption?.label ?? 'Mode réel'
  const currentDescription = activeOption?.description ?? (user ? `${user.first_name} ${user.last_name}`.trim() : 'Aucun profil démo actif')
  const tone = PROFILE_TONE[(demoProfile ?? inferredProfile ?? 'visitor') as keyof typeof PROFILE_TONE]

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:shadow-md ${
          demoProfile ? 'border-coral/20 bg-white' : 'border-night/10 bg-white'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="demo-mode-menu"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.pill}`}>
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Mode démo</p>
            <p className="text-sm font-semibold text-night">{currentLabel}</p>
            <p className="text-xs text-night/55">{currentDescription}</p>
          </div>
        </div>
        <div className={`hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] sm:inline-flex ${tone.chip}`}>
          {demoProfile || inferredProfile ? 'Profil actif' : 'Mode réel'}
        </div>
        <ChevronDown className={`h-4 w-4 text-night/45 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer le sélecteur de profil"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div id="demo-mode-menu" role="menu" aria-label="Sélecteur de mode démo" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }} className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_18px_60px_rgba(8,32,50,0.14)]">
            <button
              type="button"
              onClick={() => {
                setDemoProfile(null)
                setOpen(false)
              }}
              role="menuitem"
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                !demoProfile ? 'bg-coral/5' : 'hover:bg-sand'
              }`}
            >
              <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl ${!demoProfile ? 'bg-coral text-white' : 'bg-night/5 text-night/65'}`}>
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-night">Mode réel</p>
                <p className="text-xs text-night/55">Revenir à votre session actuelle ou au compte connecté.</p>
              </div>
            </button>
            {DEMO_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = option.key === demoProfile
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setDemoProfile(option.key)
                    setOpen(false)
                  }}
                  role="menuitem"
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                    active ? 'bg-coral/5' : 'hover:bg-sand'
                  }`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl ${active ? 'bg-coral text-white' : 'bg-night/5 text-night/65'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-night">{option.label}</p>
                    <p className="text-xs text-night/55">{option.description}</p>
                  </div>
                  {active && (
                    <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Actif
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
