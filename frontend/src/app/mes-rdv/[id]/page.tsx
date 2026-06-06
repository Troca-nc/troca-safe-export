import type { Metadata } from 'next'

import BookingDetailClient from './BookingDetailClient'

export const metadata: Metadata = {
  title: 'Rendez-vous sécurisé | Troca',
  description: 'Consultez le détail d’un rendez-vous Troca via un lien sécurisé.',
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ token?: string | string[] }>
}

type ResolvedSearchParams = {
  token?: string | string[]
}

function getToken(searchParams?: ResolvedSearchParams) {
  const raw = searchParams?.token
  return Array.isArray(raw) ? raw[0] ?? null : raw ?? null
}

export default async function MesRdvDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  return <BookingDetailClient bookingId={id} token={getToken(resolvedSearchParams)} />
}
