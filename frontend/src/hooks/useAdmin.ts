'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { ActionModeration } from '@/types/admin.types'

function useStaticResource<T>(initialData: T) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const refetch = async () => {
    setLoading(true)
    setLoading(false)
    return data
  }

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  return { data, loading, refetch }
}

export type AdminObservabilitySnapshot = {
  scope?: string
  uptime_ms: number
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external?: number
    arrayBuffers?: number
  }
  http: {
    total: number
    byStatus: Record<string, number>
    slow: number
    errors: number
    last: Array<{
      ts: string
      requestId?: string | null
      method: string
      path: string
      statusCode: number
      durationMs: number
      userId?: number | null
    }>
  }
  alerts: Array<{
    id?: string
    ts: string
    severity: 'info' | 'warning' | 'critical' | string
    category?: string
    title?: string
    message?: string
    requestId?: string | null
    source?: string
    nodeId?: string
    role?: string
    [key: string]: unknown
  }>
  errors: Array<{
    ts: string
    source?: string
    event?: string
    level?: string
    message?: string
    requestId?: string | null
    request_id?: string | null
    statusCode?: number | null
    path?: string
    method?: string
    userId?: number | null
    job?: string
    durationMs?: number
    [key: string]: unknown
  }>
  websocket: {
    connects: number
    disconnects: number
    authErrors: number
    messages: number
  }
  share?: {
    total: number
    byChannel: Record<string, number>
    byContentType: Record<string, number>
    recent: Array<{
      ts: string
      channel?: string
      contentType?: string
      itemId?: string | null
      pagePath?: string | null
      referrer?: string | null
      userId?: number | null
      requestId?: string | null
      source?: string
      [key: string]: unknown
    }>
  }
  jobs: {
    started: number
    errors: number
    skipped: number
  }
  cluster?: {
    instances: number
    nodes: Array<{
      id: string
      role?: string
      pid?: number
      host?: string
      started_at?: string
      updated_at?: string
      memory?: {
        rss?: number
        heapTotal?: number
        heapUsed?: number
        external?: number
        arrayBuffers?: number
      }
      [key: string]: unknown
    }>
  }
}

async function fetchAdminObservability(): Promise<AdminObservabilitySnapshot> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : ''
  const response = await fetch('/api/admin/observability', {
    method: 'GET',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || 'Impossible de charger l’observabilité')
  }

  return payload?.data ?? payload
}

export function useAdminStats() {
  const [data, setData] = useState<any>({
    annonces_actives: 0,
    annonces_delta_semaine: 0,
    utilisateurs_total: 0,
    utilisateurs_delta_mois: 0,
    signalements_attente: 0,
    signalements_delta_hier: 0,
    messages_total: 0,
    messages_delta_pct: 0,
    services: {},
  })
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/stats')
      setData(response.data?.data ?? response.data ?? {})
      return response.data?.data ?? response.data ?? {}
    } catch {
      return data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refetch()
  }, [])

  return { data, loading, refetch }
}

export function useAdminChartData() {
  return useStaticResource({
    daily: [] as Array<{ date: string; value: number }>,
    categories: [] as Array<{ nom: string; count: number; pct: number }>,
    communes: [] as Array<{ nom: string; count: number }>,
  })
}

export function useAdminAnnonces(_filters?: unknown) {
  return useStaticResource({
    data: [],
    total: 0,
  })
}

export function useDeleteAnnonce() {
  return {
    loading: false,
    error: null as string | null,
    deleteAnnonce: async (_id?: number, _reason?: string) => true,
  }
}

export function useAdminSignalements(_filters?: unknown) {
  return useStaticResource({
    data: [],
    total: 0,
    en_attente: 0,
  })
}

export function useModerationAction() {
  const executeAction = async (_payload: {
    signalement_id: number
    action: ActionModeration
    raison?: string
    duree_jours?: number
  }) => ({ success: true, message: 'ok' })
  return {
    loading: false,
    error: null as string | null,
    moderate: executeAction,
    executeAction,
  }
}

export function useAdminUsers(_filters?: unknown) {
  return useStaticResource({
    data: [],
    total: 0,
  })
}

export function useSuspendUser() {
  return {
    loading: false,
    error: null as string | null,
    suspendUser: async (_id?: number, _reason?: string, _duration?: number) => true,
    reactiverUser: async (_id?: number) => true,
  }
}

export function useAdminObservability() {
  const [data, setData] = useState<AdminObservabilitySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = await fetchAdminObservability()
      setData(snapshot)
      setLastUpdatedAt(new Date().toISOString())
      return snapshot
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger l’observabilité'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refetch()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void refetch()
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return { data, loading, error, refetch, lastUpdatedAt }
}
