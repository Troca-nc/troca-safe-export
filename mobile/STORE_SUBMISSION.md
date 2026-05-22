# Troca Mobile - Guide de soumission App Store and Google Play

This guide summarizes the last steps before a mobile submission. It complements `app.json`, `eas.json`, and the mobile README.

## Prerequisites

- Node.js 20+
- Up to date EAS CLI
- Connected Expo account
- Initialized EAS project

```bash
npm install -g eas-cli
eas --version
eas login
eas init
```

After `eas init`, copy the `projectId` into `mobile/app.json` under `extra.eas.projectId`.

## Environment variables

The mobile app relies on public build variables:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_STRIPE_PK`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

Simple rule:

- `development` and `preview` can use test values
- `production` must use real production values
- private secrets should never be committed

## iOS

### Apple Developer account

- Active Apple Developer account
- Access to App Store Connect
- Submission credentials ready if needed

### Useful metadata

- App name: `Troca`
- Bundle ID: `nc.troca.app`
- Category: `Shopping`
- Subtitle: `Acheter, vendre, troquer en NC`

### Check before submission

- `mobile/app.json`
  - `ios.bundleIdentifier`
  - `ios.buildNumber`
  - `owner`
  - `extra.eas.projectId`
- App Store Connect
  - name
  - description
  - keywords
  - support URL
  - privacy URL

### iOS submission

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

## Android

### Google Play account

- Active Google Play Console account
- Service account configured if `eas submit` must be automated

### Useful metadata

- App name: `Troca`
- Package: `nc.troca.app`
- Category: `Shopping`

### Check before submission

- `mobile/app.json`
  - `android.package`
  - `android.versionCode`
  - `googleServicesFile` if FCM is used
- Google Play Console
  - store listing
  - privacy policy
  - content questionnaire
  - age rating

### Android submission

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## Final checklist

- `mobile/app.json` and `mobile/eas.json` are up to date
- `version`, `buildNumber`, and `versionCode` were incremented if needed
- public build variables are correct
- backend tests pass
- frontend build passes
- `expo-doctor` passes
- no real secret is committed in the repository

## Security notes

- Never commit `google-play-service-account.json`
- Never commit Apple private keys
- Never commit a real `.env`
- Keep only placeholders in the repository

