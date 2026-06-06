'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { TOAST_EVENT, type ToastPayload, type ToastTone } from '@/lib/toast'

type ToastItem = ToastPayload & {
  id: number
  tone: ToastTone
}

const TONE_STYLES: Record<ToastTone, { root: string; icon: string; Icon: typeof CheckCircle2 }> = {
  success: {
    root: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    root: 'border-red-200 bg-red-50 text-red-700',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  info: {
    root: 'border-[#0A7EA4]/15 bg-white text-night',
    icon: 'text-[#0A7EA4]',
    Icon: Info,
  },
}

export default function ToastCenter() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail
      const message = detail?.message?.trim()
      if (!message) return

      const toast: ToastItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message,
        title: detail?.title,
        tone: detail?.tone || 'info',
      }
      setToasts((current) => [...current, toast].slice(-4))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 3400)
    }

    window.addEventListener(TOAST_EVENT, handleToast as EventListener)
    return () => window.removeEventListener(TOAST_EVENT, handleToast as EventListener)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[140] flex w-[min(92vw,24rem)] flex-col gap-2">
      {toasts.map((toast) => {
        const config = TONE_STYLES[toast.tone]
        const Icon = config.Icon
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_16px_50px_rgba(8,32,50,0.16)] ${config.root}`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.icon}`} />
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
                <p className={toast.title ? 'mt-1 text-sm leading-5' : 'text-sm leading-5'}>{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded-full p-1 text-night/35 transition hover:bg-night/5 hover:text-night"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
