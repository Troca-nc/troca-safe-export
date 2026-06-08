'use client'

import { useEffect } from 'react'

export default function MswInitializer() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_MSW !== 'true') return

    let disposed = false

    void (async () => {
      const [{ setupWorker }, { mswHandlers }] = await Promise.all([
        import('msw/browser'),
        import('@/lib/mswHandlers'),
      ])

      if (disposed) return

      const worker = setupWorker(...mswHandlers)
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
          options: { scope: '/' },
        },
      })
    })().catch((error) => {
      console.warn('[MSW] Failed to start worker', error)
    })

    return () => {
      disposed = true
    }
  }, [])

  return null
}
