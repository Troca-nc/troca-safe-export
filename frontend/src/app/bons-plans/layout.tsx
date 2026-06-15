import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bons plans & promotions - Kalico',
  description: 'Promotions, ventes flash, coupons et bons plans locaux en Nouvelle-Calédonie sur Kalico.',
}

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return children
}
