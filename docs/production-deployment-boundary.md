# Frontière de déploiement en production

Le workflow GitHub `.github/workflows/deploy.yml` exécute les tests backend et le contrôle Playwright. Sa réussite prouve que ces validations sont passées pour le commit concerné. Elle ne prouve pas que le backend, les workers, Nginx ou les migrations ont été livrés sur un serveur.

Le nom affiché du workflow est donc **Backend and E2E Validation**. Son nom de fichier historique reste inchangé afin de préserver les liens vers les anciens runs.

## Livraison actuellement disponible

Le dépôt contient deux chemins opératoires, à exécuter sur l'hôte de production :

- `scripts/install.sh` pour l'installation initiale interactive ;
- `scripts/deploy-scale.sh` pour démarrer ou reconstruire la stack existante avec un fichier `.env.production.local` déjà provisionné.

Ces scripts ne sont appelés par aucun workflow GitHub. Une intégration externe éventuelle doit être vérifiée séparément et ne peut pas être déduite du statut GitHub.

## Preuve minimale d'une livraison backend

Une livraison ne doit être déclarée réussie qu'après avoir conservé au minimum :

1. l'identité du commit ou de l'image effectivement déployée ;
2. le résultat du preflight avec l'environnement de production ;
3. l'état sain des services Docker après démarrage ;
4. la réponse du healthcheck public ;
5. le résultat des migrations requises et du plan de retour arrière, le cas échéant.

Les validations GitHub, les prévisualisations Vercel et le scan Trivy restent des preuves distinctes.
