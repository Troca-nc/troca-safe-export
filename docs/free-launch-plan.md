# Lancement gratuit de Kalico

Ce document sépare le socle nécessaire au lancement gratuit des intégrations qui peuvent être activées ultérieurement. Il ne remplace pas le preflight : le déploiement reste interdit tant que `scripts/preflight.sh` échoue.

## Maintenant : socle de production

### Application et infrastructure

- publier les images backend et frontend avec un digest `sha256` immuable ;
- épingler également Nginx, Certbot, PostgreSQL, Redis, Alpine et Node Admin ;
- conserver TLS actif et les domaines publics cohérents ;
- appliquer les migrations avant le redémarrage du backend ;
- vérifier les états de santé du frontend, du backend, du worker, de PostgreSQL et de Redis.

### Administration

- conserver une adresse administrateur et un mot de passe fort ;
- terminer l'enrôlement TOTP avec `admin/scripts/provision-admin.cjs` ;
- définir `TOTP_CONFIGURED=true` uniquement après validation d'un code dans l'application d'authentification ;
- limiter `ADMIN_ALLOWLIST` aux adresses IPv4 ou réseaux CIDR de confiance ;
- utiliser `ADMIN_EMAIL` comme `ADMIN_ALERT_EMAIL` tant qu'aucune boîte d'alerte distincte n'est disponible.

### Sauvegardes

- générer une paire de clés age dédiée ;
- placer uniquement la clé publique dans `BACKUP_AGE_RECIPIENT` ;
- conserver la clé privée de restauration hors du VPS ;
- vérifier la création, l'empreinte et la restauration d'une sauvegarde chiffrée ;
- laisser `BACKUP_ALERT_WEBHOOK_URL` vide si aucun outil de supervision n'est encore choisi : l'échec reste visible dans les journaux du conteneur.

## Plus tard : intégrations facultatives

Les groupes suivants peuvent rester entièrement vides pendant le lancement gratuit :

- Stripe : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MENSUEL`, `STRIPE_PRICE_PRO_ANNUEL` et les variables publiques associées ;
- PayPlug : `PAYPLUG_SECRET_KEY`, `PAYPLUG_WEBHOOK_SECRET` et les identifiants publics de formule ;
- Google OAuth : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ;
- Apple Sign-In : `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `NEXT_PUBLIC_APPLE_CLIENT_ID` ;
- webhook d'alerte de sauvegarde : `BACKUP_ALERT_WEBHOOK_URL`.

Une intégration backend ne doit jamais être configurée partiellement. Dès qu'une valeur d'un groupe est renseignée, toutes les valeurs de ce groupe deviennent obligatoires.

## Valeurs à laisser vides pour le lancement gratuit

```dotenv
NEXT_PUBLIC_STRIPE_PK=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_APPLE_CLIENT_ID=
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=
NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY=
NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY=
NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_YEARLY=
NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_MONTHLY=
NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_YEARLY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MENSUEL=
STRIPE_PRICE_PRO_ANNUEL=
PAYPLUG_SECRET_KEY=
PAYPLUG_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
BACKUP_ALERT_WEBHOOK_URL=
```

## Limite fonctionnelle assumée

Le mode gratuit désactive les parcours qui nécessitent un fournisseur absent ; il ne fabrique ni transaction ni abonnement. Les fonctionnalités gratuites existantes restent disponibles. Une évolution métier séparée sera nécessaire si toutes les capacités Pro doivent être offertes gratuitement, car cela modifie les droits, quotas et textes contractuels.

## Ordre de mise en ligne

1. sauvegarde complète et test de lecture ;
2. configuration des valeurs obligatoires et des groupes optionnels vides ;
3. validation TOTP et allowlist d'administration ;
4. publication des images immuables ;
5. exécution du preflight ;
6. migration ;
7. redémarrage progressif ;
8. contrôles de santé et parcours utilisateur ;
9. test d'une sauvegarde chiffrée ;
10. conservation du point de retour arrière jusqu'à validation finale.
