import { authApi } from '@/lib/api'
import { DEMO_ACCOUNTS, inferDemoAccount } from '@/lib/demoApi'
import type { AuthErrorPresentation, DemoLoginProfile } from '@/types/auth'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getAuthErrorCode(error: unknown) {
  const response = asRecord(asRecord(error).response)
  return asText(asRecord(response.data).code)
}

export function describeAuthError(error: unknown): AuthErrorPresentation {
  const response = asRecord(error)
  const responseData = asRecord(asRecord(response.response).data)
  const code = asText(responseData.code)
  const status = Number(asRecord(response.response).status || 0)
  const raw = asText(responseData.error) || asText(response.message)
  const normalized = raw.toLocaleLowerCase('fr-FR')

  if (code === 'LOGIN_LOCKED' || status === 429) {
    return { kind: 'locked', message: raw || 'Trop de tentatives. Réessayez plus tard.', retryable: false }
  }
  if (normalized.includes('network') || normalized.includes('fetch') || normalized.includes('timeout') || normalized.includes('connexion')) {
    return { kind: 'network', message: 'Connexion impossible. Vérifiez votre réseau.', retryable: true }
  }
  if (status === 401 || normalized.includes('incorrect') || normalized.includes('invalid') || normalized.includes('password') || normalized.includes('credentials')) {
    return { kind: 'invalid_credentials', message: 'Email ou mot de passe incorrect.', retryable: false }
  }
  return { kind: 'unknown', message: raw || 'Impossible de vous connecter pour le moment.', retryable: true }
}

export function getDemoLoginProfile(email: string): DemoLoginProfile | null {
  const key = inferDemoAccount(email)
  if (key !== 'particulier' && key !== 'pro' && key !== 'bon_plan') return null
  const account = DEMO_ACCOUNTS[key]
  const descriptions: Record<DemoLoginProfile['key'], string> = {
    particulier: 'Publier, discuter et gérer ses favoris.',
    pro: 'Retrouver ses annonces et ses outils professionnels.',
    bon_plan: 'Gérer ses bons plans et ses événements.',
  }
  return { key, label: account.label, description: descriptions[key] }
}

export async function requestPasswordReset(identifier: string, turnstileToken?: string) {
  await authApi.forgotPassword(identifier, turnstileToken)
}
