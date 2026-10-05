'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, Phone, RefreshCw, ShieldCheck } from 'lucide-react'
import { usePhoneVerification } from '@/hooks/usePhoneVerification'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'

function OtpInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const applyDigits = (values: string[]) => {
    const next = Array(6).fill('')
    values.slice(0, 6).forEach((digit, index) => { next[index] = digit })
    setDigits(next)
    inputs.current[Math.min(values.length, 5)]?.focus()
    if (next.every(Boolean)) void onComplete(next.join(''))
  }

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Code de vérification à 6 chiffres">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Chiffre ${index + 1}`}
          onPaste={(event) => {
            event.preventDefault()
            applyDigits(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split(''))
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
          }}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, '')
            const next = [...digits]
            next[index] = value
            setDigits(next)
            if (value && index < 5) inputs.current[index + 1]?.focus()
            if (next.every(Boolean)) void onComplete(next.join(''))
          }}
          className="h-12 min-w-0 rounded-control border border-warm-border bg-cream-surface text-center font-mono text-xl font-semibold text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-50"
        />
      ))}
    </div>
  )
}

export default function PhoneVerification({
  initialPhone = '',
  onVerified,
  className = '',
  variant = 'card',
}: {
  initialPhone?: string
  onVerified?: (telephone: string) => void
  className?: string
  variant?: 'inline' | 'card'
}) {
  const [localNumber, setLocalNumber] = useState(initialPhone.replace(/^\+687/, ''))
  const telephone = `+687${localNumber.replace(/\D/g, '').slice(0, 6)}`
  const { state, sendOtp, verifyOtp, resendOtp, reset } = usePhoneVerification(onVerified)
  const container = variant === 'card' ? 'rounded-card border border-warm-border bg-cream-surface p-5 shadow-card sm:p-6' : ''

  if (state.step === 'input') {
    const valid = localNumber.replace(/\D/g, '').length === 6
    return (
      <div className={`${container} ${className}`}>
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-lagoon/20 text-reef-text"><Phone className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-xl text-ink">Vérifiez votre téléphone</h2>
            <p className="mt-1 text-body-sm text-ink/65">Nous vous envoyons un code à six chiffres par SMS.</p>
          </div>
        </div>
        <Input
          label="Numéro mobile"
          prefix="+687"
          value={localNumber}
          onChange={(event) => setLocalNumber(event.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="XX XX XX"
          error={state.error || undefined}
          hint="Ce numéro n’est jamais affiché publiquement sans votre accord."
        />
        <Button className="mt-5 w-full" onClick={() => void sendOtp(telephone)} loading={state.loading} loadingLabel="Envoi…" disabled={!valid}>
          Recevoir le code
        </Button>
        {!valid ? <p className="mt-2 text-center text-meta text-ink/55">Saisissez les 6 chiffres de votre numéro.</p> : null}
      </div>
    )
  }

  if (state.step === 'otp') {
    const delivery = state.deliveryChannel === 'email' ? 'par e-mail' : 'par SMS'
    return (
      <div className={`${container} ${className}`}>
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-lagoon/20 text-reef-text"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-xl text-ink">Entrez le code reçu</h2>
            <p className="mt-1 text-body-sm text-ink/65">Code envoyé {delivery} à {state.masked}.</p>
          </div>
        </div>
        <OtpInput onComplete={verifyOtp} disabled={state.loading} />
        {state.loading ? <p className="mt-4 text-center text-body-sm text-ink/60">Vérification en cours…</p> : null}
        {state.error ? <p role="alert" className="mt-4 rounded-control border border-alert-error/25 bg-alert-error/10 p-3 text-body-sm text-alert-error">{state.error}</p> : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" compact onClick={reset}>Changer de numéro</Button>
          <Button variant="tertiary" compact onClick={() => void resendOtp('sms')} disabled={state.cooldown > 0 || state.loading}>
            <RefreshCw className="h-4 w-4" />
            {state.cooldown > 0 ? `Renvoyer dans ${state.cooldown}s` : 'Renvoyer le code'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${container} ${className}`}>
      <div className="flex flex-col items-center py-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-card bg-reef/15 text-reef-text"><CheckCircle2 className="h-7 w-7" /></span>
        <h2 className="mt-4 font-display text-2xl text-ink">Téléphone vérifié</h2>
        <p className="mt-2 text-body-sm text-ink/65">Votre numéro est maintenant associé à votre compte.</p>
      </div>
    </div>
  )
}
