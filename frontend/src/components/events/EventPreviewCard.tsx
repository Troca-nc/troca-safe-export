import { EventCard } from '@/components/bon-plans/EventCard'
import type { EventAdmissionMode, EventPaidReservationMode, EventPublishDraft, EventTicketDraft } from '@/types/events'

export function EventPreviewCard({ form, admissionMode, paidReservationMode, tickets, categoryLabel, communeName }: {
  form: EventPublishDraft
  admissionMode: EventAdmissionMode
  paidReservationMode: EventPaidReservationMode
  tickets: EventTicketDraft[]
  categoryLabel: string
  communeName: string
}) {
  const prices = tickets.map((ticket) => Number.parseInt(ticket.priceXpf, 10) || 0)
  const min = prices.length ? Math.min(...prices) : 0
  const ticketing = admissionMode !== 'open'
  const priceLabel = admissionMode === 'open'
    ? 'Entrée libre'
    : admissionMode === 'free'
      ? 'Réservation gratuite'
      : paidReservationMode === 'external'
        ? 'Paiement en ligne'
        : 'Paiement sur place'

  return (
    <div>
      <p className="mb-2 text-eyebrow-sm uppercase text-ink/60">Aperçu · tel que les visiteurs le verront</p>
      <EventCard
        variant="preview"
        titleMuted={!form.title.trim()}
        priceLabel={priceLabel}
        ctaLabel={ticketing ? 'Voir les détails' : 'Découvrir'}
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
          isFree: admissionMode !== 'paid',
          hasTicketing: ticketing,
          paymentMode: admissionMode === 'open' ? 'open' : admissionMode === 'free' ? 'free' : paidReservationMode,
          priceXpf: min,
          bookingUrl: null,
          coverImageUrl: form.photoUrls[0] || form.coverImageUrl.trim() || null,
        }}
      />
    </div>
  )
}
