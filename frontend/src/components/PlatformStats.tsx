'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { BadgePercent, Car, Tag } from 'lucide-react'

import { statsApi } from '@/lib/api'

type PlatformStatsResponse = {
  listings_count: number
  bons_plans_count: number
  rides_count: number
}

export interface PlatformStatsProps {
  variant?: 'light' | 'dark'
}

type Metric = {
  key: keyof PlatformStatsResponse
  label: string
  icon: ComponentType<{ className?: string }>
}

const metrics: Metric[] = [
  { key: 'listings_count', label: 'annonces actives', icon: Tag },
  { key: 'bons_plans_count', label: 'bons plans du moment', icon: BadgePercent },
  { key: 'rides_count', label: 'covoiturages disponibles', icon: Car },
]

const metricToneClasses: Record<keyof PlatformStatsResponse, string> = {
  listings_count: 'text-nc-lagon',
  bons_plans_count: 'text-nc-emeraude',
  rides_count: 'text-nc-corail',
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function StatsSkeleton({ variant }: { variant: 'light' | 'dark' }) {
  if (variant === 'dark') {
    return (
      <div className="grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
        {metrics.map((metric) => (
          <div key={metric.key} className="px-4 py-5 text-center">
            <div className="mx-auto h-4 w-4 rounded-full skeleton" />
            <div className="mx-auto mt-3 h-6 w-16 skeleton rounded-md" />
            <div className="mx-auto mt-2 h-3 w-24 skeleton rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.key} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5 shadow-sm">
          <div className="h-5 w-5 skeleton rounded-full" />
          <div className="mt-4 h-8 w-20 skeleton rounded-md" />
          <div className="mt-3 h-4 w-28 skeleton rounded-md" />
        </div>
      ))}
    </div>
  )
}

export default function PlatformStats({ variant = 'light' }: PlatformStatsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [stats, setStats] = useState<PlatformStatsResponse | null>(null)
  const [displayValues, setDisplayValues] = useState<number[]>([0, 0, 0])
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await statsApi.getPlatform()
        if (!alive) return
        const data = response.data as PlatformStatsResponse
        setStats({
          listings_count: Number(data?.listings_count ?? 0),
          bons_plans_count: Number(data?.bons_plans_count ?? 0),
          rides_count: Number(data?.rides_count ?? 0),
        })
      } catch (err) {
        console.error('[platform-stats] load failed:', err)
        if (!alive) return
        setError(true)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!stats || loading || error) return

    const values = metrics.map((metric) => stats[metric.key] ?? 0)
    if (reduceMotion) {
      setDisplayValues(values)
      return
    }

    let raf = 0
    const start = performance.now()
    const duration = 1200

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplayValues(values.map((value) => Math.round(value * eased)))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [error, loading, reduceMotion, stats])

  const formattedValues = useMemo(
    () => displayValues.map((value) => formatNumber(value)),
    [displayValues]
  )

  if (error) return null
  if (loading || !stats) return <StatsSkeleton variant={variant} />

  if (variant === 'dark') {
    return (
      <div className="grid grid-cols-3 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 divide-x divide-white/10">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={metric.key} className="px-4 py-5 text-center">
              <Icon className="mx-auto h-[18px] w-[18px] text-white/50" />
              <p className={`mt-3 text-[22px] font-semibold leading-none ${metricToneClasses[metric.key]}`}>{formattedValues[index]}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-white/40">
                {metric.label}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <article
            key={metric.key}
            className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5 shadow-sm transition-colors"
          >
            <Icon className={`h-5 w-5 ${metricToneClasses[metric.key]}`} />
            <p className={`mt-4 text-[28px] font-semibold leading-none ${metricToneClasses[metric.key]}`}>{formattedValues[index]}</p>
            <p className="mt-3 text-[13px] font-medium text-[var(--color-text-secondary)]">{metric.label}</p>
          </article>
        )
      })}
    </div>
  )
}
