'use strict';

const crypto = require('crypto');

const { query } = require('../config/database');
const { sendNewsletterEmail } = require('./emailService');

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function normalizeTextList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

async function getSubscription(userId) {
  const result = await query(
    `SELECT ns.*, u.prenom, u.nom, u.email, u.avatar_url, u.commune_id, com.name AS commune_name
     FROM newsletter_subscriptions ns
     JOIN users u ON u.id = ns.user_id
     LEFT JOIN communes com ON com.id = u.commune_id
     WHERE ns.user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

async function ensureSubscription(userId) {
  const existing = await getSubscription(userId);
  if (existing) return existing;

  await query(
    `INSERT INTO newsletter_subscriptions (
       user_id, enabled, frequency, categories, communes, unsubscribe_token, created_at, updated_at
     )
     VALUES ($1, TRUE, 'weekly', '{}'::text[], '{}'::text[], $2, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, createToken()]
  );

  return getSubscription(userId);
}

async function saveSubscription(userId, payload = {}) {
  const current = await ensureSubscription(userId);
  const enabled = payload.enabled === undefined ? Boolean(current?.enabled ?? true) : Boolean(payload.enabled);
  const frequency = ['weekly', 'monthly', 'off'].includes(String(payload.frequency || '').toLowerCase())
    ? String(payload.frequency).toLowerCase()
    : String(current?.frequency || 'weekly');
  const categories = normalizeTextList(payload.categories ?? current?.categories ?? []);
  const communes = normalizeTextList(payload.communes ?? current?.communes ?? []);
  const unsubscribeToken = String(current?.unsubscribe_token || '').trim() || createToken();

  const result = await query(
    `INSERT INTO newsletter_subscriptions (
       user_id, enabled, frequency, categories, communes, unsubscribe_token, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4::text[], $5::text[], $6, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       frequency = EXCLUDED.frequency,
       categories = EXCLUDED.categories,
       communes = EXCLUDED.communes,
       unsubscribe_token = COALESCE(newsletter_subscriptions.unsubscribe_token, EXCLUDED.unsubscribe_token),
       updated_at = NOW()
     RETURNING *`,
    [userId, enabled, frequency, categories, communes, unsubscribeToken]
  );

  return result.rows[0];
}

async function deleteSubscription(userId) {
  const result = await query(
    `UPDATE newsletter_subscriptions
     SET enabled = FALSE, frequency = 'off', updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId]
  );

  return result.rows[0] || null;
}

async function unsubscribeByToken(token) {
  const tokenValue = String(token || '').trim();
  if (!tokenValue) return null;

  const result = await query(
    `UPDATE newsletter_subscriptions
     SET enabled = FALSE, frequency = 'off', updated_at = NOW()
     WHERE unsubscribe_token = $1
     RETURNING *`,
    [tokenValue]
  );

  return result.rows[0] || null;
}

function buildListingItem(row) {
  return {
    type: row.item_type || 'Annonce',
    title: row.title,
    description: row.description || row.excerpt || '',
    meta: [row.category_name, row.commune_name, row.price_xpf ? `${Number(row.price_xpf).toLocaleString('fr-FR')} XPF` : null]
      .filter(Boolean)
      .join(' · '),
    url: `/annonces/${row.id}`,
  };
}

async function buildNewsletterPreview(userId) {
  const subscription = await ensureSubscription(userId);
  if (!subscription) return null;

  const listingsRes = await query(
    `SELECT
       a.id,
       a.titre AS title,
       LEFT(a.description, 160) AS description,
       a.prix AS price_xpf,
       cat.name AS category_name,
       com.name AS commune_name,
       'Annonce locale' AS item_type
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     LEFT JOIN communes com ON com.id = a.commune_id
     WHERE a.status = 'active'
       AND a.deleted_at IS NULL
       AND (
         COALESCE(array_length($2::text[], 1), 0) = 0
         OR cat.slug = ANY($2::text[])
         OR cat.name = ANY($2::text[])
       )
     ORDER BY a.created_at DESC
     LIMIT 6`,
    [userId, normalizeTextList(subscription.categories || [])]
  );

  const items = listingsRes.rows.map(buildListingItem);
  return {
    subscription,
    items,
    summary: {
      total: items.length,
    },
  };
}

async function listActiveSubscribers() {
  const result = await query(
    `SELECT
       ns.*,
       u.prenom,
       u.nom,
       u.email,
       u.avatar_url,
       u.commune_id,
       com.name AS commune_name
     FROM newsletter_subscriptions ns
     JOIN users u ON u.id = ns.user_id
     LEFT JOIN communes com ON com.id = u.commune_id
     WHERE ns.enabled = TRUE AND ns.frequency IN ('weekly', 'monthly')
     ORDER BY ns.updated_at DESC`
  );

  return result.rows;
}

async function sendNewsletterToSubscription(row, options = {}) {
  const preview = await buildNewsletterPreview(row.user_id);
  const payload = {
    subject: options.subject || '📰 La newsletter locale Kalico',
    intro: options.intro || 'Voici une sélection locale de nouveautés publiées sur Kalico.',
    items: preview?.items || [],
    summary: preview?.summary || { total: 0 },
    ctaUrl: options.ctaUrl || `${process.env.BASE_URL || 'https://kalico.nc'}/`,
    ctaLabel: options.ctaLabel || 'Voir sur Kalico',
    unsubscribeToken: row.unsubscribe_token,
  };

  if (!payload.items.length) {
    await query(
      `INSERT INTO newsletter_sends (user_id, subscription_id, subject, summary, status, sent_at, created_at)
       VALUES ($1, $2, $3, $4::jsonb, 'skipped', NOW(), NOW())`,
      [row.user_id, row.id, payload.subject, JSON.stringify({ total: 0 })]
    );
    return { skipped: true, items: [] };
  }

  const emailResult = await sendNewsletterEmail(row.email, row.prenom || 'Bonjour', payload, row.user_id);
  await query(
    `INSERT INTO newsletter_sends (user_id, subscription_id, subject, summary, status, provider_message_id, sent_at, created_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, NOW(), NOW())`,
    [
      row.user_id,
      row.id,
      payload.subject,
      JSON.stringify({ total: payload.items.length }),
      emailResult?.simulated ? 'sent' : 'sent',
      emailResult?.messageId || null,
    ]
  );
  await query(
    `UPDATE newsletter_subscriptions SET last_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [row.id]
  );

  return { skipped: false, items: payload.items.length };
}

async function sendNewsletterBatch() {
  const subscribers = await listActiveSubscribers();
  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const subscriber of subscribers) {
    try {
      const outcome = await sendNewsletterToSubscription(subscriber);
      if (outcome.skipped) results.skipped += 1;
      else results.sent += 1;
    } catch {
      results.failed += 1;
    }
  }

  return results;
}

module.exports = {
  buildNewsletterPreview,
  deleteSubscription,
  ensureSubscription,
  getSubscription,
  listActiveSubscribers,
  saveSubscription,
  sendNewsletterBatch,
  sendNewsletterToSubscription,
  unsubscribeByToken,
};
