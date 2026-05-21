import { ServiceDirectoryScreen } from '@/components/services/ServiceDirectoryScreen';

export default function BonsPlansScreen() {
  return (
    <ServiceDirectoryScreen
      mode="promo"
      title="Bons plans & promotions"
      eyebrow="Offres locales"
      subtitle="Promotions, ventes flash, coupons et offres locales dans une interface rapide et mobile."
      kind="promo"
      searchPlaceholder="Rechercher une promotion..."
      publishLabel="Publier une promotion"
      publishDescription="Renseigne un titre, une description, un lieu et des prix pour lancer une offre visible sur mobile."
    />
  );
}
