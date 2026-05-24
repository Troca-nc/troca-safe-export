'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
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

  await axios.post(`${API_ORIGIN}/api/rgpd/consentement`, choice, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})
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
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t-2 border-coral bg-amber-300 text-slate-950 shadow-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em]">Cookies et vie privée</p>
          <p className="mt-1 text-sm leading-relaxed">
            Troca utilise des cookies essentiels pour faire fonctionner le site. Avec votre accord, nous pouvons activer une mesure d’audience limitée.
            <Link href="/politique-cookies" className="ml-1 underline underline-offset-2">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => handleChoice({ analytics: false, marketing: false })}
            className="rounded-xl border border-slate-900/15 bg-white px-4 py-2 text-sm font-semibold"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => handleChoice({ analytics: true, marketing: true })}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Accepter
          </button>
          <Link
            href="/politique-cookies#preferences"
            className="rounded-xl border border-slate-900/15 bg-white px-4 py-2 text-center text-sm font-semibold"
          >
            Personnaliser
          </Link>
        </div>
      </div>
    </div>
  )
}
