import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { generateProfilMetadata } from '@/lib/seoHelpers'
import { serverPublicFetch } from '@/lib/serverPublicApi'
import { SITE_URL } from '@/types/seo.types'

type ProfilePayload = {
  data?: {
    prenom?: string
    nom?: string
    nb_annonces?: number
    commune_name?: string | null
  }
}

const fetchProfile = cache(async (id: string) => {
  const res = await serverPublicFetch(`/users/${encodeURIComponent(id)}`, {
    next: { revalidate: 300 },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Profile request failed with status ${res.status}`)
  const payload = (await res.json()) as ProfilePayload
  return payload?.data ?? null
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchProfile(id)
  if (!profile) {
    notFound()
  }

  return {
    ...generateProfilMetadata({
      prenom: profile.prenom ?? 'Profil',
      nom: profile.nom ?? '',
      nb_annonces: profile.nb_annonces ?? 0,
      commune: profile.commune_name ?? undefined,
    }, `${SITE_URL}/profil/${id}`),
    alternates: {
      canonical: `${SITE_URL}/profil/${id}`,
    },
  }
}

export default async function PublicProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await fetchProfile(id)
  if (!profile) notFound()

  return children
}
