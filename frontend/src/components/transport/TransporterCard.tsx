'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, MapPin, Users } from 'lucide-react'

export type TransporterCardModel = {
  id: string | number
  company_name: string
  display_name?: string | null
  prenom?: string | null
  nom?: string | null
  pro_logo_url?: string | null
  vehicle_photo_url?: string | null
  transport_type: string[]
  transport_type_labels?: string[]
  vehicle_description?: string | null
  vehicle_capacity?: number | null
  service_zones?: string[]
  base_price_xpf?: number | null
  price_per_km_xpf?: number | null
  avg_rating?: number | null
  total_rides?: number | null
  rides_completed?: number | null
  is_verified?: boolean
  is_available?: boolean
  pro_commune?: string | null
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'T'
}

function formatRating(value?: number | null) {
  const rating = Number(value ?? 0)
  if (!Number.isFinite(rating) || rating <= 0) return '0.0'
  return rating.toFixed(1)
}

function formatPrice(value?: number | null) {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('fr-FR')} XPF`
}

export default function TransporterCard({
  transporter,
  detailHref,
  quoteHref,
}: {
  transporter: TransporterCardModel
  detailHref?: string
  quoteHref?: string
}) {
  const displayName = transporter.display_name || transporter.company_name || 'Transporteur Kalico'
  const initials = getInitials(displayName)
  const labels = transporter.transport_type_labels || transporter.transport_type || []

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-20 overflow-hidden bg-[linear-gradient(135deg,_rgba(8,32,50,0.95),_rgba(10,126,164,0.45))]">
        {transporter.vehicle_photo_url ? (
          <Image
            src={transporter.vehicle_photo_url}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <div className="-mt-6 px-4 pb-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
              {transporter.pro_logo_url ? (
                <Image
                  src={transporter.pro_logo_url}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-[#0A7EA4]">{initials}</span>
              )}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Pro
          </span>
        </div>

        <h3 className="text-base font-semibold text-night">{displayName}</h3>
        <p className="mt-1 text-xs text-night/60">{transporter.vehicle_description || 'Transport local en Nouvelle-Calédonie'}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-night/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5 text-coral" />
            {transporter.pro_commune || transporter.service_zones?.[0] || 'Nouvelle-Calédonie'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
            <BadgeCheck className="h-3.5 w-3.5 text-amber-500" />
            {formatRating(transporter.avg_rating)} ({Number(transporter.total_rides ?? transporter.rides_completed ?? 0)} courses)
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {labels.slice(0, 4).map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 px-2.5 py-1 text-[11px] font-medium text-night/60"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-night/45">
            <Users className="h-3.5 w-3.5 text-[#0A7EA4]" />
            � partir de
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-night/55">
            <span>{formatPrice(transporter.base_price_xpf)}</span>
            <span>+ {Number(transporter.price_per_km_xpf ?? 0).toLocaleString('fr-FR')} XPF / km</span>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href={detailHref || `/covoiturage/transport/${transporter.id}`}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl border border-[#0A7EA4]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/5"
            >
              Voir disponibilit�s
            </Link>
            <Link
              href={quoteHref || `/covoiturage/transport/${transporter.id}#devis`}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl bg-[#0A7EA4] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Demander devis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
