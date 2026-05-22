'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { DEMO_TOAST_EVENT, isDemoMode } from '@/lib/demoMode'

type DemoToast = {
  id: number
  message: string
}

export default function DemoBanner() {
  const [toasts, setToasts] = useState<DemoToast[]>([])

  useEffect(() => {
    if (!isDemoMode()) return

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
  }, [])

  const bannerClass = useMemo(
    () => 'sticky top-0 z-[80] border-b border-amber-300/70 bg-amber-100/95 px-4 py-3 text-sm text-amber-950 backdrop-blur',
    []
  )

  if (!isDemoMode()) return null

  return (
    <>
      <div className={bannerClass}>
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
          <p className="flex-1 font-medium">
            Mode démo activé — les données sont fictives et aucune action n&apos;est réelle
          </p>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
            Démo
          </span>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-16 z-[90] flex w-[min(92vw,22rem)] flex-col gap-2">
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
