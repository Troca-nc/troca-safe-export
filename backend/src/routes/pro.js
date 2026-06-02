'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { mapListingSearchRow } = require('../services/listingsPresentation');

const router = express.Router();

const applySchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(200).required(),
  category: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().min(10).max(300).required(),
  website: Joi.string().trim().uri().allow('', null).optional(),
  phone: Joi.string().trim().min(6).max(30).allow('', null).optional(),
  hours: Joi.string().trim().max(255).allow('', null).optional(),
  commune: Joi.string().trim().min(2).max(120).required(),
  siret: Joi.string().trim().max(60).allow('', null).optional(),
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('', null).optional(),
});

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function formatCompanyName(row) {
  return row.pro_company_name || [row.prenom, row.nom].filter(Boolean).join(' ').trim() || 'Professionnel Troca';
}

function mapProsRow(row) {
  return {
    id: Number(row.id),
    prenom: row.prenom ?? null,
    nom: row.nom ?? null,
    pro_company_name: row.pro_company_name ?? null,
    pro_category: row.pro_category ?? null,
    pro_logo_url: row.pro_logo_url ?? null,
    pro_banner_url: row.pro_banner_url ?? null,
    pro_description: row.pro_description ?? null,
    pro_commune: row.pro_commune ?? null,
    pro_website: row.pro_website ?? null,
    pro_phone: row.pro_phone ?? null,
    pro_hours: row.pro_hours ?? null,
    pro_siret: row.pro_siret ?? null,
    avg_rating: Number(row.avg_rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    listing_count: Number(row.listing_count ?? 0),
    display_name: formatCompanyName(row),
    is_pro: true,
    pro_verified: true,
  };
}

async function loadProProfile(proId) {
  const profileRes = await query(
    `SELECT
       u.id,
       u.prenom,
       u.nom,
       u.pro_company_name,
       u.pro_category,
       u.pro_logo_url,
       u.pro_banner_url,
       u.pro_description,
       u.pro_commune,
       u.pro_website,
       u.pro_phone,
       u.pro_hours,
       u.pro_siret,
       COALESCE(ROUND((
         SELECT AVG(r.rating)::numeric
         FROM pro_reviews r
         WHERE r.pro_id = u.id
       ), 1), 0) AS avg_rating,
       COALESCE((
         SELECT COUNT(*)::int
         FROM pro_reviews r
         WHERE r.pro_id = u.id
       ), 0) AS review_count,
       COALESCE((
         SELECT COUNT(*)::int
         FROM annonces a
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
       ), 0) AS listing_count
     FROM users u
     WHERE u.id = $1
       AND u.is_pro = TRUE
       AND COALESCE(u.pro_verified, FALSE) = TRUE
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
       AND u.deleted_at IS NULL`,
    [proId]
  );

  const profile = profileRes.rows[0];
  if (!profile) return null;

  const [reviewsRes, listingsRes] = await Promise.all([
    query(
      `SELECT
         pr.id,
         pr.pro_id,
         pr.reviewer_id,
         pr.rating,
         pr.comment,
         pr.verified_purchase,
         pr.created_at,
         rev.prenom AS reviewer_prenom,
         rev.nom AS reviewer_nom,
         rev.avatar_url AS reviewer_avatar_url
       FROM pro_reviews pr
       LEFT JOIN users rev ON rev.id = pr.reviewer_id
       WHERE pr.pro_id = $1
       ORDER BY pr.created_at DESC
       LIMIT 3`,
      [proId]
    ),
    query(
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
         a.commune_id,
         cat.id AS category_id,
         cat.name AS category_name,
         cat.slug AS category_slug,
         cat.icon AS category_icon,
         com.name AS commune_name,
         u.id AS seller_id,
         u.prenom AS seller_prenom,
         u.nom AS seller_nom,
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
       LEFT JOIN communes com ON com.id = a.commune_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
         AND a.status = 'active'
         AND a.deleted_at IS NULL
       ORDER BY a.is_boosted DESC, a.created_at DESC
       LIMIT 12`,
      [proId]
    ),
  ]);

  return {
    ...mapProsRow(profile),
    reviews: reviewsRes.rows.map((row) => ({
      id: Number(row.id),
      pro_id: Number(row.pro_id),
      reviewer_id: Number(row.reviewer_id),
      rating: Number(row.rating),
      comment: row.comment ?? null,
      verified_purchase: Boolean(row.verified_purchase),
      created_at: row.created_at,
      reviewer_prenom: row.reviewer_prenom ?? null,
      reviewer_nom: row.reviewer_nom ?? null,
      reviewer_avatar_url: row.reviewer_avatar_url ?? null,
    })),
    listings: listingsRes.rows.map((row) => ({
      ...mapListingSearchRow(row),
      author: {
        id: Number(row.seller_id),
        prenom: row.seller_prenom ?? null,
        nom: row.seller_nom ?? null,
        avatar_url: row.seller_avatar ?? null,
        is_pro: Boolean(row.is_pro),
        pro_verified: Boolean(row.seller_pro_verified),
      },
    })),
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.prenom,
         u.nom,
         u.pro_company_name,
         u.pro_category,
         u.pro_logo_url,
         u.pro_banner_url,
         u.pro_description,
         u.pro_commune,
         u.pro_website,
         u.pro_phone,
         u.pro_hours,
         u.pro_siret,
         COALESCE(ROUND((
           SELECT AVG(r.rating)::numeric
           FROM pro_reviews r
           WHERE r.pro_id = u.id
         ), 1), 0) AS avg_rating,
         COALESCE((
           SELECT COUNT(*)::int
           FROM pro_reviews r
           WHERE r.pro_id = u.id
         ), 0) AS review_count,
         COALESCE((
           SELECT COUNT(*)::int
           FROM annonces a
           WHERE a.user_id = u.id
             AND a.status = 'active'
             AND a.deleted_at IS NULL
         ), 0) AS listing_count
       FROM users u
       WHERE u.is_pro = TRUE
         AND COALESCE(u.pro_verified, FALSE) = TRUE
         AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
         AND u.deleted_at IS NULL
       ORDER BY avg_rating DESC, listing_count DESC, COALESCE(u.pro_company_name, u.prenom, u.nom) ASC
       LIMIT 12`
    );

    return res.json({ data: result.rows.map(mapProsRow) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pro = await loadProProfile(req.params.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    return res.json({ data: pro });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const proId = Number(req.params.id);

    const reviewsRes = await query(
      `SELECT
         pr.id,
         pr.pro_id,
         pr.reviewer_id,
         pr.rating,
         pr.comment,
         pr.verified_purchase,
         pr.created_at,
         rev.prenom AS reviewer_prenom,
         rev.nom AS reviewer_nom,
         rev.avatar_url AS reviewer_avatar_url
       FROM pro_reviews pr
       LEFT JOIN users rev ON rev.id = pr.reviewer_id
       WHERE pr.pro_id = $1
       ORDER BY pr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [proId, limit, offset]
    );

    const countRes = await query(
      'SELECT COUNT(*)::int AS total FROM pro_reviews WHERE pro_id = $1',
      [proId]
    );

    return res.json({
      data: reviewsRes.rows.map((row) => ({
        id: Number(row.id),
        pro_id: Number(row.pro_id),
        reviewer_id: Number(row.reviewer_id),
        rating: Number(row.rating),
        comment: row.comment ?? null,
        verified_purchase: Boolean(row.verified_purchase),
        created_at: row.created_at,
        reviewer_prenom: row.reviewer_prenom ?? null,
        reviewer_nom: row.reviewer_nom ?? null,
        reviewer_avatar_url: row.reviewer_avatar_url ?? null,
      })),
      pagination: {
        total: Number(countRes.rows[0]?.total ?? 0),
        page,
        limit,
        pages: Math.max(1, Math.ceil(Number(countRes.rows[0]?.total ?? 0) / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const { error, value } = applySchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updates = {
      is_pro: true,
      pro_verified: false,
      pro_verified_at: null,
      pro_company_name: normalizeMaybeText(value.company_name),
      pro_category: normalizeMaybeText(value.category),
      pro_description: normalizeMaybeText(value.description),
      pro_logo_url: null,
      pro_banner_url: null,
      pro_website: normalizeMaybeText(value.website),
      pro_phone: normalizeMaybeText(value.phone),
      pro_hours: normalizeMaybeText(value.hours),
      pro_commune: normalizeMaybeText(value.commune),
      pro_siret: normalizeMaybeText(value.siret),
    };

    const result = await query(
      `UPDATE users
       SET is_pro = $2,
           pro_verified = $3,
           pro_verified_at = $4,
           pro_company_name = $5,
           pro_category = $6,
           pro_description = $7,
           pro_logo_url = $8,
           pro_banner_url = $9,
           pro_website = $10,
           pro_phone = $11,
           pro_hours = $12,
           pro_commune = $13,
           pro_siret = $14,
           pro_since = COALESCE(pro_since, NOW()),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, prenom, nom, is_pro, pro_verified, pro_company_name, pro_category`,
      [
        req.user.id,
        updates.is_pro,
        updates.pro_verified,
        updates.pro_verified_at,
        updates.pro_company_name,
        updates.pro_category,
        updates.pro_description,
        updates.pro_logo_url,
        updates.pro_banner_url,
        updates.pro_website,
        updates.pro_phone,
        updates.pro_hours,
        updates.pro_commune,
        updates.pro_siret,
      ]
    );

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const payload = result.rows[0];
      await sendMail({
        to: adminEmail,
        subject: 'Nouvelle demande compte pro',
        html: `
          <p>Une nouvelle demande de compte pro a été envoyée sur Troca.</p>
          <ul>
            <li><strong>Utilisateur :</strong> ${payload.prenom} ${payload.nom} (${payload.email})</li>
            <li><strong>Entreprise :</strong> ${updates.pro_company_name || 'Non renseignée'}</li>
            <li><strong>Catégorie :</strong> ${updates.pro_category || 'Non renseignée'}</li>
            <li><strong>Commune :</strong> ${updates.pro_commune || 'Non renseignée'}</li>
            <li><strong>SIRET/RIDET :</strong> ${updates.pro_siret || 'Non renseigné'}</li>
          </ul>
          <p>Connexion requise pour la validation manuelle dans l'espace admin.</p>
        `,
      }).catch(() => {});
    }

    return res.status(201).json({
      data: {
        id: result.rows[0].id,
        is_pro: result.rows[0].is_pro,
        pro_verified: result.rows[0].pro_verified,
        pro_company_name: result.rows[0].pro_company_name,
        pro_category: result.rows[0].pro_category,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const proId = Number(req.params.id);
    if (!Number.isFinite(proId) || proId <= 0) {
      return res.status(400).json({ error: 'Professionnel invalide.' });
    }

    const { error, value } = reviewSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const proRes = await query(
      `SELECT id, prenom, nom
       FROM users
       WHERE id = $1
         AND is_pro = TRUE
         AND COALESCE(pro_verified, FALSE) = TRUE
       LIMIT 1`,
      [proId]
    );

    const pro = proRes.rows[0];
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    const conversationRes = await query(
      `SELECT 1
       FROM conversations c
       WHERE (c.buyer_id = $1 AND c.seller_id = $2)
          OR (c.buyer_id = $2 AND c.seller_id = $1)
       LIMIT 1`,
      [req.user.id, proId]
    );

    if (!conversationRes.rows.length) {
      return res.status(403).json({ error: 'Vous devez avoir échangé avec ce professionnel avant de laisser un avis.' });
    }

    const created = await withTransaction(async (client) => {
      const reviewRes = await client.query(
        `INSERT INTO pro_reviews (pro_id, reviewer_id, rating, comment, verified_purchase)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING *`,
        [proId, req.user.id, value.rating, normalizeMaybeText(value.comment)]
      );

      const statsRes = await client.query(
        `SELECT
           COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
           COUNT(*)::int AS review_count
         FROM pro_reviews
         WHERE pro_id = $1`,
        [proId]
      );

      await client.query(
        `UPDATE users
         SET note_moyenne = $2,
             nb_avis = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [proId, Number(statsRes.rows[0]?.avg_rating ?? 0), Number(statsRes.rows[0]?.review_count ?? 0)]
      );

      return reviewRes.rows[0];
    });

    return res.status(201).json({
      data: {
        id: created.id,
        pro_id: created.pro_id,
        reviewer_id: created.reviewer_id,
        rating: created.rating,
        comment: created.comment,
        verified_purchase: created.verified_purchase,
        created_at: created.created_at,
        pro_name: `${pro.prenom} ${pro.nom}`.trim(),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
