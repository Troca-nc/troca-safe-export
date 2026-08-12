'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, ShieldCheck } from 'lucide-react'
import { rgpdApi } from '@/lib/api'

const STORAGE_KEY = 'kalico-cookie-consent'
const OPEN_EVENT = 'kalico-cookie-banner-open'

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
  window.dispatchEvent(new CustomEvent('kalico-cookie-consent-changed', { detail: state }))
}

async function syncConsent(choice: { analytics: boolean; marketing: boolean }) {
  await rgpdApi.setConsent(choice).catch(() => {})
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
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kalico-blue/10 text-kalico-blue">
              <Cookie className="h-4 w-4" />
            </span>
          <p className="text-[13px] leading-5 text-night/80 sm:text-sm sm:leading-6">
            Nous utilisons des cookies essentiels pour faire fonctionner Kalico. Vous pouvez accepter, refuser ou personnaliser vos choix.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => handleChoice({ analytics: false, marketing: false })}
            className="btn-ghost justify-center rounded-2xl px-3 py-2.5 text-sm sm:px-4"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => handleChoice({ analytics: true, marketing: true })}
            className="btn-primary justify-center rounded-2xl px-3 py-2.5 text-sm sm:px-4"
          >
            Accepter
          </button>
          <Link
            href="/politique-cookies#preferences"
            className="btn-secondary col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm sm:col-span-1"
          >
            <ShieldCheck className="h-4 w-4" />
            Personnaliser
          </Link>
        </div>
      </div>
    </div>
  )
}
