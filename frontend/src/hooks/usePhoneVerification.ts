'use client'

import { useState } from 'react'

type Step = 'input' | 'otp' | 'verified'

function maskPhoneNumber(telephone: string) {
  if (!telephone) return ''
  if (telephone.length <= 4) return telephone
  return `${telephone.slice(0, 4)} ${'*'.repeat(Math.max(2, telephone.length - 6))}${telephone.slice(-2)}`
}

interface PhoneVerificationState {
  step: Step
  telephone: string
  masked: string
  loading: boolean
  error: string
  success: string
  cooldown: number
}

export function usePhoneVerification(onVerified?: (telephone: string) => void) {
  const [state, setState] = useState<PhoneVerificationState>({
    step: 'input',
    telephone: '',
    masked: '',
    loading: false,
    error: '',
    success: '',
    cooldown: 0,
  })

  return {
    state,
    sendOtp: async (telephone: string) => {
      setState({
        step: 'otp',
        telephone,
        masked: maskPhoneNumber(telephone),
        loading: false,
        error: '',
        success: 'Code envoye',
        cooldown: 30,
      })
      return true
    },
    verifyOtp: async (code: string) => {
      if (!code) return false
      setState((current) => {
        onVerified?.(current.telephone)
        return { ...current, step: 'verified', success: 'Telephone verifie' }
      })
      return true
    },
    resendOtp: async () => {
      setState((current) => ({ ...current, success: 'Code renvoye', cooldown: 30 }))
      return true
    },
    reset: () => {
      setState({
        step: 'input',
        telephone: '',
        masked: '',
        loading: false,
        error: '',
        success: '',
        cooldown: 0,
      })
    },
  }
}
