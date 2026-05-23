'use strict';

const express = require('express');
const Joi = require('joi');

const { query } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateBusinessReviewStats } = require('../services/bonPlansService');

const router = express.Router();

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).optional().allow('', null),
});

const replySchema = Joi.object({
  reply_text: Joi.string().max(1000).required(),
});

function parsePage(value, fallback = 1) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : fallback;
}

function parseLimit(value, fallback = 20, max = 50) {
  const limit = Number(value);
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(max, Math.floor(limit));
}

function mapBusinessRow(row) {
  return {
    id: row.id,
    owner_user_id: row.owner_user_id ?? null,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url ?? null,
    contact_email: row.contact_email ?? null,
    category: row.category ?? null,
    badge: row.badge ?? 'none',
    verified_at: row.verified_at ?? null,
    verified_by: row.verified_by ?? null,
    bon_plan_count: Number(row.bon_plan_count ?? 0),
    review_avg: Number(row.review_avg ?? 0),
    review_count: Number(row.review_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 24, 100);
    const offset = (page - 1) * limit;
    const q = String(req.query.q || '').trim();
    const badge = String(req.query.badge || '').trim();
    const params = [];
    const where = ['1=1'];

    if (q) {
      params.push(`%${q}%`);
      where.push(`(b.name ILIKE $${params.length} OR b.slug ILIKE $${params.length})`);
    }

    if (badge) {
      params.push(badge);
      where.push(`b.badge = $${params.length}`);
    }

    const countQuery = `SELECT COUNT(*)::int AS total FROM businesses b WHERE ${where.join(' AND ')}`;
    const listParams = [...params, limit, offset];
    const listQuery = `
      SELECT b.*
      FROM businesses b
      WHERE ${where.join(' AND ')}
      ORDER BY b.bon_plan_count DESC, b.review_avg DESC, b.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countRes, listRes] = await Promise.all([
      query(countQuery, params),
      query(listQuery, listParams),
    ]);

    return res.json({
      data: listRes.rows.map(mapBusinessRow),
      pagination: {
        total: Number(countRes.rows[0]?.total ?? 0),
        page,
        limit,
        pages: Math.ceil(Number(countRes.rows[0]?.total ?? 0) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const businessRes = await query(
      `SELECT b.*
       FROM businesses b
       WHERE b.slug = $1
       LIMIT 1`,
      [slug]
    );

    const business = businessRes.rows[0];
    if (!business) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    const plansRes = await query(
      `SELECT
         bp.id,
         bp.title,
         bp.description,
         bp.image_url,
         bp.promo_label,
         bp.original_price_xpf,
         bp.promo_price_xpf,
         bp.cta_label,
         bp.cta_url,
         bp.category,
         bp.published_until,
         bp.view_count,
         bp.click_count,
         bp.business_name,
         bp.business_logo_url,
         bp.business_id,
         bp.status
       FROM bon_plans bp
       WHERE bp.business_id = $1
         AND bp.status = 'active'
         AND bp.published_until > NOW()
       ORDER BY bp.published_from DESC, bp.id DESC
       LIMIT 24`,
      [business.id]
    );

    return res.json({
      data: {
        business: mapBusinessRow(business),
        bon_plans: plansRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug/reviews', optionalAuth, async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20, 50);
    const offset = (page - 1) * limit;

    const businessRes = await query(`SELECT id FROM businesses WHERE slug = $1 LIMIT 1`, [slug]);
    const business = businessRes.rows[0];
    if (!business) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    const [countRes, reviewsRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM business_reviews WHERE business_id = $1`, [business.id]),
      query(
        `SELECT
           r.id, r.business_id, r.user_id, r.rating, r.comment, r.reply_text,
           r.reported, r.report_reason, r.report_reviewed_at, r.created_at, r.updated_at,
           u.prenom AS user_prenom, u.nom AS user_nom, u.avatar_url AS user_avatar
         FROM business_reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.business_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [business.id, limit, offset]
      ),
    ]);

    return res.json({
      data: reviewsRes.rows,
      pagination: {
        total: Number(countRes.rows[0]?.total ?? 0),
        page,
        limit,
        pages: Math.ceil(Number(countRes.rows[0]?.total ?? 0) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:slug/reviews', authenticate, validate({ body: reviewSchema }), async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const businessRes = await query(`SELECT id, owner_user_id FROM businesses WHERE slug = $1 LIMIT 1`, [slug]);
    const business = businessRes.rows[0];
    if (!business) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    const userRes = await query(`SELECT id, created_at FROM users WHERE id = $1 LIMIT 1`, [req.user.id]);
    const user = userRes.rows[0];
    const accountAgeDays = user?.created_at ? (Date.now() - new Date(user.created_at).getTime()) / 86_400_000 : 0;
    if (accountAgeDays < 7) {
      return res.status(403).json({ error: 'Compte trop récent pour laisser un avis.' });
    }

    const { rating, comment } = req.body || {};
    const reviewRes = await query(
      `INSERT INTO business_reviews (business_id, user_id, rating, comment, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (business_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING *`,
      [business.id, req.user.id, rating, comment || null]
    );

    await updateBusinessReviewStats(undefined, business.id).catch(() => {});

    return res.status(201).json({ data: reviewRes.rows[0] });
  } catch (err) {
    if (String(err?.code) === '23505') {
      return res.status(409).json({ error: 'Avis déjà existant.' });
    }
    next(err);
  }
});

router.put('/:slug/reviews/:id', authenticate, validate({ body: reviewSchema }), async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const reviewId = String(req.params.id || '').trim();
    const businessRes = await query(`SELECT id FROM businesses WHERE slug = $1 LIMIT 1`, [slug]);
    const business = businessRes.rows[0];
    if (!business) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    const { rating, comment } = req.body || {};
    const reviewRes = await query(
      `UPDATE business_reviews
       SET rating = $1, comment = $2, updated_at = NOW()
       WHERE id = $3 AND business_id = $4 AND user_id = $5
       RETURNING *`,
      [rating, comment || null, reviewId, business.id, req.user.id]
    );

    if (!reviewRes.rows[0]) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }

    await updateBusinessReviewStats(undefined, business.id).catch(() => {});
    return res.json({ data: reviewRes.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/:slug/reviews/:id/report', authenticate, async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const reviewId = String(req.params.id || '').trim();
    const businessRes = await query(`SELECT id FROM businesses WHERE slug = $1 LIMIT 1`, [slug]);
    const business = businessRes.rows[0];
    if (!business) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    const result = await query(
      `UPDATE business_reviews
       SET reported = TRUE,
           report_reason = COALESCE(NULLIF($1, ''), report_reason),
           report_reviewed_at = NULL,
           updated_at = NOW()
       WHERE id = $2 AND business_id = $3
       RETURNING *`,
      [String(req.body?.report_reason || req.body?.reason || 'signalement').slice(0, 255), reviewId, business.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/:slug/reviews/:id/reply', authenticate, validate({ body: replySchema }), async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const reviewId = String(req.params.id || '').trim();
    const businessRes = await query(
      `SELECT id, owner_user_id FROM businesses WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    const business = businessRes.rows[0];
    if (!business) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    if (!req.user?.is_admin && business.owner_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const result = await query(
      `UPDATE business_reviews
       SET reply_text = $1, updated_at = NOW()
       WHERE id = $2 AND business_id = $3
       RETURNING *`,
      [String(req.body.reply_text || '').trim(), reviewId, business.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
