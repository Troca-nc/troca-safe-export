import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bons plans & promotions - Troca',
  description: 'Promotions, ventes flash, coupons et bons plans locaux en Nouvelle-Caledonie sur Troca.',
}

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return children
}
