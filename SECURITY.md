# Security Policy

## Supported versions
This export is intended to be initialized as a fresh Git repository. Only the exported files should be committed.

## Reporting a vulnerability
If you find a security issue, do not publish it publicly. Contact the maintainers privately and include:
- the affected file path
- reproduction steps
- impact
- whether a secret or credential should be revoked

## Local safety checklist
- Never commit real `.env` files.
- Never commit logs, caches, build output, or user uploads.
- Rotate any credential that may have appeared in the original repository history before publishing.
