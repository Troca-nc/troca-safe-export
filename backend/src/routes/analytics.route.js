// backend/src/routes/analytics.route.js
// ── Analytics first-party minimal ─────────────────────────────────────────────

const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { recordShare } = require('../services/observability');
const { logger } = require('../utils/logger');

const router = express.Router();
router.use(optionalAuth);

const ALLOWED_EVENTS = new Set([
  'page_view',
  'listing_search',
  'listing_view',
  'contact_seller_click',
  'favorite_add',
  'signup_start',
  'signup_complete',
  'pro_cta_click',
  'checkout_start',
  'checkout_success',
  'checkout_abandon',
  'share_click',
  'bon_plan_view',
  'bon_plan_publish_start',
  'bon_plan_contact_click',
  'home_spotlight_view',
  'home_spotlight_tab_click',
  'home_spotlight_cta_click',
  'home_spotlight_item_open',
  'service_directory_view',
  'service_directory_search',
  'service_directory_filter',
  'service_directory_publish',
  'service_directory_open',
  'service_directory_share',
  'event_view',
  'event_contact_click',
  'event_reservation_click',
  'ride_view',
  'ride_contact_click',
  'ride_book',
  'ride_cancel',
  'ride_review_submit',
  'message_send',
]);

const eventSchema = Joi.object({
  event_name: Joi.string().valid(...ALLOWED_EVENTS).required(),
  page_path: Joi.string().max(255).required(),
  referrer: Joi.string().max(500).allow('', null).optional(),
  device_type: Joi.string().valid('web', 'mobile', 'tablet', 'unknown').default('web'),
  session_id: Joi.string().min(8).max(80).required(),
  consent_analytics: Joi.boolean().valid(true).required(),
  metadata: Joi.object().unknown(true).default({}),
});

function sanitizeMetadata(input = {}) {
  const allowed = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      allowed[key] = value.slice(0, 120);
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      allowed[key] = value;
    }
  }
  return allowed;
}

router.post('/events', async (req, res) => {
  const { error, value } = eventSchema.validate(req.body, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const userId = req.user?.id ?? null;

  try {
    await query(
      `INSERT INTO analytics_events
         (user_id, session_id, event_name, page_path, referrer, device_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        userId,
        value.session_id,
        value.event_name,
        value.page_path,
        value.referrer || null,
        value.device_type,
        JSON.stringify(sanitizeMetadata(value.metadata)),
      ]
    );

    if (value.event_name === 'share_click') {
      void recordShare({
        channel: value.metadata?.channel,
        contentType: value.metadata?.content_type,
        itemId: value.metadata?.item_id,
        pagePath: value.page_path,
        referrer: value.referrer || null,
        userId: userId,
        requestId: req.requestId ?? null,
        source: 'analytics',
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('analytics_collection_error', { error: err, user_id: userId });
    res.status(500).json({ error: 'Impossible d’enregistrer l’événement analytique' });
  }
});

module.exports = router;
