'use strict';

const express = require('express');
const Joi = require('joi');
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const statsRouter = require('./stats.route');

const router = express.Router();

const createSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  description: Joi.string().min(10).max(1200).required(),
  kind: Joi.string().valid('promo', 'event', 'concert', 'other').required(),
  target_audience: Joi.string().valid('particulier', 'pro').required(),
  duration_days: Joi.number().integer().valid(3, 7).required(),
  commune_id: Joi.number().integer().optional().allow(null),
  location_name: Joi.string().min(2).max(120).optional().allow('', null),
  event_date: Joi.string().isoDate().optional().allow('', null),
  link_url: Joi.string().uri().optional().allow('', null),
  normal_price_xpf: Joi.number().integer().min(0).optional().allow(null),
  promo_price_xpf: Joi.number().integer().min(0).optional().allow(null),
  discount_pct: Joi.number().integer().min(0).max(100).optional().allow(null),
  conditions: Joi.string().max(1500).optional().allow('', null),
  contact_name: Joi.string().max(120).optional().allow('', null),
  contact_phone: Joi.string().max(30).optional().allow('', null),
  contact_email: Joi.string().email().max(255).optional().allow('', null),
  website_url: Joi.string().uri().optional().allow('', null),
  opening_hours: Joi.string().max(255).optional().allow('', null),
  photos: Joi.array().items(Joi.string().uri().allow('', null)).max(12).default([]),
  social_links: Joi.object().unknown(true).default({}),
});

function computePrice(targetAudience, durationDays) {
  if (targetAudience === 'particulier') {
    return durationDays === 7 ? 590 : 290;
  }
  return durationDays === 7 ? 1990 : 990;
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(12, Math.max(1, Number(req.query.limit || 6)));
    const kinds = String(req.query.kind || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const targetAudience = String(req.query.target_audience || '').trim();
    const search = String(req.query.q || '').trim();
    const whereParts = [
      `bp.status = 'active'`,
      `bp.expires_at > NOW()`,
    ];
    const params = [];

    if (kinds.length > 0) {
      params.push(kinds);
      whereParts.push(`bp.kind = ANY($${params.length}::text[])`);
    }

    if (targetAudience) {
      params.push(targetAudience);
      whereParts.push(`bp.target_audience = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereParts.push(`(
        bp.title ILIKE $${params.length}
        OR bp.description ILIKE $${params.length}
        OR bp.location_name ILIKE $${params.length}
        OR com.name ILIKE $${params.length}
      )`);
    }

    const result = await query(
      `SELECT
         bp.id,
         bp.title,
         bp.description,
         bp.kind,
         bp.target_audience,
         bp.duration_days,
         bp.location_name,
         bp.event_date,
         bp.link_url,
         bp.price_xpf,
         bp.is_free_included,
         bp.normal_price_xpf,
         bp.promo_price_xpf,
         bp.discount_pct,
         bp.conditions,
         bp.contact_name,
         bp.contact_phone,
         bp.contact_email,
         bp.website_url,
         bp.social_links,
         bp.opening_hours,
         bp.photos,
         bp.view_count,
         bp.share_count,
         bp.created_at,
         bp.expires_at,
         bp.status,
         u.id AS author_id,
         u.prenom AS author_prenom,
         u.nom AS author_nom,
         CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS author_is_pro,
         com.name AS commune_name
       FROM bon_plans bp
       LEFT JOIN users u ON u.id = bp.user_id
       LEFT JOIN communes com ON com.id = bp.commune_id
       WHERE ${whereParts.join(' AND ')}
       ORDER BY bp.is_free_included DESC, bp.event_date ASC NULLS LAST, bp.created_at DESC
       LIMIT $${params.push(limit)}`,
      params
    );

    return res.json({
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const durationDays = Number(value.duration_days);
    const targetAudience = value.target_audience;
    const basePrice = computePrice(targetAudience, durationDays);
    const now = new Date();

    const userRes = await query(
      `SELECT id, is_pro, pro_plan, last_bon_plan_offer_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    const user = userRes.rows[0];
    const isProPlus = user?.is_pro && user?.pro_plan === 'pro_plus';
    const lastOffer = user?.last_bon_plan_offer_at ? new Date(user.last_bon_plan_offer_at) : null;
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const lastKey = lastOffer
      ? `${lastOffer.getUTCFullYear()}-${String(lastOffer.getUTCMonth() + 1).padStart(2, '0')}`
      : null;
    const freeIncluded = isProPlus && lastKey !== monthKey;
    const priceXpf = freeIncluded ? 0 : basePrice;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const created = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO bon_plans
           (user_id, title, description, kind, target_audience, commune_id, location_name, event_date, duration_days, price_xpf, is_free_included,
            normal_price_xpf, promo_price_xpf, discount_pct, conditions, contact_name, contact_phone, contact_email, website_url, social_links, opening_hours,
            photos, status, expires_at, link_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'active',$23,$24)
         RETURNING *`,
        [
          req.user.id,
          value.title.trim(),
          value.description.trim(),
          value.kind,
          targetAudience,
          value.commune_id || null,
          value.location_name?.trim() || null,
          value.event_date || null,
          durationDays,
          priceXpf,
          freeIncluded,
          value.normal_price_xpf ?? null,
          value.promo_price_xpf ?? null,
          value.discount_pct ?? null,
          value.conditions?.trim() || null,
          value.contact_name?.trim() || null,
          value.contact_phone?.trim() || null,
          value.contact_email?.trim() || null,
          value.website_url?.trim() || null,
          JSON.stringify(value.social_links || {}),
          value.opening_hours?.trim() || null,
          JSON.stringify(value.photos || []),
          expiresAt,
          value.link_url?.trim() || null,
        ]
      );

      if (freeIncluded) {
        await client.query(
          `UPDATE users
           SET last_bon_plan_offer_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [req.user.id]
        );
      }

      return inserted.rows[0];
    });

    statsRouter.invalidateCache?.('home');

    return res.status(201).json({
      data: {
        ...created,
        price_display: `${priceXpf.toLocaleString('fr-FR')} XPF`,
        free_included: freeIncluded,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
