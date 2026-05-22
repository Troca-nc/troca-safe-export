'use client'

import { create } from 'zustand'
import type { PendingAuthAction } from '@/lib/authAction'
import { storePendingAuthAction } from '@/lib/authAction'
import { rememberExplicitRedirectAfterLogin } from '@/lib/authRedirect'

type AuthActionState = {
  isOpen: boolean
  action: PendingAuthAction | null
  openAuthModal: (action: PendingAuthAction) => void
  closeAuthModal: () => void
  clearAuthModal: () => void
}

export const useAuthActionStore = create<AuthActionState>((set) => ({
  isOpen: false,
  action: null,
  openAuthModal: (action) => {
    storePendingAuthAction(action)
    rememberExplicitRedirectAfterLogin(action.redirectTo)
    set({ isOpen: true, action })
  },
  closeAuthModal: () => {
    set({ isOpen: false })
  },
  clearAuthModal: () => {
    set({ isOpen: false, action: null })
  },
}))

