'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BadgeCheck, Loader2, Ticket, UserCheck } from 'lucide-react'

import Header from '@/components/layout/Header'
import { eventsApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type TicketPayload = {
  id: number
  token: string
  qr_code_url?: string | null
  status: string
  is_scanned: boolean
  scanned_at?: string | null
  scan_location?: string | null
  event_title?: string | null
  event_date?: string | null
  event_time?: string | null
  buyer_name?: string | null
  buyer_email?: string | null
  ticket_type_name?: string | null
  ticket_price_xpf?: number | null
  order_status?: string | null
}

export default function TicketValidationPage() {
  const routeParams = useParams<{ token: string }>()
  const token = Array.isArray(routeParams?.token) ? routeParams.token[0] : routeParams?.token || ''
  const { isAuthenticated, user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [ticket, setTicket] = useState<TicketPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    if (!token) {
      setTicket(null)
      setLoading(false)
      return () => {
        alive = false
      }
    }

    eventsApi.getTicket(token)
      .then((response) => {
        if (!alive) return
        setTicket(response.data?.data || null)
      })
      .catch(() => {
        if (!alive) return
        setTicket(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [token])

  const handleScan = async () => {
    if (!ticket) return
    setError('')
    setSuccess('')

    if (!isAuthenticated) {
        openAuthModal({
          type: 'login',
          redirectTo: `/scan/${token}`,
        })
        return
      }

    setScanning(true)
    try {
      const response = await eventsApi.scanTicket(ticket.token, { location: location.trim() || null })
      setTicket(response.data?.data?.ticket || ticket)
      setSuccess('Billet validï¿½ avec succï¿½s.')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de valider ce billet.')
    } finally {
      setScanning(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
        ) : ticket ? (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <p className="inline-flex items-center gap-2 rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">
              <Ticket className="h-3.5 w-3.5" />
              Validation de billet
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold text-night">{ticket.event_title || 'Billet Kalico'}</h1>
            <p className="mt-2 text-sm text-night/60">{ticket.ticket_type_name || 'Billet standard'} ï¿½ {ticket.token}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Statut</p>
                <p className="mt-2 text-lg font-bold text-night">{ticket.status === 'used' ? 'Dï¿½jï¿½ utilisï¿½' : 'Valide'}</p>
                <p className="mt-1 text-sm text-night/60">{ticket.is_scanned ? 'Ce billet a dï¿½jï¿½ ï¿½tï¿½ scannï¿½.' : 'Ce billet est prï¿½t ï¿½ ï¿½tre contrï¿½lï¿½.'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Acheteur</p>
                <p className="mt-2 text-lg font-bold text-night">{ticket.buyer_name || 'Non renseignï¿½'}</p>
                <p className="mt-1 text-sm text-night/60">{ticket.buyer_email || 'Email non renseignï¿½'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <p className="text-sm font-semibold text-night">Contrï¿½le sur place</p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Entrï¿½e principale / Scï¿½ne"
                className="input mt-3 w-full rounded-2xl"
              />
              {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              {success ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

              <button
                type="button"
                onClick={handleScan}
                disabled={scanning}
                className="btn-primary mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:opacity-60"
              >
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Marquer comme utilisï¿½
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-night/60">
              <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5">
                <UserCheck className="h-4 w-4 text-coral" />
                {isAuthenticated ? `Connectï¿½${user?.first_name ? ` ï¿½ ${user.first_name}` : ''}` : 'Connexion requise pour scanner'}
              </span>
              <Link href="/scan" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold text-night">
                Scanner un autre billet
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
            <p className="text-lg font-semibold text-night">Billet introuvable</p>
            <p className="mt-2 text-sm">Le QR code scannï¿½ ne correspond ï¿½ aucun billet connu.</p>
            <Link href="/scan" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-2.5 text-sm font-semibold text-white">
              Retour au scanner
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
