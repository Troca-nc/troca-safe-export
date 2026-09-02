-- Review invitation bearer tokens are now persisted as SHA-256 hexadecimal
-- digests. Existing clear-text invitations cannot be converted while keeping
-- the original links valid, so applying this migration invalidates them.
DELETE FROM review_tokens;

COMMENT ON COLUMN review_tokens.token IS
  'SHA-256 hexadecimal digest; the raw review invitation token is never persisted';
