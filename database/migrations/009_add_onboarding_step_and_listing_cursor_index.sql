ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_annonces_created_at_id
  ON annonces (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_annonces_prix_created_at_id
  ON annonces (prix ASC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_annonces_nb_vues_created_at_id
  ON annonces (nb_vues DESC, created_at DESC, id DESC);
