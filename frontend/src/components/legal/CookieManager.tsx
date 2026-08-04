'use client'

import { useEffect, useState } from 'react'
import { Check, Shield, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react'
import { rgpdApi } from '@/lib/api'

const STORAGE_KEY = 'kalico-cookie-consent'

interface ConsentState {
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

function readStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ConsentState) : null
  } catch {
    return null
  }
}

function saveConsent(state: ConsentState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('kalico-cookie-consent-changed', { detail: state }))
}

async function persistToServer(choice: { analytics: boolean; marketing: boolean }) {
  await rgpdApi.setConsent(choice).catch(() => {})
}

function CookieToggle({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group rounded-2xl border border-night/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-coral/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{title}</p>
          <p className="mt-2 text-sm font-medium text-night">{enabled ? 'Activï¿½' : 'Dï¿½sactivï¿½'}</p>
        </div>
        {enabled ? <ToggleRight className="h-9 w-9 text-coral" /> : <ToggleLeft className="h-9 w-9 text-night/20" />}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-night/55">{description}</p>
    </button>
  )
}

export default function CookieManager() {
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const consent = readStoredConsent()
    if (consent) {
      setAnalytics(!!consent.analytics)
      setMarketing(!!consent.marketing)
    }
  }, [])

  const handleSave = async () => {
    const state = {
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
    }
    saveConsent(state)
    setSaved(true)
    await persistToServer({ analytics, marketing })
  }

  const handleAcceptAll = async () => {
    setAnalytics(true)
    setMarketing(true)
    const state = {
      analytics: true,
      marketing: true,
      decidedAt: new Date().toISOString(),
    }
    saveConsent(state)
    setSaved(true)
    await persistToServer({ analytics: true, marketing: true })
  }

  const handleRejectAll = async () => {
    setAnalytics(false)
    setMarketing(false)
    const state = {
      analytics: false,
      marketing: false,
      decidedAt: new Date().toISOString(),
    }
    saveConsent(state)
    setSaved(true)
    await persistToServer({ analytics: false, marketing: false })
  }

  return (
    <section id="preferences" className="rounded-[2rem] border border-night/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
            <Sparkles className="h-3.5 w-3.5" />
            Prï¿½fï¿½rences
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-night">Gï¿½rer mes cookies</h2>
          <p className="mt-2 text-sm leading-relaxed text-night/65">
            Choisissez en un clin d&apos;Sil ce que vous autorisez. Les cookies essentiels restent actifs pour la connexion et la sÃ©curitÃ©.
          </p>
        </div>

        <div className="rounded-2xl border border-night/10 bg-sand/40 px-4 py-3 text-sm text-night/65">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-coral" />
            Choix mï¿½morisï¿½s localement
          </div>
          <p className="mt-1 text-xs text-night/45">Vous pouvez revenir ici ï¿½ tout moment.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-night/10 bg-sand/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Essentiels</p>
          <p className="mt-2 text-sm font-medium text-night">Toujours actifs</p>
          <p className="mt-1 text-sm text-night/55">Connexion, sÃ©curitÃ© et prï¿½fï¿½rences de base.</p>
        </div>

        <CookieToggle
          title="Mesure daudience"
          description="Aide ï¿½ amï¿½liorer le service avec des statistiques limitï¿½es."
          enabled={analytics}
          onToggle={() => setAnalytics((value) => !value)}
        />

        <CookieToggle
          title="Marketing"
          description="Rï¿½servï¿½ aux communications promotionnelles futures."
          enabled={marketing}
          onToggle={() => setMarketing((value) => !value)}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-night/10 pt-5 sm:flex-row sm:items-center">
        <button type="button" onClick={handleRejectAll} className="btn-secondary justify-center">
          Tout refuser
        </button>
        <button type="button" onClick={handleSave} className="btn-primary justify-center">
          Enregistrer mes choix
        </button>
        <button type="button" onClick={handleAcceptAll} className="btn-ghost justify-center">
          Tout accepter
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-jungle">
            <Check className="h-4 w-4" />
            Prï¿½fï¿½rences enregistrï¿½es
          </span>
        ) : null}
      </div>
    </section>
  )
}
