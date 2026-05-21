// src/components/profil/PhoneVerification.tsx
// ── Composant de vérification téléphone en 2 étapes ──────────────────────────

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Phone, ShieldCheck, RefreshCw, ChevronDown, CheckCircle, Loader2 } from 'lucide-react'
import { usePhoneVerification } from '@/hooks/usePhoneVerification'
import { NC_PHONE_PREFIXES, DEFAULT_PREFIX } from '@/types/phone.types'

// ── Input OTP 6 cases ─────────────────────────────────────────────────────────

function OtpInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return   // chiffres uniquement

    const next = [...digits]

    if (value.length > 1) {
      // Collage d'un code complet (ex: depuis SMS)
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      pasted.forEach((d, i) => { if (i < 6) next[i] = d })
      setDigits(next)
      inputs.current[5]?.focus()
      if (next.every(d => d !== '')) onComplete(next.join(''))
      return
    }

    next[index] = value
    setDigits(next)

    if (value && index < 5) inputs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) onComplete(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) onComplete(pasted)
  }

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="Code de vérification à 6 chiffres">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
            ${digit ? 'border-coral bg-coral/5 text-coral' : 'border-night/15 bg-white text-night'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-coral focus:bg-coral/5'}
          `}
          style={{ height: '52px' }}
        />
      ))}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

interface PhoneVerificationProps {
  initialPhone?:  string
  onVerified?:    (telephone: string) => void
  className?:     string
  // Mode "inline" pour le formulaire d'inscription vs "page" pour les paramètres
  variant?:       'inline' | 'card'
}

export default function PhoneVerification({
  initialPhone = '',
  onVerified,
  className = '',
  variant = 'card',
}: PhoneVerificationProps) {
  const [prefix, setPrefix]         = useState(DEFAULT_PREFIX)
  const [localNumber, setLocalNumber] = useState(
    initialPhone.startsWith('+687') ? initialPhone.slice(4) : initialPhone
  )
  const [prefixOpen, setPrefixOpen] = useState(false)

  const telephone = `${prefix}${localNumber.replace(/\s/g, '')}`

  const { state, sendOtp, verifyOtp, resendOtp, reset } = usePhoneVerification(onVerified)

  const handleSend = () => sendOtp(telephone)

  const containerClass = variant === 'card'
    ? 'bg-white border border-night/8 rounded-2xl p-6 shadow-sm'
    : ''

  // ── Étape 1 : Saisie du numéro ────────────────────────────────────────────
  if (state.step === 'input') {
    return (
      <div className={`${containerClass} ${className}`}>
        {variant === 'card' && (
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
              <Phone size={18} className="text-coral" />
            </div>
            <div>
              <h2 className="font-semibold text-night">Vérifier votre téléphone</h2>
              <p className="text-xs text-night/50">Renforce la confiance des autres membres</p>
            </div>
          </div>
        )}

        <p className="text-sm text-night/60 mb-4">
          Entrez votre numéro de téléphone. Vous recevrez un code à 6 chiffres par SMS.
        </p>

        {/* Champ téléphone avec sélecteur de préfixe */}
        <div className="flex gap-2 mb-4">
          {/* Sélecteur préfixe */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPrefixOpen(!prefixOpen)}
              className="flex items-center gap-1.5 px-3 h-10 bg-sand border border-night/15 rounded-xl text-sm font-medium hover:border-coral/40 transition-all"
              aria-haspopup="listbox"
              aria-expanded={prefixOpen}
            >
              <span>{NC_PHONE_PREFIXES.find(p => p.value === prefix)?.flag}</span>
              <span>{prefix}</span>
              <ChevronDown size={12} className="text-night/40" />
            </button>

            {prefixOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-night/10 rounded-xl shadow-modal z-10 overflow-hidden" role="listbox">
                {NC_PHONE_PREFIXES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    role="option"
                    aria-selected={prefix === p.value}
                    onClick={() => { setPrefix(p.value); setPrefixOpen(false) }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left hover:bg-sand transition-colors ${prefix === p.value ? 'text-coral font-medium' : 'text-night'}`}
                  >
                    <span>{p.flag}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Numéro local */}
          <input
            type="tel"
            value={localNumber}
            onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s]/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            placeholder="XX XX XX"
            className="input flex-1"
            aria-label="Numéro de téléphone"
            autoComplete="tel-national"
          />
        </div>

        {/* Erreur */}
        {state.error && (
          <p className="text-xs text-red-500 mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={state.loading || !localNumber.trim()}
          className="btn-primary w-full justify-center disabled:opacity-40"
        >
          {state.loading
            ? <><Loader2 size={15} className="animate-spin" /> Envoi en cours…</>
            : <><Phone size={15} /> Recevoir le code par SMS</>
          }
        </button>

        <p className="text-[11px] text-night/35 text-center mt-3">
          Un SMS sera envoyé au {telephone || 'numéro renseigné'}.
          Tarif SMS habituel selon votre opérateur.
        </p>
      </div>
    )
  }

  // ── Étape 2 : Saisie du code OTP ──────────────────────────────────────────
  if (state.step === 'otp') {
    return (
      <div className={`${containerClass} ${className}`}>
        {variant === 'card' && (
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
              <ShieldCheck size={18} className="text-coral" />
            </div>
            <div>
              <h2 className="font-semibold text-night">Entrez votre code</h2>
              <p className="text-xs text-night/50">SMS envoyé au {state.masked}</p>
            </div>
          </div>
        )}

        {variant === 'inline' && (
          <p className="text-sm text-night/60 mb-4">
            Code envoyé au <strong>{state.masked}</strong>
          </p>
        )}

        {/* 6 cases OTP */}
        <div className="my-6">
          <OtpInput
            onComplete={verifyOtp}
            disabled={state.loading}
          />
        </div>

        {/* Erreur */}
        {state.error && (
          <p className="text-xs text-red-500 mb-4 text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {state.error}
          </p>
        )}

        {/* Loader */}
        {state.loading && (
          <div className="flex items-center justify-center gap-2 text-night/50 text-sm mb-4">
            <Loader2 size={15} className="animate-spin" />
            Vérification…
          </div>
        )}

        {/* Renvoi + retour */}
        <div className="flex items-center justify-between text-xs text-night/40">
          <button
            type="button"
            onClick={reset}
            className="hover:text-night transition-colors"
          >
            ← Changer de numéro
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={state.cooldown > 0 || state.loading}
            className="flex items-center gap-1 hover:text-coral disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={11} />
            {state.cooldown > 0
              ? `Renvoyer dans ${state.cooldown}s`
              : 'Renvoyer le code'
            }
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 3 : Vérifié ─────────────────────────────────────────────────────
  return (
    <div className={`${containerClass} ${className}`}>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <CheckCircle size={28} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="font-semibold text-night">Téléphone vérifié !</h2>
          <p className="text-sm text-night/50 mt-1">
            {state.masked} est maintenant associé à votre compte.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <ShieldCheck size={12} />
          Badge "Membre vérifié" activé sur vos annonces
        </div>
      </div>
    </div>
  )
}
