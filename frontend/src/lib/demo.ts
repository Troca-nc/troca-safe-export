// Mode démonstration : fixtures à la place de l'API, bandeau visible.
// Voir docs/design/DONNEES-DEMO.md.
export const DEMO = process.env.NEXT_PUBLIC_DEMO_DATA === 'true';

/** Suffixe ajouté aux noms de personnes et d'entreprises dans les fixtures. */
export const DEMO_SUFFIX = ' (démo)';

/** Choisit la fixture en mode démo, l'appel réel sinon. */
export async function demoOr<T>(fixture: () => Promise<T> | T, real: () => Promise<T>): Promise<T> {
  return DEMO ? fixture() : real();
}
