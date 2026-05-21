// src/types/phone.types.ts

export interface SendOtpPayload {
  telephone: string   // format E.164 ex: "+687261234"
}

export interface SendOtpResponse {
  success:    boolean
  expires_at: string   // ISO — expiration du code (10 min)
  masked:     string   // ex: "+687••••34" pour affichage
}

export interface VerifyOtpPayload {
  telephone: string
  code:      string   // 6 chiffres
}

export interface VerifyOtpResponse {
  success:  boolean
  verified: boolean
  message:  string
}

export interface PhoneVerificationState {
  step:       'input' | 'otp' | 'verified'
  telephone:  string
  masked:     string
  expires_at: string | null
  loading:    boolean
  error:      string | null
  cooldown:   number   // secondes avant de pouvoir renvoyer
}

// Préfixes téléphoniques Nouvelle-Calédonie
export const NC_PHONE_PREFIXES = [
  { label: 'NC +687', value: '+687', flag: '🇳🇨' },
  { label: 'FR +33',  value: '+33',  flag: '🇫🇷' },
  { label: 'AU +61',  value: '+61',  flag: '🇦🇺' },
]

export const DEFAULT_PREFIX = '+687'

// Validation format NC
export function validateNCPhone(phone: string): string | null {
  const cleaned = phone.replace(/\s/g, '')
  // NC mobile : 6 chiffres après +687 (ex: +687261234)
  if (/^\+687\d{6}$/.test(cleaned)) return null
  // NC fixe : 6 chiffres (ex: +687241234)
  if (/^\+687\d{6}$/.test(cleaned)) return null
  // France
  if (/^\+33[67]\d{8}$/.test(cleaned)) return null
  // Australie
  if (/^\+614\d{8}$/.test(cleaned)) return null
  return 'Numéro invalide. Format NC : +687 XX XX XX'
}
