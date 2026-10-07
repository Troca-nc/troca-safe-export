'use client'

import Link from 'next/link'
import { CalendarDays, Eye, FileInput, MessageCircle, PackageSearch, Star } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { formatXpf, isLowStock } from '@/lib/proSpacePresentation'
import type { ProSpaceData } from '@/types/pro-space'

function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(new Date(value))
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Eye }) {
  return (
    <Card className="p-5 hover:border-warm-border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-ink/60">{label}</p>
          <p className="mt-2 font-display text-h3 text-ink">{value}</p>
          <p className="mt-2 text-body-sm text-ink/60">{detail}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-info-soft text-info-text">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  )
}

export default function ProDashboardOverview({ data }: { data: ProSpaceData }) {
  const lowStock = data.products.filter(isLowStock)
  const upcomingBookings = data.bookings
    .filter((booking) => new Date(booking.starts_at).getTime() >= Date.now() && !['cancelled', 'declined'].includes(booking.status))
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
  const latestReviews = [...data.reviews]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 3)
  const stats = data.dashboard.stats

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        <Metric icon={Eye} label="Vues" value={stats.views_total.toLocaleString('fr-FR')} detail={`${stats.views_7d.toLocaleString('fr-FR')} sur les 7 derniers jours`} />
        <Metric icon={MessageCircle} label="Contacts" value={stats.contacts_total.toLocaleString('fr-FR')} detail={`${stats.contacts_7d.toLocaleString('fr-FR')} sur les 7 derniers jours`} />
        <Metric icon={FileInput} label="Demandes à préparer" value={data.requests.length.toLocaleString('fr-FR')} detail="Demandes de devis reçues" />
        <Metric icon={CalendarDays} label="Prochains rendez-vous" value={upcomingBookings.length.toLocaleString('fr-FR')} detail="Réservations à venir" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <Card className="hover:border-warm-border">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-eyebrow uppercase text-accent-text">Activité</p>
              <h2 className="mt-2 font-display text-h3 font-normal">Vues et contacts sur 30 jours</h2>
            </div>
            <p className="text-body-sm text-ink/60">Conversion actuelle : {stats.avg_conversion_rate.toFixed(1)} %</p>
          </div>
          {data.dashboard.timeline_30d.length ? (
            <div className="mt-6 h-72" aria-label="Courbe des vues et contacts">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dashboard.timeline_30d}>
                  <CartesianGrid stroke="var(--color-border-inner)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" stroke="var(--color-text-subtle)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-subtle)" tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" name="Vues" stroke="var(--color-info-text)" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="contacts" name="Contacts" stroke="var(--color-success-text)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 rounded-control bg-cream-sunken p-5 text-body-sm text-ink/65">Aucune activité mesurée pour cette période.</p>
          )}
        </Card>

        <Card className="hover:border-warm-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-eyebrow uppercase text-accent-text">Avis publiés</p>
              <h2 className="mt-2 font-display text-h3 font-normal">{data.reviewSummary.avg_rating.toFixed(1)} / 5</h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-success-soft text-success-text"><Star className="h-5 w-5" aria-hidden="true" /></span>
          </div>
          <p className="mt-3 text-body-sm text-ink/65">{data.reviewSummary.review_count} avis, dont {data.reviewSummary.verified_count} vérifiés.</p>
          {data.reviewsUnavailable ? <FeedbackAlert className="mt-4">Les avis ne sont pas accessibles tant que la vitrine publique n’est pas disponible.</FeedbackAlert> : null}
          <div className="mt-5 grid gap-3">
            {latestReviews.length ? latestReviews.map((review) => (
              <article key={review.id} className="rounded-control border border-warm-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{review.reviewer_prenom || 'Client Kalico'}</p>
                  <span className="text-label-sm text-success-text">{review.rating}/5</span>
                </div>
                {review.comment ? <p className="mt-2 line-clamp-3 text-body-sm text-ink/65">{review.comment}</p> : null}
              </article>
            )) : <p className="rounded-control bg-cream-sunken p-4 text-body-sm text-ink/65">Aucun avis publié.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="hover:border-warm-border">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display text-h4">Demandes récentes</h2><FileInput className="h-5 w-5 text-info-text" aria-hidden="true" /></div>
          <div className="mt-4 grid gap-3">
            {data.requests.slice(0, 3).map((request) => <article key={request.id} className="rounded-control bg-cream-sunken p-4"><p className="font-semibold">{request.request.requester_name}</p><p className="mt-1 text-body-sm text-ink/65">{request.request.need_type || 'Besoin à préciser'} · {request.request.commune}</p>{request.request.budget_xpf ? <p className="mt-2 text-label-sm text-accent-text">Budget : {formatXpf(Number(request.request.budget_xpf))}</p> : null}</article>)}
            {!data.requests.length ? <p className="text-body-sm text-ink/65">Aucune demande en attente.</p> : null}
          </div>
          <Link href="/pro/dashboard/devis" className="k-button k-button-tertiary mt-5 w-full">Ouvrir les devis</Link>
        </Card>

        <Card className="hover:border-warm-border">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display text-h4">Agenda</h2><CalendarDays className="h-5 w-5 text-info-text" aria-hidden="true" /></div>
          <div className="mt-4 grid gap-3">
            {upcomingBookings.slice(0, 3).map((booking) => <article key={booking.id} className="rounded-control bg-cream-sunken p-4"><p className="font-semibold">{booking.subject}</p><p className="mt-1 text-body-sm text-ink/65">{booking.requester_name}</p><p className="mt-2 text-label-sm text-info-text">{formatDate(booking.starts_at, true)}</p></article>)}
            {!upcomingBookings.length ? <p className="text-body-sm text-ink/65">Aucun rendez-vous à venir.</p> : null}
          </div>
          <Link href="/pro/dashboard/rdv" className="k-button k-button-tertiary mt-5 w-full">Gérer l’agenda</Link>
        </Card>

        <Card className="hover:border-warm-border">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display text-h4">Stocks faibles</h2><PackageSearch className="h-5 w-5 text-accent-text" aria-hidden="true" /></div>
          <div className="mt-4 grid gap-3">
            {lowStock.slice(0, 4).map((product) => <article key={product.id} className="flex items-center justify-between gap-3 rounded-control bg-cream-sunken p-4"><div className="min-w-0"><p className="truncate font-semibold">{product.title}</p><p className="mt-1 text-body-sm text-ink/60">Stock suivi</p></div><span className="rounded-pill bg-alert-warn/10 px-3 py-2 text-label-sm text-alert-warn">{product.stock_quantity}</span></article>)}
            {!lowStock.length ? <p className="text-body-sm text-ink/65">Aucun stock faible.</p> : null}
          </div>
          <Link href="/pro/dashboard/catalogue" className="k-button k-button-tertiary mt-5 w-full">Gérer le catalogue</Link>
        </Card>
      </section>
    </div>
  )
}
