'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const handle = window.setInterval(() => {
      router.refresh()
    }, intervalMs)
    return () => window.clearInterval(handle)
  }, [intervalMs, router])

  return null
}
