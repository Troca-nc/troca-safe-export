'use client'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastPayload = {
  message: string
  tone?: ToastTone
  title?: string
}

export const TOAST_EVENT = 'troca:toast'

export function showToast(payload: ToastPayload | string, tone: ToastTone = 'info') {
  if (typeof window === 'undefined') return
  const detail = typeof payload === 'string' ? { message: payload, tone } : payload
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail }))
}
