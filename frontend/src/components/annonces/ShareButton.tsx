'use client'

import ShareSheet from '@/components/share/ShareSheet'

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
  const location = annonce.commune ? `à ${annonce.commune}` : 'en Nouvelle-Calédonie'
  const price = annonce.prix ? `${annonce.prix.toLocaleString('fr-FR')} XPF` : null
  return {
    kind: 'annonce' as const,
    itemId: annonce.id,
    title: `${annonce.titre} | Troca`,
    description: [price, location].filter(Boolean).join(' • '),
    url: `https://troca.nc/annonces/${annonce.id}`,
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
