// ============================================================
//  Routes — Annonces (listings)
//  GET    /api/listings            — Recherche / liste
//  GET    /api/listings/:id        — Détail
//  POST   /api/listings            — Créer
//  PUT    /api/listings/:id        — Modifier
//  DELETE /api/listings/:id        — Supprimer
//  POST   /api/listings/:id/favoris  — Ajouter/retirer des favoris
//  GET    /api/listings/:id/favoris  — Statut favori
//  POST   /api/listings/:id/signaler — Signaler
//  POST   /api/listings/:id/boost    — Booster (pro)
// ============================================================

const express = require('express');
const Joi     = require('joi');
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { matchImmediateAlerts } = require('../jobs/scheduler');
const { rateLimitAnnonces, flagIfSuspicious } = require('../middleware/antiScam');
const { buildListingSearchContext } = require('../services/listingsQuery');
const { deletePrefix, getJson, setJson } = require('../services/sharedCache');
const {
  mapListingSearchRow,
  mapListingDetailResponse,
  mapUserListingRow,
} = require('../services/listingsPresentation');


const router = express.Router();

const LIST_CACHE_PREFIX = 'cache:listings:';

async function readListCache(key) {
  return getJson(`${LIST_CACHE_PREFIX}${key}`);
}

async function writeListCache(key, value, ttlMs) {
  return setJson(`${LIST_CACHE_PREFIX}${key}`, value, ttlMs);
}

async function clearListCache() {
  await deletePrefix(LIST_CACHE_PREFIX);
}

// ── Schémas ─────────────────────────────────────────────────

const baseListingSchema = Joi.object({
  title:            Joi.string().min(3).max(200).optional(),
  titre:            Joi.string().min(3).max(200).optional(),
  description:      Joi.string().min(10).max(5000).optional(),
  price:            Joi.number().min(0).max(100000000).allow(null).optional(),
  category_id:      Joi.number().integer().required(),
  commune_id:       Joi.number().integer().required(),
  condition:        Joi.string().valid('new','like_new','good','fair','for_parts').required(),
  is_free:          Joi.boolean().default(false),
  price_negotiable: Joi.boolean().default(false),
  is_negotiable:    Joi.boolean().default(false),
  contre_quoi:      Joi.string().max(200).allow(null, '').optional(),
  phone:            Joi.string().max(20).optional().allow(''),
});

const createSchema = baseListingSchema.fork(
  ['description'],
  (f) => f.required()
);

const updateSchema = baseListingSchema.fork(
  ['category_id', 'commune_id', 'condition'],
  (f) => f.optional()
);
const updateSchemaWithStatus = updateSchema.keys({
  status: Joi.string().valid('active', 'inactive', 'sold').optional(),
});

const signalerSchema = Joi.object({
  reason:  Joi.string().valid('spam','fake','prohibited','offensive','other').required(),
  comment: Joi.string().max(500).optional().allow(''),
});

// ── GET /api/listings — Recherche ───────────────────────────

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const cacheKey = `list:${JSON.stringify(req.query || {})}`;
    const cached = await readListCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, params, orderBy, pageNum, pageSize, offset, geo } = buildListingSearchContext(req.query);
    const limitPlaceholder = params.length + 1;
    const offsetPlaceholder = params.length + 2;
    const distanceSelect = geo?.enabled
      ? `ROUND((
          ST_Distance(
            ST_SetSRID(ST_MakePoint(com.longitude, com.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($${geo.lngParam}, $${geo.latParam}), 4326)::geography
          ) / 1000.0
        )::numeric, 1) AS distance_km`
      : 'NULL::numeric AS distance_km';

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM annonces a
       LEFT JOIN categories cat    ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com      ON com.id = a.commune_id
       LEFT JOIN provinces prov    ON prov.id = com.province_id
       WHERE ${whereClause}`,
      params
    );

    const listRes = await query(
      `SELECT
          a.id,
          a.titre AS titre,
          a.titre AS title,
          a.prix AS prix,
          a.prix AS price,
          a.condition,
          a.is_negotiable AS price_negotiable,
          (a.prix IS NULL) AS is_free,
          a.contre_quoi,
          a.created_at AS published_at,
          a.nb_vues,
          a.boost_expires_at AS boosted_until,
          ${distanceSelect},
          a.commune_id,
          cat.id AS category_id,
          cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
          com.name AS commune_name,
          u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
          u.is_pro AS is_pro,
          u.email_verified AS seller_email_verified,
          u.phone_verified AS seller_phone_verified,
          u.trust_score AS seller_trust_score,
          u.trust_level AS seller_trust_level,
          u.note_moyenne AS user_rating,
          (SELECT thumbnail_url FROM annonce_images
           WHERE annonce_id = a.id AND is_cover = TRUE
           LIMIT 1) AS cover_image_thumbnail,
          (SELECT id FROM annonce_images
           WHERE annonce_id = a.id AND is_cover = TRUE
           LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com ON com.id = a.commune_id
       LEFT JOIN provinces prov ON prov.id = com.province_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
      [...params, pageSize, offset]
    );

    const total = parseInt(countRes.rows[0].total);

    const payload = {
      data: listRes.rows.map(mapListingSearchRow),
      pagination: {
        total,
        page:  pageNum,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    };

    await writeListCache(cacheKey, payload, 15_000);
    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/listings/:id — Détail ──────────────────────────

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
          a.*,
          cat.id AS category_id, cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
          parent.name AS parent_category_name, parent.slug AS parent_category_slug,
          com.id AS commune_id, com.name AS commune_name, com.slug AS commune_slug,
          prov.name AS province_name,
          u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
          u.avatar_url AS seller_avatar, u.is_pro AS seller_is_pro,
          u.trust_score AS seller_trust_score, u.trust_level AS seller_trust_level,
          u.note_moyenne AS seller_note, u.nb_avis AS seller_nb_avis,
          u.created_at AS seller_since, u.nb_annonces AS seller_nb_annonces,
          seller_com.name AS seller_commune_name,
          seller_prov.name AS seller_province_name,
          u.email_verified AS seller_email_verified,
          u.phone_verified AS seller_phone_verified,
          COALESCE(
            json_agg(
              json_build_object(
                'id', img.id,
                'url', img.url,
                'thumbnail_url', img.thumbnail_url,
                'variants', img.variants,
                'is_cover', img.is_cover
              )
              ORDER BY img.is_cover DESC, img.sort_order
            ) FILTER (WHERE img.id IS NOT NULL),
            '[]'
          ) AS images
       FROM annonces a
       LEFT JOIN categories cat    ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com      ON com.id = a.commune_id
       LEFT JOIN provinces prov    ON prov.id = com.province_id
       LEFT JOIN users u           ON u.id = a.user_id
       LEFT JOIN communes seller_com ON seller_com.id = u.commune_id
       LEFT JOIN provinces seller_prov ON seller_prov.id = seller_com.province_id
       LEFT JOIN annonce_images img ON img.annonce_id = a.id
       WHERE a.id = $1 AND a.deleted_at IS NULL
       GROUP BY a.id, cat.id, parent.id, com.id, prov.id, u.id, seller_com.id, seller_prov.id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    const listing = result.rows[0];

    // Incrémenter les vues (async, non bloquant)
    query(
      `UPDATE annonces SET nb_vues = nb_vues + 1 WHERE id = $1`,
      [id]
    ).catch(() => {});

    // Statut favori si connecté
    let isFavorited = false;
    if (req.user) {
      const fav = await query(
        `SELECT 1 FROM favoris WHERE user_id = $1 AND annonce_id = $2`,
        [req.user.id, id]
      );
      isFavorited = fav.rows.length > 0;
    }

    return res.json(mapListingDetailResponse(listing, isFavorited));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/listings — Créer ───────────────────────────────

router.post('/', authenticate, rateLimitAnnonces, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const title = (value.title || value.titre || '').trim();
    const description = value.description?.trim();
    const priceNegotiable = value.price_negotiable || value.is_negotiable || false;
    const price = value.is_free ? null : value.price;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis.' });
    }

    if (!value.is_free && (price === null || price === undefined)) {
      return res.status(400).json({ error: 'Le prix est requis pour une annonce payante.' });
    }

    // Limite d'annonces actives pour les non-pro
    if (!req.user.is_pro) {
      const activeCount = await query(
        `SELECT COUNT(*) AS n FROM annonces WHERE user_id = $1 AND status = 'active' AND deleted_at IS NULL`,
        [req.user.id]
      );
      if (parseInt(activeCount.rows[0].n) >= 10) {
        return res.status(403).json({
          error: 'Limite de 10 annonces actives atteinte. Passez en compte Pro pour publier davantage.',
          code: 'LIMIT_REACHED',
        });
      }
    }

    const result = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO annonces
           (user_id, titre, description, prix, category_id, commune_id, condition, is_negotiable, phone, contre_quoi, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active')
         RETURNING *`,
        [req.user.id, title, description, price, value.category_id, value.commune_id, value.condition, priceNegotiable, value.phone || null, value.contre_quoi || null]
      );

      await client.query(
        `UPDATE users SET nb_annonces = nb_annonces + 1 WHERE id = $1`,
        [req.user.id]
      );

      return ins.rows[0];
    });

    // Déclencher les alertes de recherche immédiates en arrière-plan
    matchImmediateAlerts(result).catch((err) =>
      console.error('[alerts:immediate] Erreur post-publication:', err.message)
    );
    await flagIfSuspicious(result.id);
    void clearListCache();

    return res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/listings/:id — Modifier ────────────────────────

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query(
      `SELECT * FROM annonces WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });

    const listing = existing.rows[0];
    if (listing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }

    const { error, value } = updateSchemaWithStatus.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fields = [];
    const params = [];
    let p = 1;

    const title = (value.title || value.titre || '').trim();
    const hasTitle = Object.prototype.hasOwnProperty.call(value, 'title') || Object.prototype.hasOwnProperty.call(value, 'titre');
    if (hasTitle && !title) {
      return res.status(400).json({ error: 'Le titre est requis.' });
    }

    if (hasTitle) {
      fields.push(`titre = $${p}`);
      params.push(title);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'description') && value.description !== undefined) {
      fields.push(`description = $${p}`);
      params.push(value.description?.trim() || null);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'price') || Object.prototype.hasOwnProperty.call(value, 'is_free')) {
      const price = value.is_free ? null : value.price;
      fields.push(`prix = $${p}`);
      params.push(price);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'category_id') && value.category_id !== undefined) {
      fields.push(`category_id = $${p}`);
      params.push(value.category_id);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'commune_id') && value.commune_id !== undefined) {
      fields.push(`commune_id = $${p}`);
      params.push(value.commune_id);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'condition') && value.condition !== undefined) {
      fields.push(`condition = $${p}`);
      params.push(value.condition);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'price_negotiable') || Object.prototype.hasOwnProperty.call(value, 'is_negotiable')) {
      const priceNegotiable = value.price_negotiable || value.is_negotiable || false;
      fields.push(`is_negotiable = $${p}`);
      params.push(priceNegotiable);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'contre_quoi')) {
      fields.push(`contre_quoi = $${p}`);
      params.push(value.contre_quoi || null);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'phone')) {
      fields.push(`phone = $${p}`);
      params.push(value.phone || null);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'status') && value.status !== undefined) {
      fields.push(`status = $${p}`);
      params.push(value.status);
      p++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier.' });

    params.push(id);
    const result = await query(
      `UPDATE annonces SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${p} RETURNING *`,
      params
    );

    flagIfSuspicious(id).catch((err) =>
      console.error('[antiScam] Erreur revalidation:', err.message)
    );
    void clearListCache();

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/listings/:id — Supprimer ─────────────────────

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'other' } = req.body;

    const existing = await query(
      `SELECT user_id FROM annonces WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });

    if (existing.rows[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres annonces.' });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE annonces SET deleted_at = NOW(), delete_reason = $1 WHERE id = $2`,
        [reason, id]
      );
      await client.query(
        `UPDATE users SET nb_annonces = GREATEST(nb_annonces - 1, 0) WHERE id = $1`,
        [existing.rows[0].user_id]
      );
    });

    void clearListCache();
    return res.json({ message: 'Annonce supprimée.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/listings/:id/favoris — Toggle favori ────────────

router.post('/:id/favoris', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query(
      `SELECT 1 FROM favoris WHERE user_id = $1 AND annonce_id = $2`,
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      await query(`DELETE FROM favoris WHERE user_id = $1 AND annonce_id = $2`, [req.user.id, id]);
      void clearListCache();
      return res.json({ favorited: false });
    } else {
      await query(
        `INSERT INTO favoris (user_id, annonce_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.user.id, id]
      );
      void clearListCache();
      return res.json({ favorited: true });
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /api/listings/:id/favoris — Statut favori ───────────

router.get('/:id/favoris', authenticate, async (req, res, next) => {
  try {
    const fav = await query(
      `SELECT 1 FROM favoris WHERE user_id = $1 AND annonce_id = $2`,
      [req.user.id, req.params.id]
    );
    return res.json({ favorited: fav.rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/listings/:id/signaler — Signalement ───────────

router.post('/:id/signaler', authenticate, async (req, res, next) => {
  try {
    const { error, value } = signalerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Vérifier qu'on ne signale pas sa propre annonce
    const listing = await query(
      `SELECT user_id FROM annonces WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (!listing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (listing.rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas signaler votre propre annonce.' });
    }

    await query(
      `INSERT INTO signalements (annonce_id, reporter_id, reason, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (annonce_id, reporter_id) DO UPDATE SET reason = $3, comment = $4`,
      [req.params.id, req.user.id, value.reason, value.comment || null]
    );
    void clearListCache();

    return res.json({ message: 'Signalement enregistré. Notre équipe va examiner cette annonce.' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:userId/listings — Annonces d'un utilisateur

router.get('/user/:userId', optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const result = await query(
      `SELECT a.id, a.titre, a.prix, a.condition, a.created_at, a.nb_vues AS view_count, a.status,
              cat.name AS category_name,
              com.name AS commune_name,
              (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image,
              (SELECT id FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com   ON com.id = a.commune_id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL AND a.status = 'active'
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    return res.json({ data: result.rows.map(mapUserListingRow) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
