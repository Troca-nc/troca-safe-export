'use client'

import { useEffect, useState } from 'react'
import { phoneApi } from '@/lib/api'

type Step = 'input' | 'otp' | 'verified'
type DeliveryChannel = 'sms' | 'email'

function maskPhoneNumber(telephone: string) {
  if (!telephone) return ''
  if (telephone.length <= 4) return telephone
  return `${telephone.slice(0, 4)} ${'*'.repeat(Math.max(2, telephone.length - 6))}${telephone.slice(-2)}`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const response = error as { response?: { data?: { error?: string } } }
    if (typeof response.response?.data?.error === 'string' && response.response.data.error) {
      return response.response.data.error
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

interface PhoneVerificationState {
  step: Step
  telephone: string
  masked: string
  deliveryChannel: DeliveryChannel
  loading: boolean
  error: string
  success: string
  cooldown: number
  expires_at: string | null
}

function buildDefaultState(): PhoneVerificationState {
  return {
    step: 'input',
    telephone: '',
    masked: '',
    deliveryChannel: 'sms',
    loading: false,
    error: '',
    success: '',
    cooldown: 0,
    expires_at: null,
  }
}

export function usePhoneVerification(onVerified?: (telephone: string) => void) {
  const [state, setState] = useState<PhoneVerificationState>(buildDefaultState)

  useEffect(() => {
    if (state.step !== 'otp' || state.cooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.cooldown <= 1) {
          window.clearInterval(timer)
          return { ...current, cooldown: 0 }
        }
        return { ...current, cooldown: current.cooldown - 1 }
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [state.cooldown, state.step])

  // TODO: test E2E for OTP resend and email fallback flow.
  const sendOtp = async (telephone: string) => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
      success: '',
    }))

    try {
      const { data } = await phoneApi.send(telephone)
      const channel = (data.channel === 'email' ? 'email' : 'sms') as DeliveryChannel
      const masked = typeof data.masked === 'string' && data.masked ? data.masked : maskPhoneNumber(telephone)

      setState({
        step: 'otp',
        telephone,
        masked,
        deliveryChannel: channel,
        loading: false,
        error: '',
        success: data.message ?? 'Code envoyé',
        cooldown: Number(data.cooldown ?? 60),
        expires_at: typeof data.expires_at === 'string' ? data.expires_at : null,
      })
      return true
    } catch (error) {
      const message = getErrorMessage(error, 'Impossible d\'envoyer le code')
      setState((current) => ({
        ...current,
        loading: false,
        error: message,
        success: '',
      }))
      return false
    }
  }

  const verifyOtp = async (code: string) => {
    if (!code) return false

    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }))

    try {
      const { data } = await phoneApi.verify(state.telephone, code)
      if (data?.verified) {
        setState((current) => ({
          ...current,
          step: 'verified',
          loading: false,
          error: '',
          success: data.message ?? 'Téléphone vérifié',
          cooldown: 0,
        }))
        onVerified?.(state.telephone)
        return true
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: data?.error ?? 'Code incorrect ou expiré',
      }))
      return false
    } catch (error) {
      const message = getErrorMessage(error, 'Réessayez')
      setState((current) => ({
        ...current,
        loading: false,
        error: message,
      }))
      return false
    }
  }

  const resendOtp = async (channel: DeliveryChannel = 'sms') => {
    if (!state.telephone) return false

    setState((current) => ({
      ...current,
      loading: true,
      error: '',
      success: '',
    }))

    try {
      const { data } = await phoneApi.resend(state.telephone, channel)
      const nextChannel = (data.channel === 'email' ? 'email' : 'sms') as DeliveryChannel

      setState((current) => ({
        ...current,
        step: 'otp',
        masked: typeof data.masked === 'string' && data.masked ? data.masked : current.masked,
        deliveryChannel: nextChannel,
        loading: false,
        error: '',
        success: data.message ?? 'Code renvoyé',
        cooldown: Number(data.cooldown ?? 60),
        expires_at: typeof data.expires_at === 'string' ? data.expires_at : current.expires_at,
      }))
      return true
    } catch (error) {
      const message = getErrorMessage(error, 'Impossible de renvoyer le code')
      setState((current) => ({
        ...current,
        loading: false,
        error: message,
      }))
      return false
    }
  }

  const reset = () => {
    setState(buildDefaultState())
  }

  return {
    state,
    sendOtp,
    verifyOtp,
    resendOtp,
    reset,
  }
}
