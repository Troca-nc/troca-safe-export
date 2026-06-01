# DESIGN AUDIT - Troca NC

Date: 2026-05-27
Scope: `frontend/src/app/`, `frontend/src/components/`, `frontend/src/styles/` (none found), `frontend/tailwind.config.js`

## 1. Synthese rapide

L'interface Troca repose deja sur une base visuelle cohérente, mais elle mélange plusieurs niveaux de densité et plusieurs styles de composants. Le produit a une identité forte, avec une palette claire inspirée de la mer et de la NC, mais les écrans les plus importants restent plus denses qu'ils ne devraient l'être pour une expérience moderne et fluide.

Ce qui fonctionne deja:
- palette de couleurs bien identifiée et globalement stable
- base typographique lisible
- styles utilitaires partagés présents dans le CSS global
- quelques composants de design system deja réutilisés (`card`, `input`, `btn-*`, `badge`, `skeleton`)
- prise en compte du dark mode et du `prefers-reduced-motion`

Ce qui doit être renforcé:
- hiérarchie visuelle trop irrégulière selon les pages
- certaines vues sont encore très textuelles et peu respirées
- les flows d'inscription et de monétisation ne mettent pas assez vite en valeur l'étape décisive
- plusieurs composants font le même job avec des variantes visuelles différentes
- le design system existe, mais il n'est pas encore appliqué partout de manière homogène

## 2. Palette de couleurs actuelle

La palette est déjà définie dans `tailwind.config.js` et reprise dans `globals.css`.

Couleurs principales:
- `coral` : bleu/vert principal de marque (`#0A7EA4`)
- `ocean` : bleu foncé profond (`#08324F`)
- `lagoon` : turquoise plus lumineux (`#48CAE4`)
- `sand` : fond clair principal (`#F4F8F7`)
- `jungle` : vert accent (`#2D6A4F`)
- `night` : texte/fond très sombre (`#082032`)
- `slate` : gris secondaire

Constat:
- la palette est lisible et bien adaptée à la marque
- les couleurs primaires ne doivent pas être changées
- les usages sémantiques ne sont pas encore totalement standardisés partout
- certains composants utilisent encore des classes Tailwind directes au lieu des tokens ou utilitaires partagés

## 3. Typographie actuelle

Polices définies:
- `font-display`: Georgia / serif
- `font-body`: system-ui / sans-serif
- `font-mono`: monospace

Hiérarchie observée:
- les titres utilisent déjà souvent la famille display
- le corps reste en police système, donc lisible et rapide
- plusieurs écrans restent trop serrés, avec beaucoup de texte au même niveau visuel

Constat:
- la base typographique est correcte
- le problème principal n'est pas la police, mais la hiérarchie et la densité
- certains écrans gagneraient à avoir des tailles plus contrastées, moins de blocs compacts et plus d'espacement vertical

## 4. Espacements et rythme visuel

Patterns observés:
- usage fréquent de `px-4`, `py-4`, `rounded-xl` et `rounded-2xl`
- sections parfois espacées, parfois très serrées selon le fichier
- cartes et blocs utilitaires ne partagent pas toujours le même rythme interne

Constat:
- il manque un rythme d'espacement clairement systématisé
- certains écrans ont un effet "mur de texte"
- les containers et sections ne sont pas encore standardisés autour d'un vrai système de design

## 5. Composants les plus utilisés

Composants / patterns clairement présents:
- boutons `btn-primary`, `btn-secondary`, `btn-ghost`
- champs `input`
- cartes `card`
- badges `badge`
- skeleton loader `.skeleton`
- navigation header / footer
- listing cards, cards de feed, cards de détail
- modales et drawers
- inputs de recherche et filtres

Composants à fort impact visuel:
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/ListingCard.tsx` et `frontend/src/components/listings/ListingCard.tsx`
- `frontend/src/app/inscription/page.tsx`
- `frontend/src/app/bienvenue/page.tsx`
- `frontend/src/components/auth/SocialAuthButtons.tsx`
- `frontend/src/components/home/HomeSections.tsx`
- `frontend/src/components/annonces/CategoryFields.tsx`

## 6. Incoherences visuelles reperees

- Certaines pages ont une structure très éditoriale, d'autres sont très denses.
- Le flow d'inscription a déjà été retravaillé, mais la logique visuelle doit encore être simplifiée pour éviter la répétition et rendre l'étape Pro plus lisible.
- Les écrans de listing, d'annonces et de profil n'ont pas toujours la même profondeur de carte, le même espacement et le même traitement des métadonnées.
- Les composants d'authentification et les pages d'abonnement ne racontent pas encore suffisamment clairement la valeur du plan Pro.
- Quelques textes visibles ont encore des traces d'encodage ou des formulations trop "internes".
- Le style de certaines interfaces d'administration est plus fonctionnel que soigné, ce qui crée une rupture avec le web public.

## 7. Etats déjà en place

Déjà présents dans le code:
- dark mode via `class`
- focus visible global
- `prefers-reduced-motion`
- skeleton loader de base
- utilities partagées pour boutons, cartes, inputs, badges

Ce qui manque ou reste partiel:
- vrai système de variantes de card
- système de toasts standardisé
- micro-animations plus homogènes
- états vides plus illustrés
- stepper / progression plus lisible sur les parcours guidés
- navigation visuelle plus légère sur les écrans principaux

## 8. Conclusions pour la refonte

La refonte doit partir de cette base, pas la casser.

Priorités visuelles:
1. unifier les composants de base autour d'un vrai système de design
2. augmenter l'espace respirable et réduire la densité
3. clarifier les parcours clés, surtout l'inscription et la monétisation
4. rendre les cartes de contenu plus contemporaines et plus lisibles
5. harmoniser le rendu web entre les pages publiques, les pages de compte et l'administration

## 9. Risques à éviter

- changer les couleurs principales de marque
- multiplier des variantes de composants sans logique commune
- créer des animations décoratives qui nuisent à la lisibilité
- introduire un style trop "marketing" au détriment de l'utilisabilité
- masquer les informations importantes derrière des visuels trop lourds

## 10. Recommandation de suite

Partir dans cet ordre:
1. tokens Tailwind + variables CSS sémantiques
2. composant `card`, `button`, `input`, `badge`, `skeleton`
3. navigation et hiérarchie globale
4. listing cards et home
5. flow d'inscription et page Pro

