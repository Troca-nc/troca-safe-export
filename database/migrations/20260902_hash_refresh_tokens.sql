-- Refresh tokens are now persisted as SHA-256 hexadecimal digests.
-- Existing rows contain clear-text bearer tokens and cannot be migrated safely
-- while preserving sessions. Applying this migration intentionally logs every
-- currently authenticated user out once.
DELETE FROM refresh_tokens;

COMMENT ON COLUMN refresh_tokens.token IS
  'SHA-256 hexadecimal digest of the refresh token; raw bearer tokens are never persisted';
