'use client'

import { api } from '@/lib/api'

export type DemoAccountKey = 'particulier' | 'pro' | 'bon_plan' | 'admin'

export const DEMO_ACCOUNTS: Record<DemoAccountKey, { email: string; password: string; label: string; description: string }> = {
  particulier: {
    email: 'particulier@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Particulier',
    description: 'Publier, discuter et g�rer ses favoris.',
  },
  pro: {
    email: 'pro@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Compte Pro',
    description: 'Vues, boosts, abonnement et tableaux de bord.',
  },
  bon_plan: {
    email: 'bonplan@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Bon plan',
    description: 'Promos, �v�nements et campagnes sponsoris�es.',
  },
  admin: {
    email: 'admin@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Administrateur',
    description: 'Mod�ration, dashboards et parcours de supervision.',
  },
}

export async function seedDemoDataset() {
  const { data } = await api.post('/demo/seed')
  return data?.data
}

export async function resetDemoDataset() {
  const { data } = await api.delete('/demo/seed')
  return data?.data
}

export async function getDemoStatus() {
  const { data } = await api.get('/demo/status')
  return data?.data
}

export function isDemoEmail(email?: string | null) {
  return Boolean(email && email.endsWith('@demo.kalico.nc'))
}

export function inferDemoAccount(email?: string | null): DemoAccountKey | null {
  if (!isDemoEmail(email)) return null
  const slug = (email ?? '').split('@')[0]
  if (slug.includes('pro')) return 'pro'
  if (slug.includes('bon')) return 'bon_plan'
  if (slug.includes('part')) return 'particulier'
  return 'particulier'
}
