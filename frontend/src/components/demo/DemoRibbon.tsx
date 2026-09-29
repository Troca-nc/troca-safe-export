import { DEMO } from '@/lib/demo';

/** Bandeau fixe signalant les données de démonstration. À placer dans le layout racine. */
export function DemoRibbon() {
  if (!DEMO) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[100] flex items-center gap-2 rounded-pill bg-ink-deep px-4 py-2 text-label-sm text-cream shadow-panel"
    >
      <span className="h-2 w-2 rounded-pill bg-accent" aria-hidden />
      Données de démonstration
    </div>
  );
}
