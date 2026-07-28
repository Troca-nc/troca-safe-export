'use strict';

const express = require('express');
const Joi = require('joi');
const Stripe = require('stripe');

const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimit');
const { isConfiguredValue } = require('../config/env');
const { query } = require('../config/database');
const payplug = require('../services/payplugService');
const { getOrCreateStripeCustomer } = require('../services/paymentHelpers');
const { xpfToEurCents, formatXpfEur } = require('../services/paymentCatalog');
const {
  CAMPAIGN_PRICE_TABLE,
  createCampaignWithPayment,
  activateCampaignIfSlotAvailable,
  getActivePopup,
  getCategoryBanner,
  listHomeSponsoredCampaigns,
  listDashboardCampaigns,
  listAdminCampaigns,
  pauseCampaign,
  resumeCampaign,
  getWeeklyBonPlanSelection,
  saveWeeklyBonPlanSelection,
} = require('../services/campaignsService');

const router = express.Router();

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const stripe = isConfiguredValue(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' })
  : null;

const campaignSchema = Joi.object({
  type: Joi.string().valid('bon_plan', 'banner', 'popup').required(),
  category_slug: Joi.string().max(120).optional().allow('', null),
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().max(500).optional().allow('', null),
  image_url: Joi.string().pattern(/^(\/|https?:\/\/)/).max(500).optional().allow('', null),
  link_url: Joi.string().pattern(/^(\/|https?:\/\/)/).max(500).optional().allow('', null),
  cta_text: Joi.string().max(60).optional().allow('', null),
  duration_days: Joi.number().integer().valid(3, 7, 14, 15, 30, 90).required(),
  pricing_mode: Joi.string().valid('one_shot', 'monthly').default('one_shot'),
  pricing_plan: Joi.string().valid('essential', 'standard', 'unlimited').optional().allow('', null),
  payment_provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
});

const weeklySelectionSchema = Joi.object({
  campaign_ids: Joi.array().items(Joi.number().integer().positive()).max(2).required(),
});

function buildCampaignPricing(value) {
  if (value.type === 'bon_plan' && value.pricing_mode === 'monthly') {
    const planKey = value.pricing_plan || 'essential';
    const price_xpf = CAMPAIGN_PRICE_TABLE.bon_plan.monthly[planKey] || CAMPAIGN_PRICE_TABLE.bon_plan.monthly.essential;
    return { price_xpf, duration_days: 30, pricing_mode: 'monthly', pricing_plan: planKey };
  }

  if (value.type === 'bon_plan') {
    const days = [3, 7, 14, 30].includes(Number(value.duration_days)) ? Number(value.duration_days) : 7;
    return { price_xpf: CAMPAIGN_PRICE_TABLE.bon_plan.one_shot[days], duration_days: days, pricing_mode: 'one_shot', pricing_plan: null };
  }

  if (value.type === 'banner') {
    const days = [7, 15, 30, 90].includes(Number(value.duration_days)) ? Number(value.duration_days) : 7;
    return { price_xpf: CAMPAIGN_PRICE_TABLE.banner[days], duration_days: days, pricing_mode: 'one_shot', pricing_plan: null };
  }

  const days = [3, 7, 15, 30].includes(Number(value.duration_days)) ? Number(value.duration_days) : 7;
  return { price_xpf: CAMPAIGN_PRICE_TABLE.popup[days], duration_days: days, pricing_mode: 'one_shot', pricing_plan: null };
}

function canManageCampaign(user, campaign) {
  return Boolean(user?.is_admin) || Number(user?.id || 0) === Number(campaign.user_id || 0);
}

router.get('/public/home', async (_req, res, next) => {
  try {
    const [bonPlans, popup] = await Promise.all([
      listHomeSponsoredCampaigns(query, 6),
      getActivePopup(query),
    ]);

    return res.json({
      data: {
        bon_plans: bonPlans,
        popup,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/public/category/:slug', async (req, res, next) => {
  try {
    const banner = await getCategoryBanner(query, req.params.slug);
    return res.json({ data: { banner } });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const dashboard = await listDashboardCampaigns(query, req.user.id);
    return res.json({
      data: {
        ...dashboard,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/bon-plans/weekly', authenticate, async (req, res, next) => {
  try {
    const selection = await getWeeklyBonPlanSelection(query, req.user.id);
    return res.json({ data: selection });
  } catch (err) {
    next(err);
  }
});

router.put('/dashboard/bon-plans/weekly', authenticate, validate({ body: weeklySelectionSchema }), async (req, res, next) => {
  try {
    const selection = await saveWeeklyBonPlanSelection(query, {
      userId: req.user.id,
      campaignIds: Array.isArray(req.body?.campaign_ids) ? req.body.campaign_ids : [],
      method: 'manual',
    });
    return res.json({ data: selection });
  } catch (err) {
    next(err);
  }
});

router.get('/admin', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès réservé à l’administration.' });
    }
    const admin = await listAdminCampaigns(query);
    return res.json({ data: admin });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, paymentLimiter, validate({ body: campaignSchema }), async (req, res, next) => {
  try {
    const value = req.body || {};
    const pricing = buildCampaignPricing(value);
    const payload = {
      ...value,
      category_slug: String(value.category_slug || '').trim() || null,
      title: String(value.title || '').trim(),
      description: String(value.description || '').trim(),
      image_url: value.image_url || null,
      link_url: value.link_url || null,
      cta_text: value.cta_text || null,
      duration_days: pricing.duration_days,
      pricing_mode: pricing.pricing_mode,
      pricing_plan: pricing.pricing_plan,
      price_xpf: pricing.price_xpf,
    };

    const created = await createCampaignWithPayment(query, {
      user: req.user,
      payload,
      provider: value.payment_provider || 'stripe',
      baseUrl,
      stripe,
    });

    if (created.payment?.success) {
      await activateCampaignIfSlotAvailable(query, created.campaign, { fromQueue: false });
    }

    return res.json({
      data: {
        campaign: created.campaign,
        pricing: {
          ...created.pricing,
          price_label: formatXpfEur(created.pricing.price_xpf),
        },
        payment: created.payment,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pause', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Campagne invalide.' });
    }
    await pauseCampaign(query, { campaignId: id, userId: req.user.id, isAdmin: Boolean(req.user?.is_admin) });
    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resume', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Campagne invalide.' });
    }
    await resumeCampaign(query, { campaignId: id, userId: req.user.id, isAdmin: Boolean(req.user?.is_admin) });
    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
