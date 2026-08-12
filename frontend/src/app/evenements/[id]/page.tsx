'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, Loader2, MapPin, Ticket } from 'lucide-react'

import Header from '@/components/layout/Header'
import { eventsApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type EventTicketType = {
  id: number
  name: string
  description?: string | null
  price_xpf: number
  quantity_total: number
  quantity_sold: number
  quantity_reserved: number
  remaining: number
}

type EventDetail = {
  id: number
  title: string
  description?: string | null
  venue_name?: string | null
  venue_address?: string | null
  commune_name?: string | null
  event_date?: string | null
  event_time?: string | null
  end_time?: string | null
  cover_image_url?: string | null
  photos?: string[]
  category?: string | null
  status?: string | null
  has_ticketing?: boolean
  is_free?: boolean
  organizer_name?: string | null
  organizer_email?: string | null
  website_url?: string | null
  ticket_types?: EventTicketType[]
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date à confirmer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à confirmer'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatMoney(value: number) {
  return `${value.toLocaleString('fr-FR')} XPF`
}

export default function EventDetailPage() {
  const routeParams = useParams<{ id: string }>()
  const eventId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id || ''
  const { isAuthenticated, user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  useEffect(() => {
    let alive = true
    setLoading(true)
    if (!eventId) {
      setEvent(null)
      setLoading(false)
      return () => {
        alive = false
      }
    }

    eventsApi.getById(eventId)
      .then((response) => {
        if (!alive) return
        const data = response.data?.data as EventDetail | undefined
        setEvent(data || null)
        const initialQuantities: Record<number, number> = {}
        for (const ticket of data?.ticket_types || []) {
          initialQuantities[ticket.id] = ticket.remaining > 0 ? 1 : 0
        }
        setQuantities(initialQuantities)
      })
      .catch(() => {
        if (!alive) return
        setEvent(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [eventId])

  useEffect(() => {
    if (user?.email) setBuyerEmail(user.email)
  }, [user?.email])

  useEffect(() => {
    const firstName = user?.first_name || user?.prenom || ''
    const lastName = user?.last_name || user?.nom || ''
    const phone = user?.telephone || ''

    if (!buyerName.trim() && (firstName || lastName)) {
      setBuyerName([firstName, lastName].filter(Boolean).join(' ').trim())
    }
    if (!buyerPhone.trim() && phone) {
      setBuyerPhone(phone)
    }
  }, [buyerName, buyerPhone, user?.first_name, user?.last_name, user?.nom, user?.prenom, user?.telephone])

  const selectedItems = useMemo(
    () => (event?.ticket_types || [])
      .map((ticket) => ({ ticket, quantity: quantities[ticket.id] || 0 }))
      .filter((item) => item.quantity > 0),
    [event?.ticket_types, quantities],
  )

  const totalXpf = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity * item.ticket.price_xpf, 0),
    [selectedItems],
  )

  const handleReserve = async () => {
    if (!event) return
    setError('')
    setSuccess('')

    if (!isAuthenticated) {
        openAuthModal({
          type: 'publish_listing',
          redirectTo: `/evenements/${event.id}`,
        })
        return
      }

    if (!buyerEmail.trim() || !buyerName.trim()) {
      setError('Votre nom et votre email sont requis.')
      return
    }

    if (!selectedItems.length) {
      setError('Sélectionnez au moins un billet.')
      return
    }

    setSubmitting(true)
    try {
      const response = await eventsApi.reserveTickets(event.id, {
        buyer_email: buyerEmail.trim(),
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim() || null,
        provider: 'stripe',
        items: selectedItems.map((item) => ({
          ticket_type_id: item.ticket.id,
          quantity: item.quantity,
        })),
      })

      const data = response.data?.data
      if (data?.checkout_url) {
        window.location.assign(data.checkout_url)
        return
      }

      setSuccess(`Commande confirmée. Total payé: ${formatMoney(totalXpf)}.`)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de réserver les billets.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
        ) : event ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
              <div className="relative h-64 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.28))]">
                {event.cover_image_url ? (
                  <Image src={event.cover_image_url} alt={event.title} fill className="object-cover opacity-80" />
                ) : null}
              </div>
              <div className="p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">{event.category || 'Événement'}</p>
                <h1 className="mt-2 font-display text-4xl font-bold text-night">{event.title}</h1>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-night/65">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5">
                    <CalendarDays className="h-4 w-4 text-kalico-blue" />
                    {formatDateLabel(event.event_date)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5">
                    <Clock3 className="h-4 w-4 text-kalico-blue" />
                    {event.event_time || 'Heure à confirmer'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5">
                    <MapPin className="h-4 w-4 text-kalico-blue" />
                    {event.venue_name || event.commune_name || 'Nouvelle-Calédonie'}
                  </span>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-night/65 md:text-base">
                  {event.description || 'Aucune description disponible.'}
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Organisateur</p>
                    <p className="mt-1 text-sm font-semibold text-night">{event.organizer_name || 'Kalico Events'}</p>
                    {event.website_url ? (
                      <Link href={event.website_url} target="_blank" className="mt-2 inline-flex text-sm font-semibold text-[#0A7EA4]">
                        Site web
                      </Link>
                    ) : null}
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Billetterie</p>
                    <p className="mt-1 text-sm font-semibold text-night">
                      {event.has_ticketing ? (event.is_free ? 'Gratuite' : 'Billets payants') : 'Aucune billetterie'}
                    </p>
                    <p className="mt-1 text-sm text-night/60">{event.ticket_types?.length || 0} type(s) de billet</p>
                  </div>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Réserver</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Choisissez vos billets</h2>

                <div className="mt-4 space-y-3">
                  {(event.ticket_types || []).length ? (
                    event.ticket_types!.map((ticket) => (
                      <div key={ticket.id} className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-night">{ticket.name}</p>
                            <p className="mt-1 text-sm text-night/60">{ticket.description || 'Billet standard'}</p>
                          </div>
                          <p className="text-sm font-bold text-night">{formatMoney(ticket.price_xpf)}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-night/50">Restant: {ticket.remaining}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setQuantities((current) => ({ ...current, [ticket.id]: Math.max(0, (current[ticket.id] || 0) - 1) }))} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm font-semibold">-</button>
                            <span className="min-w-8 text-center text-sm font-semibold">{quantities[ticket.id] || 0}</span>
                            <button type="button" onClick={() => setQuantities((current) => ({ ...current, [ticket.id]: Math.min(ticket.remaining, (current[ticket.id] || 0) + 1) }))} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm font-semibold">+</button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-8 text-sm text-night/55">
                      La billetterie n'est pas encore configurée pour cet événement.
                    </p>
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Nom</span>
                    <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input w-full rounded-2xl" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Email</span>
                    <input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} type="email" className="input w-full rounded-2xl" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Téléphone</span>
                    <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input w-full rounded-2xl" />
                  </label>
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Total</p>
                  <p className="mt-1 text-2xl font-bold text-night">{formatMoney(totalXpf)}</p>
                  <p className="mt-1 text-sm text-night/55">Réservation temporaire 10 minutes avant expiration.</p>
                </div>

                {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
                {success ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={submitting || !selectedItems.length}
                  className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Réserver mes billets
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
            <p className="text-lg font-semibold text-night">Événement introuvable</p>
            <p className="mt-2 text-sm">Retournez au calendrier pour découvrir les prochains événements.</p>
            <Link href="/evenements" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
              Voir le calendrier
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
