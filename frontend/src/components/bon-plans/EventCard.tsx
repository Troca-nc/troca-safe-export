import { BadgeCheck, CalendarDays, Clock3, Image as ImageIcon, MapPin, Ticket } from 'lucide-react'

import { formatNoumeaDate } from '@/lib/bonPlansDate'
import type { LocalEvent } from '@/types/bon-plans'

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

function defaultPrice(event: LocalEvent) {
  if (event.isFree) return 'Gratuit'
  return event.priceXpf === null ? 'Tarif à confirmer' : `${money.format(event.priceXpf)} F`
}

function Placeholder({ className = 'min-h-44' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-cream-sunken text-ink/45 ${className}`} aria-label="Visuel de l’événement">
      <ImageIcon className="h-10 w-10" aria-hidden="true" />
    </div>
  )
}

function compactTime(value: string | null) {
  if (!value) return ''
  return value.replace(/:00$/, ' h').replace(':', ' h ')
}

export function EventCard({
  event,
  variant = 'list',
  priceLabel,
  ctaLabel,
  titleMuted = false,
}: {
  event: LocalEvent
  variant?: 'list' | 'preview'
  priceLabel?: string
  ctaLabel?: string
  titleMuted?: boolean
}) {
  const eventPrice = priceLabel || defaultPrice(event)

  if (variant === 'preview') {
    const hasDate = Boolean(event.dateIso)
    const month = hasDate ? formatNoumeaDate(event.dateIso, { month: 'short' }).replace('.', '') : 'date'
    const day = hasDate ? formatNoumeaDate(event.dateIso, { day: 'numeric' }) : '–'
    const when = hasDate
      ? `${formatNoumeaDate(event.dateIso, { weekday: 'long', day: 'numeric', month: 'short' })}${event.time ? ` à ${compactTime(event.time)}` : ''}${event.endTime ? ` – ${compactTime(event.endTime)}` : ''}`
      : 'Date à définir'

    return (
      <article className="overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-panel">
        <div className="relative h-48 overflow-hidden bg-cream-sunken">
          {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" /> : <Placeholder className="h-full" />}
          <span className="absolute left-3.5 top-3.5 rounded-pill bg-ink px-3 py-1.5 text-label-sm font-semibold text-cream">{event.category || 'Catégorie'}</span>
          <div className="absolute right-3.5 top-3.5 w-16 rounded-control bg-cream-surface px-1 py-2 text-center shadow-card">
            <p className="text-eyebrow-sm uppercase text-accent-text">{month}</p>
            <p className="font-display text-[1.875rem] leading-none text-ink">{day}</p>
          </div>
        </div>
        <div className="p-5">
          <h3 className={`font-display text-h3 text-ink ${titleMuted ? 'text-ink/45' : ''}`}>{event.title}</h3>
          <p className="mt-2 line-clamp-3 text-body-sm text-ink/70">{event.description || 'La description apparaîtra ici.'}</p>
          <div className="mt-4 flex flex-col gap-2 text-body-sm text-ink/65">
            <span className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />{when}</span>
            <span className="flex items-start gap-2 font-semibold text-info-text"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{[event.venue, event.commune].filter(Boolean).join(', ') || 'Lieu à définir'}</span>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-sand pt-4">
            <span className="font-display text-[1.75rem] leading-none text-ink">{eventPrice}</span>
            <span className="inline-flex min-h-11 items-center rounded-control bg-accent-strong px-4 text-label font-semibold text-cream">{ctaLabel || 'Voir'}</span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="grid overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-card sm:grid-cols-[11rem_1fr]">
      {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="h-full min-h-44 w-full object-cover" /> : <Placeholder />}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-pill bg-info/15 px-3 py-1 text-label-sm font-semibold text-info-text">{event.category}</span>
          <span className="rounded-pill bg-reef/15 px-3 py-1 text-label-sm font-semibold text-reef-text">{eventPrice}</span>
          {event.verified ? <span className="flex items-center gap-1 text-meta font-semibold text-info-text"><BadgeCheck className="h-4 w-4" />Organisateur vérifié</span> : null}
        </div>
        <h3 className="mt-3 font-display text-h4">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-body-sm text-ink/70">{event.description || 'Les informations pratiques seront précisées par l’organisateur.'}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta font-semibold text-ink/65">
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent-text" />{formatNoumeaDate(event.dateIso, { weekday: 'long' })}</span>
          {event.time ? <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent-text" />{event.time}{event.endTime ? ` – ${event.endTime}` : ''}</span> : null}
          {event.commune || event.venue ? <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-text" />{[event.venue, event.commune].filter(Boolean).join(', ')}</span> : null}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-meta text-ink/55">{event.organizerName || 'Organisateur local'}</p>
          {event.bookingUrl ? <a href={event.bookingUrl} target="_blank" rel="noreferrer" className="k-button k-button-secondary">Réserver<Ticket className="h-4 w-4" /></a> : null}
        </div>
      </div>
    </article>
  )
}
