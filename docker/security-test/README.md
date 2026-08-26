# Security-boundary harness

This harness uses synthetic data and isolated Docker resources. It must never be connected to production data or production volumes.

## Safety invariants

- Compose project names must start with `kalico-security-`.
- The database name must end with `_security_test`.
- Fixture and inventory scripts require `NODE_ENV=test` and `KALICO_SECURITY_TEST_ONLY=true`.
- The inventory is SELECT/read-only and emits aggregate counts only.
- `security-test-artifacts/` must remain untracked.

## Commands

From the repository root:

```powershell
node backend/src/tests/security/run.js
docker compose -p kalico-security-local -f docker-compose.security-test.yml config
docker compose -p kalico-security-local -f docker-compose.security-test.yml up -d --build --wait
npx playwright test --config=playwright.security.config.ts
docker compose -p kalico-security-local -f docker-compose.security-test.yml run --rm security-seed node src/scripts/security/inventoryPrivateAssets.js
docker compose -p kalico-security-local -f docker-compose.security-test.yml down --volumes --remove-orphans
```

The current exposure tests intentionally characterize known findings. They are temporary evidence, not target behavior. Each entry is tracked in `known-exposures.json` and must be retired by its corrective lot.

## Local TLS interception

The backend image accepts a local public CA through the BuildKit secret
`security_test_ca`. Place it at
`security-test-artifacts/local-ca.crt`; this path is ignored by Git and must
never contain a private key. The CA is used only while installing locked npm
dependencies and is removed before the image layer is finalized.
