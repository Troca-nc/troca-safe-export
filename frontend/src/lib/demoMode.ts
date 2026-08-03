'use client'

export const DEMO_TOAST_EVENT = 'kalico:demo-toast'

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function showDemoToast(message = 'D�sactiv� en mode d�mo') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DEMO_TOAST_EVENT, { detail: { message } }))
}
