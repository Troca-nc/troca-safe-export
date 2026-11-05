import Image from 'next/image'
import { Image as ImageIcon } from 'lucide-react'

import { computeDiscountPercent, DEAL_CATEGORIES } from '@/lib/data/deals'
import type { DealOfferType, DealPlaceMode, DealPublishDraft } from '@/types/deals'

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? '' : `${date.getDate()} ${months[date.getMonth()]}`
}

export function DealPreviewCard({ form, offerType, placeMode, communeName }: {
  form: DealPublishDraft
  offerType: DealOfferType
  placeMode: DealPlaceMode
  communeName: string
}) {
  const discount = offerType === 'price'
    ? computeDiscountPercent(form.originalPriceXpf, form.promoPriceXpf)
    : offerType === 'percent' && Number(form.discountPercent) > 0 ? Number(form.discountPercent) : null
  const badge = offerType === 'code' ? 'CODE' : offerType === 'multi' ? 'OFFRE' : discount ? `−${discount} %` : '− %'
  const category = DEAL_CATEGORIES.find((item) => item.value === form.category)?.label || 'Catégorie'
  const start = formatDate(form.validFrom)
  const end = formatDate(form.validUntil)
  const period = end ? (start ? `Du ${start} au ${end}` : `Jusqu’au ${end}`) : 'Dates à définir'
  const location = placeMode === 'online'
    ? 'En ligne'
    : [form.locationName.trim(), communeName].filter(Boolean).join(', ') || 'Lieu à définir'
  const description = offerType === 'multi' && form.specialDetail.trim()
    ? form.specialDetail.trim()
    : form.description.trim() || 'Les conditions apparaîtront ici.'
  const imageUrl = form.imageUrl.trim()
  const hasValidImageUrl = /^https?:\/\//i.test(imageUrl)

  return (
    <div>
      <p className="mb-2 text-eyebrow-sm uppercase text-ink/60">Aperçu · tel que les visiteurs le verront</p>
      <article className="overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-panel">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-cream-sunken text-ink/40">
          {hasValidImageUrl ? <Image src={imageUrl} alt="" fill className="object-cover" sizes="400px" /> : <ImageIcon className="h-11 w-11" aria-hidden="true" />}
          <span className="absolute left-3.5 top-3.5 rounded-pill bg-ink px-3 py-1.5 text-label-sm font-semibold text-cream">{category}</span>
          <span className="absolute right-3.5 top-3.5 rounded-control bg-accent-strong px-3 py-2 font-display text-h4 text-cream shadow-card">{badge}</span>
        </div>
        <div className="p-5">
          <p className="text-eyebrow uppercase text-accent-text">{form.businessName.trim() || 'Enseigne'}</p>
          <h3 className={`mt-2 font-display text-h3 ${form.title.trim() ? 'text-ink' : 'text-ink/45'}`}>{form.title.trim() || 'Titre du bon plan'}</h3>
          {offerType === 'price' && Number(form.originalPriceXpf) > 0 ? <div className="mt-3 flex items-baseline gap-3"><span className="font-display text-price-sm">{money.format(Number(form.promoPriceXpf) || 0)} XPF</span><span className="text-body-sm text-ink/55 line-through" aria-label={`ancien prix ${money.format(Number(form.originalPriceXpf))} XPF`}>{money.format(Number(form.originalPriceXpf))} XPF</span></div> : null}
          {offerType === 'code' && form.promoCode.trim() ? <div className="mt-3 inline-flex gap-2 rounded-control border border-dashed border-ink px-3 py-2 text-body-sm"><span className="text-ink/60">Code</span><strong className="tracking-[0.12em]">{form.promoCode.trim().toUpperCase()}</strong></div> : null}
          <p className="mt-3 line-clamp-2 text-body-sm text-ink/70">{description}</p>
          <div className="mt-4 space-y-1 text-body-sm"><p>{period}</p><p className="font-semibold text-info-text">{location}</p></div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-sand pt-4"><span className="text-meta font-semibold text-accent-text">{end ? `Se termine le ${end}` : 'Date de fin à définir'}</span><span className="rounded-control bg-accent-strong px-4 py-2.5 text-label font-semibold text-cream">{placeMode === 'online' ? 'Voir l’offre' : 'En profiter'}</span></div>
        </div>
      </article>
    </div>
  )
}
