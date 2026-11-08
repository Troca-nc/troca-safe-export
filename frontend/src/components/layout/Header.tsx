'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import HeaderV2, { type HeaderProps } from './HeaderV2'

const BUILD_CHECK_INTERVAL_MS = 5 * 60 * 1_000

export function extractKalicoBuildId(html: string) {
  return html.match(/\\"b\\":\\"(build-[^"\\]+)\\"/)?.[1]
    || html.match(/"b":"(build-[^"]+)"/)?.[1]
    || null
}

function BuildUpdateNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const currentBuildId = useRef<string | null>(null)
  const checking = useRef(false)

  const checkForUpdate = useCallback(async () => {
    if (checking.current || !currentBuildId.current) return
    checking.current = true
    try {
      const response = await fetch(`/?_kalico_build_check=${Date.now()}`, { cache: 'no-store' })
      if (!response.ok) return
      const latestBuildId = extractKalicoBuildId(await response.text())
      if (latestBuildId && latestBuildId !== currentBuildId.current) setUpdateAvailable(true)
    } catch {
      // Une vérification de version ne doit jamais perturber la navigation.
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => {
    currentBuildId.current = extractKalicoBuildId(document.documentElement.outerHTML)

    const currentUrl = new URL(window.location.href)
    if (currentUrl.searchParams.has('_kalico_refresh')) {
      currentUrl.searchParams.delete('_kalico_refresh')
      window.history.replaceState(window.history.state, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
    }

    void checkForUpdate()
    const interval = window.setInterval(() => void checkForUpdate(), BUILD_CHECK_INTERVAL_MS)
    const handleFocus = () => void checkForUpdate()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void checkForUpdate()
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [checkForUpdate])

  if (!updateAvailable) return null

  const refresh = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('_kalico_refresh', Date.now().toString())
    window.location.assign(url.toString())
  }

  return (
    <div role="status" className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-card border border-warm-border bg-ink-deep px-4 py-3 text-cream-surface shadow-modal sm:px-5">
      <div>
        <p className="text-label font-semibold">Une nouvelle version de Kalico est disponible.</p>
        <p className="mt-1 text-meta text-cream-surface/75">Actualisez pour profiter des dernières améliorations.</p>
      </div>
      <button type="button" onClick={refresh} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent-strong px-4 text-label font-semibold text-cream-surface transition-colors hover:bg-accent-strongHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-surface">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Actualiser
      </button>
    </div>
  )
}

export default function Header(props: HeaderProps) {
  return (
    <>
      <BuildUpdateNotice />
      <HeaderV2 {...props} />
    </>
  )
}

export type { HeaderProps }
