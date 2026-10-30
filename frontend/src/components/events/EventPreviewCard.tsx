import { EventCard } from '@/components/bon-plans/EventCard'
import type { EventPublishDraft, EventTicketDraft } from '@/types/events'

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

export function EventPreviewCard({ form, ticketing, tickets, categoryLabel, communeName }: {
  form: EventPublishDraft
  ticketing: boolean
  tickets: EventTicketDraft[]
  categoryLabel: string
  communeName: string
}) {
  const prices = tickets.map((ticket) => Number.parseInt(ticket.priceXpf, 10) || 0)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0
  const priceLabel = !ticketing ? 'Entrée libre' : max === 0 ? 'Gratuit' : min === max ? `${money.format(min)} XPF` : `Dès ${money.format(min)} XPF`

  return (
    <div>
      <p className="mb-2 text-eyebrow-sm uppercase text-ink/60">Aperçu · tel que les visiteurs le verront</p>
      <EventCard
        variant="preview"
        titleMuted={!form.title.trim()}
        priceLabel={priceLabel}
        ctaLabel={ticketing ? 'Réserver' : 'Voir'}
        event={{
          id: 'preview',
          title: form.title.trim() || 'Titre de l’événement',
          description: form.description.trim(),
          dateIso: form.eventDate,
          time: form.startTime || null,
          endTime: form.endTime || null,
          commune: communeName || null,
          venue: form.venueName.trim() || null,
          category: categoryLabel,
          organizerName: form.organizerName.trim() || null,
          verified: false,
          isFree: !ticketing || max === 0,
          priceXpf: min,
          bookingUrl: null,
          coverImageUrl: form.coverImageUrl.trim() || null,
        }}
      />
    </div>
  )
}
