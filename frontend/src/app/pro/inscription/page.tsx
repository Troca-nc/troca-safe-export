import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Inscription Pro - Kalico NC',
  description: 'Accï¿½dez ï¿½ lespace professionnel Kalico et crï¿½ez votre vitrine locale en Nouvelle-CalÃ©donie.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${SITE_URL}/pro/inscription`,
  },
}

export default function ProInscriptionPage() {
  redirect('/pro#formulaire-pro')
}
