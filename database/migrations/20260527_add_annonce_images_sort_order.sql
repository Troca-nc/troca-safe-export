ALTER TABLE annonce_images
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE annonce_images
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE annonce_images
SET sort_order = position,
    is_cover = (position = 0)
WHERE sort_order IS DISTINCT FROM position
   OR is_cover IS DISTINCT FROM (position = 0);

CREATE INDEX IF NOT EXISTS idx_images_annonce_cover_sort
  ON annonce_images (annonce_id, is_cover DESC, sort_order ASC);
