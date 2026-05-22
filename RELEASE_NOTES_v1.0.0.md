# Troca v1.0.0

Public baseline and stable release for Troca.

## Highlights

- Public repository with GitHub protections enabled.
- Dependabot vulnerabilities fixed across backend, frontend, and mobile.
- Backend stabilized and test suite restored to green.
- Frontend and mobile validated by build and health checks.
- Expo config and submission docs cleaned up.

## Security

- `main` remains protected.
- `Secret Protection` is enabled.
- `Dependabot alerts`, `Dependabot security updates`, `Dependency graph`, and `Dependabot malware alerts` are enabled.
- No real secrets are committed in the repository.

## Validation

- Backend: `npm test`
- Frontend: `next build`
- Mobile: `expo-doctor`

## Notes

- The repository is tagged as `v1.0.0`.
- Future changes should go through PRs.
- Configuration placeholders are intentionally kept in the repo to avoid secret leaks.

