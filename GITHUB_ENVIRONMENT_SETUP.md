# GitHub Environment Setup

Use this file to configure GitHub in the most secure way.

## Environments

Create:
- `staging`
- `production`

For `production`, require at least one reviewer.

## Secrets

Store these in GitHub Secrets or Environment Secrets:
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `INTERNAL_API_TOKEN`
- `TURNSTILE_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPLUG_SECRET_KEY`
- `SMTP_PASS`
- `TWILIO_AUTH_TOKEN`
- `AWS_SECRET_ACCESS_KEY`
- `SERVER_SSH_KEY`
- `APPLE_PRIVATE_KEY`
- `GOOGLE_CLIENT_SECRET`
- `EXPO_ACCESS_TOKEN`

## Variables

Store these in GitHub Variables or Environment Variables:
- `BASE_URL`
- `DOMAIN`
- `NEXT_PUBLIC_API_URL`
- `EXPO_PUBLIC_API_URL`
- `DEPLOY_PATH`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `REDIS_URL`
- `MAX_FILE_SIZE_MB`
- `MAX_IMAGES_PER_LISTING`
- `RUN_JOBS`
- `OBSERVABILITY_ROLE`

## Public keys and non-sensitive identifiers

These are safe as variables:
- `NEXT_PUBLIC_STRIPE_PK`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `PAYPLUG_PUBLIC_KEY`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `EXPO_PUBLIC_PROJECT_ID`

## Recommended split

### staging
- copy of production variables
- staging-only secrets
- staging database
- staging Redis
- staging API URL

### production
- production secrets only
- production database
- production Redis
- production API URL
- protected reviewers

## Rules

- Never store real secrets in tracked files.
- Never put private keys in `.env.example`.
- Keep the repo limited to placeholders.
- Use GitHub Environments for anything sensitive that differs between staging and production.

