ALTER TABLE users
  ALTER COLUMN commune_id DROP DEFAULT;

UPDATE users
SET commune_id = NULL
WHERE commune_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM communes c
    WHERE c.id = users.commune_id
  );

ALTER TABLE users
  ADD CONSTRAINT users_commune_id_fkey
  FOREIGN KEY (commune_id)
  REFERENCES communes(id)
  ON DELETE SET NULL;
