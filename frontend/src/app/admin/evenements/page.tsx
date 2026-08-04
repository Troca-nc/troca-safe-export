'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, Rocket, Ticket } from 'lucide-react'

import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi, eventsApi } from '@/lib/api'

type CinemaEvent = {
  id: number | string
  title: string
  venue_name?: string | null
  commune_name?: string | null
  event_date?: string | null
  event_time?: string | null
  room?: string | null
  version?: string | null
  is_3d?: boolean | null
  booking_url?: string | null
  price_normal_xpf?: number | null
  price_reduced_xpf?: number | null
  external_id?: string | null
}

function CinemaAdminPage() {
  const [events, setEvents] = useState<CinemaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const response = await eventsApi.list({ limit: 50, category: 'cinema' })
      setEvents(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const runScraper = async () => {
    setScraping(true)
    setMessage('')
    try {
      const response = await adminApi.runCinemaScraper()
      const report = Array.isArray(response.data?.data) ? response.data.data : []
      setMessage(`Scraper lancï¿½. ${report.length} cinï¿½ma(s) traitï¿½(s).`)
      await load()
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Impossible de lancer le scraper.')
    } finally {
      setScraping(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Admin cinï¿½ma</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-night">Sï¿½ances cinï¿½ma</h1>
              <p className="mt-2 text-sm text-night/60">
                Visualisez les sï¿½ances importï¿½es et relancez le scraper quand la grille a changï¿½.
              </p>
              <Link href="/evenements/publier?category=cinema" className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                Ajouter une sï¿½ance manuelle
              </Link>
            </div>
            <button
              type="button"
              onClick={() => void runScraper()}
              disabled={scraping}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Lancer le scraper maintenant
            </button>
          </div>
          {message ? <p className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm text-night/65">{message}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-night">Cinï¿½ma</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{events.length} sï¿½ance{events.length > 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="mt-4 h-40 animate-pulse rounded-2xl bg-sand/60" />
          ) : events.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5 text-sm text-night/55">
              Aucune sï¿½ance cinï¿½ma importï¿½e pour le moment.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {events.map((event) => (
                <article key={event.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0A7EA4]">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-night">{event.title}</p>
                      <p className="mt-1 text-xs text-night/55">{event.venue_name || 'Cinï¿½ma'} ï¿½ {event.commune_name || 'Nouvelle-CalÃ©donie'}</p>
                      <p className="mt-2 text-xs text-night/60">
                        {event.event_date || 'Date ?'} {event.event_time ? `ï¿½ ${event.event_time}` : ''} {event.version ? `ï¿½ ${event.version}` : ''} {event.is_3d ? 'ï¿½ 3D' : ''}
                      </p>
                      <p className="mt-1 text-xs text-night/50">
                        {event.price_normal_xpf ? `${Number(event.price_normal_xpf).toLocaleString('fr-FR')} XPF` : 'Tarif non communiquï¿½'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}

export default CinemaAdminPage
