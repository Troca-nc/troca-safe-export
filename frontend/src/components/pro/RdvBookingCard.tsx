'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, CalendarDays, CheckCircle2, Clock3, MessageCircle, MapPin, UserRound, XCircle } from 'lucide-react'

export type RdvBookingItem = {
  id: number | string
  pro_id: number | string
  requester_user_id?: number | string | null
  slot_id?: number | string | null
  requester_name: string
  requester_email: string
  requester_phone?: string | null
  commune?: string | null
  service_title?: string | null
  service_price_xpf?: number | null
  service_duration_minutes?: number | null
  subject: string
  details?: string | null
  starts_at: string
  ends_at?: string | null
  status: string
  source?: string | null
  role: 'client' | 'pro'
  created_at?: string
  updated_at?: string
  confirmed_at?: string | null
  declined_at?: string | null
  cancelled_at?: string | null
  completed_at?: string | null
  reminder_24h_sent_at?: string | null
  reminder_2h_sent_at?: string | null
  pro: {
    id: number | string
    display_name: string
    pro_company_name?: string | null
    pro_category?: string | null
    pro_commune?: string | null
    pro_phone?: string | null
    pro_website?: string | null
    pro_hours?: string | null
    pro_logo_url?: string | null
    pro_banner_url?: string | null
    pro_avatar_url?: string | null
  }
  requester: {
    id?: number | string | null
    prenom?: string | null
    nom?: string | null
    avatar_url?: string | null
    email?: string | null
  }
  slot?: {
    id?: number | string | null
    starts_at?: string | null
    ends_at?: string | null
    label?: string | null
    status?: string | null
  } | null
}

type RdvBookingCardProps = {
  booking: RdvBookingItem
  onContact?: (bookingId: number | string) => Promise<void> | void
  onConfirm?: (bookingId: number | string) => Promise<void> | void
  onDecline?: (bookingId: number | string) => Promise<void> | void
  onCancel?: (bookingId: number | string) => Promise<void> | void
  onReview?: (bookingId: number | string) => Promise<void> | void
}

function formatSlotLabel(booking: RdvBookingItem) {
  const startsAt = new Date(booking.starts_at)
  const endsAt = booking.ends_at ? new Date(booking.ends_at) : null
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(startsAt)
  const start = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt)
  const end = endsAt
    ? new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(endsAt)
    : null
  return `${date} ï¿½ ${start}${end ? ` ï¿½ ${end}` : ''}`
}

function statusLabel(status: string) {
  const value = String(status || '').toLowerCase()
  if (value === 'pending') return { label: 'En attente', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (value === 'confirmed') return { label: 'Confirmï¿½', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (value === 'declined') return { label: 'Refusï¿½', tone: 'bg-red-50 text-red-700 border-red-200' }
  if (value === 'cancelled') return { label: 'Annulï¿½', tone: 'bg-slate-100 text-slate-500 border-slate-200' }
  if (value === 'completed') return { label: 'Terminï¿½', tone: 'bg-sky-50 text-sky-700 border-sky-200' }
  if (value === 'no_show') return { label: 'Absent', tone: 'bg-rose-50 text-rose-700 border-rose-200' }
  return { label: 'En cours', tone: 'bg-slate-100 text-slate-600 border-slate-200' }
}

function reminderLabel(value?: string | null, fallback = 'Rappel') {
  if (!value) return null;
  return `${fallback} envoyï¿½`;
}

export default function RdvBookingCard({
  booking,
  onContact,
  onConfirm,
  onDecline,
  onCancel,
  onReview,
}: RdvBookingCardProps) {
  const status = statusLabel(booking.status)
  const isClient = booking.role === 'client'
  const partnerName = isClient
    ? (booking.pro.display_name || booking.pro.pro_company_name || 'Professionnel')
    : (booking.requester.prenom || booking.requester_name || 'Client')
  const partnerAvatar = isClient ? booking.pro.pro_logo_url : booking.requester.avatar_url
  const partnerInitials = partnerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'RD'

  const canManageAsPro = booking.role === 'pro' && booking.status === 'pending'
  const isFutureBooking = new Date(booking.starts_at).getTime() > Date.now()
  const canCancelAsClient = booking.role === 'client'
    && isFutureBooking
    && !['cancelled', 'declined', 'completed'].includes(String(booking.status).toLowerCase())
  const canReview = booking.role === 'client' && String(booking.status).toLowerCase() === 'completed' && Boolean(onReview)
  const reminderBadges = [
    reminderLabel(booking.reminder_24h_sent_at, 'Rappel J-1'),
    reminderLabel(booking.reminder_2h_sent_at, 'Rappel H-2'),
  ].filter(Boolean) as string[]

  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
          {isClient ? 'Mes demandes' : 'Demandes reï¿½ues'}
        </span>
        <span className="rounded-full bg-[#0A7EA4]/8 px-3 py-1 text-xs font-semibold text-[#0A7EA4]">
          {formatSlotLabel(booking)}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0A7EA4]/10 text-[#0A7EA4]">
          {partnerAvatar ? (
            <Image src={partnerAvatar} alt={partnerName} width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold">{partnerInitials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-night">
            {isClient ? booking.pro.display_name : booking.requester_name}
          </h3>
          <p className="mt-1 text-sm text-night/60">{booking.subject}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-night/65 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
          {formatSlotLabel(booking)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#0A7EA4]" />
          {booking.commune || booking.pro.pro_commune || 'Nouvelle-CalÃ©donie'}
        </p>
        <p className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-[#0A7EA4]" />
          {isClient ? booking.pro.pro_category || 'Professionnel' : booking.requester_name}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#0A7EA4]" />
          {booking.requester_phone || booking.requester_email}
        </p>
      </div>

      {reminderBadges.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {reminderBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {booking.details ? (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-night/70">
          {booking.details}
        </p>
      ) : null}

      {booking.service_title ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
            {booking.service_title}
          </span>
          {booking.service_duration_minutes ? (
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
              {booking.service_duration_minutes} min
            </span>
          ) : null}
          {booking.service_price_xpf != null ? (
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
              {Number(booking.service_price_xpf).toLocaleString('fr-FR')} XPF
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {booking.pro.pro_website ? (
          <Link
            href={booking.pro.pro_website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/5"
          >
            <MessageCircle className="h-4 w-4" />
            Voir la vitrine
          </Link>
        ) : null}

        {onContact ? (
          <button
            type="button"
            onClick={() => onContact(booking.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/5"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter
          </button>
        ) : null}

        {canManageAsPro && onConfirm ? (
          <button
            type="button"
            onClick={() => onConfirm(booking.id)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmer
          </button>
        ) : null}

        {canManageAsPro && onDecline ? (
          <button
            type="button"
            onClick={() => onDecline(booking.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <XCircle className="h-4 w-4" />
            Refuser
          </button>
        ) : null}

        {canCancelAsClient && onCancel ? (
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            <XCircle className="h-4 w-4" />
            Annuler
          </button>
        ) : null}

        {canReview && onReview ? (
          <button
            type="button"
            onClick={() => onReview(booking.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            <BadgeCheck className="h-4 w-4" />
            Laisser un avis
          </button>
        ) : null}
      </div>
    </article>
  )
}
