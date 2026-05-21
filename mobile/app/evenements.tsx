import { ServiceDirectoryScreen } from '@/components/services/ServiceDirectoryScreen';

export default function EvenementsScreen() {
  return (
    <ServiceDirectoryScreen
      mode="event"
      title="Evenements & culture"
      eyebrow="Agenda local"
      subtitle="Concerts, festivals, animations, marches et rendez-vous communautaires."
      kind="event,concert"
      searchPlaceholder="Rechercher un evenement..."
      publishLabel="Publier un evenement"
      publishDescription="Partage un lieu, une date et un contact pour referencer un rendez-vous local."
    />
  );
}
