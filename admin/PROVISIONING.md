# Provisionnement initial de l’administrateur

Ce parcours est volontairement local et interactif. Aucun endpoint HTTP ne crée ou n’affiche le secret TOTP.

1. Utiliser un poste de confiance, hors partage d’écran et sans journalisation du terminal.
2. Depuis le dossier `admin`, exécuter `pnpm provision:admin`.
3. Saisir l’email et deux fois le mot de passe. Le mot de passe n’est ni un argument de commande ni affiché.
4. Ajouter la clé générée dans l’application d’authentification, puis saisir un code à six chiffres. Aucune configuration n’est validée tant que ce contrôle échoue.
5. Copier le bloc obtenu directement dans le gestionnaire de secrets de l’environnement. Ne jamais le placer dans Git, une PR, un ticket ou une conversation.
6. Déployer séparément, vérifier la connexion puis supprimer l’historique visible du terminal. Conserver les moyens de récupération selon la procédure d’exploitation.

Le bloc contient une nouvelle identité Admin, le hash bcrypt du mot de passe, le secret TOTP, une clé de session et un jeton interne Admin. Le même `ADMIN_API_TOKEN` doit être fourni aux services Admin et backend. Une nouvelle clé de session invalide toutes les sessions Admin antérieures.

Pour une rotation, préparer et stocker les nouvelles valeurs avant de modifier l’environnement. Ne jamais désactiver le TOTP pour contourner une perte d’accès.

## Révocation globale des sessions

En cas de compromission ou avant une rotation sensible, définir explicitement `ADMIN_ENVIRONMENT`, vérifier la cible Redis, puis exécuter `pnpm revoke:admin-sessions` dans un terminal interactif autorisé. Dans le conteneur de production, la forme attendue est `docker compose exec admin pnpm revoke:admin-sessions`.

La commande affiche uniquement l’hôte et le numéro de base Redis, jamais ses identifiants. Elle exige de recopier une phrase contenant le nom de l’environnement avant toute connexion. Elle parcourt seulement `admin-session:active:*` avec `SCAN` et supprime par lots bornés avec `UNLINK`. Elle ne doit pas être automatisée dans la CI ou au démarrage.

Le workflow Admin exécute séparément `tests/redis-session.smoke.cjs` contre un conteneur Redis jetable. Ce test utilise exclusivement des identifiants fictifs et contrôle la connexion, le refus du rejeu TOTP, la révocation au logout et le périmètre de la révocation globale. `ADMIN_TEST_REDIS_URL` doit toujours désigner une instance de test isolée : ce script ne doit jamais être lancé contre Redis de production.
