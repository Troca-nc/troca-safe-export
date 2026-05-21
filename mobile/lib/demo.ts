export type DemoAccountKey = 'particulier' | 'pro' | 'bon_plan' | 'admin'

export const DEMO_ACCOUNTS: Record<DemoAccountKey, { email: string; password: string; label: string; description: string }> = {
  particulier: {
    email: 'particulier@demo.troca',
    password: 'Demo1234!',
    label: 'Particulier',
    description: 'Publier une annonce et gérer ses favoris.',
  },
  pro: {
    email: 'pro@demo.troca',
    password: 'Demo1234!',
    label: 'Compte Pro',
    description: 'Vues, boosts et dashboard vendeur.',
  },
  bon_plan: {
    email: 'bonplan@demo.troca',
    password: 'Demo1234!',
    label: 'Bon plan',
    description: 'Promos locales et campagnes sponsorisées.',
  },
  admin: {
    email: 'admin@demo.troca',
    password: 'Demo1234!',
    label: 'Administrateur',
    description: 'Modération et supervision locale.',
  },
}

export function isDemoModeEnabled() {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.EXPO_PUBLIC_DEMO_MODE === 'true'
}
