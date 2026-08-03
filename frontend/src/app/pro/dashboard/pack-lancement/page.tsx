import type { Metadata } from 'next'

import ProLaunchPack from '@/components/pro/ProLaunchPack'

export const metadata: Metadata = {
  title: 'Pack lancement Pro | Kalico',
  description:
    'Compl�tez votre d�marrage Pro en 6 �tapes avec votre vitrine, vos produits, vos rendez-vous et vos premiers boosts.',
}

export default function PackLancementPage() {
  return <ProLaunchPack />
}
