'use client'
// src/components/ui/CookieBanner.tsx
// ── Bannière consentement cookies — conforme RGPD / CNIL ─────────────────────
// À placer dans le layout racine. N'apparaît que si pas encore de choix enregistré.

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'
import { API_ORIGIN } from '@/lib/api'
import { getStoredAccessToken } from '@/lib/tokenStorage'

const STORAGE_KEY = 'troca-cookie-consent'
const OPEN_EVENT = 'troca-cookie-banner-open'
interface ConsentState {
  analytics:  boolean
  marketing:  boolean
  decidedAt:  string
}

function readStoredConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as ConsentState
  } catch {
    return null
  }
}

export default function CookieBanner() {
  const [visible,   setVisible]   = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const acceptRef = useRef<HTMLButtonElement | null>(null)
  const refuseRef = useRef<HTMLButtonElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const visibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Vérifier si consentement déjà donné
  useEffect(() => {
    const stored = readStoredConsent()
    if (stored) {
      setAnalytics(!!stored.analytics)
      setMarketing(!!stored.marketing)
      return
    }
    if (!stored) {
      // Délai pour ne pas bloquer le rendu initial
      visibleTimerRef.current = setTimeout(() => setVisible(true), 1500)
    }

    return () => {
      if (visibleTimerRef.current) clearTimeout(visibleTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      const stored = readStoredConsent()
      if (stored) {
        setAnalytics(!!stored.analytics)
        setMarketing(!!stored.marketing)
      }
      setExpanded(true)
      setVisible(true)
    }

    window.addEventListener(OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!visible) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => {
      acceptRef.current?.focus()
    }, 0)

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        refuseAll()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => !el.hasAttribute('disabled'))

      if (!focusables.length) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeydown)
      restoreFocusRef.current?.focus?.()
    }
  }, [visible])

  const saveConsent = async (choice: { analytics: boolean; marketing: boolean }) => {
    const state: ConsentState = {
      ...choice,
      decidedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setVisible(false)
    window.dispatchEvent(new CustomEvent('troca-cookie-consent-changed', { detail: state }))

    // Persister côté serveur si connecté
    const token = getStoredAccessToken()
    if (token) {
      await axios.post(`${API_ORIGIN}/api/rgpd/consentement`, choice, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  }

  const acceptAll = () => saveConsent({ analytics: true, marketing: true })
  const refuseAll = () => saveConsent({ analytics: false, marketing: false })
  const saveCustom = () => saveConsent({ analytics, marketing })

  if (!visible) return null

  return (
    <div
      ref={dialogRef}
      className="fixed bottom-0 left-0 right-0 z-[100] md:bottom-4 md:left-4 md:right-auto md:max-w-md
        bg-white border border-night/10 rounded-t-2xl md:rounded-2xl shadow-modal
        animate-slide-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-coral shrink-0" />
            <p id="cookie-banner-title" className="font-semibold text-night text-sm">Cookies et vie privée</p>
          </div>
          <button
            type="button"
            onClick={refuseAll}
            className="text-night/30 hover:text-night/60 transition-colors p-0.5"
            aria-label="Tout refuser et fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Texte */}
        <p id="cookie-banner-desc" className="text-xs text-night/70 leading-relaxed mb-4">
          Troca utilise des cookies essentiels au fonctionnement du site. Avec votre accord, nous enregistrons une mesure d’audience first-party limitée pour améliorer le service, sans publicité ciblée.{' '}
          <Link href="/confidentialite" className="text-coral underline">
            En savoir plus
          </Link>
        </p>

        {/* Personnaliser */}
        {expanded && (
          <div className="space-y-3 mb-4 animate-fade-in">
            {/* Essentiels (toujours actifs) */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-night">Cookies essentiels</p>
                <p className="text-[10px] text-night/60">Connexion, panier, sécurité</p>
              </div>
              <div className="w-9 h-5 bg-jungle/20 rounded-full flex items-center px-0.5 cursor-not-allowed">
                <div className="w-4 h-4 bg-jungle rounded-full ml-auto" />
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-night">Mesure d’audience</p>
                <p className="text-[10px] text-night/60">Pages visitées et actions utiles au produit</p>
              </div>
              <button
                type="button"
                onClick={() => setAnalytics(!analytics)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${analytics ? 'bg-coral' : 'bg-night/20'}`}
                aria-checked={analytics}
                role="switch"
                aria-label={`Mesure d’audience ${analytics ? 'activée' : 'désactivée'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${analytics ? 'translate-x-4' : ''}`} />
              </button>
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-night">Préférences marketing</p>
                <p className="text-[10px] text-night/60">Réservé aux futures communications</p>
              </div>
              <button
                type="button"
                onClick={() => setMarketing(!marketing)}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${marketing ? 'bg-coral' : 'bg-night/20'}`}
                aria-checked={marketing}
                role="switch"
                aria-label={`Préférences marketing ${marketing ? 'activées' : 'désactivées'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${marketing ? 'translate-x-4' : ''}`} />
              </button>
            </div>

            <button type="button" onClick={saveCustom} className="btn-ghost w-full justify-center text-xs py-2">
              Enregistrer mes choix
            </button>
          </div>
        )}

        {/* Bouton personnaliser */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-night/60 hover:text-night transition-colors mb-3"
          aria-expanded={expanded}
          aria-controls="cookie-banner-customization"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Personnaliser
        </button>

        {/* CTA principaux */}
        <div id="cookie-banner-customization" className="grid grid-cols-2 gap-2">
          <button ref={refuseRef} type="button" onClick={refuseAll} className="btn-ghost py-2 text-sm justify-center">
            Tout refuser
          </button>
          <button ref={acceptRef} type="button" onClick={acceptAll} className="btn-primary py-2 text-sm justify-center">
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  )
}
