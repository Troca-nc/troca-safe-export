'use client'

import { WifiOff, RefreshCw, SearchX, MessageCircle, Heart, Package, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './Button'

type EmptyVariant = 'search' | 'messages' | 'favoris' | 'annonces' | 'notifications' | 'generic'

const CONFIGS: Record<EmptyVariant, { title: string; subtitle: string; cta?: string; icon: React.ReactNode }> = {
  search: {
    title: 'Aucune annonce trouvée',
    subtitle: 'Essaie d’élargir la recherche ou de changer les filtres.',
    cta: 'Effacer les filtres',
    icon: <SearchX className="w-8 h-8" />,
  },
  messages: {
    title: 'Aucun message',
    subtitle: 'Une conversation commencera ici dès que tu contactes un vendeur.',
    cta: 'Parcourir les annonces',
    icon: <MessageCircle className="w-8 h-8" />,
  },
  favoris: {
    title: 'Aucun favori',
    subtitle: 'Ajoute des annonces en favori pour les retrouver plus vite.',
    cta: 'Explorer',
    icon: <Heart className="w-8 h-8" />,
  },
  annonces: {
    title: 'Aucune annonce publiée',
    subtitle: 'Publie ta première annonce pour démarrer.',
    cta: 'Déposer une annonce',
    icon: <Package className="w-8 h-8" />,
  },
  notifications: {
    title: 'Aucune notification',
    subtitle: 'Les alertes et nouveaux événements apparaîtront ici.',
    icon: <Bell className="w-8 h-8" />,
  },
  generic: {
    title: 'Rien à afficher',
    subtitle: 'Reviens un peu plus tard.',
    cta: 'Actualiser',
    icon: <Package className="w-8 h-8" />,
  },
}

export function MobileEmptyState({
  variant,
  onCta,
}: {
  variant: EmptyVariant
  onCta?: () => void
}) {
  const config = CONFIGS[variant]

  return (
    <div className="rounded-card border border-sand bg-cream-surface p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lagoon/15 text-lagoon-text">
        {config.icon}
      </div>
      <h3 className="mb-2 font-body text-h6 font-semibold text-ink">{config.title}</h3>
      <p className="mx-auto max-w-md text-body-sm text-ink/70">{config.subtitle}</p>
      {config.cta && onCta ? (
        <Button onClick={onCta} variant="secondary" className="mt-5">
          {config.cta}
        </Button>
      ) : null}
    </div>
  )
}

export function MobileOfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/30 bg-accent/15 px-4 py-3 text-body-sm text-accent-text">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>Connexion indisponible</span>
      </div>
      <Button onClick={onRetry} variant="secondary" compact>
        <RefreshCw className="w-4 h-4" />
        Réessayer
      </Button>
    </div>
  )
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const sync = () => setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  return { isOnline }
}
