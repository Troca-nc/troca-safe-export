-- ============================================================
-- Kalico â€” CatÃ©gories v2 / metadata listings
-- ============================================================

ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_annonces_metadata
  ON annonces USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_annonces_category_status
  ON annonces (category_id, status, created_at DESC);

ALTER TABLE annonces
  DROP CONSTRAINT IF EXISTS annonces_status_check;

ALTER TABLE annonces
  ADD CONSTRAINT annonces_status_check
  CHECK (status IN ('active', 'sold', 'expired', 'deleted', 'pending', 'completed'));

INSERT INTO categories (name, slug, icon, sort_order)
VALUES
  ('Locations courte durée', 'location_courte_duree', '🏠', 9),
  ('Services entre particuliers', 'services', '🛠️', 10),
  ('Dons', 'don', '🎁', 11)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon, sort_order)
SELECT c.id, 'Vente', 'vente', '🏡', 1
FROM categories c
WHERE c.slug = 'immobilier'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon, sort_order)
SELECT c.id, 'Location longue durÃ©e', 'location-longue-duree', '🏡', 2
FROM categories c
WHERE c.slug = 'immobilier'
ON CONFLICT (slug) DO NOTHING;
