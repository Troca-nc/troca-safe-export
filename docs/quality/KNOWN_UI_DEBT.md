# Dette UI connue au démarrage du gate

La baseline ne valide pas ces contrastes : elle les rend visibles et empêche l'ajout de nouvelles combinaisons de couleurs insuffisamment contrastées. L'empreinte repose sur la paire premier plan/arrière-plan afin de rester stable entre les métriques de police Windows et Linux ; plusieurs éléments et états peuvent partager la même combinaison.

| État audité | Styles de contraste connus |
|---|---:|
| Accueil | 3 |
| Liste des annonces | 5 |
| Inscription | 2 |
| Connexion | 3 |
| CGU | 0 |
| Politique de confidentialité | 0 |
| Paramètres, état normal | 9 |
| Paramètres, états de survol | 9 styles partagés |
| Publication, étape Description | 5 |

Les corrections doivent réduire cette baseline sans la régénérer globalement. Lorsqu'un style est corrigé, son empreinte peut être retirée après un passage normal du gate et une revue visuelle.

Le scanner d'encodage signale également une dette historique dans des fichiers non encore protégés. Les 139 fichiers critiques protégés sont propres ; le serveur de démonstration et ses catégories font désormais partie de ce périmètre bloquant.
