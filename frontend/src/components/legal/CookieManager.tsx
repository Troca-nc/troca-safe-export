'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_ORIGIN } from '@/lib/api'
import { getStoredAccessToken } from '@/lib/tokenStorage'

const STORAGE_KEY = 'troca-cookie-consent'

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
  window.dispatchEvent(new CustomEvent('troca-cookie-consent-changed', { detail: state }))
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

  const persistToServer = async (choice: { analytics: boolean; marketing: boolean }) => {
    const token = getStoredAccessToken()
    if (!token) return

    await axios
      .post(`${API_ORIGIN}/api/rgpd/consentement`, choice, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {})
  }

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

  return (
    <section id="preferences" className="rounded-3xl border border-night/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">Préférences</p>
          <h2 className="mt-1 text-2xl font-bold text-night">Gérer mes cookies</h2>
          <p className="mt-2 text-sm text-night/65">
            Les cookies essentiels restent actifs pour garantir la connexion, la sécurité et le bon fonctionnement du site.
          </p>
        </div>
        <p className="text-xs text-night/45">Les choix sont mémorisés localement.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-night/10 bg-sand/40 p-4">
          <input
            type="checkbox"
            checked
            disabled
            className="mt-1 h-4 w-4 rounded border-night/20 text-coral"
          />
          <span>
            <span className="block font-semibold text-night">Essentiels</span>
            <span className="block text-sm text-night/60">Connexion, sécurité, panier et préférences.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-night/10 bg-white p-4">
          <input
            type="checkbox"
            checked={analytics}
            onChange={(event) => setAnalytics(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-night/20 text-coral"
          />
          <span>
            <span className="block font-semibold text-night">Mesure d’audience</span>
            <span className="block text-sm text-night/60">Aide à améliorer le service avec des statistiques first-party limitées.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-night/10 bg-white p-4 md:col-span-2">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(event) => setMarketing(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-night/20 text-coral"
          />
          <span>
            <span className="block font-semibold text-night">Préférences marketing</span>
            <span className="block text-sm text-night/60">Réservé aux communications promotionnelles futures si vous y consentez.</span>
          </span>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={handleSave} className="btn-primary">
          Enregistrer mes choix
        </button>
        {saved ? <span className="text-sm text-jungle font-medium">Préférences enregistrées.</span> : null}
      </div>
    </section>
  )
}
