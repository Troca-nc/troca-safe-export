'use client'

import Header from '@/components/layout/Header'
import { ServiceDirectoryPage } from '@/components/services/ServiceDirectoryPage'

export default function BonsPlansPage() {
  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <ServiceDirectoryPage
        title="Bons plans & promotions"
        eyebrow="Type Groupon local"
        description="Publiez des promotions, des ventes flash, des coupons et des offres locales visibles sur web et mobile."
        kind="promo"
        mode="promo"
        searchPlaceholder="Rechercher une promotion, un coupon, une boutique..."
        introPoints={['Promos actives', 'Coupons locaux', 'Partage rapide', 'Expiration automatique']}
      />
    </div>
  )
}
