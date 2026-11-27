# Sessions d'authentification Kalico

## Portée actuelle

Le site Web est le seul client activé. Une session est une famille stable
identifiée par `auth_sessions.id`. Les access tokens et refresh tokens issus
de cette famille portent le claim signé `sid`.

Le refresh token Web est uniquement transporté dans le cookie
`kalico_refresh_token` avec les attributs suivants :

- `HttpOnly` ;
- `Secure` en production ;
- `SameSite=Strict` ;
- `Path=/api/auth/refresh`.

Une réponse destinée au Web ne contient jamais de refresh token dans son
corps JSON.

## Rotation et réutilisation

La rotation verrouille le token courant et sa famille dans une transaction.
L'ancien token reste en base sous forme d'empreinte SHA-256 avec sa date
d'utilisation et le lien vers son descendant.

Une grâce de 15 secondes couvre une duplication immédiate de requête ou la
perte d'une réponse réseau. Pendant cette grâce, le serveur renvoie exactement
le même descendant depuis une charge chiffrée à durée de vie courte dans
Redis. Quinze secondes couvrent un retry réseau immédiat tout en maintenant
une fenêtre de rejeu très inférieure à la durée de la session.

Après cette grâce, la présentation d'un token utilisé révoque la famille
entière. Une erreur PostgreSQL ou Redis est une indisponibilité temporaire et
ne doit jamais être transformée en token invalide.

## Révocation

- Une déconnexion révoque uniquement la famille du navigateur courant.
- Un changement ou une réinitialisation du mot de passe révoque toutes les
  familles du compte et avance `users.auth_invalid_before`.
- Le service backend expose une primitive de révocation de toutes les familles
  pour un futur bouton « Déconnecter tous les appareils ». Aucune interface
  n'est ajoutée dans ce lot.

## Contrat natif futur

Le contrat natif est désactivé par défaut avec
`NATIVE_AUTH_ENABLED=false`. Aucune route native n'est montée dans le lot Web.
Activer le flag seul ne doit pas suffire à publier une route : le futur routeur
natif devra aussi imposer une preuve d'application non disponible au navigateur
et rester hors du routeur Web.

Le futur contrat utilisera une route distincte et les règles suivantes :

- `client_type=native` et libellé d'appareil facultatif dans `auth_sessions` ;
- refresh token reçu dans le corps puis renvoyé dans le JSON après rotation ;
- stockage du refresh token dans le coffre sécurisé du système mobile ;
- même rotation transactionnelle, même grâce et même détection de
  réutilisation que le Web ;
- même limiteur fondé sur la famille signée ;
- aucune réponse du routeur Web ne peut activer ce format JSON.

## Protection CSRF

Les routes Web de refresh et de logout valident une origine exacte autorisée.
Le cookie `SameSite=Strict` apporte une seconde barrière. Le durcissement du
middleware CSRF général est différé dans un lot séparé. Le premier inventaire
du SHA de base donne les catégories suivantes :

- `POST /api/payments/webhooks/stripe`, authentifié par la signature Stripe ;
- `POST /api/payments/webhooks/payplug`, authentifié par la vérification de la
  ressource PayPlug ;
- `POST /api/auth/google` et `POST /api/auth/apple`, échanges OAuth initiés par
  le navigateur mais sans cookie de session préalable ;
- les routes d'écriture sous `/api/upload`, `/api/import` et
  `/api/pro/documents`, appels Web authentifiés qui doivent recevoir une preuve
  CSRF compatible avec `multipart/form-data` et ne doivent pas être exemptés
  globalement ;
- les routes de paiement Web authentifiées sous `/api/payments`, qui doivent
  rester protégées, à l'exception des deux webhooks signés ci-dessus ;
- `/api/internal/observability` et les lectures internes frontend, actuellement
  limitées à des méthodes sûres et authentifiées par secret.

Le lot CSRF devra produire une liste fermée d'exemptions par chemin et par
preuve cryptographique. Une exemption ne devra jamais reposer uniquement sur
l'absence de cookie, sur un User-Agent ou sur un en-tête librement forgeable.
