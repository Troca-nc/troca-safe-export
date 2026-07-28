# Kalico secret rotation checklist

Use this checklist when moving from Troca to Kalico or when preparing a new deploy.

## Must rotate

- `DB_PASSWORD`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `INTERNAL_API_TOKEN`
- `REDIS_PASSWORD`
- `ADMIN_API_TOKEN`
- `ADMIN_PASSWORD_HASH`

## Rotate if the integration is active

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPLUG_SECRET_KEY`
- `PAYPLUG_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_PRIVATE_KEY`
- `TURNSTILE_SECRET_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Files to update

- `.env.production.local` on the deployment host
- GitHub environment secrets
- Vercel environment variables
- any CI or release workflow secret store

## Validation

1. Restart backend, frontend, worker, Redis, and PostgreSQL.
2. Open `/api/health`.
3. Open `/api/categories`.
4. Test login and one write flow.

## Rule of thumb

If a value was copied from Troca or appears in a public repo, assume it needs rotation before production use.
