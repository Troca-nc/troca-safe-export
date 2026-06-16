'use client'

import { useState } from 'react'
import axios from 'axios'
import { trackEvent } from '@/lib/analytics'
import { API_ORIGIN } from '@/lib/api'
import { isDemoMode, showDemoToast } from '@/lib/demoMode'
import { getStoredAccessToken } from '@/lib/tokenStorage'

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return getStoredAccessToken()
}

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
})

// ── useBoostPayment ───────────────────────────────────────────────────────────

interface BoostPayload {
  annonce_id: number
  boost_type: string
  boost_duration: number
  provider: 'stripe' | 'payplug'
}

export interface SavedCard {
  id: string
  brand: string
  last4: string
  exp_month?: number | null
  exp_year?: number | null
  funding?: string | null
  holder_name?: string | null
}

export function useBoostPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const initiateBoost = async (payload: BoostPayload) => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode()) {
        showDemoToast('Désactivé en mode démo')
        const msg = 'Désactivé en mode démo'
        setError(msg)
        return { ok: false, error: msg }
      }

      void trackEvent('checkout_start', {
        offer_type: 'boost',
        boost_type: payload.boost_type,
        provider: payload.provider,
        duration_days: payload.boost_duration,
      })
      const { data } = await axios.post(
        `${API_ORIGIN}/api/payment/boost`,
        payload,
        { headers: authHeaders() }
      )
      // Rediriger vers Stripe Checkout ou PayPlug
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
      return { ok: true, checkout_url: data.checkout_url }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erreur lors du paiement'
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const loadSavedCards = async () => {
    setError(null)
    try {
      if (isDemoMode()) {
        return {
          ok: true,
          cards: [
            {
              id: 'demo_card_1',
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2030,
              funding: 'credit',
              holder_name: 'Client',
            },
          ] as SavedCard[],
        }
      }

      const { data } = await axios.get(`${API_ORIGIN}/api/payment/saved-cards`, { headers: authHeaders() })
      const cards = Array.isArray(data?.data) ? data.data : []
      return { ok: true, cards }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Impossible de charger les cartes enregistrées'
      setError(msg)
      return { ok: false, error: msg, cards: [] as SavedCard[] }
    }
  }

  const initiateBoostOneClick = async (payload: {
    annonce_id: number
    boost_type: string
    boost_duration: number
    payment_method_id: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode()) {
        showDemoToast('DÃ©sactivÃ© en mode dÃ©mo')
        return { ok: true, demo: true }
      }

      void trackEvent('checkout_start', {
        offer_type: 'boost',
        boost_type: payload.boost_type,
        provider: 'stripe',
        duration_days: payload.boost_duration,
        payment_mode: 'saved_card',
      })

      const { data } = await axios.post(
        `${API_ORIGIN}/api/payment/boost-one-click`,
        payload,
        { headers: authHeaders() }
      )

      return { ok: true, data: data?.data ?? data }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erreur lors du paiement'
      setError(msg)
      return {
        ok: false,
        error: msg,
        requires_action: Boolean(err?.response?.data?.requires_action),
        client_secret: err?.response?.data?.client_secret ?? null,
      }
    } finally {
      setLoading(false)
    }
  }

  return { initiateBoost, initiateBoostOneClick, loadSavedCards, loading, error }
}

// ── useSubscription ───────────────────────────────────────────────────────────

interface SubscriptionPayload {
  plan_id:        string
  billing_period: 'monthly' | 'yearly'
  provider:       'stripe' | 'payplug'
}

export function useSubscription() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const initiateSubscription = async (payload: SubscriptionPayload) => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode()) {
        showDemoToast('Désactivé en mode démo')
        const msg = 'Désactivé en mode démo'
        setError(msg)
        return { ok: false, error: msg }
      }

      void trackEvent('checkout_start', {
        offer_type: 'subscription',
        plan_id: payload.plan_id,
        billing_period: payload.billing_period,
        provider: payload.provider,
      })
      const { data } = await axios.post(
        `${API_ORIGIN}/api/payment/subscribe`,
        payload,
        { headers: authHeaders() }
      )
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
      return { ok: true, checkout_url: data.checkout_url }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erreur lors de la souscription'
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode()) {
        showDemoToast('Désactivé en mode démo')
        const msg = 'Désactivé en mode démo'
        setError(msg)
        return { ok: false, error: msg }
      }

      await axios.post(
        `${API_ORIGIN}/api/payment/cancel`,
        {},
        { headers: authHeaders() }
      )
      return { ok: true }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erreur lors de l\'annulation'
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { initiateSubscription, cancelSubscription, loading, error }
}
