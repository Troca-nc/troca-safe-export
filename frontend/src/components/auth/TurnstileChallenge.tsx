'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type Props = {
  onTokenChange?: (token: string) => void
  action?: string
  label?: string
  className?: string
}

function loadTurnstileScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Turnstile requires a browser environment'))
      return
    }

    if (window.turnstile) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed to load'))
    document.head.appendChild(script)
  })
}

export default function TurnstileChallenge({
  onTokenChange,
  action,
  label = 'Vérification anti-bot',
  className = '',
}: Props) {
  const siteKey = useMemo(() => {
    const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
    const trimmed = value.trim()
    return trimmed && !trimmed.toLowerCase().includes('changeme') ? trimmed : ''
  }, [])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [localToken, setLocalToken] = useState('')

  useEffect(() => {
    onTokenChange?.(siteKey ? localToken : '')
  }, [localToken, onTokenChange, siteKey])

  useEffect(() => {
    if (!siteKey) {
      setStatus('idle')
      setLocalToken('')
      return
    }

    let cancelled = false

    setStatus('loading')
    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {}
          widgetIdRef.current = null
        }

        containerRef.current.innerHTML = ''
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'light',
          size: 'normal',
          callback: (token: string) => {
            setLocalToken(token || '')
          },
          'expired-callback': () => {
            setLocalToken('')
          },
          'error-callback': () => {
            setLocalToken('')
            setStatus('error')
          },
        }) as string

        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
      }
      widgetIdRef.current = null
    }
  }, [action, siteKey])

  if (!siteKey) {
    return (
      <div className={`rounded-xl border border-night/10 bg-sand/50 px-4 py-3 text-xs text-night/55 ${className}`}>
        {label} désactivée en mode local.
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-night/55">{label}</p>
      <div ref={containerRef} className="min-h-[78px]" />
      {status === 'loading' && <p className="mt-2 text-[11px] text-night/45">Chargement du contrôle anti-bot…</p>}
      {status === 'error' && (
        <p className="mt-2 text-[11px] text-red-600">Impossible de charger la vérification anti-bot.</p>
      )}
    </div>
  )
}
