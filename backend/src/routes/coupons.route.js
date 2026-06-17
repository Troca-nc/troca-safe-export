'use strict';

const crypto = require('crypto');
const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateQrCodeFromUrl, saveQrCodeToStorage } = require('../services/qrCodeService');

const router = express.Router();

const createSchema = Joi.object({
  label: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).allow('', null),
  discount_type: Joi.string().valid('percent', 'fixed_xpf', 'free_item', 'free_shipping', 'other').required(),
  discount_value: Joi.number().integer().allow(null),
  min_purchase_xpf: Joi.number().integer().min(0).default(0),
  max_uses: Joi.number().integer().min(1).allow(null),
  uses_per_user: Joi.number().integer().min(1).default(1),
  valid_from: Joi.string().isoDate().allow('', null),
  valid_until: Joi.string().isoDate().allow('', null),
  bon_plan_id: Joi.number().integer().allow(null),
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

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 5 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join('');
  return `KAL${suffix}`;
}

async function insertCoupon({ userId, payload }) {
  const baseUrl = (process.env.BASE_URL || 'https://kalico.nc').replace(/\/$/, '');
  const code = generateCode();
  const couponUrl = `${baseUrl}/coupon/${code}`;
  const qrCodeDataUrl = await generateQrCodeFromUrl(couponUrl);
  const qrCodeUrl = await saveQrCodeToStorage(`coupon-${code}`, qrCodeDataUrl);

  const result = await query(
    `INSERT INTO coupons
       (pro_id, bon_plan_id, code, label, description, discount_type, discount_value, min_purchase_xpf, max_uses,
        uses_per_user, valid_from, valid_until, is_active, qr_code_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, $13)
     RETURNING *`,
    [
      userId,
      payload.bon_plan_id || null,
      code,
      payload.label,
      payload.description || null,
      payload.discount_type,
      payload.discount_value == null ? null : Number(payload.discount_value),
      Number(payload.min_purchase_xpf ?? 0),
      payload.max_uses == null ? null : Number(payload.max_uses),
      Number(payload.uses_per_user ?? 1),
      normalizeDate(payload.valid_from),
      normalizeDate(payload.valid_until),
      qrCodeUrl,
    ]
  );

  return {
    ...result.rows[0],
    qr_code_url: qrCodeUrl,
    public_url: couponUrl,
  };
}

function serializeCoupon(row) {
  const baseUrl = (process.env.BASE_URL || 'https://kalico.nc').replace(/\/$/, '');
  const totalUses = Number(row.uses_count ?? 0);
  const maxUses = row.max_uses == null ? null : Number(row.max_uses);
  return {
    id: Number(row.id),
    pro_id: row.pro_id == null ? null : Number(row.pro_id),
    bon_plan_id: row.bon_plan_id == null ? null : Number(row.bon_plan_id),
    code: row.code,
    label: row.label,
    description: row.description ?? null,
    discount_type: row.discount_type,
    discount_value: row.discount_value == null ? null : Number(row.discount_value),
    min_purchase_xpf: row.min_purchase_xpf == null ? 0 : Number(row.min_purchase_xpf),
    max_uses: maxUses,
    uses_count: totalUses,
    uses_per_user: Number(row.uses_per_user ?? 1),
    valid_from: row.valid_from ?? null,
    valid_until: row.valid_until ?? null,
    is_active: Boolean(row.is_active),
    qr_code_url: row.qr_code_url ?? null,
    public_url: `${baseUrl}/coupon/${row.code}`,
    usage_rate: maxUses ? Math.round((totalUses / maxUses) * 100) : null,
    created_at: row.created_at ?? null,
  };
}

router.post('/', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const { error, value: payload } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const coupon = await insertCoupon({ userId: req.user.id, payload });
    return res.status(201).json({ data: coupon });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const { rows } = await query(
      `SELECT c.*, b.title AS bon_plan_title, b.business_name
       FROM coupons c
       LEFT JOIN bon_plans b ON b.id = c.bon_plan_id
       WHERE c.pro_id = $1
       ORDER BY c.created_at DESC, c.id DESC`,
      [req.user.id]
    );
    return res.json({
      data: rows.map((row) => ({
        ...serializeCoupon(row),
        bon_plan_title: row.bon_plan_title ?? null,
        business_name: row.business_name ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.*, u.pro_company_name, u.pro_logo_url
         FROM coupons c
         JOIN users u ON u.id = c.pro_id
        WHERE c.code = $1
        LIMIT 1`,
      [String(req.params.code || '').trim().toUpperCase()]
    );
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ valid: false, reason: 'Coupon introuvable.' });
    }

    const now = Date.now();
    const start = row.valid_from ? new Date(row.valid_from).getTime() : null;
    const end = row.valid_until ? new Date(row.valid_until).getTime() : null;
    if (!row.is_active) {
      return res.json({ valid: false, reason: 'Coupon désactivé.' });
    }
    if (start && start > now) {
      return res.json({ valid: false, reason: 'Coupon pas encore actif.' });
    }
    if (end && end < now) {
      return res.json({ valid: false, reason: 'Coupon expiré.' });
    }
    if (row.max_uses != null && Number(row.uses_count ?? 0) >= Number(row.max_uses)) {
      return res.json({ valid: false, reason: 'Quota atteint.' });
    }

    return res.json({
      valid: true,
      ...serializeCoupon(row),
      pro_name: row.pro_company_name || 'Professionnel Kalico',
      pro_logo_url: row.pro_logo_url ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/use', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Connexion requise.' });
    }

    const couponRes = await query(
      `SELECT * FROM coupons WHERE code = $1 LIMIT 1`,
      [String(req.params.code || '').trim().toUpperCase()]
    );
    const coupon = couponRes.rows[0];
    if (!coupon || !coupon.is_active) {
      return res.status(404).json({ error: 'Coupon introuvable.' });
    }

    const now = Date.now();
    const start = coupon.valid_from ? new Date(coupon.valid_from).getTime() : null;
    const end = coupon.valid_until ? new Date(coupon.valid_until).getTime() : null;
    if (start && start > now) {
      return res.status(409).json({ error: 'Coupon pas encore actif.' });
    }
    if (end && end < now) {
      return res.status(409).json({ error: 'Coupon expiré.' });
    }
    if (coupon.max_uses != null && Number(coupon.uses_count ?? 0) >= Number(coupon.max_uses)) {
      return res.status(409).json({ error: 'Quota atteint.' });
    }

    const usageCountRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM coupon_uses
       WHERE coupon_id = $1 AND user_id = $2`,
      [coupon.id, req.user.id]
    );
    const usageCount = Number(usageCountRes.rows[0]?.count || 0);
    if (coupon.uses_per_user != null && usageCount >= Number(coupon.uses_per_user || 1)) {
      return res.status(409).json({ error: 'Coupon déjà utilisé le nombre maximum de fois.' });
    }

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO coupon_uses (coupon_id, user_id, order_ref)
         VALUES ($1, $2, $3)`,
        [coupon.id, req.user.id, String(req.body?.order_ref || '').trim() || null]
      );
      await client.query(
        `UPDATE coupons SET uses_count = uses_count + 1 WHERE id = $1`,
        [coupon.id]
      );
    });

    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const couponId = Number(req.params.id);
    const { rows } = await query(
      `UPDATE coupons
       SET is_active = FALSE
       WHERE id = $1 AND pro_id = $2
       RETURNING *`,
      [couponId, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Coupon introuvable.' });
    }
    return res.json({ data: serializeCoupon(rows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
