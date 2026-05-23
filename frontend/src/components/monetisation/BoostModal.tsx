// src/components/monetisation/BoostModal.tsx
// ── Modale d'achat de boost pour une annonce ──────────────────────────────────

'use client'

import { useState } from 'react'
import { X, Star, AlertCircle, Zap, Camera, TrendingUp, Loader2 } from 'lucide-react'
import { useBoostPayment } from '@/hooks/usePayment'
import DemoModeNotice from '@/components/DemoModeNotice'
import { BOOST_CATALOG, formatXPF } from '@/types/monetisation.types'
import type { BoostOption, BoostType, BoostDuration, PaymentProvider } from '@/types/monetisation.types'

// ── Icônes par type de boost ──────────────────────────────────────────────────

const BOOST_ICONS: Record<BoostType, React.ReactNode> = {
  une:     <Star     size={18} className="text-amber-500" />,
  urgent:  <Zap      size={18} className="text-red-500" />,
  remonte: <TrendingUp size={18} className="text-blue-500" />,
  photos:  <Camera   size={18} className="text-emerald-500" />,
}

// ── Sélecteur provider ────────────────────────────────────────────────────────

function ProviderSelector({
  value,
  onChange,
}: {
  value:    PaymentProvider
  onChange: (p: PaymentProvider) => void
}) {
  return (
    <div>
      <p className="text-xs text-night/50 mb-2">Moyen de paiement</p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { value: 'stripe',  label: 'Carte bancaire',    sub: 'Via Stripe',  emoji: '💳' },
          { value: 'payplug', label: 'Carte FR/NC (BCI, BNC…)', sub: 'Via PayPlug', emoji: '🇳🇨' },
        ] as { value: PaymentProvider; label: string; sub: string; emoji: string }[]).map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
              value === p.value
                ? 'border-coral bg-coral/8'
                : 'border-night/10 hover:border-night/25'
            }`}
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="text-xs font-medium text-night">{p.label}</span>
            <span className="text-[10px] text-night/40">{p.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BoostModalProps {
  annonce: { id: number; titre: string }
  onClose: () => void
}

export default function BoostModal({ annonce, onClose }: BoostModalProps) {
  const [selectedBoost, setSelectedBoost] = useState<BoostOption>(BOOST_CATALOG[0])
  const [provider,      setProvider]      = useState<PaymentProvider>('stripe')

  const { initiateBoost, loading, error } = useBoostPayment()

  // Grouper les boosts par type pour l'affichage
  const boostTypes = Array.from(new Set(BOOST_CATALOG.map(b => b.type)))

  const handlePay = () => {
    initiateBoost({
      annonce_id:     annonce.id,
      boost_type:     selectedBoost.type,
      boost_duration: selectedBoost.duration as BoostDuration,
      provider,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-night/8 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-night">Booster l'annonce</h2>
            <p className="text-xs text-night/50 truncate max-w-[240px]">{annonce.titre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-night/40 hover:text-night rounded-xl hover:bg-sand transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          <DemoModeNotice />

          {/* Sélection du boost */}
          <div>
            <p className="text-xs text-night/50 mb-3">Choisissez votre boost</p>
            <div className="space-y-2">
              {boostTypes.map(type => {
                const options = BOOST_CATALOG.filter(b => b.type === type)
                const first   = options[0]
                return (
                  <div key={type} className="border border-night/8 rounded-2xl overflow-hidden">
                    {/* En-tête type */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-sand/50">
                      {BOOST_ICONS[type]}
                      <span className="text-sm font-medium text-night">{first.emoji} {first.label.split(' —')[0]}</span>
                    </div>
                    {/* Options de durée */}
                    <div className="divide-y divide-night/6">
                      {options.map(opt => (
                        <label
                          key={`${opt.type}-${opt.duration}`}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                            selectedBoost.type === opt.type && selectedBoost.duration === opt.duration
                              ? 'bg-coral/8'
                              : 'hover:bg-sand'
                          }`}
                        >
                          <input
                            type="radio"
                            name="boost"
                            checked={selectedBoost.type === opt.type && selectedBoost.duration === opt.duration}
                            onChange={() => setSelectedBoost(opt)}
                            className="accent-coral"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-night">{opt.description}</p>
                            <p className="text-[10px] text-night/40">{opt.duration} jours</p>
                          </div>
                          <p className="text-sm font-bold text-coral">{formatXPF(opt.price_xpf)}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

                    {/* Sélection provider */}
          <ProviderSelector value={provider} onChange={setProvider} />

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Récap + CTA */}
          <div className="bg-sand rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
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
              className="btn-primary w-full justify-center text-base py-3 disabled:opacity-50"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Redirection…</>
                : `Payer ${formatXPF(selectedBoost.price_xpf)} →`
              }
            </button>
            <p className="text-[10px] text-night/35 text-center mt-2">
              Paiement sécurisé · Activation immédiate après paiement
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
