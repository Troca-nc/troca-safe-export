'use client'

import { useState } from 'react'
import { BadgeCheck, Car, RefreshCw, Send } from 'lucide-react'

import { formatRideDate, formatRideTime } from '@/lib/covoiturageFormat'
import { bookRide } from '@/lib/data/covoiturage'
import type { Ride } from '@/types/covoiturage'

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const dayLabels = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

function recurrenceLabel(ride: Ride) {
  if (ride.recurrenceType === 'daily') return 'Tous les jours'
  if (ride.recurrenceType === 'weekly') return ride.recurrenceDays.length ? ride.recurrenceDays.map((day) => dayLabels[day]).join(', ') : 'Chaque semaine'
  return null
}

export default function RideCard({ ride, currentUserId, onRequireAuth, onBooked }: { ride: Ride; currentUserId?: string | null; onRequireAuth: () => void; onBooked: () => void | Promise<void> }) {
  const [messageOpen, setMessageOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isOwner = currentUserId && currentUserId === ride.driverId
  const recurrence = recurrenceLabel(ride)
  const comforts = [ride.noSmoking && 'Non-fumeur', ride.musicAllowed && 'Musique', ride.animalsAllowed && 'Animaux acceptés'].filter(Boolean) as string[]

  const reserve = async () => {
    if (!currentUserId) return onRequireAuth()
    setLoading(true); setStatus(null)
    try { await bookRide(ride.id, ride.bookingMode === 'manual' ? message.trim() : undefined); setStatus(ride.bookingMode === 'manual' ? 'Demande envoyée' : 'Place réservée'); setMessageOpen(false); await onBooked() }
    catch { setStatus('Réservation impossible pour le moment') }
    finally { setLoading(false) }
  }

  return <article className={`rounded-card border border-warm-border bg-cream-surface p-5 shadow-card transition hover:border-ink sm:p-7 ${ride.featured ? 'border-l-4 border-l-accent' : ''}`}>
    <div className="flex flex-wrap gap-2">{ride.featured ? <span className="rounded-pill bg-accent px-3 py-1 text-caption font-semibold text-ink">Boosté</span> : null}<span className="rounded-pill border border-warm-border bg-cream-sunken px-3 py-1 text-caption font-semibold">{formatRideDate(ride.dateIso)}</span>{recurrence ? <span className="flex items-center gap-1 rounded-pill bg-info/15 px-3 py-1 text-caption font-semibold text-info-text"><RefreshCw className="h-3.5 w-3.5" />{recurrence}</span> : null}{ride.verifiedDriver ? <span className="flex items-center gap-1 rounded-pill bg-reef/15 px-3 py-1 text-caption font-semibold text-reef-text"><BadgeCheck className="h-3.5 w-3.5" />Conducteur vérifié</span> : null}{ride.womenOnly ? <span className="rounded-pill bg-accent/15 px-3 py-1 text-caption font-semibold text-accent-text">Réservé aux femmes</span> : null}</div>
    <div className="mt-5 grid gap-5 md:grid-cols-[6rem_1fr_11rem] md:items-center"><div className="text-center"><p className="font-display text-h3">{formatRideTime(ride.time)}</p></div><div><div className="grid grid-cols-[1rem_1fr] gap-x-3"><span className="mt-2 h-2.5 w-2.5 rounded-full border-2 border-reef" /><p className="text-body-lg font-semibold">{ride.departure}</p><span className="mx-auto h-6 w-px bg-warm-border" /><span /><span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent-strong" /><p className="text-body-lg font-semibold">{ride.destination}</p></div>{ride.viaStops.length ? <p className="mt-3 text-meta text-ink/60">Via {ride.viaStops.join(', ')}</p> : null}<p className="mt-3 text-body-sm text-ink/70">{ride.description}</p><div className="mt-3 flex flex-wrap gap-2">{comforts.map((item) => <span key={item} className="rounded-pill bg-cream-sunken px-3 py-1 text-caption text-ink/65">{item}</span>)}</div></div><div className="text-right"><p className="font-display text-price">{money.format(ride.priceXpf)} <span className="text-body-sm text-ink/55">F</span></p><p className="mt-2 text-meta text-ink/60">{ride.seatsRemaining > 1 ? `${ride.seatsRemaining} places restantes` : ride.seatsRemaining === 1 ? 'Dernière place' : 'Complet'}</p>{!isOwner && ride.seatsRemaining > 0 ? <button type="button" disabled={loading} onClick={() => ride.bookingMode === 'manual' ? setMessageOpen(true) : void reserve()} className={`mt-4 min-h-11 rounded-control px-4 text-label font-semibold ${ride.bookingMode === 'auto' ? 'bg-accent-strong text-cream' : 'border border-ink text-ink'}`}>{loading ? 'Envoi…' : ride.bookingMode === 'auto' ? 'Réserver' : 'Demander'}</button> : null}</div></div>
    <div className="mt-5 flex items-center gap-3 border-t border-warm-border-inner pt-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-info/15 text-label font-semibold text-info-text">{ride.driverInitials}</span><div><p className="text-label">{ride.driverName}</p><p className="text-meta text-ink/55">★ {ride.rating?.toFixed(1) || 'Nouveau'} · {ride.reviewsCount} avis{ride.trustScore !== null ? ` · confiance ${ride.trustScore}/100` : ''}</p></div>{ride.vehicle ? <span className="ml-auto hidden items-center gap-2 text-meta text-ink/55 sm:flex"><Car className="h-4 w-4" />{ride.vehicle}</span> : null}</div>
    {messageOpen ? <div className="mt-5 rounded-card bg-cream-sunken p-4"><label className="text-label-sm font-semibold">Message au conducteur<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="mt-2 w-full rounded-field border border-warm-border bg-cream-surface p-3 text-base" placeholder="Présentez brièvement votre demande." /></label><div className="mt-3 flex gap-2"><button type="button" onClick={() => void reserve()} className="k-button k-button-primary" disabled={loading}><Send className="h-4 w-4" />Envoyer</button><button type="button" onClick={() => setMessageOpen(false)} className="k-button k-button-ghost">Annuler</button></div></div> : null}{status ? <p className="mt-4 rounded-control bg-cream-sunken p-3 text-meta" role="status">{status}</p> : null}
  </article>
}
