'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, Zap } from 'lucide-react'

import { useBoostPayment } from '@/hooks/usePayment'

type BoostListing = {
  id: string | number
  title: string
  cover_image?: string | null
  price?: number | null
}

type BoostPlan = {
  days: number
  price: number
  label: string
  highlight?: boolean
}

const BOOST_PLANS: BoostPlan[] = [
  { days: 3, price: 990, label: 'Idéal pour tester' },
  { days: 7, price: 1990, label: 'Le plus populaire', highlight: true },
  { days: 30, price: 5900, label: 'Visibilité maximale' },
]

export default function BoostModal({
  open,
  onClose,
  listing,
}: {
  open: boolean
  onClose: () => void
  listing: BoostListing | null
}) {
  const { initiateBoost, loading, error } = useBoostPayment()
  const [selectedDays, setSelectedDays] = useState(7)
  const [success, setSuccess] = useState(false)

  const selectedPlan = useMemo(
    () => BOOST_PLANS.find((plan) => plan.days === selectedDays) || BOOST_PLANS[1],
    [selectedDays]
  )

  useEffect(() => {
    if (!open) {
      setSuccess(false)
      setSelectedDays(7)
      return
    }
    const timer = window.setTimeout(() => undefined, 0)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => {
      onClose()
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [onClose, success])

  if (!open || !listing) return null

  const handlePay = async () => {
    const result = await initiateBoost({
      annonce_id: Number(listing.id),
      boost_type: 'une',
      boost_duration: selectedPlan.days,
      provider: 'stripe',
    })
    if (result?.ok) {
      setSuccess(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-[var(--color-surface)] p-6 shadow-2xl transition-all duration-200 animate-scale-in">
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-600" />
            <h3 className="mt-4 font-display text-2xl font-bold text-night">Boost activé !</h3>
            <p className="mt-2 max-w-md text-sm text-night/60">
              Votre annonce est maintenant mise en avant sur Kalico.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary mt-6 px-5 py-3 text-sm"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Boost</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-night">⚡ Booster cette annonce</h3>
                <p className="mt-1 text-sm text-night/60">Votre annonce apparaît en tête des résultats et sur la homepage.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold text-night/60 transition hover:bg-[var(--color-background-secondary)]"
              >
                Annuler
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {BOOST_PLANS.map((plan) => {
                const active = plan.days === selectedDays
                return (
                  <button
                    key={plan.days}
                    type="button"
                    onClick={() => setSelectedDays(plan.days)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-[#0A7EA4] bg-nc-lagonLight shadow-sm'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-night">
                        <Zap className={`h-4 w-4 ${active ? 'text-[#0A7EA4]' : 'text-amber-500'}`} />
                        {plan.days} jours
                      </span>
                      {plan.highlight ? (
                        <span className="rounded-full bg-[#0A7EA4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          Le plus populaire
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-night">{plan.price.toLocaleString('fr-FR')} XPF</p>
                    <p className="mt-1 text-xs text-night/60">{plan.label}</p>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <p className="text-sm font-semibold text-night">Annonce</p>
              <p className="mt-1 text-sm text-night/65 line-clamp-2">{listing.title}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-night/60">
                  {selectedPlan.days} jours · {selectedPlan.price.toLocaleString('fr-FR')} XPF
                </span>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={loading}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Paiement...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Payer {selectedPlan.price.toLocaleString('fr-FR')} XPF
                    </>
                  )}
                </button>
              </div>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
