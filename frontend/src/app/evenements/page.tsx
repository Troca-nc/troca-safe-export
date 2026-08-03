'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, MapPin, Sparkles } from 'lucide-react'

import Header from '@/components/layout/Header'
import { eventsApi } from '@/lib/api'

type EventItem = {
  id: number | string
  title: string
  description: string
  event_date?: string | null
  commune_name?: string | null
  location_name?: string | null
  link_url?: string | null
  website_url?: string | null
  price_xpf?: number | null
  category?: string | null
  author_is_pro?: boolean | null
  kind?: string | null
  has_ticketing?: boolean | null
  booking_url?: string | null
  room?: string | null
  version?: string | null
  is_3d?: boolean | null
  price_normal_xpf?: number | null
  price_reduced_xpf?: number | null
  ticket_types?: Array<{
    id: number | string
    name: string
    price_xpf: number
    quantity_total: number
    quantity_sold?: number
    quantity_reserved?: number
  }>
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date e confirmer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date e confirmer'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

function toDayKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function buildCalendarCells(baseDate: Date) {
  const first = startOfMonth(baseDate)
  const firstDay = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - firstDay)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function CinemaCard({ event }: { event: EventItem }) {
  const href = event.booking_url || event.link_url || event.website_url || `/evenements/${event.id}`
  const external = Boolean(event.booking_url || event.link_url || event.website_url)
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,_#ffffff,_#f8fbfd)] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nc-emeraude">🎭 Cin�ma</p>
      <h3 className="mt-2 text-base font-bold text-night">{event.title}</h3>
      <p className="mt-1 text-sm text-night/60">{event.commune_name || event.location_name || 'Nouvelle-Caledonie'}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-white px-2.5 py-1">{formatDateLabel(event.event_date)}</span>
        {event.version ? <span className="rounded-full bg-white px-2.5 py-1">{event.version}</span> : null}
        {event.is_3d ? <span className="rounded-full bg-white px-2.5 py-1">3D</span> : null}
        {event.room ? <span className="rounded-full bg-white px-2.5 py-1">Salle {event.room}</span> : null}
      </div>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Reserver
      </a>
    </article>
  )
}

export default function EvenementsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)

    eventsApi
      .list({
        limit: 48,
        category: 'concert,festival,sport,marche,conference,exposition,cinema,spectacle,autre',
      })
      .then((response) => {
        if (!alive) return
        setEvents(Array.isArray(response.data?.data) ? response.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setEvents([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const currentMonth = useMemo(() => {
    const base = new Date()
    base.setMonth(base.getMonth() + monthOffset)
    return base
  }, [monthOffset])

  const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    for (const event of events) {
      if (!event.event_date) continue
      const key = new Date(event.event_date)
      if (Number.isNaN(key.getTime())) continue
      const dayKey = toDayKey(key)
      const bucket = map.get(dayKey) || []
      bucket.push(event)
      map.set(dayKey, bucket)
    }
    return map
  }, [events])

  const visibleEvents = useMemo(() => {
    const targetMonth = currentMonth.getMonth()
    const targetYear = currentMonth.getFullYear()
    return events
      .filter((event) => {
        if (!event.event_date) return false
        const date = new Date(event.event_date)
        if (Number.isNaN(date.getTime())) return false
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear
      })
      .sort((a, b) => Number(new Date(a.event_date || 0)) - Number(new Date(b.event_date || 0)))
  }, [currentMonth, events])

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.96),_rgba(10,126,164,0.68))] px-6 py-10 text-white md:px-10">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Agenda Kalico
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold">evenements, concerts et sorties en Nouvelle-Caledonie</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Retrouvez une vue calendrier claire des evenements e venir, avec les dates cles, les lieux et un acces direct vers les annonces.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Calendrier</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">
                  {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentMonth)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonthOffset((value) => value - 1)}
                  className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  e
                </button>
                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  Aujourdhui
                </button>
                <button
                  type="button"
                  onClick={() => setMonthOffset((value) => value + 1)}
                  className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  e
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarCells.map((day) => {
                const dayKey = toDayKey(day)
                const inMonth = day.getMonth() === currentMonth.getMonth()
                const isToday = dayKey === toDayKey(new Date())
                const dayEvents = eventsByDay.get(dayKey) || []

                return (
                  <div
                    key={dayKey}
                    className={`min-h-28 rounded-[1.25rem] border p-3 ${
                      inMonth
                        ? 'border-[var(--color-border)] bg-[var(--color-background-secondary)]'
                        : 'border-dashed border-[var(--color-border)] bg-white/60 text-night/35'
                    } ${isToday ? 'ring-2 ring-[#0A7EA4]/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-semibold ${inMonth ? 'text-night' : 'text-night/35'}`}>{day.getDate()}</span>
                      {dayEvents.length ? (
                        <span className="rounded-full bg-nc-lagonLight px-2 py-0.5 text-[10px] font-semibold text-nc-lagon">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        event.category === 'cinema' ? (
                          <div key={event.id} className="rounded-xl bg-white px-2.5 py-2 text-left shadow-sm">
                            <p className="line-clamp-1 text-xs font-semibold text-night">{event.title}</p>
                            <p className="mt-0.5 text-[11px] text-night/50">{event.commune_name || event.location_name || 'Nouvelle-Caledonie'}</p>
                          </div>
                        ) : (
                          <div key={event.id} className="rounded-xl bg-white px-2.5 py-2 text-left shadow-sm">
                            <p className="line-clamp-1 text-xs font-semibold text-night">{event.title}</p>
                            <p className="mt-0.5 text-[11px] text-night/50">{event.commune_name || event.location_name || 'Nouvelle-Caledonie'}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">e venir ce mois-ci</p>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-20 animate-pulse rounded-2xl bg-sand/60" />
                    <div className="h-20 animate-pulse rounded-2xl bg-sand/60" />
                  </div>
                ) : visibleEvents.length ? (
                  visibleEvents.slice(0, 8).map((event) => (
                    event.category === 'cinema' ? (
                      <CinemaCard key={event.id} event={event} />
                    ) : (
                    <article key={event.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">{event.title}</p>
                          <p className="mt-1 text-xs text-night/55 line-clamp-2">{event.description}</p>
                        </div>
                        {event.author_is_pro ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Organisateur verifie</span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-2 text-xs font-semibold text-night/65 sm:grid-cols-2">
                        <span className="rounded-full bg-white px-2.5 py-1">
                          <CalendarDays className="mr-1 inline h-3.5 w-3.5 text-coral" />
                          {formatDateLabel(event.event_date)}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          <MapPin className="mr-1 inline h-3.5 w-3.5 text-coral" />
                          {event.commune_name || event.location_name || 'Local'}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          <Clock3 className="mr-1 inline h-3.5 w-3.5 text-coral" />
                          {Number(event.price_xpf ?? 0) > 0 ? `${Number(event.price_xpf).toLocaleString('fr-FR')} XPF` : 'Gratuit'}
                        </span>
                      </div>

                      <div className="mt-4">
                        <a
                          href={event.link_url || event.website_url || `/evenements/${event.id}`}
                          target={event.link_url || event.website_url ? '_blank' : undefined}
                          rel={event.link_url || event.website_url ? 'noreferrer' : undefined}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                        >
                          Ouvrir levenement
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>
                    </article>
                    )
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-8 text-sm text-night/55">
                    Aucun evenement nest publie pour ce mois.
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href="/evenements/publier" className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
                  Publier un evenement
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/scan" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-night">
                  Scanner un billet
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(214,240,246,0.55),_rgba(255,255,255,0.98))] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Explorer</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-night">Promotions et sorties</h3>
              <p className="mt-2 text-sm leading-relaxed text-night/60">
                Consultez aussi les bons plans, les promos et les evenements dans la meme base editoriale.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/bons-plans#evenements" className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
                  Voir les bons plans
                </Link>
                <Link href="/annonces" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night">
                  Parcourir les annonces
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
