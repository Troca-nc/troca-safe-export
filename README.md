# Troca

Troca is a marketplace-style platform with:
- web frontend
- mobile app
- backend API
- PostgreSQL schema and migrations
- Docker and Nginx deployment files
- tests, scripts, and documentation

## Quick start

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd backend
npm install
npm test
```

```powershell
cd mobile
npm install
npm test -- --runInBand
```

## Security rules

- Never commit a real `.env` file.
- Keep secrets in GitHub Secrets or on the server, not in the repo.
- Do not commit logs, caches, build output, or user uploads.
- Rotate any credential that may have existed in the original project history.

## GitHub hardening

After creating the repository, enable:
- branch protection on `main`
- pull request reviews
- required status checks
- no force-push
- no branch deletion
- restricted workflow edits

See `GITHUB_HARDENING.md` for the exact checklist.
