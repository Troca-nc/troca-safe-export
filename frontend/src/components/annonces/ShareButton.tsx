'use client'

import ShareSheet from '@/components/share/ShareSheet'
import { SITE_URL } from '@/types/seo.types'

interface ShareButtonProps {
  annonce: {
    id: number
    titre: string
    prix: number | null
    commune: string | null
    image_url?: string | null
    description?: string | null
  }
  variant?: 'icon' | 'full' | 'minimal'
  className?: string
}

function buildShareContent(annonce: ShareButtonProps['annonce']) {
  const location = annonce.commune ? `� ${annonce.commune}` : 'en Nouvelle-Cal�donie'
  const price = annonce.prix ? `${annonce.prix.toLocaleString('fr-FR')} XPF` : null
  return {
    kind: 'annonce' as const,
    itemId: annonce.id,
    title: `${annonce.titre} | Kalico`,
    description: [price, location].filter(Boolean).join(' " '),
    url: `${SITE_URL}/annonces/${annonce.id}`,
    imageUrl: annonce.image_url ?? null,
  }
}

export default function ShareButton({ annonce, variant = 'full', className = '' }: ShareButtonProps) {
  return (
    <ShareSheet
      content={buildShareContent(annonce)}
      variant={variant}
      label={variant === 'minimal' ? 'Partager' : 'Partager'}
      className={className}
    />
  )
}
