'use client'

import { useCallback, useEffect, useState } from 'react'

import { alertsApi } from '@/lib/api'
import type { AlertsResponse, CreateAlertPayload, SearchAlert } from '@/types/alert.types'

function getErrorMessage(err: unknown) {
  if (err && typeof err === 'object') {
    const response = err as { response?: { data?: { error?: string } } }
    return response.response?.data?.error ?? 'Impossible de charger les alertes.'
  }
  return 'Impossible de charger les alertes.'
}

function unwrapAlertResponse(data: unknown): SearchAlert {
  if (data && typeof data === 'object' && 'data' in data) {
    const nested = (data as { data?: unknown }).data
    if (nested && typeof nested === 'object') return nested as SearchAlert
  }
  return data as SearchAlert
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<SearchAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await alertsApi.list()
      const payload = response.data as AlertsResponse | { data?: SearchAlert[] }
      setAlerts((payload as AlertsResponse).data ?? (payload as { data?: SearchAlert[] }).data ?? [])
    } catch (err) {
      setAlerts([])
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createAlert = useCallback(async (payload: CreateAlertPayload) => {
    const response = await alertsApi.create(payload)
    const created = unwrapAlertResponse(response.data)
    setAlerts((current) => [created, ...current.filter((item) => item.id !== created.id)])
    return created
  }, [])

  const updateAlert = useCallback(async (id: number | string, patch: Partial<SearchAlert>) => {
    const response = await alertsApi.update(id, patch)
    const updated = unwrapAlertResponse(response.data)
    setAlerts((current) => current.map((item) => (item.id === Number(id) ? updated : item)))
    return updated
  }, [])

  const deleteAlert = useCallback(async (id: number | string) => {
    await alertsApi.delete(id)
    setAlerts((current) => current.filter((item) => item.id !== Number(id)))
    return true
  }, [])

  return {
    alerts,
    loading,
    error,
    refresh,
    createAlert,
    updateAlert,
    deleteAlert,
  }
}
