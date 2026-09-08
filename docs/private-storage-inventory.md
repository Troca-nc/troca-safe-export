# Inventaire en lecture seule du stockage privé

Cet inventaire compte les fichiers par classe et rapproche des compteurs de base de données. Il ne retourne aucun nom de fichier, chemin individuel, jeton ou donnée personnelle. La transaction SQL commence avec `BEGIN READ ONLY` et le parcours du volume utilise uniquement les opérations de lecture.

## Exécution en production

Vérifier d'abord que le conteneur `backend` est sain et que `STORAGE_LOCAL_PATH` vaut le chemin absolu attendu (`/app/uploads` dans le Compose actuel). L'exécution exige les deux valeurs exactes `NODE_ENV=production` et `KALICO_INVENTORY_READ_ONLY=true` :

```sh
docker compose -f docker-compose.prod.yml exec -T \
  -e KALICO_INVENTORY_READ_ONLY=true \
  backend npm run inventory:private-assets
```

Conserver le JSON agrégé dans le dossier d'audit hors du dépôt. Une erreur de base, de volume ou de table fait échouer la commande au lieu de produire un inventaire partiel.

## Lecture du rapport

- `filesystem.chat`, `pro-documents`, `imports` et `qr-tickets` recensent les classes privées ou historiques.
- `db.*.public_path` compte les références applicatives contenant encore `/uploads/` ; ce compteur n'affirme pas à lui seul que la ressource est publiquement accessible.
- `ticket_state_anomalies.total` doit rester à zéro.
- `unknown` doit être expliqué avant toute suppression ou migration.

Cet outil ne supprime, ne déplace et ne modifie rien. Toute migration ou suppression exige une sauvegarde, un plan dédié et une autorisation séparée.
