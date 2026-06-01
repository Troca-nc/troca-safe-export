-- ============================================================
-- Troca — catégories hiérarchiques / positionnement
-- ============================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

UPDATE categories
SET position = COALESCE(position, sort_order, 0)
WHERE position IS NULL OR position = 0;

CREATE INDEX IF NOT EXISTS idx_categories_parent_position
  ON categories (parent_id, position, id);

CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON categories (slug);
