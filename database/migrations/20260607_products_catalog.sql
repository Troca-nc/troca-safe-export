CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  price_xpf INTEGER NOT NULL DEFAULT 0,
  compare_at_price_xpf INTEGER DEFAULT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT DEFAULT NULL,
  brand TEXT DEFAULT NULL,
  category_id INTEGER DEFAULT NULL REFERENCES categories(id),
  commune_id INTEGER DEFAULT NULL REFERENCES communes(id),
  unit_label TEXT DEFAULT NULL,
  cover_image_url TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  published_listing_count INTEGER NOT NULL DEFAULT 0,
  last_published_listing_id INTEGER DEFAULT NULL REFERENCES annonces(id) ON DELETE SET NULL,
  last_published_at TIMESTAMPTZ DEFAULT NULL,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_owner_slug ON products (owner_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_owner ON products (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_commune ON products (commune_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (owner_id, is_active, archived_at);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id, position, id);
