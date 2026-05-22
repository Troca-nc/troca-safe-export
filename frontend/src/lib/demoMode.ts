'use client'

export const DEMO_TOAST_EVENT = 'troca:demo-toast'

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function showDemoToast(message = 'Désactivé en mode démo') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DEMO_TOAST_EVENT, { detail: { message } }))
}
