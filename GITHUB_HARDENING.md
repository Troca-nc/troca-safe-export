# GitHub Hardening Checklist

Use this checklist after the first push to GitHub.

## Branch protection

Protect `main` with:
- require pull request before merging
- require at least 1 review
- require status checks to pass
- dismiss stale approvals on new commits
- block force pushes
- block branch deletion

## CODEOWNERS

Add real owners in `.github/CODEOWNERS` so sensitive areas require review.

## GitHub Secrets

Store only sensitive values in GitHub Secrets or Environment Secrets:
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

## GitHub Variables

Use GitHub Variables for non-sensitive runtime settings:
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

## Recommended repository settings

- Disable secret scanning alerts only if you have another equivalent control.
- Restrict who can modify workflows.
- Require admin approval for GitHub Actions from forks if the repo becomes public.
- Keep production deployment tokens separate from local development credentials.
