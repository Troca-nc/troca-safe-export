import type { Metadata } from 'next'

import BookingDetailClient from './BookingDetailClient'

export const metadata: Metadata = {
  title: 'Rendez-vous sécurisé | Kalico',
  description: 'Consultez le détail d’un rendez-vous Kalico via un lien sécurisé.',
}

type PageProps = {
  params: Promise<{ id: string }>
}
export default async function MesRdvDetailPage({ params }: PageProps) {
  const { id } = await params
  return <BookingDetailClient bookingId={id} />
}
