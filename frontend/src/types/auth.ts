export type AuthErrorKind = 'invalid_credentials' | 'locked' | 'network' | 'unknown'

export type AuthErrorPresentation = {
  kind: AuthErrorKind
  message: string
  retryable: boolean
}

export type DemoLoginProfile = {
  key: 'particulier' | 'pro' | 'bon_plan'
  label: string
  description: string
}
