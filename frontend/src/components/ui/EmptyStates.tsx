'use client'

import { WifiOff, RefreshCw, SearchX, MessageCircle, Heart, Package, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

type EmptyVariant = 'search' | 'messages' | 'favoris' | 'annonces' | 'notifications' | 'generic'

const CONFIGS: Record<EmptyVariant, { title: string; subtitle: string; cta?: string; icon: React.ReactNode }> = {
  search: {
    title: 'Aucune annonce trouvee',
    subtitle: 'Essaie d elargir la recherche ou de changer les filtres.',
    cta: 'Effacer les filtres',
    icon: <SearchX className="w-8 h-8" />,
  },
  messages: {
    title: 'Aucun message',
    subtitle: 'Une conversation commencera ici des que tu contactes un vendeur.',
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
    title: 'Aucune annonce publiee',
    subtitle: 'Publie ta premiere annonce pour demarrer.',
    cta: 'Deposer une annonce',
    icon: <Package className="w-8 h-8" />,
  },
  notifications: {
    title: 'Aucune notification',
    subtitle: 'Les alertes et nouveaux evenements apparaitront ici.',
    icon: <Bell className="w-8 h-8" />,
  },
  generic: {
    title: 'Rien a afficher',
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
    <div className="rounded-2xl border border-night/10 bg-white p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
        {config.icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-night">{config.title}</h3>
      <p className="mx-auto max-w-md text-sm text-night/60">{config.subtitle}</p>
      {config.cta && onCta ? (
        <button onClick={onCta} className="mt-5 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white">
          {config.cta}
        </button>
      ) : null}
    </div>
  )
}

export function MobileOfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>Connexion indisponible</span>
      </div>
      <button onClick={onRetry} className="inline-flex items-center gap-1 font-semibold">
        <RefreshCw className="w-4 h-4" />
        Reessayer
      </button>
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
