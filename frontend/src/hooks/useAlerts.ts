'use client'

import { useState } from 'react'

export function useAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])

  return {
    alerts,
    loading: false,
    error: null as string | null,
    createAlert: async (payload: any) => {
      const created = { id: Date.now(), ...payload }
      setAlerts((current) => [...current, created])
      return created
    },
    updateAlert: async (id: number | string, patch: any) => {
      setAlerts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
      return true
    },
    deleteAlert: async (id: number | string) => {
      setAlerts((current) => current.filter((item) => item.id !== id))
      return true
    },
  }
}
