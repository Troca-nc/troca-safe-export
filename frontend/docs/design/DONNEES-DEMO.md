# Données de démonstration

Objectif : le site peut s'afficher complet avant le lancement, sans qu'aucune
valeur inventée ne soit prise pour une vraie, et le passage aux données réelles
se fait en changeant une variable d'environnement.

## Trois catégories de valeurs

| Catégorie | Exemple dans les maquettes | Où ça vit | Au lancement |
| --- | --- | --- | --- |
| Contenu utilisateur | annonces, membres, messages, devis | API réelle, ou `src/demo/fixtures/` en mode démo | fixtures désactivées |
| Chiffres de la plateforme | « 18 406 membres », « 212 000 visites » | `src/content/placeholders.ts` | remplacés par l'API ou une valeur vérifiée |
| Textes d'interface | libellés, titres, aides | directement dans les composants | inchangés |

## Règles pour les fixtures

1. Un fichier par domaine : `src/demo/fixtures/listings.ts`, `users.ts`,
   `quotes.ts`, `trocs.ts`, `rides.ts`, `ads.ts`, `admin.ts`…
2. Chaque objet est typé avec **le type réel** de l'API, pour que le passage
   aux vraies données ne change rien côté composant.
3. Chaque objet porte `id: 'demo-…'`. Rien d'autre dans le code ne commence par
   `demo-`.
4. Les noms de personnes sont suivis de « (démo) » : `Tehani R. (démo)`.
   Les entreprises aussi : `Menuiserie Cocotier (démo)`.
5. Pas de vrai numéro de téléphone, d'e-mail ou de RIDET : téléphones en
   `+687 00 00 00`, e-mails en `@exemple.nc`, RIDET en `0 000 000.000`.
6. Les photos sont des images de remplacement neutres (`/demo/placeholder-*.svg`),
   jamais des photos récupérées ailleurs.

## Accès aux données

```ts
// src/lib/data/listings.ts
import { DEMO } from '@/lib/demo';
import type { Listing } from '@/types/listing';

export async function getMyListings(): Promise<Listing[]> {
  if (DEMO) return (await import('@/demo/fixtures/listings')).myListings;
  return api.get('/me/listings');
}
```

Les composants appellent `getMyListings()`, jamais la fixture.

## Signalement visible en mode démo

- `<DemoRibbon />` dans le layout racine : bandeau fixe « Données de
  démonstration », affiché seulement si `DEMO` est vrai.
- `<Placeholder value={…} />` pour les chiffres de plateforme : souligné en
  pointillés et infobulle « valeur provisoire » en mode démo, rendu normal sinon.

Fichiers fournis : `src/lib/demo.ts`, `src/components/demo/DemoRibbon.tsx`,
`src/components/demo/Placeholder.tsx`, `src/content/placeholders.ts`.

## Passage au lancement

1. `NEXT_PUBLIC_DEMO_DATA=false` (ou absente) dans l'environnement de production.
2. Chaque entrée de `src/content/placeholders.ts` passe à `provisional: false`
   avec une valeur vérifiée, ou est branchée sur l'API.
3. `node scripts/check-design.mjs --launch` doit passer. Il échoue si :
   - `NEXT_PUBLIC_DEMO_DATA=true` dans `.env.production` ;
   - une entrée de `placeholders.ts` est encore `provisional: true` ;
   - `src/demo/` est importé ailleurs que dans `src/lib/data/` ;
   - un commentaire `TODO-LANCEMENT` subsiste.
