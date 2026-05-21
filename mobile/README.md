# Troca Mobile — Guide de démarrage

## Mode hors ligne

If you only need the local app talking to the local backend, create `mobile/.env.local` with:

- `EXPO_PUBLIC_API_URL=http://localhost:3001/api`
- `EXPO_PUBLIC_STRIPE_PK=` blank to disable payment UI
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID=` blank to disable social auth

The app now detects missing or placeholder values and hides or disables the related flows cleanly.

## Stack technique
- **Expo SDK 51** + Expo Router v3 (navigation par fichiers)
- **React Native 0.74** (iOS + Android)
- **TypeScript** strict
- **Zustand** (state management)
- **Socket.io-client** (messagerie temps réel)
- **Stripe React Native** (paiements)
- **Expo Notifications** (push iOS/Android)
- **EAS Build** (compilation cloud)

---

## Prérequis

```bash
# Node.js 20+
node --version

# Installer Expo CLI et EAS CLI globalement
npm install -g expo-cli eas-cli

# Se connecter à votre compte Expo
eas login
```

---

## Installation

```bash
cd mobile
npm install
```

---

## Développement local

```bash
# Démarrer Metro (scan le QR code avec l'app Expo Go)
npm start

# Sur simulateur iOS (macOS uniquement)
npm run ios

# Sur émulateur Android
npm run android
```

> **Note** : Les notifications push et Stripe ne fonctionnent **pas** sur simulateur.  
> Utiliser un appareil physique via `eas build --profile development`.

---

## Configuration avant le premier build

### 1. Expo / EAS
```bash
# Créer le projet EAS (génère le projectId)
eas init

# Copier le projectId dans app.json → extra.eas.projectId
```

### 2. Variables d'environnement
```bash
cp .env .env.local
# Renseigner EXPO_PUBLIC_STRIPE_PK avec votre clé publique Stripe
# Renseigner EXPO_PUBLIC_GOOGLE_CLIENT_ID avec le client ID OAuth web/mobile
```

### 3. Google Services (Android FCM)
- Télécharger `google-services.json` depuis la Firebase Console
- Le placer à la racine de `mobile/`

### 4. Apple Push Notifications (iOS)
- Dans le compte Apple Developer, créer un certificat APNs
- EAS gère automatiquement les provisioning profiles si vous utilisez `eas credentials`

---

## Build EAS

```bash
# Preview (APK Android + IPA iOS en distribution interne)
npm run build:preview

# Production (App Store + Google Play)
npm run build:production
```

Le premier build prend ~15 minutes. Les suivants sont plus rapides grâce au cache.

---

## Soumettre aux stores

```bash
# Configurer eas.json → submit.production avec :
# - iOS : appleId, ascAppId, appleTeamId
# - Android : google-play-service-account.json

# Soumettre
npm run submit:ios
npm run submit:android
```

---

## Structure du projet

```
mobile/
├── app/                    # Écrans (Expo Router — navigation par fichiers)
│   ├── _layout.tsx         # Root layout (auth guard, push, Stripe)
│   ├── auth/               # Login, Register
│   ├── tabs/               # Onglets : Accueil, Annonces, Publier, Messages, Profil
│   ├── annonce/[id].tsx    # Détail annonce
│   └── messages/[id].tsx   # Conversation (chat temps réel)
├── components/             # Composants réutilisables
├── constants/theme.ts      # Design tokens (couleurs, spacing, typography)
├── hooks/                  # Hooks custom
├── lib/
│   ├── api.ts              # Client Axios + refresh automatique JWT
│   ├── socket.ts           # Client Socket.io
│   └── notifications.ts    # Service push Expo
├── store/
│   └── authStore.ts        # State auth (Zustand)
├── app.json                # Config Expo
├── eas.json                # Config EAS Build
└── babel.config.js         # Babel (avec plugin Reanimated)
```

---

## Points à compléter après le premier lancement

| Feature | Statut | Notes |
|---|---|---|
| Écran profil — édition infos | ✅ Fait | `app/profil/edit.tsx` |
| Mes annonces (onglet profil) | ✅ Fait | `app/profil/mes-annonces.tsx` |
| Favoris | ✅ Fait | `app/profil/favoris.tsx` |
| Filtres par commune | 🔄 En cours | Picker communes à brancher dans `annonces.tsx` |
| Google Sign-In mobile | ✅ Fait | `hooks/useSocialAuth.ts` + `expo-auth-session` |
| Apple Sign-In | ✅ Fait | `hooks/useSocialAuth.ts` + `expo-apple-authentication` |
| Abonnement Pro (PaymentSheet) | ✅ Fait | `app/profil/abonnement.tsx` |
| Alertes de recherche | ✅ Fait | `app/profil/alertes.tsx` |
| Vérification téléphone | ✅ Fait | `app/profil/telephone.tsx` |
