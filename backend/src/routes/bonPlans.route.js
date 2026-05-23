'use strict';

const express = require('express');
const Joi = require('joi');
const Stripe = require('stripe');

const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimit');
const { isConfiguredValue } = require('../config/env');
const payplug = require('../services/payplugService');
const { ensureStripe, getOrCreateStripeCustomer } = require('../services/paymentHelpers');
const { xpfToEurCents, formatXpfEur } = require('../services/paymentCatalog');
const { getRedisClient } = require('../config/redis');
const statsRouter = require('./stats.route');
const {
  activateBonPlanFromPayment,
  getBonPlanPricing,
  recordBonPlanView,
  normalizeBusinessName,
  slugifyBusinessName,
  formatXpf,
} = require('../services/bonPlansService');

const router = express.Router();

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const demoModeEnabled = process.env.DEMO_MODE === 'true';
const stripe = isConfiguredValue(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' })
  : null;

const CATEGORY_VALUES = [
  'alimentation',
  'mode',
  'beaute',
  'high_tech',
  'auto_moto',
  'maison',
  'restauration',
  'services',
  'sport',
  'voyages',
  'autre',
];

const createSchema = Joi.object({
  business_name: Joi.string().min(2).max(255).optional().allow('', null),
  business_logo_url: Joi.string().uri().optional().allow('', null),
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().min(10).max(500).required(),
  image_url: Joi.string().uri().optional().allow('', null),
  promo_label: Joi.string().max(80).optional().allow('', null),
  original_price_xpf: Joi.number().integer().min(0).optional().allow(null),
  promo_price_xpf: Joi.number().integer().min(0).optional().allow(null),
  cta_label: Joi.string().max(60).optional().allow('', null),
  cta_url: Joi.string().uri().optional().allow('', null),
  category: Joi.string().valid(...CATEGORY_VALUES).optional().allow('', null),
  promo_valid_from: Joi.string().isoDate().optional().allow('', null),
  promo_valid_until: Joi.string().isoDate().optional().allow('', null),
  duration_days: Joi.number().integer().valid(3, 7, 30).required(),
  payment_provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
  contact_email: Joi.string().email().max(255).required(),
  contact_name: Joi.string().max(120).optional().allow('', null),
  contact_phone: Joi.string().max(30).optional().allow('', null),
  website_url: Joi.string().uri().optional().allow('', null),
  link_url: Joi.string().uri().optional().allow('', null),
  location_name: Joi.string().max(120).optional().allow('', null),
  event_date: Joi.string().isoDate().optional().allow('', null),
  conditions: Joi.string().max(500).optional().allow('', null),
  opening_hours: Joi.string().max(255).optional().allow('', null),
  photos: Joi.array().items(Joi.string().uri().allow('', null)).max(12).default([]),
  social_links: Joi.object().unknown(true).default({}),
  kind: Joi.string().valid('promo', 'event', 'concert', 'other').optional(),
  target_audience: Joi.string().valid('particulier', 'pro').optional(),
  commune_id: Joi.number().integer().optional().allow(null),
});

const prefsSchema = Joi.object({
  notify_all: Joi.boolean().optional(),
  notify_categories: Joi.array().items(Joi.string().valid(...CATEGORY_VALUES)).optional(),
  notify_businesses: Joi.array().items(Joi.string().min(1).max(255)).optional(),
  via_push: Joi.boolean().optional(),
  via_email: Joi.boolean().optional(),
});

function mapLegacyCategory(kind) {
  switch (String(kind || '').trim()) {
    case 'event':
      return 'voyages';
    case 'concert':
      return 'culture';
    case 'promo':
    case 'other':
    default:
      return 'services';
  }
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function normalizePreviewBusinessName(body, user) {
  return normalizeBusinessName(body.business_name || body.contact_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || body.title);
}

function encodeCursor(row) {
  if (!row) return null;
  return Buffer.from(JSON.stringify({ published_from: row.published_from, id: row.id })).toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    if (!decoded?.published_from || !decoded?.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

function serializeBonPlan(row) {
  const pricing = getBonPlanPricing(Number(row.duration_days || 7), Boolean(row.user_is_pro));
  const promoPrice = row.amount_xpf ?? row.promo_price_xpf ?? pricing.final_price_xpf;
  const originalPrice = row.original_price_xpf ?? row.normal_price_xpf ?? pricing.original_price_xpf;
  const photos = Array.isArray(row.photos)
    ? row.photos
    : (() => {
        try {
          return row.photos ? JSON.parse(row.photos) : [];
        } catch {
          return [];
        }
      })();

  return {
    id: row.id,
    business_id: row.business_id ?? null,
    business_name: row.business_name || row.title || 'Troca',
    business_logo_url: row.business_logo_url ?? null,
    business_badge: row.business_badge || row.badge || 'none',
    business_review_avg: row.business_review_avg ?? row.review_avg ?? 0,
    business_review_count: row.business_review_count ?? row.review_count ?? 0,
    user_id: row.user_id ?? null,
    title: row.title,
    description: row.description,
    image_url: row.image_url ?? null,
    promo_label: row.promo_label ?? null,
    original_price_xpf: originalPrice ?? null,
    promo_price_xpf: row.promo_price_xpf ?? null,
    cta_label: row.cta_label || 'En profiter',
    cta_url: row.cta_url || row.link_url || row.website_url || null,
    category: row.category || mapLegacyCategory(row.kind),
    promo_valid_from: row.promo_valid_from ?? null,
    promo_valid_until: row.promo_valid_until ?? null,
    published_from: row.published_from ?? row.created_at,
    published_until: row.published_until ?? row.expires_at ?? null,
    duration_days: Number(row.duration_days || 7),
    payment_provider: row.payment_provider ?? null,
    payment_intent_id: row.payment_intent_id ?? null,
    amount_xpf: row.amount_xpf ?? promoPrice,
    amount_eur: row.amount_eur ?? null,
    paid_at: row.paid_at ?? null,
    status: row.status,
    view_count: Number(row.view_count || 0),
    click_count: Number(row.click_count || 0),
    price_xpf: promoPrice,
    price_display: promoPrice ? formatXpfEur(Number(promoPrice)) : null,
    is_free_included: Boolean(row.is_free_included),
    normal_price_xpf: originalPrice ?? null,
    discount_pct: row.discount_pct ?? pricing.discount_pct,
    contact_name: row.contact_name ?? null,
    contact_phone: row.contact_phone ?? null,
    contact_email: row.contact_email ?? null,
    website_url: row.website_url ?? null,
    link_url: row.link_url ?? null,
    social_links: row.social_links ?? {},
    opening_hours: row.opening_hours ?? null,
    photos,
    location_name: row.location_name ?? null,
    commune_name: row.commune_name ?? null,
    event_date: row.event_date ?? null,
    author_id: row.author_id ?? null,
    author_prenom: row.author_prenom ?? null,
    author_nom: row.author_nom ?? null,
    author_is_pro: Boolean(row.author_is_pro),
    kind: row.kind || 'promo',
    target_audience: row.target_audience || (row.business_name ? 'pro' : 'particulier'),
  };
}

async function queryBonPlans(filters = {}) {
  const {
    limit = 12,
    after = null,
    offset = null,
    q = '',
    category = '',
    business_name = '',
    kind = '',
    target_audience = '',
  } = filters;

  const params = [];
  const where = [`bp.status = 'active'`, `bp.published_until > NOW()`];

  if (kind) {
    const kinds = String(kind)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (kinds.length) {
      params.push(kinds);
      where.push(`bp.kind = ANY($${params.length}::text[])`);
    }
  }

  if (target_audience) {
    params.push(target_audience);
    where.push(`bp.target_audience = $${params.length}`);
  }

  if (category) {
    params.push(String(category).trim().toLowerCase());
    where.push(`LOWER(COALESCE(bp.category, 'autre')) = $${params.length}`);
  }

  if (business_name) {
    params.push(`%${String(business_name).trim()}%`);
    where.push(`(bp.business_name ILIKE $${params.length} OR b.name ILIKE $${params.length})`);
  }

  if (q) {
    params.push(`%${String(q).trim()}%`);
    where.push(`(
      bp.title ILIKE $${params.length}
      OR bp.description ILIKE $${params.length}
      OR bp.business_name ILIKE $${params.length}
      OR bp.contact_name ILIKE $${params.length}
      OR b.name ILIKE $${params.length}
    )`);
  }

  const countParams = [...params];

  const cursor = decodeCursor(after);
  if (cursor?.published_from && cursor?.id) {
    params.push(cursor.published_from);
    params.push(cursor.id);
    where.push(`(bp.published_from, bp.id) < ($${params.length - 1}::timestamptz, $${params.length}::int)`);
  }

  if (offset !== null && Number.isFinite(Number(offset)) && Number(offset) > 0) {
    params.push(Number(offset));
  }

  const queryParams = [...params];
  queryParams.push(Math.min(24, Math.max(1, Number(limit) || 12)));

  const listQuery = `
    SELECT
      bp.id,
      bp.user_id,
      bp.business_id,
      bp.business_name,
      bp.business_logo_url,
      bp.title,
      bp.description,
      bp.image_url,
      bp.promo_label,
      bp.original_price_xpf,
      bp.normal_price_xpf,
      bp.promo_price_xpf,
      bp.cta_label,
      bp.cta_url,
      bp.category,
      bp.promo_valid_from,
      bp.promo_valid_until,
      bp.published_from,
      bp.published_until,
      bp.duration_days,
      bp.payment_provider,
      bp.payment_intent_id,
      bp.amount_xpf,
      bp.amount_eur,
      bp.paid_at,
      bp.status,
      bp.view_count,
      bp.click_count,
      bp.kind,
      bp.target_audience,
      bp.location_name,
      bp.event_date,
      bp.link_url,
      bp.price_xpf,
      bp.is_free_included,
      bp.discount_pct,
      bp.conditions,
      bp.contact_name,
      bp.contact_phone,
      bp.contact_email,
      bp.website_url,
      bp.social_links,
      bp.opening_hours,
      bp.photos,
      bp.commune_id,
      com.name AS commune_name,
      u.id AS author_id,
      u.prenom AS author_prenom,
      u.nom AS author_nom,
      CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS author_is_pro,
      b.badge AS business_badge,
      b.review_avg AS business_review_avg,
      b.review_count AS business_review_count
    FROM bon_plans bp
    LEFT JOIN users u ON u.id = bp.user_id
    LEFT JOIN communes com ON com.id = bp.commune_id
    LEFT JOIN businesses b ON b.id = bp.business_id
    WHERE ${where.join(' AND ')}
    ORDER BY bp.published_from DESC, bp.id DESC
    LIMIT $${queryParams.length}
    ${offset !== null && Number.isFinite(Number(offset)) && Number(offset) > 0 ? `OFFSET $${queryParams.length - 1}` : ''}
  `;

  const totalQuery = `
    SELECT COUNT(*)::int AS total
    FROM bon_plans bp
    LEFT JOIN businesses b ON b.id = bp.business_id
    WHERE ${where.join(' AND ')}
  `;

  return { listQuery, totalQuery, listParams: queryParams, countParams };
}

async function createPaymentForBonPlan({ user, bonPlan, provider, amountXpf, amountEur, durationDays }) {
  const metadata = {
    payment_type: 'bon_plan',
    bon_plan_id: String(bonPlan.id),
    user_id: String(user.id),
    business_name: bonPlan.business_name,
    category: bonPlan.category,
    duration_days: String(durationDays),
    amount_xpf: String(amountXpf),
    amount_eur: String(amountEur),
  };

  if (demoModeEnabled) {
    await query(
      `UPDATE bon_plans
       SET status = 'active',
           paid_at = NOW(),
           payment_provider = $2,
           amount_xpf = $3,
           amount_eur = $4,
           published_from = COALESCE(published_from, NOW()),
           published_until = NOW() + make_interval(days => duration_days),
           updated_at = NOW()
       WHERE id = $1`,
      [bonPlan.id, provider, amountXpf, amountEur]
    );

    return {
      checkout_url: `${baseUrl}/bons-plans/${bonPlan.id}?demo=1`,
      demo: true,
      success: true,
      message: 'Paiement simule',
      provider,
    };
  }

  if (provider === 'payplug') {
    if (!payplug.isPayPlugConfigured()) {
      throw Object.assign(new Error('PayPlug non configure'), { status: 503 });
    }

    const payment = await payplug.createPayment({
      amount_xpf: amountXpf,
      description: `${bonPlan.title} — ${bonPlan.business_name}`,
      email: user.email,
      first_name: user.prenom || 'Client',
      last_name: user.nom || 'Troca',
      return_url: `${baseUrl}/bons-plans/publier?payment_id={PAYPLUG_PAYMENT_ID}&provider=payplug`,
      cancel_url: `${baseUrl}/bons-plans/publier?cancelled=1`,
      metadata,
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'bon_plan', 'payplug', $2, $3, 'pending', $4)`,
      [user.id, payment.id, amountXpf, JSON.stringify(metadata)]
    );

    return { checkout_url: payment.hosted_payment.payment_url, payment_id: payment.id, provider };
  }

  if (!stripe) {
    throw Object.assign(new Error('Stripe non configure'), { status: 503 });
  }

  const customerId = await getOrCreateStripeCustomer(stripe, user.id, user.email);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    success_url: `${baseUrl}/bons-plans/publier?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${baseUrl}/bons-plans/publier?cancelled=1`,
    metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: xpfToEurCents(amountXpf),
          product_data: {
            name: `${bonPlan.title} — ${bonPlan.business_name}`,
            description: bonPlan.description.slice(0, 200),
          },
        },
      },
    ],
  });

  await query(
    `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
     VALUES ($1, 'bon_plan', 'stripe', $2, $3, 'pending', $4)`,
    [user.id, session.id, amountXpf, JSON.stringify(metadata)]
  );

  return { checkout_url: session.url, payment_id: session.id, provider };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 12)));
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || req.query.cat || '').trim();
    const businessName = String(req.query.business_name || '').trim();
    const kind = String(req.query.kind || '').trim();
    const targetAudience = String(req.query.target_audience || '').trim();
    const after = String(req.query.after || '').trim();
    const offset = req.query.page ? Math.max(0, (Number(req.query.page) - 1) * limit) : null;

    const { listQuery, totalQuery, listParams, countParams } = await queryBonPlans({
      limit,
      after,
      offset,
      q,
      category,
      business_name: businessName,
      kind,
      target_audience: targetAudience,
    });

    const [listResult, totalResult] = await Promise.all([
      query(listQuery, listParams),
      query(totalQuery, countParams),
    ]);

    const data = listResult.rows.map(serializeBonPlan);
    return res.json({
      data,
      nextCursor: data.length ? encodeCursor(listResult.rows[listResult.rows.length - 1]) : null,
      total: Number(totalResult.rows[0]?.total ?? 0),
      pagination: {
        total: Number(totalResult.rows[0]?.total ?? 0),
        limit,
        offset: offset ?? 0,
        has_more: data.length === limit,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/businesses', optionalAuth, async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT name, slug, logo_url AS business_logo_url, badge AS business_badge
       FROM businesses
       WHERE name IS NOT NULL AND name <> ''
       ORDER BY bon_plan_count DESC, name ASC
       LIMIT 100`
    ).catch(async () => ({ rows: [] }));

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/meta/businesses', optionalAuth, async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT name, slug, logo_url AS business_logo_url, badge AS business_badge
       FROM businesses
       WHERE name IS NOT NULL AND name <> ''
       ORDER BY bon_plan_count DESC, name ASC
       LIMIT 100`
    ).catch(async () => ({ rows: [] }));

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/notifications/prefs', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT user_id, notify_all, notify_categories, notify_businesses, via_push, via_email
       FROM bon_plan_notification_prefs
       WHERE user_id = $1`,
      [req.user.id]
    );

    return res.json({
      data: rows[0] ?? {
        user_id: req.user.id,
        notify_all: false,
        notify_categories: [],
        notify_businesses: [],
        via_push: true,
        via_email: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/notifications/prefs', authenticate, validate({ body: prefsSchema }), async (req, res, next) => {
  try {
    const body = req.body || {};
    const notifyCategories = Array.isArray(body.notify_categories)
      ? body.notify_categories.map((value) => String(value).trim().toLowerCase()).filter(Boolean)
      : null;
    const notifyBusinesses = Array.isArray(body.notify_businesses)
      ? body.notify_businesses.map((value) => String(value).trim().toLowerCase()).filter(Boolean)
      : null;

    const result = await query(
      `INSERT INTO bon_plan_notification_prefs
         (user_id, notify_all, notify_categories, notify_businesses, via_push, via_email, updated_at)
       VALUES ($1, COALESCE($2, FALSE), COALESCE($3, '{}'), COALESCE($4, '{}'), COALESCE($5, TRUE), COALESCE($6, FALSE), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         notify_all = COALESCE(EXCLUDED.notify_all, bon_plan_notification_prefs.notify_all),
         notify_categories = COALESCE(EXCLUDED.notify_categories, bon_plan_notification_prefs.notify_categories),
         notify_businesses = COALESCE(EXCLUDED.notify_businesses, bon_plan_notification_prefs.notify_businesses),
         via_push = COALESCE(EXCLUDED.via_push, bon_plan_notification_prefs.via_push),
         via_email = COALESCE(EXCLUDED.via_email, bon_plan_notification_prefs.via_email),
         updated_at = NOW()
       RETURNING user_id, notify_all, notify_categories, notify_businesses, via_push, via_email`,
      [
        req.user.id,
        body.notify_all,
        notifyCategories,
        notifyBusinesses,
        body.via_push,
        body.via_email,
      ]
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Bon plan invalide.' });
    }

    await recordBonPlanView(id).catch(() => {});

    const result = await query(
      `SELECT
         bp.id,
         bp.user_id,
         bp.business_id,
         bp.business_name,
         bp.business_logo_url,
         bp.title,
         bp.description,
         bp.image_url,
         bp.promo_label,
         bp.original_price_xpf,
         bp.normal_price_xpf,
         bp.promo_price_xpf,
         bp.cta_label,
         bp.cta_url,
         bp.category,
         bp.promo_valid_from,
         bp.promo_valid_until,
         bp.published_from,
         bp.published_until,
         bp.duration_days,
         bp.payment_provider,
         bp.payment_intent_id,
         bp.amount_xpf,
         bp.amount_eur,
         bp.paid_at,
         bp.status,
         bp.view_count,
         bp.click_count,
         bp.kind,
         bp.target_audience,
         bp.location_name,
         bp.event_date,
         bp.link_url,
         bp.price_xpf,
         bp.is_free_included,
         bp.discount_pct,
         bp.conditions,
         bp.contact_name,
         bp.contact_phone,
         bp.contact_email,
         bp.website_url,
         bp.social_links,
         bp.opening_hours,
         bp.photos,
         bp.commune_id,
         com.name AS commune_name,
         u.id AS author_id,
         u.prenom AS author_prenom,
         u.nom AS author_nom,
         CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS author_is_pro,
         b.badge AS business_badge,
         b.review_avg AS business_review_avg,
         b.review_count AS business_review_count
       FROM bon_plans bp
       LEFT JOIN users u ON u.id = bp.user_id
       LEFT JOIN communes com ON com.id = bp.commune_id
       LEFT JOIN businesses b ON b.id = bp.business_id
       WHERE bp.id = $1
         AND bp.status = 'active'
         AND bp.published_until > NOW()
       LIMIT 1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Bon plan introuvable.' });
    }

    return res.json({ data: serializeBonPlan(row) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/click', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Bon plan invalide.' });
    }

    await query(
      `UPDATE bon_plans SET click_count = click_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [id]
    ).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, paymentLimiter, validate({ body: createSchema }), async (req, res, next) => {
  try {
    const value = req.body || {};
    const isPro = Boolean(req.user?.is_pro && (req.user?.pro_plan === 'pro' || req.user?.pro_plan == null || req.user?.pro_expires_at == null || new Date(req.user.pro_expires_at) > new Date()));
    const durationDays = Number(value.duration_days) === 3 ? 7 : Number(value.duration_days);
    const pricing = getBonPlanPricing(durationDays, isPro);
    const paymentProvider = String(value.payment_provider || 'stripe');
    const businessName = normalizeBusinessName(value.business_name || value.contact_name || value.title);
    const category = String(value.category || mapLegacyCategory(value.kind)).trim().toLowerCase();
    const publishedUntil = new Date(Date.now() + durationDays * 86400_000);

    const payload = {
      user_id: req.user.id,
      business_name: businessName,
      business_logo_url: value.business_logo_url || null,
      title: value.title.trim(),
      description: value.description.trim(),
      image_url: value.image_url || null,
      promo_label: value.promo_label?.trim() || null,
      original_price_xpf: toNumberOrNull(value.original_price_xpf ?? value.normal_price_xpf) ?? pricing.original_price_xpf,
      promo_price_xpf: toNumberOrNull(value.promo_price_xpf) ?? pricing.final_price_xpf,
      cta_label: value.cta_label?.trim() || 'En profiter',
      cta_url: value.cta_url?.trim() || value.link_url?.trim() || value.website_url?.trim() || null,
      category,
      promo_valid_from: toDateOrNull(value.promo_valid_from),
      promo_valid_until: toDateOrNull(value.promo_valid_until),
      commune_id: value.commune_id ?? null,
      location_name: value.location_name?.trim() || null,
      event_date: toDateOrNull(value.event_date),
      duration_days: durationDays,
      payment_provider: paymentProvider,
      contact_name: value.contact_name?.trim() || null,
      contact_phone: value.contact_phone?.trim() || null,
      contact_email: value.contact_email?.trim() || req.user.email,
      website_url: value.website_url?.trim() || null,
      conditions: value.conditions?.trim() || null,
      opening_hours: value.opening_hours?.trim() || null,
      photos: JSON.stringify(Array.isArray(value.photos) ? value.photos.filter(Boolean) : []),
      social_links: JSON.stringify(value.social_links || {}),
      status: 'draft',
      published_from: new Date(),
      published_until: publishedUntil,
      amount_xpf: pricing.final_price_xpf,
      amount_eur: Math.round(pricing.final_price_xpf / 119.3317),
    };

    const created = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO bon_plans
           (user_id, business_name, business_logo_url, title, description, image_url, promo_label, original_price_xpf, promo_price_xpf, cta_label, cta_url,
            category, promo_valid_from, promo_valid_until, commune_id, location_name, event_date, duration_days, payment_provider, contact_name, contact_phone,
            contact_email, website_url, conditions, opening_hours, photos, social_links, status, published_from, published_until, amount_xpf, amount_eur)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
            $22,$23,$24,$25,$26::jsonb,$27::jsonb,$28,$29,$30,$31,$32)
         RETURNING *`,
        [
          payload.user_id,
          payload.business_name,
          payload.business_logo_url,
          payload.title,
          payload.description,
          payload.image_url,
          payload.promo_label,
          payload.original_price_xpf,
          payload.promo_price_xpf,
          payload.cta_label,
          payload.cta_url,
          payload.category,
          payload.promo_valid_from,
          payload.promo_valid_until,
          payload.commune_id,
          payload.location_name,
          payload.event_date,
          payload.duration_days,
          payload.payment_provider,
          payload.contact_name,
          payload.contact_phone,
          payload.contact_email,
          payload.website_url,
          payload.conditions,
          payload.opening_hours,
          payload.photos,
          payload.social_links,
          payload.status,
          payload.published_from,
          payload.published_until,
          payload.amount_xpf,
          payload.amount_eur,
        ]
      );

      const bonPlan = inserted.rows[0];
      if (!bonPlan) throw new Error('Impossible de creer le bon plan');

      const payment = await createPaymentForBonPlan({
        user: req.user,
        bonPlan,
        provider: paymentProvider,
        amountXpf: pricing.final_price_xpf,
        amountEur: payload.amount_eur,
        durationDays,
      });

      if (!demoModeEnabled) {
        await client.query(
          `UPDATE bon_plans
           SET payment_intent_id = $2,
               updated_at = NOW()
           WHERE id = $1`,
          [bonPlan.id, payment.payment_id || payment.checkout_url || `pending_${bonPlan.id}`]
        );
      } else {
        await client.query(
          `UPDATE bon_plans
           SET status = 'active',
               paid_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [bonPlan.id]
        );
      }

      return { bonPlan: { ...bonPlan, ...payload }, payment, pricing };
    });

    if (statsRouter.invalidateCache) {
      await statsRouter.invalidateCache('home');
    }

    return res.status(201).json({
      data: {
        id: created.bonPlan.id,
        payment_url: created.payment.checkout_url,
        checkout_url: created.payment.checkout_url,
        payment_provider: paymentProvider,
        demo: Boolean(created.payment.demo),
        success: Boolean(created.payment.success),
        message: created.payment.message || null,
        pricing: created.pricing,
        bon_plan: serializeBonPlan({
          ...created.bonPlan,
          amount_xpf: created.pricing.final_price_xpf,
          amount_eur: Math.round(created.pricing.final_price_xpf / 119.3317),
          status: demoModeEnabled ? 'active' : 'draft',
        }),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
