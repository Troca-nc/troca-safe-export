import { forwardRef } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import type { EventTicketDraft } from '@/types/events'

export type TicketErrors = Partial<Record<keyof EventTicketDraft, string>>

export const TicketTypeCard = forwardRef<HTMLInputElement, {
  index: number
  ticket: EventTicketDraft
  errors?: TicketErrors
  canRemove: boolean
  onChange: (field: keyof EventTicketDraft, value: string) => void
  onRemove: () => void
}>(function TicketTypeCard({ index, ticket, errors = {}, canRemove, onChange, onRemove }, ref) {
  return (
    <div className="grid grid-cols-[0.5rem_minmax(0,1fr)] overflow-hidden rounded-control border border-sand bg-cream-sunken">
      <div className="bg-accent" aria-hidden="true" />
      <div className="p-4 sm:px-5">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-eyebrow-sm uppercase text-accent-text">Billet {index + 1}</p>
          {canRemove ? <Button type="button" variant="ghost" compact onClick={onRemove}>Retirer</Button> : null}
        </div>
        <div className="mt-2 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
          <Input ref={ref} label="Nom" value={ticket.name} error={errors.name} onChange={(event) => onChange('name', event.target.value)} />
          <Input label="Prix (XPF)" type="number" min="0" step="1" value={ticket.priceXpf} error={errors.priceXpf} onChange={(event) => onChange('priceXpf', event.target.value)} />
          <Input label="Places" type="number" min="1" step="1" value={ticket.quantity} error={errors.quantity} onChange={(event) => onChange('quantity', event.target.value)} />
        </div>
        <div className="mt-3">
          <Input label="Description · facultative" value={ticket.description} placeholder="Ex. Entrée seule, boisson non comprise" onChange={(event) => onChange('description', event.target.value)} />
        </div>
      </div>
    </div>
  )
})
