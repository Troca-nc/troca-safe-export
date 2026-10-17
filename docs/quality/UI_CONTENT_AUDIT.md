# Stratégie hybride de qualité UI et contenu

## Objectif

Rendre la couverture de l'audit démontrable avant chaque livraison. L'automatisation bloque les régressions objectives ; la revue humaine juge la pertinence, la cohérence et la qualité du parcours.

## Référentiels

- `ROUTE_INVENTORY.md` recense automatiquement toutes les pages Next.js.
- `MANUAL_AUDIT_MATRIX.md` suit les parcours, appareils, états et preuves.
- `COPY_GLOSSARY.md` fixe les termes et les sources de vérité éditoriales.
- `tests/quality/` bloque les contrastes insuffisants, les mojibakes visibles et les débordements horizontaux sur les parcours couverts.
- `tests/quality/known-contrast-violations.json` décrit la dette de contraste initiale. La CI tolère uniquement ces empreintes connues et bloque toute nouvelle violation.

## Campagne manuelle

Chaque route P0 doit être examinée avec les six passes suivantes, sans les mélanger :

1. Fonctionnement du parcours et exactitude des états métier.
2. Cohérence visuelle, alignements, hiérarchie et composants partagés.
3. Responsive sur ordinateur, Android étroit et iPhone.
4. Textes, terminologie, catégories, erreurs et confirmations.
5. Accessibilité : clavier, focus, zoom 200 %, contrastes et libellés.
6. Résilience : chargement, vide, erreur, texte long et réseau lent.

Pour chaque cellule validée, conserver une capture ou une vidéo, l'URL, le viewport, le rôle, la date et le ticket éventuel. Une page modifiée ne peut pas être validée uniquement par son auteur.

## États obligatoires

- normal, survol, focus clavier, actif, désactivé ;
- chargement, vide, erreur, succès ;
- menu, liste ou modale ouverte ;
- contenu court, long et accentué ;
- utilisateur anonyme et rôle authentifié pertinent.

## Sévérité

- **Bloquant** : action impossible, perte de données, sécurité ou paiement.
- **Majeur** : texte illisible, contraste insuffisant, mauvais état métier, parcours critique dégradé.
- **Mineur** : incohérence visuelle ou éditoriale sans blocage.
- **Amélioration** : optimisation non nécessaire à la livraison.

## Conditions de livraison

- Toutes les lignes P0 de la matrice sont validées ou portent une dérogation datée et approuvée.
- Aucun défaut bloquant ou majeur n'est ouvert.
- `npm run quality:inventory:check`, `npm run check:encoding --prefix frontend` et `npm run test:e2e:quality` passent.
- Les différences visuelles attendues ont une preuve de revue.
- Un smoke test est exécuté sur la préproduction puis après déploiement.

## Boucle d'amélioration

Chaque défaut trouvé manuellement doit produire au moins un des éléments suivants : test automatisé, règle de design, terme du glossaire, composant partagé ou ligne permanente dans la matrice.

La baseline de contraste ne doit être régénérée qu'après revue humaine :

- PowerShell : `$env:QUALITY_UPDATE_CONTRAST_BASELINE='true'; npm run test:e2e:quality`
- Bash : `QUALITY_UPDATE_CONTRAST_BASELINE=true npm run test:e2e:quality`

Une violation corrigée peut disparaître librement ; une nouvelle empreinte bloque la livraison. La dette initiale est résumée dans `KNOWN_UI_DEBT.md`.
