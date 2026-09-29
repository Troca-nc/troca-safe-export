# Avancement de la refonte v2

Statuts : `À faire` · `Inventaire` · `En cours` · `À relire` · `Fait` · `Bloqué`.
Codex met à jour sa ligne et la section de sa page à la fin de chaque étape.

| Fiche | Page | Route | Statut | PR |
| --- | --- | --- | --- | --- |
| [00](specs/00-fondations.md) | Fondations : tokens et composants de base | aucune | À faire | — |
| [01](specs/01-layout.md) | En-tête, pied de page, onglets de compte | toutes | À faire | — |
| [02](specs/02-accueil.md) | Accueil | / | À faire | — |
| [03](specs/03-annonces.md) | Liste des annonces | /annonces | À faire | — |
| [04](specs/04-annonce.md) | Fiche annonce | /annonces/[id] | À faire | — |
| [05](specs/05-connexion.md) | Connexion | /connexion, | À faire | — |
| [06](specs/06-inscription.md) | Inscription | /inscription | À faire | — |
| [07](specs/07-mon-compte.md) | Mon compte : vue d’ensemble | /profil | À faire | — |
| [08](specs/08-compte-particulier.md) | Compte particulier : annonces, coups de cœur, alertes, offres | /profil/annonces, | À faire | — |
| [09](specs/09-deposer.md) | Déposer une annonce | /deposer | À faire | — |
| [10](specs/10-troc.md) | Troc et trocomètre | /troc | À faire | — |
| [11](specs/11-bons-plans.md) | Bons plans et événements | /bons-plans, | À faire | — |
| [12](specs/12-covoiturage.md) | Covoiturage | /covoiturage, | À faire | — |
| [13](specs/13-services.md) | Services : devis, professionnels, envoi | /services | À faire | — |
| [14](specs/14-pros.md) | Annuaire et vitrine des pros | /pros, | À faire | — |
| [15](specs/15-pro-presentation.md) | Présentation de l’offre Pro | /pro | À faire | — |
| [16](specs/16-devenir-pro.md) | Devenir Pro | /devenir-pro | À faire | — |
| [17](specs/17-compte-pro.md) | Espace Pro | /pro/espace | À faire | — |
| [18](specs/18-publicite.md) | Publicité (Kalico Pub) | /publicite | À faire | — |
| [19](specs/19-admin.md) | Administration | /admin | À faire | — |

## Hors site

`Emails prospection pro v2.dc.html` et `Seeding autorisations v2.dc.html` sont des outils internes. Ils ne se codent pas dans le site.

---

## Journal par page

Codex ajoute ici, sous le numéro de la fiche : inventaire, fichiers touchés, critères cochés, écarts, QUESTIONS.

## Installation du paquet Codex v2 — 2026-09-29

Installation seule, aucune fiche commencée. Scripts check:design et check:launch ajoutés ; mode démo local activé dans .env.local ignoré par Git.

Limites de validation du paquet :
- npm run lint : impossible, script lint absent du package.json existant.
- npm run check:design : code de sortie 0 mais zéro fichier inspecté ; le filtre src/ ne couvre pas les chemins frontend/src/ retournés par Git depuis la racine du dépôt. La redirection /dev/null produit aussi un avertissement sous Windows. Ce résultat ne valide donc pas les fichiers ajoutés.

Validation finale : npx tsc --noEmit réussi ; npm run build réussi (104 pages générées), avec NODE_USE_SYSTEM_CA=1 pour les certificats Windows. git diff --cached --check réussi après retrait d'un espace final dans DESIGN.md. Archive et dossier temporaire supprimés. Aucune fiche commencée.
