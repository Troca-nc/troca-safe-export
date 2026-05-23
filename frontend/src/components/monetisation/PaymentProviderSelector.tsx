'use client'

import { Check, CreditCard, Landmark, type LucideIcon } from 'lucide-react'

import type { PaymentProvider } from '@/types/monetisation.types'

type PaymentProviderSelectorProps = {
  value: PaymentProvider
  onChange: (provider: PaymentProvider) => void
  className?: string
}

const OPTIONS: Array<{
  value: PaymentProvider
  title: string
  subtitle: string
  note: string
  icon: LucideIcon
}> = [
  {
    value: 'stripe',
    title: 'Carte bancaire internationale',
    subtitle: 'Visa, Mastercard, Amex et cartes étrangères',
    note: 'Paiement sécurisé et rapide via Stripe.',
    icon: CreditCard,
  },
  {
    value: 'payplug',
    title: 'Carte OPT-NC / réseau local',
    subtitle: 'Cartes locales en Nouvelle-Calédonie',
    note: 'Idéal pour les paiements locaux via PayPlug.',
    icon: Landmark,
  },
]

export function PaymentProviderSelector({ value, onChange, className = '' }: PaymentProviderSelectorProps) {
  return (
    <div className={className}>
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Moyen de paiement</p>
        <p className="mt-1 text-sm text-night/55">
          Choisissez le tunnel le plus adapté à votre carte. Vous pourrez changer d&apos;option avant la confirmation.
        </p>
      </div>

      <div role="radiogroup" aria-label="Moyen de paiement" className="grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const active = value === option.value
          const Icon = option.icon

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`flex min-h-[92px] items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                active
                  ? 'border-coral bg-coral/8 shadow-sm ring-2 ring-coral/15'
                  : 'border-night/10 bg-white hover:border-night/25 hover:bg-sand/40'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                active ? 'bg-coral text-white' : 'bg-sand text-night'
              }`}>
                <Icon size={18} />
              </span>

              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-night">{option.title}</span>
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-coral">
                      <Check size={10} />
                      Sélectionné
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-night/55">{option.subtitle}</span>
                <span className="mt-2 block text-[11px] leading-5 text-night/45">{option.note}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
