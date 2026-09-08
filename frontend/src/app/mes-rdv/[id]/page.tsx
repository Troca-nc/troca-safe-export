import type { Metadata } from 'next'

import BookingDetailClient from './BookingDetailClient'

export const metadata: Metadata = {
  title: 'Rendez-vous sï¿½curisï¿½ | Kalico',
  description: 'Consultez le dï¿½tail dun rendez-vous Kalico via un lien sï¿½curisï¿½.',
}

type PageProps = {
  params: Promise<{ id: string }>
}
export default async function MesRdvDetailPage({ params }: PageProps) {
  const { id } = await params
  return <BookingDetailClient bookingId={id} />
}
