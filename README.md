# Troca Safe Export

This folder is a GitHub-safe export of the Troca project. It contains source code, configuration templates, scripts, and documentation needed to develop and deploy the app without committing secrets or local caches.

## What is included
- Backend API and workers
- Frontend web app
- Mobile app
- Database schema and migrations
- Docker and Nginx deployment files
- Deployment and setup scripts
- Tests and public assets
- Sanitized environment example

## What is intentionally excluded
- Git history
- Real `.env` files
- Logs and caches
- Build outputs and dependency folders
- Private keys, certificates, and cloud credentials
- Uploaded user data and database dumps

## Getting started

1. Install dependencies in each app folder.
2. Copy `.env.example` to the needed environment file(s) and fill in your own values.
3. Start the backend, frontend, database, and optional Redis/worker services.

### Web

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm test
```

### Mobile

```bash
cd mobile
npm install
npm test -- --runInBand
```

### Docker deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Before publishing to GitHub
- Verify no real secrets are present in any config file.
- Run a final scan for tokens, keys, and passwords.
- Confirm the repository has no `.git` history from the original project.
- Review the deployment workflow and environment examples.
