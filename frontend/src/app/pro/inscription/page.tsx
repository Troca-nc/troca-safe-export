import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Inscription Pro - Kalico NC',
  description: 'Acc�dez � lespace professionnel Kalico et cr�ez votre vitrine locale en Nouvelle-Cal�donie.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${SITE_URL}/pro/inscription`,
  },
}

export default function ProInscriptionPage() {
  redirect('/pro#formulaire-pro')
}
