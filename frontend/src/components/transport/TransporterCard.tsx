import Link from 'next/link'
import { ArrowRight, BadgeCheck, MapPin, Users } from 'lucide-react'

import type { Transporter } from '@/types/covoiturage'

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

export default function TransporterCard({ transporter }: { transporter: Transporter }) {
  const labels = transporter.transportTypeLabels.length ? transporter.transportTypeLabels : transporter.transportTypes
  const initials = transporter.displayName.split(/\s+/).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'K'
  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-card transition hover:border-ink">
      <div className="relative flex h-28 items-center justify-center bg-cream-sunken text-ink/40">
        <div className="absolute inset-0 bg-tressage text-ink/5" />
        <span className="relative font-mono text-mono-xs">Visuel du véhicule</span>
        {transporter.available ? <span className="absolute left-3 top-3 rounded-pill border border-warm-border bg-cream-surface px-3 py-1 text-caption font-semibold text-reef-text">Disponible</span> : null}
        {transporter.verified ? <span className="absolute right-3 top-3 flex items-center gap-1 rounded-pill bg-reef px-3 py-1 text-caption font-semibold text-ink"><BadgeCheck className="h-3.5 w-3.5" />Pro</span> : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-end gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-card border-2 border-cream-surface bg-cream-sunken font-display text-h4">{initials}</span><div className="min-w-0"><h3 className="truncate text-h5 text-ink">{transporter.displayName}</h3><p className="mt-1 flex items-center gap-1 text-meta text-ink/60"><MapPin className="h-4 w-4" />{transporter.commune || transporter.serviceZones[0] || 'Nouvelle-Calédonie'}</p></div></div>
        <p className="mt-4 text-body-sm text-ink/70">{transporter.vehicleDescription || 'Transport professionnel sur réservation.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">{labels.slice(0, 4).map((label) => <span key={label} className="rounded-pill border border-warm-border bg-cream-sunken px-3 py-1 text-caption text-ink/70">{label}</span>)}</div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-warm-border-inner pt-4 text-meta text-ink/65"><span>★ {transporter.rating?.toFixed(1) || 'Nouveau'}</span><span className="flex items-center gap-1"><Users className="h-4 w-4" />{transporter.ridesCompleted} courses</span></div>
        <div className="mt-4 flex items-baseline gap-2">{transporter.basePriceXpf !== null ? <strong className="font-display text-price-sm">{money.format(transporter.basePriceXpf)} F</strong> : <strong className="text-label">Tarif sur devis</strong>}{transporter.pricePerKmXpf !== null ? <span className="text-meta text-ink/55">+ {money.format(transporter.pricePerKmXpf)} F/km</span> : null}</div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5"><Link href={`/covoiturage/transport/${transporter.id}`} className="k-button k-button-secondary">Voir la fiche</Link><Link href={`/covoiturage/transport/${transporter.id}#devis`} className="k-button k-button-primary">Demander<ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </article>
  )
}
