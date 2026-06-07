'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { deletePrefix } = require('../services/sharedCache');
const { slugifyCategoryName } = require('../../../shared/categoryTaxonomy');
const { matchImmediateAlerts } = require('../jobs/scheduler');
const { flagIfSuspicious } = require('../middleware/antiScam');

const router = express.Router();
const LIST_CACHE_PREFIX = 'cache:listings:';

const createSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  price_type: Joi.string().valid('fixed', 'from', 'on_quote', 'free').default('fixed'),
  price_xpf: Joi.alternatives().try(Joi.number().integer().min(0), Joi.valid(null)).optional(),
  compare_at_price_xpf: Joi.number().integer().min(0).allow(null).optional(),
  stock_quantity: Joi.alternatives().try(Joi.number().integer().min(0), Joi.valid(null)).optional(),
  sku: Joi.string().trim().max(80).allow('', null).optional(),
  brand: Joi.string().trim().max(120).allow('', null).optional(),
  category_id: Joi.number().integer().positive().required(),
  catalog_category_id: Joi.number().integer().positive().allow(null).optional(),
  commune_id: Joi.number().integer().positive().required(),
  unit_label: Joi.string().trim().max(80).allow('', null).optional(),
  cover_image_url: Joi.string().trim().uri().allow('', null).optional(),
  image_urls: Joi.array().items(Joi.string().trim().uri()).max(12).optional(),
  is_featured: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().min(10).max(2000).optional(),
  price_type: Joi.string().valid('fixed', 'from', 'on_quote', 'free').optional(),
  price_xpf: Joi.alternatives().try(Joi.number().integer().min(0), Joi.valid(null)).optional(),
  compare_at_price_xpf: Joi.number().integer().min(0).allow(null).optional(),
  stock_quantity: Joi.alternatives().try(Joi.number().integer().min(0), Joi.valid(null)).optional(),
  sku: Joi.string().trim().max(80).allow('', null).optional(),
  brand: Joi.string().trim().max(120).allow('', null).optional(),
  category_id: Joi.number().integer().positive().optional(),
  catalog_category_id: Joi.number().integer().positive().allow(null).optional(),
  commune_id: Joi.number().integer().positive().optional(),
  unit_label: Joi.string().trim().max(80).allow('', null).optional(),
  cover_image_url: Joi.string().trim().uri().allow('', null).optional(),
  image_urls: Joi.array().items(Joi.string().trim().uri()).max(12).optional(),
  is_active: Joi.boolean().optional(),
  is_featured: Joi.boolean().optional(),
});

const catalogCategoryCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  position: Joi.number().integer().min(0).optional(),
});

const catalogCategoryUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  position: Joi.number().integer().min(0).optional(),
});

function requirePro(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'Connexion requise.' });
    return false;
  }
  if (!req.user.is_pro) {
    res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    return false;
  }
  return true;
}

function normalizeText(value) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function normalizeUrls(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

async function clearListCache() {
  await deletePrefix(LIST_CACHE_PREFIX).catch(() => {});
}

function mapProductRow(row) {
  return {
    id: Number(row.id),
    owner_id: Number(row.owner_id),
    title: row.title,
    slug: row.slug,
    description: row.description,
    price_type: row.price_type || 'fixed',
    price_xpf: Number(row.price_xpf ?? 0),
    compare_at_price_xpf: row.compare_at_price_xpf == null ? null : Number(row.compare_at_price_xpf),
    stock_quantity: row.stock_quantity == null ? null : Number(row.stock_quantity),
    sku: row.sku ?? null,
    brand: row.brand ?? null,
    category_id: row.category_id == null ? null : Number(row.category_id),
    category_name: row.category_name ?? null,
    catalog_category_id: row.catalog_category_id == null ? null : Number(row.catalog_category_id),
    catalog_category_name: row.catalog_category_name ?? null,
    commune_id: row.commune_id == null ? null : Number(row.commune_id),
    commune_name: row.commune_name ?? null,
    unit_label: row.unit_label ?? null,
    cover_image_url: row.effective_cover_image_url ?? row.cover_image_url ?? null,
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    published_listing_count: Number(row.published_listing_count ?? 0),
    last_published_listing_id: row.last_published_listing_id == null ? null : Number(row.last_published_listing_id),
    last_published_listing_title: row.last_published_listing_title ?? null,
    last_published_at: row.last_published_at ?? null,
    archived_at: row.archived_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    image_count: Number(row.image_count ?? 0),
    images: Array.isArray(row.images) ? row.images : [],
  };
}

async function loadProductOr404(productId, ownerId) {
  const result = await query(
    `SELECT
       p.*,
       cat.name AS category_name,
       ccat.name AS catalog_category_name,
       com.name AS commune_name,
       (
         SELECT a.titre
         FROM annonces a
         WHERE a.id = p.last_published_listing_id
         LIMIT 1
       ) AS last_published_listing_title,
       COALESCE((
         SELECT COUNT(*)
         FROM product_images pi
         WHERE pi.product_id = p.id
       ), 0)::int AS image_count,
       COALESCE(
         p.cover_image_url,
         (
           SELECT pi.url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.position ASC, pi.id ASC
           LIMIT 1
         )
       ) AS effective_cover_image_url,
       COALESCE((
         SELECT json_agg(
           json_build_object(
             'id', pi.id,
             'url', pi.url,
             'position', pi.position,
             'alt_text', pi.alt_text
           )
           ORDER BY pi.position ASC, pi.id ASC
         )
         FROM product_images pi
         WHERE pi.product_id = p.id
       ), '[]'::json) AS images
     FROM products p
     LEFT JOIN categories cat ON cat.id = p.category_id
     LEFT JOIN pro_catalog_categories ccat ON ccat.id = p.catalog_category_id
     LEFT JOIN communes com ON com.id = p.commune_id
     WHERE p.id = $1 AND p.owner_id = $2`,
    [productId, ownerId]
  );

  return result.rows[0] ? mapProductRow(result.rows[0]) : null;
}

router.use(authenticate);

router.get('/categories', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const result = await query(
      `SELECT id, pro_id, name, slug, position, created_at, updated_at
       FROM pro_catalog_categories
       WHERE pro_id = $1
       ORDER BY position ASC, name ASC, id ASC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map((row) => ({
        id: Number(row.id),
        pro_id: Number(row.pro_id),
        name: row.name,
        slug: row.slug,
        position: Number(row.position ?? 0),
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const { error, value } = catalogCategoryCreateSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const name = normalizeText(value.name);
    const slugBase = slugifyCategoryName(name) || 'catalogue';

    const created = await withTransaction(async (client) => {
      const slugResult = await client.query(
        `SELECT slug
         FROM pro_catalog_categories
         WHERE pro_id = $1 AND slug LIKE $2
         ORDER BY id DESC
         LIMIT 1`,
        [req.user.id, `${slugBase}%`]
      );

      const nextSlug = slugResult.rows[0]
        ? `${slugBase}-${Date.now().toString(36)}`
        : slugBase;

      const inserted = await client.query(
        `INSERT INTO pro_catalog_categories (pro_id, name, slug, position)
         VALUES ($1, $2, $3, $4)
         RETURNING id, pro_id, name, slug, position, created_at, updated_at`,
        [req.user.id, name, nextSlug, Number(value.position ?? 0)]
      );

      return inserted.rows[0];
    });

    await clearListCache();

    return res.status(201).json({
      data: {
        id: Number(created.id),
        pro_id: Number(created.pro_id),
        name: created.name,
        slug: created.slug,
        position: Number(created.position ?? 0),
        created_at: created.created_at,
        updated_at: created.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: 'Catégorie invalide.' });
    }

    const { error, value } = catalogCategoryUpdateSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existing = await query(
      `SELECT id, pro_id, name, slug, position
       FROM pro_catalog_categories
       WHERE id = $1 AND pro_id = $2
       LIMIT 1`,
      [categoryId, req.user.id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Catégorie introuvable.' });

    const nextName = Object.prototype.hasOwnProperty.call(value, 'name') ? normalizeText(value.name) : existing.rows[0].name;
    const nextSlug = Object.prototype.hasOwnProperty.call(value, 'name')
      ? `${slugifyCategoryName(nextName) || 'catalogue'}-${categoryId}`
      : existing.rows[0].slug;
    const nextPosition = Object.prototype.hasOwnProperty.call(value, 'position') ? Number(value.position ?? 0) : existing.rows[0].position;

    const updated = await query(
      `UPDATE pro_catalog_categories
       SET name = $1,
           slug = $2,
           position = $3,
           updated_at = NOW()
       WHERE id = $4 AND pro_id = $5
       RETURNING id, pro_id, name, slug, position, created_at, updated_at`,
      [nextName, nextSlug, nextPosition, categoryId, req.user.id]
    );

    await clearListCache();

    return res.json({
      data: {
        id: Number(updated.rows[0].id),
        pro_id: Number(updated.rows[0].pro_id),
        name: updated.rows[0].name,
        slug: updated.rows[0].slug,
        position: Number(updated.rows[0].position ?? 0),
        created_at: updated.rows[0].created_at,
        updated_at: updated.rows[0].updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: 'Catégorie invalide.' });
    }

    const deleted = await withTransaction(async (client) => {
      await client.query(
        `UPDATE products
         SET catalog_category_id = NULL,
             updated_at = NOW()
         WHERE owner_id = $1 AND catalog_category_id = $2`,
        [req.user.id, categoryId]
      );

      const result = await client.query(
        `DELETE FROM pro_catalog_categories
         WHERE id = $1 AND pro_id = $2
         RETURNING id`,
        [categoryId, req.user.id]
      );

      return result.rows[0] || null;
    });

    if (!deleted) return res.status(404).json({ error: 'Catégorie introuvable.' });

    await clearListCache();

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const result = await query(
      `SELECT
         p.*,
         cat.name AS category_name,
         ccat.name AS catalog_category_name,
         com.name AS commune_name,
         (
           SELECT a.titre
           FROM annonces a
           WHERE a.id = p.last_published_listing_id
           LIMIT 1
         ) AS last_published_listing_title,
       COALESCE((
         SELECT COUNT(*)
         FROM product_images pi
         WHERE pi.product_id = p.id
       ), 0)::int AS image_count,
       COALESCE(
         p.cover_image_url,
         (
           SELECT pi.url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.position ASC, pi.id ASC
           LIMIT 1
         )
       ) AS effective_cover_image_url,
       COALESCE((
         SELECT json_agg(
             json_build_object(
               'id', pi.id,
               'url', pi.url,
               'position', pi.position,
               'alt_text', pi.alt_text
             )
             ORDER BY pi.position ASC, pi.id ASC
           )
           FROM product_images pi
           WHERE pi.product_id = p.id
         ), '[]'::json) AS images
       FROM products p
       LEFT JOIN categories cat ON cat.id = p.category_id
       LEFT JOIN pro_catalog_categories ccat ON ccat.id = p.catalog_category_id
       LEFT JOIN communes com ON com.id = p.commune_id
       WHERE p.owner_id = $1
       ORDER BY p.is_featured DESC, p.is_active DESC, p.created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows.map(mapProductRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const { error, value } = createSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const title = normalizeText(value.title);
    const description = normalizeText(value.description);
    const imageUrls = normalizeUrls(value.image_urls);
    const slugBase = slugifyCategoryName(title) || 'produit';
    const tempSlug = `${slugBase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const created = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO products
           (owner_id, title, slug, description, price_type, price_xpf, compare_at_price_xpf, stock_quantity,
            sku, brand, category_id, catalog_category_id, commune_id, unit_label, cover_image_url, is_featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          req.user.id,
          title,
          tempSlug,
          description,
          value.price_type || 'fixed',
          value.price_xpf == null ? 0 : Number(value.price_xpf ?? 0),
          value.compare_at_price_xpf == null ? null : Number(value.compare_at_price_xpf),
          value.stock_quantity == null ? null : Number(value.stock_quantity ?? 0),
          normalizeText(value.sku),
          normalizeText(value.brand),
          Number(value.category_id),
          value.catalog_category_id == null ? null : Number(value.catalog_category_id),
          Number(value.commune_id),
          normalizeText(value.unit_label),
          normalizeText(value.cover_image_url),
          Boolean(value.is_featured),
        ]
      );

      const productId = inserted.rows[0].id;
      const finalSlug = `${slugBase}-${productId}`;
      const updated = await client.query(
        `UPDATE products
         SET slug = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [productId, finalSlug]
      );

      if (imageUrls.length) {
        for (let i = 0; i < imageUrls.length; i += 1) {
          await client.query(
            `INSERT INTO product_images (product_id, url, position, alt_text)
             VALUES ($1, $2, $3, $4)`,
            [productId, imageUrls[i], i, `${title} - image ${i + 1}`]
          );
        }
      }

      return updated.rows[0];
    });

    const hydrated = await loadProductOr404(created.id, req.user.id);
    return res.status(201).json({ data: hydrated });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const productId = Number(req.params.id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Produit invalide.' });
    }

    const { error, value } = updateSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existing = await loadProductOr404(productId, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Produit introuvable.' });

    const nextTitle = normalizeText(value.title) ?? existing.title;
    const slugBase = slugifyCategoryName(nextTitle) || 'produit';
    const nextImageUrls = Object.prototype.hasOwnProperty.call(value, 'image_urls')
      ? normalizeUrls(value.image_urls)
      : null;

    await withTransaction(async (client) => {
      const fields = [];
      const params = [];
      let idx = 1;

      const push = (column, v) => {
        fields.push(`${column} = $${idx}`);
        params.push(v);
        idx += 1;
      };

      if (Object.prototype.hasOwnProperty.call(value, 'title')) push('title', nextTitle);
      if (Object.prototype.hasOwnProperty.call(value, 'description')) push('description', normalizeText(value.description));
      if (Object.prototype.hasOwnProperty.call(value, 'price_type')) push('price_type', value.price_type || 'fixed');
      if (Object.prototype.hasOwnProperty.call(value, 'price_xpf')) push('price_xpf', Number(value.price_xpf ?? 0));
      if (Object.prototype.hasOwnProperty.call(value, 'compare_at_price_xpf')) push('compare_at_price_xpf', value.compare_at_price_xpf == null ? null : Number(value.compare_at_price_xpf));
      if (Object.prototype.hasOwnProperty.call(value, 'stock_quantity')) push('stock_quantity', value.stock_quantity == null ? null : Number(value.stock_quantity ?? 0));
      if (Object.prototype.hasOwnProperty.call(value, 'sku')) push('sku', normalizeText(value.sku));
      if (Object.prototype.hasOwnProperty.call(value, 'brand')) push('brand', normalizeText(value.brand));
      if (Object.prototype.hasOwnProperty.call(value, 'category_id')) push('category_id', Number(value.category_id));
      if (Object.prototype.hasOwnProperty.call(value, 'catalog_category_id')) push('catalog_category_id', value.catalog_category_id == null ? null : Number(value.catalog_category_id));
      if (Object.prototype.hasOwnProperty.call(value, 'commune_id')) push('commune_id', Number(value.commune_id));
      if (Object.prototype.hasOwnProperty.call(value, 'unit_label')) push('unit_label', normalizeText(value.unit_label));
      if (Object.prototype.hasOwnProperty.call(value, 'cover_image_url')) push('cover_image_url', normalizeText(value.cover_image_url));
      if (Object.prototype.hasOwnProperty.call(value, 'is_active')) push('is_active', Boolean(value.is_active));
      if (Object.prototype.hasOwnProperty.call(value, 'is_featured')) push('is_featured', Boolean(value.is_featured));

      fields.push(`slug = $${idx}`);
      params.push(`${slugBase}-${productId}`);
      idx += 1;

      fields.push('updated_at = NOW()');

      params.push(productId, req.user.id);

      await client.query(
        `UPDATE products SET ${fields.join(', ')}
         WHERE id = $${idx} AND owner_id = $${idx + 1}`,
        params
      );

      if (nextImageUrls) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
        for (let i = 0; i < nextImageUrls.length; i += 1) {
          await client.query(
            `INSERT INTO product_images (product_id, url, position, alt_text)
             VALUES ($1, $2, $3, $4)`,
            [productId, nextImageUrls[i], i, `${nextTitle} - image ${i + 1}`]
          );
        }
      }
    });

    const updated = await loadProductOr404(productId, req.user.id);
    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const productId = Number(req.params.id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Produit invalide.' });
    }

    const result = await query(
      `UPDATE products
       SET is_active = FALSE,
           archived_at = COALESCE(archived_at, NOW()),
           updated_at = NOW()
       WHERE id = $1 AND owner_id = $2
       RETURNING id`,
      [productId, req.user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Produit introuvable.' });
    const updated = await loadProductOr404(productId, req.user.id);
    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/publish', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const productId = Number(req.params.id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Produit invalide.' });
    }

    const product = await loadProductOr404(productId, req.user.id);
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
    if (!product.is_active) return res.status(400).json({ error: 'Le produit doit être actif pour être publié.' });
    if (product.stock_quantity != null && Number(product.stock_quantity ?? 0) <= 0) {
      return res.status(400).json({ error: 'Le stock doit être supérieur à 0.' });
    }
    if (!product.category_id || !product.commune_id) {
      return res.status(400).json({ error: 'Le produit doit avoir une catégorie et une commune.' });
    }

    const createdListing = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO annonces
           (user_id, titre, description, prix, category_id, commune_id, condition, is_negotiable, phone, contre_quoi,
            is_troc, troc_accepts_complement_xpf, troc_complement_max_xpf, troc_wants, troc_status, metadata, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'active')
         RETURNING id, titre`,
        [
          req.user.id,
          product.title,
          product.description,
          Number(product.price_xpf ?? 0),
          product.category_id,
          product.commune_id,
          'new',
          false,
          null,
          null,
          false,
          false,
          0,
          [],
          'open',
          JSON.stringify({
            source: 'product_catalog',
            source_product_id: product.id,
            source_product_slug: product.slug,
            source_product_stock: product.stock_quantity,
            source_product_sku: product.sku,
            source_product_brand: product.brand,
            source_product_unit: product.unit_label,
            source_product_featured: product.is_featured,
          }),
        ]
      );

      const listingId = ins.rows[0].id;

      await client.query(
        `UPDATE products
         SET published_listing_count = published_listing_count + 1,
             last_published_listing_id = $2,
             last_published_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND owner_id = $3`,
        [product.id, listingId, req.user.id]
      );

      return { id: listingId, titre: ins.rows[0].titre };
    });

    const listingResult = await query(
      `SELECT * FROM annonces WHERE id = $1`,
      [createdListing.id]
    );
    const listing = listingResult.rows[0];

    matchImmediateAlerts(listing).catch((err) =>
      console.error('[alerts:immediate] Erreur post-publication produit:', err.message)
    );
    flagIfSuspicious(listing.id).catch((err) =>
      console.error('[antiScam] Erreur revalidation produit:', err.message)
    );
    void clearListCache();

    return res.status(201).json({
      data: {
        product_id: product.id,
        listing_id: listing.id,
        listing_title: listing.titre,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
