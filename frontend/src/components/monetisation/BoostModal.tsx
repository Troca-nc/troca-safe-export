'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, Camera, CreditCard, Globe, Loader2, TrendingUp, X, Zap } from 'lucide-react'

import DemoModeNotice from '@/components/DemoModeNotice'
import { useBoostPayment, type SavedCard } from '@/hooks/usePayment'
import { BOOST_CATALOG, formatXPF } from '@/types/monetisation.types'
import type { BoostDuration, BoostOption, BoostType, PaymentProvider } from '@/types/monetisation.types'

const BOOST_ICONS: Record<BoostType, ReactNode> = {
  une: <TrendingUp size={18} className="text-amber-500" />,
  urgent: <Zap size={18} className="text-red-500" />,
  remonte: <TrendingUp size={18} className="text-blue-500" />,
  photos: <Camera size={18} className="text-emerald-500" />,
}

function ProviderSelector({
  value,
  onChange,
}: {
  value: PaymentProvider
  onChange: (provider: PaymentProvider) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-night/50">Moyen de paiement</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: 'stripe', label: 'Carte bancaire', sub: 'Via Stripe', icon: CreditCard },
          { value: 'payplug', label: 'Paiement local', sub: 'Via PayPlug', icon: Globe },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value as PaymentProvider)}
            className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
              value === option.value ? 'border-coral bg-coral/8' : 'border-night/10 hover:border-night/25'
            }`}
          >
            <option.icon className="h-5 w-5 text-night/60" />
            <span className="text-xs font-medium text-night">{option.label}</span>
            <span className="text-[10px] text-night/40">{option.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function formatCardLabel(card: SavedCard) {
  return `${String(card.brand || 'card').toUpperCase()} """" ${card.last4}`
}

interface BoostModalProps {
  annonce: { id: number; titre: string }
  onClose: () => void
}

export default function BoostModal({ annonce, onClose }: BoostModalProps) {
  const [selectedBoost, setSelectedBoost] = useState<BoostOption>(BOOST_CATALOG[0])
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [cardsLoading, setCardsLoading] = useState(false)

  const { initiateBoost, initiateBoostOneClick, loadSavedCards, loading, error } = useBoostPayment()
  const boostTypes = useMemo(() => Array.from(new Set(BOOST_CATALOG.map((boost) => boost.type))), [])
  const selectedSavedCard = useMemo(
    () => savedCards.find((card) => card.id === selectedCardId) || null,
    [savedCards, selectedCardId]
  )

  useEffect(() => {
    let alive = true
    if (!annonce?.id) return
    setCardsLoading(true)
    void loadSavedCards().then((result) => {
      if (!alive) return
      if (result.ok && Array.isArray(result.cards)) {
        setSavedCards(result.cards)
        setSelectedCardId((current) => current || result.cards[0]?.id || '')
      } else {
        setSavedCards([])
        setSelectedCardId('')
      }
      setCardsLoading(false)
    })

    return () => {
      alive = false
    }
  }, [annonce?.id, loadSavedCards])

  const handlePay = () => {
    if (selectedSavedCard) {
      void initiateBoostOneClick({
        annonce_id: annonce.id,
        boost_type: selectedBoost.type,
        boost_duration: selectedBoost.duration as BoostDuration,
        payment_method_id: selectedSavedCard.id,
      })
      return
    }

    void initiateBoost({
      annonce_id: annonce.id,
      boost_type: selectedBoost.type,
      boost_duration: selectedBoost.duration as BoostDuration,
      provider,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-night/8 bg-white px-5 py-4">
          <div>
            <h2 className="font-semibold text-night">Booster l'annonce</h2>
            <p className="max-w-[240px] truncate text-xs text-night/50">{annonce.titre}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl p-1.5 text-night/40 transition hover:bg-sand hover:text-night">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <DemoModeNotice />

          <div className="rounded-2xl border border-night/8 bg-sand/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/45">Paiement rapide</p>
                <p className="mt-1 text-sm font-semibold text-night">Cartes enregistrées</p>
              </div>
              {cardsLoading ? <Loader2 size={16} className="animate-spin text-night/45" /> : null}
            </div>

            {savedCards.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {savedCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selectedCardId === card.id
                        ? 'border-coral bg-coral/8'
                        : 'border-night/8 bg-white hover:border-night/20'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-night">{formatCardLabel(card)}</p>
                      <p className="text-xs text-night/45">
                        {card.holder_name || 'Titulaire non renseigné'} · expire {String(card.exp_month || '--').padStart(2, '0')}/{card.exp_year || '----'}
                      </p>
                    </div>
                    <span className="rounded-full bg-nc-lagonLight px-2.5 py-1 text-[11px] font-semibold text-nc-lagon">
                      {selectedCardId === card.id ? 'Sélectionnée' : 'Choisir'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-night/55">Aucune carte enregistrée. Le paiement standard reste disponible.</p>
            )}
          </div>

          <div>
            <p className="mb-3 text-xs text-night/50">Choisissez votre boost</p>
            <div className="space-y-2">
              {boostTypes.map((type) => {
                const options = BOOST_CATALOG.filter((item) => item.type === type)
                const first = options[0]
                return (
                  <div key={type} className="overflow-hidden rounded-2xl border border-night/8">
                    <div className="flex items-center gap-2 bg-sand/50 px-3 py-2.5">
                      {BOOST_ICONS[type]}
                      <span className="text-sm font-medium text-night">{first.emoji} {first.label.split(' ')[0]}</span>
                    </div>
                    <div className="divide-y divide-night/6">
                      {options.map((option) => (
                        <label
                          key={`${option.type}-${option.duration}`}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-all ${
                            selectedBoost.type === option.type && selectedBoost.duration === option.duration
                              ? 'bg-coral/8'
                              : 'hover:bg-sand'
                          }`}
                        >
                          <input
                            type="radio"
                            name="boost"
                            checked={selectedBoost.type === option.type && selectedBoost.duration === option.duration}
                            onChange={() => setSelectedBoost(option)}
                            className="accent-coral"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-night">{option.description}</p>
                            <p className="text-[10px] text-night/40">{option.duration} jours</p>
                          </div>
                          <p className="text-sm font-bold text-coral">{formatXPF(option.price_xpf)}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedSavedCard ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
              Boost en un clic prêt à être utilisé avec <strong>{formatCardLabel(selectedSavedCard)}</strong>.
              <button type="button" onClick={() => setSelectedCardId('')} className="ml-2 font-semibold underline">
                Utiliser une autre carte
              </button>
            </div>
          ) : (
            <ProviderSelector value={provider} onChange={setProvider} />
          )}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl bg-sand p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-night/50">Total à payer</p>
                <p className="text-2xl font-bold text-night">{formatXPF(selectedBoost.price_xpf)}</p>
              </div>
              <div className="text-right text-xs text-night/40">
                <p>{selectedBoost.emoji} {selectedBoost.label}</p>
                <p>{selectedBoost.duration} jours</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Redirection…
                </>
              ) : selectedSavedCard ? (
                `Payer ${formatXPF(selectedBoost.price_xpf)} avec la carte enregistrée →`
              ) : (
                `Payer ${formatXPF(selectedBoost.price_xpf)} →`
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-night/35">
              Paiement sécurisé · Activation immédiate après paiement
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
