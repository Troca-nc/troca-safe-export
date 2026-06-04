import type { Metadata } from 'next'

import ProLaunchPack from '@/components/pro/ProLaunchPack'

export const metadata: Metadata = {
  title: 'Pack lancement Pro | Troca',
  description:
    'Complétez votre démarrage Pro en 6 étapes avec votre vitrine, vos produits, vos rendez-vous et vos premiers boosts.',
}

export default function PackLancementPage() {
  return <ProLaunchPack />
}
