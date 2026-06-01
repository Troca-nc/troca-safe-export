'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Cookie, ShieldCheck } from 'lucide-react'
import { API_ORIGIN } from '@/lib/api'
import { getStoredAccessToken } from '@/lib/tokenStorage'

const STORAGE_KEY = 'troca-cookie-consent'
const OPEN_EVENT = 'troca-cookie-banner-open'

interface ConsentState {
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ConsentState) : null
  } catch {
    return null
  }
}

function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
  const state: ConsentState = { ...choice, decidedAt: new Date().toISOString() }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('troca-cookie-consent-changed', { detail: state }))
}

async function syncConsent(choice: { analytics: boolean; marketing: boolean }) {
  const token = getStoredAccessToken()
  if (!token) return

  await axios
    .post(`${API_ORIGIN}/api/rgpd/consentement`, choice, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .catch(() => {})
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const open = () => setVisible(true)
    window.addEventListener(OPEN_EVENT, open)

    const consent = readConsent()
    const timeout = consent ? null : window.setTimeout(() => setVisible(true), 1200)

    return () => {
      window.removeEventListener(OPEN_EVENT, open)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [])

  const handleChoice = async (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice)
    setVisible(false)
    await syncConsent(choice)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <Cookie className="h-4 w-4" />
            </span>
          <p className="text-sm leading-6 text-night/80">
            Nous utilisons des cookies essentiels pour faire fonctionner Troca. Vous pouvez accepter, refuser ou personnaliser vos choix.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => handleChoice({ analytics: false, marketing: false })}
            className="btn-ghost justify-center rounded-2xl px-4 py-2.5"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => handleChoice({ analytics: true, marketing: true })}
            className="btn-primary justify-center rounded-2xl px-4 py-2.5"
          >
            Accepter
          </button>
          <Link
            href="/politique-cookies#preferences"
            className="btn-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Personnaliser
          </Link>
        </div>
      </div>
    </div>
  )
}
