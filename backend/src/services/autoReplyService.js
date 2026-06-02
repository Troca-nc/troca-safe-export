'use strict';

const { query, withTransaction } = require('../config/database');

function normalizeMessage(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function normalizeKeywords(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeActiveDays(value) {
  if (!Array.isArray(value) || value.length === 0) return [1, 2, 3, 4, 5];
  return value
    .map((entry) => Number(entry))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
    .slice(0, 7);
}

function normalizeTime(value) {
  const text = String(value ?? '').trim();
  return /^\d{2}:\d{2}$/.test(text) ? text : null;
}

function asBoolean(value, fallback = false) {
  if (value === undefined || value === null) return Boolean(fallback);
  return Boolean(value);
}

function toConfigRow(row) {
  const isActive = Boolean(row?.is_active ?? row?.enabled ?? false);
  const activeDays = Array.isArray(row?.active_days) && row.active_days.length > 0
    ? row.active_days.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
    : [1, 2, 3, 4, 5];

  return {
    id: row?.id == null ? null : Number(row.id),
    user_id: row?.user_id == null ? null : Number(row.user_id),
    enabled: isActive,
    is_active: isActive,
    message: row?.message || 'Bonjour, merci pour votre message. Je vous réponds dès que possible.',
    active_keywords: Array.isArray(row?.active_keywords) ? row.active_keywords : [],
    active_from: row?.active_from ?? null,
    active_until: row?.active_until ?? null,
    active_days: activeDays,
    delay_minutes: Number(row?.delay_minutes ?? row?.reply_delay_minutes ?? 0),
    reply_delay_minutes: Number(row?.reply_delay_minutes ?? row?.delay_minutes ?? 0),
    created_at: row?.created_at ?? null,
    updated_at: row?.updated_at ?? null,
  };
}

function isWithinSchedule(config, now = new Date()) {
  if (!config?.is_active && !config?.enabled) return false;

  const activeDays = Array.isArray(config.active_days) && config.active_days.length > 0
    ? config.active_days.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
    : [1, 2, 3, 4, 5];

  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  if (!activeDays.includes(currentDay)) return false;

  const activeFrom = normalizeTime(config.active_from);
  const activeUntil = normalizeTime(config.active_until);
  if (!activeFrom || !activeUntil) return true;

  const currentTime = now.toTimeString().slice(0, 5);
  if (activeFrom <= activeUntil) {
    return currentTime >= activeFrom && currentTime <= activeUntil;
  }

  return currentTime >= activeFrom || currentTime <= activeUntil;
}

async function getAutoReply(userId) {
  const result = await query(
    `SELECT id, user_id, enabled, is_active, message, active_keywords, active_from, active_until, active_days, delay_minutes, reply_delay_minutes, created_at, updated_at
     FROM auto_replies
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] ? toConfigRow(result.rows[0]) : toConfigRow({
    user_id: Number(userId),
    enabled: false,
    is_active: false,
    message: 'Bonjour, merci pour votre message. Je vous réponds dès que possible.',
    active_keywords: [],
    active_from: null,
    active_until: null,
    active_days: [1, 2, 3, 4, 5],
    delay_minutes: 0,
    reply_delay_minutes: 0,
  });
}

async function saveAutoReply(userId, payload = {}) {
  const current = await getAutoReply(userId);
  const isActive = payload.is_active === undefined
    ? asBoolean(payload.enabled, current.is_active)
    : asBoolean(payload.is_active, current.is_active);
  const message = normalizeMessage(payload.message) || current.message;
  const activeKeywords = normalizeKeywords(payload.active_keywords ?? current.active_keywords ?? []);
  const activeFrom = normalizeTime(payload.active_from ?? current.active_from);
  const activeUntil = normalizeTime(payload.active_until ?? current.active_until);
  const activeDays = normalizeActiveDays(payload.active_days ?? current.active_days ?? [1, 2, 3, 4, 5]);
  const replyDelayMinutes = Number.isFinite(Number(payload.reply_delay_minutes))
    ? Math.max(0, Math.min(1440, Math.floor(Number(payload.reply_delay_minutes))))
    : Number.isFinite(Number(payload.delay_minutes))
      ? Math.max(0, Math.min(1440, Math.floor(Number(payload.delay_minutes))))
      : Number(current.reply_delay_minutes ?? current.delay_minutes ?? 0);

  const result = await query(
    `INSERT INTO auto_replies (
       user_id,
       enabled,
       is_active,
       message,
       active_keywords,
       active_from,
       active_until,
       active_days,
       delay_minutes,
       reply_delay_minutes,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8::integer[], $9, $10, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       is_active = EXCLUDED.is_active,
       message = EXCLUDED.message,
       active_keywords = EXCLUDED.active_keywords,
       active_from = EXCLUDED.active_from,
       active_until = EXCLUDED.active_until,
       active_days = EXCLUDED.active_days,
       delay_minutes = EXCLUDED.delay_minutes,
       reply_delay_minutes = EXCLUDED.reply_delay_minutes,
       updated_at = NOW()
     RETURNING id, user_id, enabled, is_active, message, active_keywords, active_from, active_until, active_days, delay_minutes, reply_delay_minutes, created_at, updated_at`,
    [userId, isActive, isActive, message, activeKeywords, activeFrom, activeUntil, activeDays, replyDelayMinutes, replyDelayMinutes]
  );

  return toConfigRow(result.rows[0]);
}

async function maybeSendAutoReply({ conversationId, senderId, recipientId, sourceMessage }) {
  if (!conversationId || !senderId || !recipientId) return null;
  if (Number(senderId) === Number(recipientId)) return null;
  if (String(sourceMessage?.type || '').toLowerCase() === 'auto_reply') return null;

  const config = await getAutoReply(recipientId);
  if (!config.is_active || !config.message) return null;
  if (!isWithinSchedule(config, new Date())) return null;

  const delayMinutes = Number(config.reply_delay_minutes ?? config.delay_minutes ?? 0);
  if (delayMinutes > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMinutes * 60 * 1000));
  }

  const inserted = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO messages (conv_id, sender_id, type, content, created_at)
       VALUES ($1, $2, 'text', $3, NOW())
       RETURNING id, conv_id, sender_id, type, content, photo_url, attachment_url, attachment_name, attachment_mime_type, attachment_size_bytes, read_at, created_at`,
      [conversationId, recipientId, config.message]
    );

    await client.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    return result.rows[0];
  });

  return {
    message: inserted,
    recipientId: Number(senderId),
    config,
  };
}

module.exports = {
  getAutoReply,
  saveAutoReply,
  maybeSendAutoReply,
};
