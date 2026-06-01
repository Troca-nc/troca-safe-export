'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { DEMO_ACCOUNTS } from '@/lib/demoApi'
import { DEMO_TOAST_EVENT, isDemoMode } from '@/lib/demoMode'

type DemoToast = {
  id: number
  message: string
}

export default function DemoBanner() {
  const showDemoBar = process.env.NEXT_PUBLIC_SHOW_DEMO_BAR === 'true'
  const [toasts, setToasts] = useState<DemoToast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isDemoMode() || !showDemoBar) return

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      const message = detail?.message?.trim()
      if (!message) return

      const toast = { id: Date.now() + Math.floor(Math.random() * 1000), message }
      setToasts((current) => [...current, toast].slice(-3))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 3200)
    }

    window.addEventListener(DEMO_TOAST_EVENT, handleToast as EventListener)
    return () => window.removeEventListener(DEMO_TOAST_EVENT, handleToast as EventListener)
  }, [mounted, showDemoBar])

  if (!mounted || !isDemoMode() || !showDemoBar) return null

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[120] border-b border-amber-300/80 bg-amber-300 px-4 py-2 text-sm text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.22)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <p className="font-medium leading-5">Mode démo - aucun paiement réel ne sera débité</p>
              <p className="text-[11px] leading-4 text-amber-900/85">
                Code SMS <strong>123456</strong> - Compte de départ{' '}
                <strong>{DEMO_ACCOUNTS.particulier.email}</strong> / <strong>{DEMO_ACCOUNTS.particulier.password}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <span className="rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-950">
              Demo
            </span>
            <span className="rounded-full border border-amber-400/60 bg-white/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
              Buyer
            </span>
            <span className="rounded-full border border-amber-400/60 bg-white/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
              Pro
            </span>
            <span className="rounded-full border border-amber-400/60 bg-white/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
              Admin
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-20 z-[130] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-night shadow-[0_16px_50px_rgba(8,32,50,0.16)]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="flex-1 leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-full p-1 text-night/35 transition hover:bg-night/5 hover:text-night"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
