# Environnement QA éphémère

Le workflow `Ephemeral QA Journey` valide le parcours critique avec les vrais frontend et backend Kalico, sans utiliser la production.

## Périmètre

- PostgreSQL/PostGIS, Redis et Mailpit sont créés dans le runner GitHub Actions.
- Les migrations et les données Playwright ne ciblent que la base `kalico_qa` du runner.
- Les pièces jointes sont écrites dans `/tmp/kalico-qa-uploads`.
- Les intégrations externes (paiement, SMS, stockage objet et anti-bot) ne sont pas configurées.
- Aucun secret de production, accès SSH, DNS ou service du VPS n'est requis.
- Le runner et toutes ses données sont détruits automatiquement après le job.

## Parcours bloquant

Le test `tests/qa/authenticated-journey.spec.ts` vérifie successivement :

1. création de deux nouveaux comptes par l'API publique, sans dépendre du jeu de données partagé ;
2. capture locale des e-mails de bienvenue et de vérification dans Mailpit ;
3. publication d'une annonce avec photo depuis l'interface ;
4. recherche de cette annonce depuis un autre compte ;
5. ouverture d'une conversation et réception du premier message côté vendeur.

## Déclenchement et preuves

Le workflow s'exécute sur les pull requests, sur chaque push vers `main`, chaque jour à heure fixe et manuellement. Les traces Playwright, captures et journaux applicatifs sont conservés 14 jours en cas de diagnostic.

L'environnement est volontairement éphémère. Un futur environnement de recette persistant devra disposer de son propre hébergement, de son domaine, de ses secrets et de ses données synthétiques ; il ne devra jamais partager la base ou les volumes de production.
