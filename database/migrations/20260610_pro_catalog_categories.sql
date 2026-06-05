CREATE TABLE IF NOT EXISTS pro_catalog_categories (
  id          SERIAL PRIMARY KEY,
  pro_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  slug        TEXT         NOT NULL,
  position    INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (pro_id, slug)
);

DROP TRIGGER IF EXISTS trg_pro_catalog_categories_updated_at ON pro_catalog_categories;
CREATE TRIGGER trg_pro_catalog_categories_updated_at
  BEFORE UPDATE ON pro_catalog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) NOT NULL DEFAULT 'fixed'
    CHECK (price_type IN ('fixed', 'from', 'on_quote', 'free'));

ALTER TABLE products
  ALTER COLUMN stock_quantity DROP NOT NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS catalog_category_id INTEGER DEFAULT NULL REFERENCES pro_catalog_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_catalog_category
  ON products (catalog_category_id);
