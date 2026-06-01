'use strict';

const crypto = require('crypto');
const { query } = require('../config/database');

const PERFORMANCE_FREQUENCIES = new Set(['daily', 'weekly', 'monthly', 'never']);

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function normalizeFrequency(value, fallback = 'weekly') {
  const candidate = String(value || '').trim().toLowerCase();
  return PERFORMANCE_FREQUENCIES.has(candidate) ? candidate : fallback;
}

function normalizePrefs(row) {
  if (!row) return null;
  return {
    user_id: Number(row.user_id),
    email_new_message: Boolean(row.email_new_message),
    push_new_message: Boolean(row.push_new_message),
    email_search_alert: Boolean(row.email_search_alert),
    push_search_alert: Boolean(row.push_search_alert),
    email_boost_activated: Boolean(row.email_boost_activated),
    email_offer_received: Boolean(row.email_offer_received),
    email_listing_expiring: Boolean(row.email_listing_expiring),
    email_listing_expired: Boolean(row.email_listing_expired),
    email_performance_report: Boolean(row.email_performance_report),
    push_performance_report: Boolean(row.push_performance_report),
    performance_report_frequency: normalizeFrequency(row.performance_report_frequency),
    new_message_unsubscribe_token: row.new_message_unsubscribe_token,
    boost_activated_unsubscribe_token: row.boost_activated_unsubscribe_token,
    offer_received_unsubscribe_token: row.offer_received_unsubscribe_token,
    listing_expiring_unsubscribe_token: row.listing_expiring_unsubscribe_token,
    listing_expired_unsubscribe_token: row.listing_expired_unsubscribe_token,
    performance_report_unsubscribe_token: row.performance_report_unsubscribe_token,
    last_performance_report_at: row.last_performance_report_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

function defaultPrefsForUser(user) {
  const isPro = Boolean(user?.is_pro);
  return {
    email_new_message: true,
    push_new_message: true,
    email_search_alert: true,
    push_search_alert: true,
    email_boost_activated: true,
    email_offer_received: true,
    email_listing_expiring: true,
    email_listing_expired: true,
    email_performance_report: true,
    push_performance_report: false,
    performance_report_frequency: isPro ? 'weekly' : 'weekly',
  };
}

async function loadUserContext(userId) {
  const result = await query(
    `SELECT id, is_pro, account_type
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  return result.rows[0] || null;
}

async function ensureNotificationPreferences(userId) {
  if (!userId) return null;

  const existing = await query(
    `SELECT *
     FROM notification_preferences
     WHERE user_id = $1`,
    [userId]
  );
  if (existing.rows[0]) {
    return normalizePrefs(existing.rows[0]);
  }

  const user = await loadUserContext(userId);
  if (!user) return null;

  const defaults = defaultPrefsForUser(user);
  const tokens = {
    new_message_unsubscribe_token: generateToken(),
    boost_activated_unsubscribe_token: generateToken(),
    offer_received_unsubscribe_token: generateToken(),
    listing_expiring_unsubscribe_token: generateToken(),
    listing_expired_unsubscribe_token: generateToken(),
    performance_report_unsubscribe_token: generateToken(),
  };

  await query(
    `INSERT INTO notification_preferences (
       user_id,
       email_new_message,
       push_new_message,
       email_search_alert,
       push_search_alert,
       email_boost_activated,
       email_offer_received,
       email_listing_expiring,
       email_listing_expired,
       email_performance_report,
       push_performance_report,
       performance_report_frequency,
       new_message_unsubscribe_token,
       boost_activated_unsubscribe_token,
       offer_received_unsubscribe_token,
       listing_expiring_unsubscribe_token,
       listing_expired_unsubscribe_token,
       performance_report_unsubscribe_token,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [
      userId,
      defaults.email_new_message,
      defaults.push_new_message,
      defaults.email_search_alert,
      defaults.push_search_alert,
      defaults.email_boost_activated,
      defaults.email_offer_received,
      defaults.email_listing_expiring,
      defaults.email_listing_expired,
      defaults.email_performance_report,
      defaults.push_performance_report,
      defaults.performance_report_frequency,
      tokens.new_message_unsubscribe_token,
      tokens.boost_activated_unsubscribe_token,
      tokens.offer_received_unsubscribe_token,
      tokens.listing_expiring_unsubscribe_token,
      tokens.listing_expired_unsubscribe_token,
      tokens.performance_report_unsubscribe_token,
    ]
  );

  const created = await query(
    `SELECT *
     FROM notification_preferences
     WHERE user_id = $1`,
    [userId]
  );

  return normalizePrefs(created.rows[0] || null);
}

async function getNotificationPreferences(userId) {
  return ensureNotificationPreferences(userId);
}

async function saveNotificationPreferences(userId, payload = {}) {
  const current = await ensureNotificationPreferences(userId);
  if (!current) return null;

  const next = {
    email_new_message:
      payload.email_new_message === undefined ? current.email_new_message : Boolean(payload.email_new_message),
    push_new_message:
      payload.push_new_message === undefined ? current.push_new_message : Boolean(payload.push_new_message),
    email_search_alert:
      payload.email_search_alert === undefined ? current.email_search_alert : Boolean(payload.email_search_alert),
    push_search_alert:
      payload.push_search_alert === undefined ? current.push_search_alert : Boolean(payload.push_search_alert),
    email_boost_activated:
      payload.email_boost_activated === undefined ? current.email_boost_activated : Boolean(payload.email_boost_activated),
    email_offer_received:
      payload.email_offer_received === undefined ? current.email_offer_received : Boolean(payload.email_offer_received),
    email_listing_expiring:
      payload.email_listing_expiring === undefined ? current.email_listing_expiring : Boolean(payload.email_listing_expiring),
    email_listing_expired:
      payload.email_listing_expired === undefined ? current.email_listing_expired : Boolean(payload.email_listing_expired),
    email_performance_report:
      payload.email_performance_report === undefined ? current.email_performance_report : Boolean(payload.email_performance_report),
    push_performance_report:
      payload.push_performance_report === undefined ? current.push_performance_report : Boolean(payload.push_performance_report),
    performance_report_frequency: normalizeFrequency(
      payload.performance_report_frequency,
      current.performance_report_frequency
    ),
  };

  if (next.performance_report_frequency === 'never') {
    next.email_performance_report = false;
    next.push_performance_report = false;
  }

  const result = await query(
     `UPDATE notification_preferences
     SET email_new_message = $2,
         push_new_message = $3,
         email_search_alert = $4,
         push_search_alert = $5,
         email_boost_activated = $6,
         email_offer_received = $7,
         email_listing_expiring = $8,
         email_listing_expired = $9,
         email_performance_report = $10,
         push_performance_report = $11,
         performance_report_frequency = $12,
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [
      userId,
      next.email_new_message,
      next.push_new_message,
      next.email_search_alert,
      next.push_search_alert,
      next.email_boost_activated,
      next.email_offer_received,
      next.email_listing_expiring,
      next.email_listing_expired,
      next.email_performance_report,
      next.push_performance_report,
      next.performance_report_frequency,
    ]
  );

  return normalizePrefs(result.rows[0] || null);
}

async function disableNotificationByToken(token) {
  const tokenValue = String(token || '').trim();
  if (!tokenValue) return null;

  const match = await query(
    `SELECT user_id, 'new_message' AS kind
     FROM notification_preferences
     WHERE new_message_unsubscribe_token = $1
     UNION ALL
     SELECT user_id, 'boost_activated' AS kind
     FROM notification_preferences
     WHERE boost_activated_unsubscribe_token = $1
     UNION ALL
     SELECT user_id, 'offer_received' AS kind
     FROM notification_preferences
     WHERE offer_received_unsubscribe_token = $1
     UNION ALL
     SELECT user_id, 'listing_expiring' AS kind
     FROM notification_preferences
     WHERE listing_expiring_unsubscribe_token = $1
     UNION ALL
     SELECT user_id, 'listing_expired' AS kind
     FROM notification_preferences
     WHERE listing_expired_unsubscribe_token = $1
     UNION ALL
     SELECT user_id, 'performance_report' AS kind
     FROM notification_preferences
     WHERE performance_report_unsubscribe_token = $1
     LIMIT 1`,
    [tokenValue]
  );

  const row = match.rows[0];
  if (!row) return null;

  const current = await ensureNotificationPreferences(row.user_id);
  if (!current) return null;

  if (row.kind === 'new_message') {
    return saveNotificationPreferences(row.user_id, {
      email_new_message: false,
    });
  }

  if (row.kind === 'boost_activated') {
    return saveNotificationPreferences(row.user_id, {
      email_boost_activated: false,
    });
  }

  if (row.kind === 'offer_received') {
    return saveNotificationPreferences(row.user_id, {
      email_offer_received: false,
    });
  }

  if (row.kind === 'listing_expiring') {
    return saveNotificationPreferences(row.user_id, {
      email_listing_expiring: false,
    });
  }

  if (row.kind === 'listing_expired') {
    return saveNotificationPreferences(row.user_id, {
      email_listing_expired: false,
    });
  }

  return saveNotificationPreferences(row.user_id, {
    email_performance_report: false,
    push_performance_report: false,
    performance_report_frequency: 'never',
  });
}

module.exports = {
  disableNotificationByToken,
  ensureNotificationPreferences,
  getNotificationPreferences,
  normalizeFrequency,
  saveNotificationPreferences,
};
