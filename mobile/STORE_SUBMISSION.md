# Troca Mobile — Guide de soumission App Store & Google Play

## Vue d'ensemble

| Étape | App Store (iOS) | Google Play (Android) |
|---|---|---|
| Compte | Apple Developer (99 USD/an) | Google Play Console (25 USD unique) |
| Build | `eas build --platform ios` | `eas build --platform android` |
| Format | `.ipa` → App Store Connect | `.aab` → Google Play Console |
| Délai review | 1–3 jours | Quelques heures à 3 jours |
| Outils | `eas submit --platform ios` | `eas submit --platform android` |

---

## Prérequis communs

```bash
# EAS CLI à jour
npm install -g eas-cli
eas --version  # doit être ≥ 10.0.0

# Connecté à votre compte Expo
eas login

# Projet EAS initialisé (génère le projectId)
eas init
# → Copier le projectId dans app.json → extra.eas.projectId
```

---

## PARTIE 1 — App Store (iOS)

### 1.1 Compte Apple Developer

1. Aller sur [developer.apple.com](https://developer.apple.com)
2. S'inscrire (99 USD/an) — compte individuel ou organisation
3. Accepter les CGU dans App Store Connect

### 1.2 App Store Connect — Créer l'app

1. Aller sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Mes apps → +** → Nouvelle app
3. Remplir :
   - **Nom** : `Troca`
   - **Langue primaire** : Français
   - **Bundle ID** : `nc.troca.app` (doit correspondre à `app.json → ios.bundleIdentifier`)
   - **SKU** : `troca-nc-app` (identifiant interne unique)
   - **Accès utilisateur** : Accès complet

### 1.3 Métadonnées App Store

**Nom de l'app** (30 caractères max) :
```
Troca — Annonces Calédonie
```

**Sous-titre** (30 caractères max) :
```
Acheter, vendre, troquer en NC
```

**Description** (4 000 caractères max) :
```
Troca est la plateforme de petites annonces de référence en Nouvelle-Calédonie.

Achetez, vendez ou échangez facilement : véhicules, immobilier, électronique, vêtements, mobilier, emploi et bien plus encore — partout sur l'archipel.

✦ POURQUOI TROCA ?
• 100 % local — annonces de Nouméa à Maré en passant par Koné et Koumac
• Interface claire et rapide, pensée pour le mobile
• Messagerie intégrée en temps réel pour contacter les vendeurs
• Photos haute qualité pour mieux présenter vos articles
• Sécurisé : vérification par SMS des utilisateurs

✦ FONCTIONNALITÉS
• Parcourir des milliers d'annonces par catégorie ou localisation
• Publier une annonce en moins de 2 minutes avec jusqu'à 8 photos
• Contacter les vendeurs directement dans l'app
• Sauvegarder vos annonces favorites
• Créer des alertes de recherche personnalisées
• Paiement sécurisé via Stripe

✦ COMPTE PRO
Les professionnels et particuliers actifs peuvent passer Pro pour :
- Annonces illimitées (vs 5 gratuites)
- Boost des annonces en tête de liste
- Badge Pro visible sur le profil
- Statistiques détaillées

Troca, c'est le marché numérique de la Nouvelle-Calédonie. Rejoignez la communauté !
```

**Mots-clés** (100 caractères max, séparés par des virgules) :
```
annonces,calédonie,vente,achat,troc,occasion,marché,nouméa,immobilier,voiture
```

**URL de support** : `https://troca.nc/aide`
**URL de politique de confidentialité** : `https://troca.nc/confidentialite`
**URL marketing** : `https://troca.nc`

**Catégorie principale** : Shopping
**Catégorie secondaire** : Lifestyle

**Classification de contenu** : 4+ (aucun contenu adulte)

### 1.4 Assets visuels requis

| Asset | Dimensions | Format | Requis |
|---|---|---|---|
| Icône App Store | 1024×1024 px | PNG sans transparence | ✅ |
| Screenshot iPhone 6.7" | 1290×2796 px | PNG ou JPEG | ✅ (min 3) |
| Screenshot iPhone 6.5" | 1242×2688 px | PNG ou JPEG | Optionnel |
| Screenshot iPad Pro 12.9" | 2048×2732 px | PNG ou JPEG | Si iPad supporté |
| Preview vidéo | 15–30s, ≤500 MB | .mov, .mp4, .m4v | Optionnel |

**Captures d'écran recommandées (dans cet ordre)** :
1. Écran d'accueil avec annonces (accroche principale)
2. Détail d'une annonce avec photos
3. Messagerie en temps réel
4. Publication d'une annonce
5. Profil / Compte Pro

### 1.5 Credentials iOS (EAS gère automatiquement)

```bash
# EAS configure automatiquement les certificats et provisioning profiles
eas credentials --platform ios
# Choisir : "Let EAS handle this" → recommandé
```

Si vous préférez gérer manuellement (non recommandé) :
- Distribution Certificate (`.cer` + clé privée `.p12`)
- Provisioning Profile App Store (`.mobileprovision`)

### 1.6 Build et soumission iOS

```bash
# 1. Build production
eas build --platform ios --profile production

# 2. Attendre la fin du build (~15-20 min)
# Le .ipa est uploadé automatiquement dans EAS

# 3. Soumettre à App Store Connect
eas submit --platform ios --profile production

# Ou avec les infos dans eas.json (recommandé) :
# eas.json → submit.production.ios :
#   appleId: "votre@email.com"
#   ascAppId: "1234567890"  ← dans App Store Connect → Général → Informations
#   appleTeamId: "XXXXXXXXXX"
```

### 1.7 Informations de review Apple

Apple peut demander des identifiants de test. Préparer un compte demo :
- **Email** : `review@troca.nc`
- **Mot de passe** : Un mot de passe fort (changer après review)

**Notes pour le reviewer** :
```
Troca est une plateforme de petites annonces locale pour la Nouvelle-Calédonie (DOM-TOM français).

Compte de démonstration :
- Email : review@troca.nc
- Mot de passe : [votre mot de passe demo]

L'app nécessite une connexion Internet. Le SMS de vérification téléphone peut être ignoré lors de la review (bouton "Passer" disponible).

Paiements : mode test Stripe activé pour le reviewer. Utiliser la carte 4242 4242 4242 4242 pour tester.
```

---

## PARTIE 2 — Google Play (Android)

### 2.1 Google Play Console — Créer l'app

1. Aller sur [play.google.com/console](https://play.google.com/console)
2. **Créer une application** → Remplir :
   - **Nom** : `Troca`
   - **Langue par défaut** : Français (France) → `fr-FR`
   - **Type** : Application
   - **Gratuite ou payante** : Gratuite
3. Accepter les politiques du programme développeur

### 2.2 Métadonnées Google Play

**Titre** (50 caractères max) :
```
Troca — Annonces Calédonie
```

**Description courte** (80 caractères max) :
```
Achetez, vendez et échangez en Nouvelle-Calédonie
```

**Description complète** : (identique App Store, 4 000 caractères max)

**Catégorie** : Shopping

**Tags** : annonces, occasion, marché, vente, achat

**Coordonnées du développeur** :
- Email : `contact@troca.nc`
- Site web : `https://troca.nc`
- Politique de confidentialité : `https://troca.nc/confidentialite`

### 2.3 Assets visuels Google Play

| Asset | Dimensions | Format | Requis |
|---|---|---|---|
| Icône Hi-res | 512×512 px | PNG 32-bit | ✅ |
| Feature Graphic | 1024×500 px | PNG ou JPEG | ✅ |
| Screenshot téléphone | min 320px, max 3840px | PNG ou JPEG | ✅ (min 2) |
| Screenshot tablette 7" | idem | PNG ou JPEG | Recommandé |

### 2.4 Service Account Google Play (pour `eas submit`)

1. Dans Google Play Console → **Configuration → Accès API**
2. Créer un projet Google Cloud (ou lier l'existant)
3. **Créer un compte de service** :
   - Rôle : Administrateur de version
   - Créer une clé JSON → télécharger `google-play-service-account.json`
4. Placer le fichier à la racine de `mobile/`
5. Dans Play Console → **Inviter l'utilisateur** → email du compte de service → Accès Administrateur

### 2.5 Build et soumission Android

```bash
# 1. Build AAB production (requis pour Play Store)
eas build --platform android --profile production

# 2. Soumettre en Internal Testing (recommandé pour commencer)
eas submit --platform android --profile production

# eas.json → submit.production.android :
#   serviceAccountKeyPath: "./google-play-service-account.json"
#   track: "internal"   ← internal → alpha → beta → production
```

### 2.6 Contenu de l'app (questionnaire Play Console)

**Classement du contenu** : Remplir le questionnaire
- Violence : Non
- Sexe : Non
- Langage : Non
- Substances contrôlées : Non
- → Classement attendu : **Everyone / Tout public**

**Politique de confidentialité des données** :
- Collecte de données : Oui (email, téléphone, photos)
- Chiffrement en transit : Oui (HTTPS/TLS)
- Suppression possible : Oui (RGPD)
- Partage avec des tiers : Non (hors Stripe pour paiements)

---

## PARTIE 3 — Checklist finale avant soumission

### Vérifications techniques
- [ ] `app.json` → `version` incrémentée
- [ ] `app.json` → `ios.buildNumber` incrémenté
- [ ] `app.json` → `android.versionCode` incrémenté
- [ ] `eas.json` → `projectId` renseigné
- [ ] `.env` → `EXPO_PUBLIC_API_URL` pointe sur `https://troca.nc/api`
- [ ] `.env` → `EXPO_PUBLIC_STRIPE_PK` en clé `pk_live_` (pas `pk_test_`)
- [ ] `.env` → `EXPO_PUBLIC_GOOGLE_CLIENT_ID` renseigné
- [ ] Tests passés : `cd backend && npm test`
- [ ] Build de preview testé sur appareil physique iOS ET Android

### Vérifications contenu
- [ ] Écran de connexion fonctionnel (email + Google + Apple iOS)
- [ ] Flux de publication d'annonce complet
- [ ] Messagerie temps réel fonctionnelle
- [ ] Paiement Stripe en mode live testé
- [ ] Notifications push reçues sur appareil physique
- [ ] Lien CGU accessible depuis l'app
- [ ] Lien politique de confidentialité accessible
- [ ] Pas de contenu de test visible (IDs hardcodés, console.log sensibles)

### Assets à préparer
- [ ] Icône 1024×1024 px (App Store)
- [ ] Icône 512×512 px (Google Play)
- [ ] Feature Graphic 1024×500 px (Google Play)
- [ ] 3–5 captures d'écran iPhone 6.7" (1290×2796 px)
- [ ] 2–3 captures d'écran Android (recommandé)
- [ ] `assets/images/icon.png` dans le projet Expo (utilisée pour le splash aussi)
- [ ] `assets/images/adaptive-icon.png` (Android)
- [ ] `assets/images/splash.png` (écran de démarrage)

---

## Commandes de référence

```bash
# Vérifier la config EAS
eas config

# Voir l'état des builds
eas build:list

# Voir l'état des soumissions
eas submit:list

# Mettre à jour l'app SANS passer par les stores (OTA — JS uniquement)
eas update --branch production --message "Fix critique messagerie"

# Gérer les credentials
eas credentials --platform ios
eas credentials --platform android
```

---

## Délais à prévoir

| Action | Durée estimée |
|---|---|
| Créer comptes développeurs | 1–2 jours (Apple peut demander des justificatifs) |
| Préparer les assets visuels | 1–2 jours |
| Build EAS (premier build) | 15–25 minutes |
| Review App Store | 1–3 jours ouvrés |
| Review Google Play (première soumission) | 3–7 jours |
| Review Google Play (mises à jour) | Quelques heures |

**Calendrier recommandé** : soumettre Google Play 1 semaine avant l'App Store, car les délais Google sont plus longs pour la première soumission.
