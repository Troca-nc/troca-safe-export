import type { Metadata } from 'next'
import { generateProfilMetadata, generateNoindexMetadata } from '@/lib/seoHelpers'
import { SITE_URL } from '@/types/seo.types'

type ProfilePayload = {
  data?: {
    prenom?: string
    nom?: string
    nb_annonces?: number
    commune_name?: string | null
  }
}

async function fetchProfile(id: string) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? `${SITE_URL}/api`).replace(/\/$/, '')

  try {
    const res = await fetch(`${apiBase}/users/${id}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const payload = (await res.json()) as ProfilePayload
    return payload?.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchProfile(id)
  if (!profile) {
    return generateNoindexMetadata('Profil introuvable')
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

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
