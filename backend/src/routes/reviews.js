'use strict';

const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');

const { authenticate } = require('../middleware/auth');
const { query, withTransaction } = require('../config/database');
const { sendReviewInviteEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');
const { evaluateReviewCreation } = require('../services/reviewCreationPolicy');
const { reportVerifiedReview } = require('../services/reviewReportService');

const router = express.Router();

const reviewSchema = Joi.object({
  pro_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim()).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(80).allow('', null).optional(),
  comment: Joi.string().trim().max(1000).allow('', null).optional(),
  token: Joi.string().trim().allow('', null).optional(),
  reviewer_email: Joi.string().trim().email().allow('', null).optional(),
  reviewer_prenom: Joi.string().trim().max(120).allow('', null).optional(),
});

const inviteSchema = Joi.object({
  pro_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim()).required(),
  reviewer_email: Joi.string().trim().email().allow('', null).optional(),
  reviewer_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim()).allow(null).optional(),
});

const replySchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
});

const helpfulSchema = Joi.object({
  helpful: Joi.boolean().default(true),
});

const reportSchema = Joi.object({
  reason: Joi.string().trim().max(300).allow('', null).optional(),
});

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function normalizeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function mapReview(row) {
  return {
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    reviewer_id: row.reviewer_id == null ? null : Number(row.reviewer_id),
    reviewer_prenom: row.reviewer_prenom ?? null,
    reviewer_avatar_url: row.reviewer_avatar_url ?? null,
    rating: Number(row.rating ?? 0),
    title: row.title ?? null,
    comment: row.comment ?? null,
    verified_purchase: Boolean(row.verified_purchase),
    source: row.source ?? 'invite',
    status: row.status ?? 'published',
    helpful_count: Number(row.helpful_count ?? 0),
    report_count: Number(row.report_count ?? 0),
    report_reason: row.report_reason ?? null,
    reply_content: row.reply_content ?? null,
    reply_at: row.reply_at ?? null,
    reply_by: row.reply_by == null ? null : Number(row.reply_by),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

async function loadPro(proId) {
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
       COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
       COALESCE(COUNT(r.id)::int, 0) AS review_count,
       COALESCE((
         SELECT COUNT(*)::int
         FROM annonces a
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
       ), 0) AS listing_count
     FROM users u
     LEFT JOIN verified_reviews r ON r.pro_id = u.id AND r.status = 'published'
     WHERE u.id = $1
       AND u.is_pro = TRUE
       AND COALESCE(u.pro_verified, FALSE) = TRUE
       AND u.deleted_at IS NULL
     GROUP BY u.id`,
    [proId]
  );

  return result.rows[0] || null;
}

async function loadReviews(proId, limit = 20, offset = 0) {
  const result = await query(
    `SELECT
       vr.id,
       vr.pro_id,
       vr.reviewer_id,
       vr.reviewer_prenom,
       vr.reviewer_avatar_url,
       vr.rating,
       vr.title,
       vr.comment,
       vr.verified_purchase,
       vr.source,
       vr.status,
       vr.helpful_count,
       vr.report_count,
       vr.report_reason,
       vr.reply_content,
       vr.reply_at,
       vr.reply_by,
       vr.created_at,
       vr.updated_at,
       rev.prenom AS reviewer_first_name,
       rev.nom AS reviewer_last_name,
       rev.avatar_url AS reviewer_avatar_url_db,
       (
         SELECT COUNT(*)
         FROM review_helpful rh
         WHERE rh.review_id = vr.id AND rh.helpful = TRUE
       )::int AS helpful_total
     FROM verified_reviews vr
     LEFT JOIN users rev ON rev.id = vr.reviewer_id
     WHERE vr.pro_id = $1
       AND vr.status IN ('published', 'reported')
     ORDER BY vr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [proId, limit, offset]
  );

  return result.rows.map((row) => ({
    ...mapReview({
      ...row,
      reviewer_prenom: row.reviewer_prenom || row.reviewer_first_name || null,
      reviewer_avatar_url: row.reviewer_avatar_url || row.reviewer_avatar_url_db || null,
      helpful_count: row.helpful_total ?? row.helpful_count,
    }),
    reviewer_nom: row.reviewer_last_name ?? null,
  }));
}

async function loadSummary(proId) {
  const result = await query(
    `SELECT
       COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
       COUNT(*)::int AS review_count,
       COUNT(*) FILTER (WHERE verified_purchase = TRUE)::int AS verified_count
     FROM verified_reviews
     WHERE pro_id = $1
       AND status = 'published'`,
    [proId]
  );

  return result.rows[0] || {
    avg_rating: 0,
    review_count: 0,
    verified_count: 0,
  };
}

router.get('/pro/:proId', async (req, res, next) => {
  try {
    const proId = Number(req.params.proId);
    if (!Number.isFinite(proId) || proId <= 0) {
      return res.status(400).json({ error: 'Professionnel invalide.' });
    }

    const [pro, summary, reviews] = await Promise.all([
      loadPro(proId),
      loadSummary(proId),
      loadReviews(proId, 30, 0),
    ]);

    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    return res.json({
      data: {
        pro,
        summary: {
          avg_rating: Number(summary.avg_rating ?? 0),
          review_count: Number(summary.review_count ?? 0),
          verified_count: Number(summary.verified_count ?? 0),
        },
        reviews,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/invite/:token', async (req, res, next) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Jeton invalide.' });
    }

    const tokenRes = await query(
      `SELECT rt.*, u.prenom AS pro_prenom, u.nom AS pro_nom, u.pro_company_name, u.pro_category, u.pro_logo_url, u.pro_banner_url, u.pro_description, u.pro_commune, u.pro_website, u.pro_phone
       FROM review_tokens rt
       JOIN users u ON u.id = rt.pro_id
       WHERE rt.token = $1
       LIMIT 1`,
      [token]
    );

    const row = tokenRes.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Lien introuvable.' });
    }

    return res.json({
      data: {
        token: row.token,
        expires_at: row.expires_at,
        used_at: row.used_at,
        pro: {
          id: Number(row.pro_id),
          prenom: row.pro_prenom,
          nom: row.pro_nom,
          pro_company_name: row.pro_company_name,
          pro_category: row.pro_category,
          pro_logo_url: row.pro_logo_url,
          pro_banner_url: row.pro_banner_url,
          pro_description: row.pro_description,
          pro_commune: row.pro_commune,
          pro_website: row.pro_website,
          pro_phone: row.pro_phone,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/invite', authenticate, async (req, res, next) => {
  try {
    const { error, value } = inviteSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const proId = Number(value.pro_id);
    const proRes = await query(
      `SELECT id, prenom, nom, email, pro_company_name
       FROM users
       WHERE id = $1
         AND is_pro = TRUE
         AND COALESCE(pro_verified, FALSE) = TRUE
         AND deleted_at IS NULL
       LIMIT 1`,
      [proId]
    );

    const pro = proRes.rows[0];
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    if (!req.user.is_admin && Number(req.user.id) !== Number(proId)) {
      return res.status(403).json({ error: 'Accès réservé au professionnel concerné.' });
    }

    const token = createToken();
    const inserted = await query(
      `INSERT INTO review_tokens (token, pro_id, reviewer_id, reviewer_email, conversation_id, source, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, 'invite', NOW() + INTERVAL '14 days', NOW())
       RETURNING *`,
      [
        token,
        proId,
        value.reviewer_id ? Number(value.reviewer_id) : null,
        normalizeText(value.reviewer_email),
        null,
      ]
    );

    if (value.reviewer_email) {
      await sendReviewInviteEmail(value.reviewer_email, 'Bonjour', {
        token,
        proName: pro.pro_company_name || `${pro.prenom} ${pro.nom}`.trim(),
        reviewUrl: `${process.env.BASE_URL || 'https://kalico.nc'}/avis/${token}`,
      }).catch(() => {});
    }

    return res.status(201).json({
      data: {
        token,
        review_url: `${process.env.BASE_URL || 'https://kalico.nc'}/avis/${token}`,
        expires_at: inserted.rows[0].expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const proId = Number(value.pro_id);
    const proRes = await query(
      `SELECT id, prenom, nom, pro_company_name
       FROM users
       WHERE id = $1
         AND is_pro = TRUE
         AND COALESCE(pro_verified, FALSE) = TRUE
         AND deleted_at IS NULL
       LIMIT 1`,
      [proId]
    );
    const pro = proRes.rows[0];
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }
    if (Number(req.user.id) === proId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas évaluer votre propre profil.' });
    }

    let tokenRow = null;
    if (value.token) {
      const tokenRes = await query(
        `SELECT * FROM review_tokens WHERE token = $1 LIMIT 1`,
        [value.token]
      );
      tokenRow = tokenRes.rows[0] || null;
      if (!tokenRow) {
        return res.status(404).json({ error: 'Lien d\'avis introuvable.' });
      }
      if (tokenRow.used_at) {
        return res.status(400).json({ error: 'Ce lien a déjà été utilisé.' });
      }
      if (new Date(tokenRow.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Ce lien a expiré.' });
      }
      if (Number(tokenRow.pro_id) !== proId) {
        return res.status(400).json({ error: 'Professionnel du lien invalide.' });
      }
      if (req.user && tokenRow.reviewer_id && Number(tokenRow.reviewer_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'Ce lien n\'est pas associé à votre compte.' });
      }
    }

    const reviewerId = req.user.id;
    const reviewerPrenom = normalizeText(req.user.prenom || 'Client');
    const reviewerAvatar = req.user.avatar_url || null;

    const conversationCheck = await query(
      `SELECT 1
       FROM conversations c
       WHERE (c.buyer_id = $1 AND c.seller_id = $2)
          OR (c.buyer_id = $2 AND c.seller_id = $1)
       LIMIT 1`,
      [reviewerId, proId]
    );
    const policy = evaluateReviewCreation({
      reviewerId,
      proId,
      hasInvite: Boolean(tokenRow),
      hasConversation: conversationCheck.rows.length > 0,
    });
    if (!policy.allowed) {
      return res.status(policy.status).json({ error: policy.error });
    }

    const created = await withTransaction(async (client) => {
      const reviewRes = await client.query(
        `INSERT INTO verified_reviews (
           pro_id, reviewer_id, reviewer_prenom, reviewer_avatar_url,
           rating, title, comment, verified_purchase, source, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, 'published')
         RETURNING *`,
        [
          proId,
          reviewerId,
          reviewerPrenom,
          reviewerAvatar,
          value.rating,
          normalizeText(value.title),
          normalizeText(value.comment),
          tokenRow ? 'invite' : 'profile',
        ]
      );

      if (tokenRow) {
        await client.query(
          'UPDATE review_tokens SET used_at = NOW() WHERE id = $1',
          [tokenRow.id]
        );
      }

      const summary = await client.query(
        `SELECT
           COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
           COUNT(*)::int AS review_count
         FROM verified_reviews
         WHERE pro_id = $1
           AND status = 'published'`,
        [proId]
      );

      await client.query(
        `UPDATE users
         SET note_moyenne = $2,
             nb_avis = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [proId, Number(summary.rows[0]?.avg_rating ?? 0), Number(summary.rows[0]?.review_count ?? 0)]
      );

      return reviewRes.rows[0];
    });

    return res.status(201).json({
      data: mapReview({
        ...created,
        reviewer_prenom: created.reviewer_prenom || reviewerPrenom || null,
        reviewer_avatar_url: created.reviewer_avatar_url || reviewerAvatar || null,
      }),
      pro: {
        id: proId,
        prenom: pro.prenom,
        nom: pro.nom,
        pro_company_name: pro.pro_company_name,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reply', authenticate, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    const { error, value } = replySchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const reviewRes = await query(
      `SELECT id, pro_id
       FROM verified_reviews
       WHERE id = $1
       LIMIT 1`,
      [reviewId]
    );
    const review = reviewRes.rows[0];
    if (!review) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }
    if (Number(review.pro_id) !== Number(req.user.id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Seul le professionnel concerné peut répondre.' });
    }

    const updated = await query(
      `UPDATE verified_reviews
       SET reply_content = $2,
           reply_at = NOW(),
           reply_by = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [reviewId, value.content, req.user.id]
    );

    return res.json({ data: mapReview(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/helpful', authenticate, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    const { error, value } = helpfulSchema.validate(req.body || {}, {
      stripUnknown: true,
      convert: true,
    });
    if (error) return res.status(400).json({ error: error.details[0].message });

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO review_helpful (review_id, user_id, helpful, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (review_id, user_id)
         DO UPDATE SET helpful = EXCLUDED.helpful, created_at = NOW()`,
        [reviewId, req.user.id, value.helpful]
      );

      const countRes = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM review_helpful
         WHERE review_id = $1 AND helpful = TRUE`,
        [reviewId]
      );

      await client.query(
        `UPDATE verified_reviews
         SET helpful_count = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [reviewId, countRes.rows[0]?.total ?? 0]
      );
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    const { error, value } = reportSchema.validate(req.body || {}, {
      stripUnknown: true,
      convert: true,
    });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await withTransaction((client) => reportVerifiedReview({
      client,
      reviewId,
      reporterId: req.user.id,
      reason: normalizeText(value.reason),
    }));
    if (result.outcome === 'invalid') return res.status(400).json({ error: 'Avis invalide.' });
    if (result.outcome === 'not_found') return res.status(404).json({ error: 'Avis introuvable.' });
    if (result.outcome === 'self_report') return res.status(403).json({ error: 'Vous ne pouvez pas signaler votre propre avis.' });

    return res.json({
      data: mapReview(result.review),
      report: { recorded: result.outcome === 'recorded', count: result.count, threshold: result.threshold },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
