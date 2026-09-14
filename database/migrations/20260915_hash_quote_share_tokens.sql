CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE pro_quotes
SET share_token = encode(digest(share_token, 'sha256'), 'hex');
