'use client'

import { useEffect, useState } from 'react'

import { proApi } from '@/lib/api'
import ProCard, { type ProCardModel } from '@/components/pro/ProCard'

function ProCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="h-20 animate-pulse bg-sand/70" />
      <div className="-mt-6 px-4 pb-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="h-12 w-12 rounded-full bg-sand/80 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-sand/80 animate-pulse" />
        </div>
        <div className="h-4 w-2/3 rounded-full bg-sand/80 animate-pulse" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-sand/70 animate-pulse" />
        <div className="mt-3 h-10 rounded-2xl bg-sand/70 animate-pulse" />
      </div>
    </div>
  )
}

export default function ProCarousel() {
  const [pros, setPros] = useState<ProCardModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const response = await proApi.list({ limit: 12 })
        const items = Array.isArray(response.data?.data) ? response.data.data : []
        if (!alive) return
        setPros(items)
      } catch {
        if (!alive) return
        setPros([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  if (!loading && pros.length === 0) return null

  return (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
      {loading ? (
        <div className="grid auto-cols-[minmax(82vw,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] md:auto-cols-auto md:grid-flow-row md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid auto-cols-[minmax(82vw,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] md:auto-cols-auto md:grid-flow-row md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible">
          {pros.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      )}
    </div>
  )
}
