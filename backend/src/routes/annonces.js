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
const { buildListingSearchContext, encodeListingCursor } = require('../services/listingsQuery');
const { deletePrefix, getJson, setJson } = require('../services/sharedCache');
const { enqueueTrocMatching } = require('../services/trocQueueService');
const {
  mapListingSearchRow,
  mapListingDetailResponse,
  mapUserListingRow,
} = require('../services/listingsPresentation');
const { getUserPresence, getPresenceLabel } = require('../services/presenceService');
const { getSellerResponseTime } = require('../services/sellerInsightsService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');
const {
  isDonCategory,
  validateListingMetadata,
} = require('../services/listingMetadata');


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

async function executeListingSearch(req, res, next, extraQuery = {}) {
  try {
    const mergedQuery = { ...(req.query || {}), ...(extraQuery || {}) };
    const cacheKey = `list:${JSON.stringify(mergedQuery)}`;
    const cached = await readListCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, params, orderBy, pageNum, pageSize, offset, geo, cursorWhere, cursorParams, sort, sortConfig } = buildListingSearchContext(mergedQuery);
    const cursorParamCount = cursorParams?.length || 0;
    const limitPlaceholder = params.length + cursorParamCount + 1;
    const offsetPlaceholder = params.length + cursorParamCount + 2;
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
          a.metadata,
          a.created_at AS published_at,
          a.created_at AS created_at_sort,
          a.boost_expires_at AS boost_expires_at,
          a.nb_vues,
          a.boost_expires_at AS boosted_until,
          ${distanceSelect},
          a.commune_id,
          cat.id AS category_id,
          cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
          com.name AS commune_name,
          u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
          u.avatar_url AS seller_avatar,
          CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
          u.pro_verified AS seller_pro_verified,
          u.email_verified AS seller_email_verified,
          u.phone_verified AS seller_phone_verified,
          u.trust_score AS seller_trust_score,
          u.trust_level AS seller_trust_level,
          u.note_moyenne AS seller_note_moyenne,
          u.nb_avis AS seller_nb_avis,
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
       WHERE ${whereClause}${cursorWhere ? ` AND ${cursorWhere}` : ''}
       ORDER BY ${orderBy}
       LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
      [...params, ...(cursorParams || []), pageSize, offset]
    );

    const total = parseInt(countRes.rows[0].total);
    const lastRow = listRes.rows[listRes.rows.length - 1] || null;
    const sellerIds = [...new Set(
      listRes.rows
        .map((row) => Number(row.seller_id))
        .filter((value) => Number.isFinite(value) && value > 0)
    )];
    const sellerInsights = new Map();
    await Promise.all(sellerIds.map(async (sellerId) => {
      const [presence, response] = await Promise.all([
        Promise.resolve(getUserPresence(sellerId)),
        getSellerResponseTime(query, sellerId).catch(() => ({
          avg_response_time_minutes: null,
          avg_response_time_label: null,
        })),
      ]);
      sellerInsights.set(sellerId, {
        seller_is_online: presence.is_online,
        seller_last_seen_at: presence.last_seen_at,
        seller_last_seen_label: getPresenceLabel(presence),
        seller_avg_response_time_minutes: response.avg_response_time_minutes,
        seller_avg_response_time_label: response.avg_response_time_label,
      });
    }));
    const nextCursor = lastRow && listRes.rows.length === pageSize
      ? encodeListingCursor({
          v: 1,
          sort,
          values: sortConfig.tupleFromRow(lastRow),
        })
      : null;

    const payload = {
      data: listRes.rows.map((row) => ({
        ...mapListingSearchRow(row),
        ...(sellerInsights.get(Number(row.seller_id)) || {}),
      })),
      nextCursor,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    };

    await writeListCache(cacheKey, payload, 15_000);
    return res.json(payload);
  } catch (err) {
    next(err);
    return null;
  }
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
  is_troc:          Joi.boolean().optional(),
  troc_accepts_complement_xpf: Joi.boolean().optional(),
  troc_complement_max_xpf: Joi.number().integer().min(0).optional(),
  troc_wants:       Joi.alternatives().try(
                      Joi.array().items(Joi.string().trim().min(1).max(80)),
                      Joi.string().allow('')
                    ).optional(),
  troc_status:      Joi.string().valid('open', 'negotiating', 'completed', 'cancelled').optional(),
  metadata:         Joi.object().unknown(true).optional(),
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
  status: Joi.string().valid('active', 'reserved', 'inactive', 'sold').optional(),
});

const signalerSchema = Joi.object({
  reason:  Joi.string().valid('spam','fake','prohibited','offensive','other').required(),
  comment: Joi.string().max(500).optional().allow(''),
});

function normalizeTrocWants(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n|;/]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

async function getCategoryById(categoryId) {
  if (!categoryId) return null;
  const result = await query(
    `SELECT id, slug, name
     FROM categories
     WHERE id = $1
     LIMIT 1`,
    [categoryId]
  );
  return result.rows[0] || null;
}

function resolveListingMetadata(categorySlug, value) {
  return validateListingMetadata(categorySlug, value || {});
}

async function resolveListingCategoryMetadata(categoryId, rawMetadata) {
  const category = await getCategoryById(categoryId);
  if (!category) {
    const error = new Error('Catégorie introuvable.');
    error.statusCode = 400;
    throw error;
  }

  const metadata = resolveListingMetadata(category.slug, rawMetadata);
  return { category, metadata };
}

// ── GET /api/listings — Recherche ───────────────────────────

router.get('/', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next);
});

router.get('/location_courte_duree', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'location_courte_duree' });
});

router.get('/locations', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'location_courte_duree' });
});

router.get('/services', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'services' });
});

router.get('/don', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'don' });
});

router.get('/dons', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'don' });
});

router.get('/immobilier', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'immobilier' });
});

// ── GET /api/listings/:id — Détail ──────────────────────────

router.post('/:id/view', async (req, res, next) => {
  try {
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }

    const source = String(req.body?.source || 'direct').slice(0, 40);
    await query(
      `INSERT INTO listing_stats (listing_id, viewer_ip, source)
       VALUES ($1, $2, $3)`,
      [listingId, req.ip || req.headers['x-forwarded-for'] || null, source]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contact', async (req, res, next) => {
  try {
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }

    const contactType = String(req.body?.contact_type || 'message').slice(0, 30);
    await query(
      `INSERT INTO listing_contacts (listing_id, contact_type)
       VALUES ($1, $2)`,
      [listingId, contactType]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

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
          u.avatar_url AS seller_avatar,
          CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS seller_is_pro,
          u.pro_verified AS seller_pro_verified,
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
    const sellerPresence = getUserPresence(listing.seller_id);
    const sellerResponse = await getSellerResponseTime(query, listing.seller_id).catch(() => ({
      avg_response_time_minutes: null,
      avg_response_time_label: null,
    }));
    listing.seller_is_online = sellerPresence.is_online;
    listing.seller_last_seen_at = sellerPresence.last_seen_at;
    listing.seller_last_seen_label = getPresenceLabel(sellerPresence);
    listing.seller_avg_response_time_minutes = sellerResponse.avg_response_time_minutes;
    listing.seller_avg_response_time_label = sellerResponse.avg_response_time_label;

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
    const isTroc = Boolean(value.is_troc);
    const trocWants = normalizeTrocWants(value.troc_wants);
    const trocAcceptsComplement = Boolean(value.troc_accepts_complement_xpf);
    const trocComplementMax = Number(value.troc_complement_max_xpf || 0);
    const trocStatus = value.troc_status || 'open';
    const rawMetadata = Object.prototype.hasOwnProperty.call(value, 'metadata') ? value.metadata : {};
    const { category, metadata } = await resolveListingCategoryMetadata(value.category_id, rawMetadata);
    const isDonListing = isDonCategory(category.slug);
    const price = isDonListing ? 0 : (value.is_free ? null : value.price);

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis.' });
    }

    if (!isDonListing && !value.is_free && (price === null || price === undefined)) {
      return res.status(400).json({ error: 'Le prix est requis pour une annonce payante.' });
    }

    if (isTroc && trocWants.length === 0) {
      return res.status(400).json({ error: 'Merci de preciser ce que vous cherchez pour le troc.' });
    }

    if (isTroc && trocAcceptsComplement && trocComplementMax <= 0) {
      return res.status(400).json({ error: 'Le complement XPF maximal doit etre superieur a 0.' });
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
           (user_id, titre, description, prix, category_id, commune_id, condition, is_negotiable, phone, contre_quoi,
            is_troc, troc_accepts_complement_xpf, troc_complement_max_xpf, troc_wants, troc_status, metadata, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'active')
         RETURNING *`,
        [
          req.user.id,
          title,
          description,
          price,
          value.category_id,
          value.commune_id,
          value.condition,
          priceNegotiable,
          value.phone || null,
          value.contre_quoi || null,
          isTroc,
          isTroc ? trocAcceptsComplement : false,
          isTroc ? trocComplementMax : 0,
          isTroc ? trocWants : [],
          isTroc ? trocStatus : 'open',
          JSON.stringify(metadata),
        ]
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
    if (isTroc) {
      enqueueTrocMatching(result.id).catch((err) =>
        console.error('[troc:matching] Enqueue erreur:', err.message)
      );
    }
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
      `SELECT id, user_id, category_id, commune_id, titre, description, prix, condition, status,
              is_boosted, boost_type, boost_expires_at, nb_vues, nb_favoris, slug,
              expires_at, published_at, created_at, updated_at, metadata, is_troc,
              troc_accepts_complement_xpf, troc_complement_max_xpf, troc_wants, troc_status,
              boosted_until, delete_reason, phone, is_negotiable, contre_quoi, deleted_at, view_count
       FROM annonces
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });

    const listing = existing.rows[0];
    if (listing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }

    const { error, value } = updateSchemaWithStatus.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const nextCategoryId = Object.prototype.hasOwnProperty.call(value, 'category_id') && value.category_id !== undefined
      ? value.category_id
      : listing.category_id;
    const rawMetadata = Object.prototype.hasOwnProperty.call(value, 'metadata')
      ? value.metadata
      : (listing.metadata || {});
    const { category, metadata } = await resolveListingCategoryMetadata(nextCategoryId, rawMetadata);
    const isDonListing = isDonCategory(category.slug);

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
      const price = isDonListing ? 0 : (value.is_free ? null : value.price);
      fields.push(`prix = $${p}`);
      params.push(price);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'category_id') && value.category_id !== undefined) {
      fields.push(`category_id = $${p}`);
      params.push(value.category_id);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'metadata') || Object.prototype.hasOwnProperty.call(value, 'category_id')) {
      fields.push(`metadata = $${p}`);
      params.push(JSON.stringify(metadata));
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

    if (Object.prototype.hasOwnProperty.call(value, 'is_troc')) {
      const nextIsTroc = Boolean(value.is_troc);
      const trocWants = normalizeTrocWants(value.troc_wants);
      const trocAcceptsComplement = Boolean(value.troc_accepts_complement_xpf);
      const trocComplementMax = Number(value.troc_complement_max_xpf || 0);
      const trocStatus = value.troc_status || (nextIsTroc ? listing.troc_status || 'open' : 'open');

      if (nextIsTroc && trocWants.length === 0) {
        return res.status(400).json({ error: 'Merci de preciser ce que vous cherchez pour le troc.' });
      }

      if (nextIsTroc && trocAcceptsComplement && trocComplementMax <= 0) {
        return res.status(400).json({ error: 'Le complement XPF maximal doit etre superieur a 0.' });
      }

      fields.push(`is_troc = $${p}`);
      params.push(nextIsTroc);
      p++;

      fields.push(`troc_accepts_complement_xpf = $${p}`);
      params.push(nextIsTroc ? trocAcceptsComplement : false);
      p++;

      fields.push(`troc_complement_max_xpf = $${p}`);
      params.push(nextIsTroc ? trocComplementMax : 0);
      p++;

      fields.push(`troc_wants = $${p}`);
      params.push(nextIsTroc ? trocWants : []);
      p++;

      fields.push(`troc_status = $${p}`);
      params.push(nextIsTroc ? trocStatus : 'open');
      p++;
    } else {
      if (Object.prototype.hasOwnProperty.call(value, 'troc_wants')) {
        fields.push(`troc_wants = $${p}`);
        params.push(normalizeTrocWants(value.troc_wants));
        p++;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'troc_accepts_complement_xpf')) {
        fields.push(`troc_accepts_complement_xpf = $${p}`);
        params.push(Boolean(value.troc_accepts_complement_xpf));
        p++;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'troc_complement_max_xpf')) {
        fields.push(`troc_complement_max_xpf = $${p}`);
        params.push(Number(value.troc_complement_max_xpf || 0));
        p++;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'troc_status')) {
        fields.push(`troc_status = $${p}`);
        params.push(value.troc_status || 'open');
        p++;
      }
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
    if (result.rows[0]?.is_troc) {
      enqueueTrocMatching(result.rows[0].id).catch((err) =>
        console.error('[troc:matching] Enqueue erreur:', err.message)
      );
    }
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

// ?? GET /api/users/:userId/listings ? Annonces d'un utilisateur

// ?? PATCH /api/listings/:id/mark-given ? Marquer un don comme compl?t?

router.patch('/:id/mark-given', authenticate, async (req, res, next) => {
  try {
    const listing = await query(
      `SELECT a.id, a.user_id, a.status, a.metadata, cat.slug AS category_slug
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [req.params.id]
    );

    if (!listing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (listing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }
    if (!isDonCategory(listing.rows[0].category_slug)) {
      return res.status(400).json({ error: 'Cette action est r?serv?e aux annonces de don.' });
    }

    const result = await query(
      `UPDATE annonces
       SET status = 'completed',
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('given_at', NOW()),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    void clearListCache();
    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();
    if (!['active', 'reserved', 'sold'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez active, reserved ou sold.' });
    }

    const listingResult = await query(
      `SELECT a.id, a.user_id, a.status, a.titre, a.metadata, a.deleted_at,
              u.prenom, u.nom, u.email
       FROM annonces a
       JOIN users u ON u.id = a.user_id
       WHERE a.id = $1 AND a.deleted_at IS NULL
       LIMIT 1`,
      [req.params.id]
    );

    const listing = listingResult.rows[0];
    if (!listing) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }
    if (listing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }

    const updated = await query(
      `UPDATE annonces
       SET status = $2,
           updated_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('status_updated_at', NOW()::text)
       WHERE id = $1
       RETURNING *`,
      [req.params.id, nextStatus]
    );

    const conversationRows = await query(
      `SELECT id, buyer_id
       FROM conversations
       WHERE annonce_id = $1`,
      [req.params.id]
    );

    const systemMessage = nextStatus === 'reserved'
      ? `📌 L'annonce « ${listing.titre} » est maintenant réservée.`
      : `✅ L'annonce « ${listing.titre} » est marquée comme vendue.`

    await Promise.all(
      conversationRows.rows.map(async (conversation) => {
        const recipientId = Number(conversation.buyer_id)
        if (!Number.isFinite(recipientId) || recipientId <= 0) return

        await query(
          `INSERT INTO messages (conv_id, sender_id, type, content)
           VALUES ($1, $2, 'system', $3)`,
          [conversation.id, req.user.id, systemMessage]
        ).catch(() => {})

        await Promise.all([
          createNotification(recipientId, {
            type: 'system',
            title: nextStatus === 'reserved' ? 'Annonce réservée' : 'Annonce vendue',
            body: systemMessage,
            href: `/messages/${conversation.id}`,
          }),
          sendPushToUser(recipientId, {
            title: nextStatus === 'reserved' ? 'Annonce réservée' : 'Annonce vendue',
            body: systemMessage,
            data: { type: 'listing_status_update', listing_id: Number(req.params.id), conversation_id: conversation.id, status: nextStatus },
          }).catch(() => {}),
        ])
      })
    )

    void clearListCache();
    return res.json({ data: updated.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.get('/user/:userId', optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const result = await query(
      `SELECT a.id, a.titre, a.prix, a.condition, a.created_at, a.nb_vues AS view_count, a.status, a.metadata,
              cat.name AS category_name,
              com.name AS commune_name,
              u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
              u.avatar_url AS seller_avatar,
              CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
              u.pro_verified AS seller_pro_verified,
              u.email_verified AS seller_email_verified,
              u.phone_verified AS seller_phone_verified,
              u.trust_score AS seller_trust_score,
              u.trust_level AS seller_trust_level,
              (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image,
              (SELECT id FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com   ON com.id = a.commune_id
       LEFT JOIN users u        ON u.id = a.user_id
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
