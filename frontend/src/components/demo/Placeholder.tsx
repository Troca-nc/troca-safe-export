import { DEMO } from '@/lib/demo';
import { placeholders, type PlaceholderKey } from '@/content/placeholders';

/** Affiche un chiffre de plateforme. Signalé comme provisoire en mode démo. */
export function Placeholder({ k }: { k: PlaceholderKey }) {
  const p = placeholders[k];
  if (!DEMO || !p.provisional) return <>{p.value}</>;
  return (
    <span title={`Valeur provisoire · ${p.source}`} className="underline decoration-accent decoration-dotted underline-offset-4">
      {p.value}
    </span>
  );
}
