-- Email-verification and password-reset bearer tokens are now persisted as
-- SHA-256 hexadecimal digests. Existing clear-text rows cannot be converted
-- while retaining safe link semantics, so applying this migration invalidates
-- all links issued before deployment.
DELETE FROM email_verification_tokens;
DELETE FROM password_reset_tokens;

COMMENT ON COLUMN email_verification_tokens.token IS
  'SHA-256 hexadecimal digest; the raw email-verification token is never persisted';

COMMENT ON COLUMN password_reset_tokens.token IS
  'SHA-256 hexadecimal digest; the raw password-reset token is never persisted';
