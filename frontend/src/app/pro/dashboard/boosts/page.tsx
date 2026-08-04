'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Clock3, Package, Sparkles, Zap } from 'lucide-react'

import { proApi } from '@/lib/api'

type BoostItem = {
  id: string | number
  listing_id: string | number
  listing_title: string
  listing_price?: number | null
  cover_image?: string | null
  started_at: string
  expires_at: string
  duration_days: number
  price_xpf: number
  status: string
  invoice_number?: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function getProgress(boost: BoostItem) {
  const started = new Date(boost.started_at).getTime()
  const expires = new Date(boost.expires_at).getTime()
  const total = Math.max(1, expires - started)
  const remaining = Math.max(0, expires - Date.now())
  return Math.max(0, Math.min(100, ((total - remaining) / total) * 100))
}

export default function ProDashboardBoostsPage() {
  const [boosts, setBoosts] = useState<BoostItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const response = await proApi.getBoosts()
        if (!alive) return
        setBoosts(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setBoosts([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const activeBoosts = useMemo(
    () => boosts.filter((boost) => boost.status === 'active' && new Date(boost.expires_at) > new Date()),
    [boosts]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Boosts</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Historique des boosts</h1>
            <p className="mt-2 text-sm text-night/60">Suivez vos boosts actifs et vos anciennes campagnes de visibilitï¿½.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
            <BadgeCheck className="h-4 w-4" />
            {activeBoosts.length} actif{activeBoosts.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Boosts actifs</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">En cours</h2>
          </div>
        </div>
        {activeBoosts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeBoosts.map((boost) => {
              const progress = getProgress(boost)
              return (
                <article key={boost.id} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-sand">
                      {boost.cover_image ? (
                        <Image src={boost.cover_image} alt={boost.listing_title} width={64} height={64} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-night/25">
                          <Package className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold text-night">{boost.listing_title}</h3>
                      <p className="mt-1 text-xs text-night/55">
                        Du {formatDate(boost.started_at)} au {formatDate(boost.expires_at)}
                      </p>
                      <div className="mt-3 h-2 rounded-full bg-sand">
                        <div className="h-2 rounded-full bg-[#0A7EA4]" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-night/55">{Math.max(0, 100 - Math.round(progress))}% restant</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                      {Number(boost.price_xpf).toLocaleString('fr-FR')} XPF
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-night/55">
                      <Clock3 className="h-3.5 w-3.5" />
                      {boost.duration_days} jours
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center text-night/55">
            <Zap className="mx-auto h-8 w-8 text-[#0A7EA4]" />
            <p className="mt-3 text-lg font-semibold text-night">Aucun boost actif pour le moment</p>
            <p className="mt-2 text-sm">Boostez une annonce pour la faire remonter sur la homepage et dans sa catï¿½gorie.</p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Historique</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Toutes vos campagnes</h2>
        </div>

        {boosts.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-background-secondary)] text-night/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Annonce</th>
                  <th className="px-4 py-3 text-left font-semibold">Durï¿½e</th>
                  <th className="px-4 py-3 text-left font-semibold">Prix</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {boosts.map((boost) => (
                  <tr key={boost.id}>
                    <td className="px-4 py-3 text-night/70">{formatDate(boost.started_at)}</td>
                    <td className="px-4 py-3 font-medium text-night">{boost.listing_title}</td>
                    <td className="px-4 py-3 text-night/70">{boost.duration_days} jours</td>
                    <td className="px-4 py-3 text-night/70">{Number(boost.price_xpf).toLocaleString('fr-FR')} XPF</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        boost.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : boost.status === 'expired'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-sand text-night/60'
                      }`}>
                        {boost.status === 'active' ? 'Actif' : boost.status === 'expired' ? 'Expirï¿½' : 'Annulï¿½'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-night/55">
            Aucun historique de boost disponible.
          </div>
        )}
      </section>
    </div>
  )
}
