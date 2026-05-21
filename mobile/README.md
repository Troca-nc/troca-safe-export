# Troca Mobile — Guide de démarrage

## Mode local

Si tu veux simplement connecter l'application locale au backend local, crée un fichier `mobile/.env.local` basé sur `.env.example` avec:

- `EXPO_PUBLIC_API_URL=http://localhost:3001/api`
- `EXPO_PUBLIC_STRIPE_PK=` vide pour désactiver l'UI de paiement
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID=` vide pour désactiver le login social

L'application masque automatiquement les parcours qui n'ont pas de valeur configurée.

## Stack technique

- **Expo SDK 51** + Expo Router v3
- **React Native 0.74** pour iOS et Android
- **TypeScript** strict
- **Zustand** pour l'état
- **Socket.io-client** pour la messagerie temps réel
- **Stripe React Native** pour les paiements
- **Expo Notifications** pour les push iOS / Android
- **EAS Build** pour la compilation cloud

## Prérequis

```bash
# Node.js 20+
node --version

# Expo CLI et EAS CLI
npm install -g expo-cli eas-cli

# Connexion au compte Expo
eas login
```

## Installation

```bash
cd mobile
npm install
```

## Développement local

```bash
# Démarrer Metro
npm start

# Simulateur iOS
npm run ios

# Émulateur Android
npm run android
```

> **Note** : Les notifications push et Stripe ne fonctionnent pas sur simulateur.  
> Pour un test réaliste, utilise un appareil physique via `eas build --profile development`.

## Configuration avant le premier build

### 1. Expo / EAS

```bash
# Créer le projet EAS
eas init

# Copier le projectId dans app.json → extra.eas.projectId
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
# Renseigner EXPO_PUBLIC_STRIPE_PK avec la clé publique Stripe
# Renseigner EXPO_PUBLIC_GOOGLE_CLIENT_ID avec le client ID OAuth web/mobile
```

### 3. Google Services (Android FCM)

- Télécharger `google-services.json` depuis Firebase Console si tu actives les push Android.
- Garder ce fichier hors du dépôt s'il contient des informations sensibles.

### 4. Apple Push Notifications (iOS)

- Créer un certificat APNs dans le compte Apple Developer.
- EAS peut gérer les provisioning profiles via `eas credentials`.

## Build EAS

```bash
# Preview (APK Android + IPA iOS en distribution interne)
npm run build:preview

# Production (App Store + Google Play)
npm run build:production
```

Le premier build prend environ 15 minutes. Les suivants sont plus rapides grâce au cache.

## Soumission aux stores

```bash
# Configurer eas.json → submit.production avec :
# - iOS : appleId, ascAppId, appleTeamId
# - Android : google-play-service-account.json

# Soumettre
npm run submit:ios
npm run submit:android
```

## Structure du projet

```text
mobile/
├── app/                    # Écrans (Expo Router)
│   ├── _layout.tsx         # Root layout (auth guard, push, Stripe)
│   ├── auth/               # Login, Register
│   ├── tabs/               # Onglets : Accueil, Annonces, Publier, Messages, Profil
│   ├── annonce/[id].tsx    # Détail annonce
│   └── messages/[id].tsx   # Conversation (chat temps réel)
├── components/             # Composants réutilisables
├── constants/theme.ts      # Design tokens
├── hooks/                  # Hooks custom
├── lib/
│   ├── api.ts              # Client Axios + refresh JWT
│   ├── socket.ts           # Client Socket.io
│   └── notifications.ts    # Service push Expo
├── store/
│   └── authStore.ts        # État auth (Zustand)
├── app.json                # Config Expo
├── eas.json                # Config EAS Build
└── babel.config.js         # Babel (plugin Reanimated)
```

## Points déjà couverts

| Fonctionnalité | Statut | Notes |
| --- | --- | --- |
| Écran profil - édition infos | Fait | `app/profil/edit.tsx` |
| Mes annonces (onglet profil) | Fait | `app/profil/mes-annonces.tsx` |
| Favoris | Fait | `app/profil/favoris.tsx` |
| Filtres par commune | En cours | Picker communes à brancher dans `annonces.tsx` |
| Google Sign-In mobile | Fait | `hooks/useSocialAuth.ts` + `expo-auth-session` |
| Apple Sign-In | Fait | `hooks/useSocialAuth.ts` + `expo-apple-authentication` |
| Abonnement Pro (PaymentSheet) | Fait | `app/profil/abonnement.tsx` |
| Alertes de recherche | Fait | `app/profil/alertes.tsx` |
| Vérification téléphone | Fait | `app/profil/telephone.tsx` |

## Rappel sécurité

- Ne commit jamais de vrai `.env`.
- Garde les secrets dans GitHub Secrets ou sur le serveur.
- Ne commit pas `google-services.json` ou un compte de service Google Play.
