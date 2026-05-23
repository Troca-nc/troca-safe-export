'use strict';

const { getRedisClient } = require('../config/redis');
const { query: defaultQuery } = require('../config/database');
const { createNotification } = require('./notificationService');
const { sendMail } = require('./emailService');
const { sendPushToUsers } = require('./pushService');
const { XPF_PER_EUR } = require('./paymentCatalog');

const BON_PLAN_PRICING = {
  7: { publicXpf: 2900, proXpf: 2320 },
  30: { publicXpf: 7900, proXpf: 6320 },
};

function getQueryRunner(db = defaultQuery) {
  if (typeof db === 'function') return db;
  if (db && typeof db.query === 'function') return db.query.bind(db);
  return defaultQuery;
}

function normalizeBusinessName(name) {
  return String(name || '').trim();
}

function slugifyBusinessName(name) {
  return normalizeBusinessName(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255) || `business-${Date.now()}`;
}

function getBonPlanPricing(durationDays, isPro = false) {
  const base = BON_PLAN_PRICING[Number(durationDays)] || BON_PLAN_PRICING[7];
  const finalPrice = isPro ? base.proXpf : base.publicXpf;
  const discountPct = base.publicXpf > 0 ? Math.max(0, Math.round((1 - finalPrice / base.publicXpf) * 100)) : 0;
  return {
    duration_days: Number(durationDays),
    original_price_xpf: base.publicXpf,
    discount_pct: discountPct,
    final_price_xpf: finalPrice,
    final_price_eur: Math.round(finalPrice / XPF_PER_EUR),
  };
}

function formatXpf(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`;
}

function buildBonPlanEmailHtml({ bonPlan, business, baseUrl }) {
  const safe = (value) => String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const link = `${baseUrl}/bons-plans/${bonPlan.id}`;
  const imageUrl = bonPlan.image_url || bonPlan.business_logo_url || `${baseUrl}/logo.png`;

  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:24px;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,.08)">
    <div style="background:#0a7ea4;padding:24px;color:#fff">
      <h1 style="margin:0;font-size:24px;">Nouveau Bon Plan</h1>
      <p style="margin:8px 0 0;opacity:.92">${safe(business?.name || bonPlan.business_name)}</p>
    </div>
    <img src="${imageUrl}" alt="" style="display:block;width:100%;height:auto;object-fit:cover;" />
    <div style="padding:24px">
      <p style="margin:0 0 8px;color:#0a7ea4;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;">Bon plan local</p>
      <h2 style="margin:0 0 12px;font-size:24px;line-height:1.2;">${safe(bonPlan.title)}</h2>
      <p style="margin:0 0 18px;line-height:1.6;color:#475569;">${safe(bonPlan.description)}</p>
      ${bonPlan.original_price_xpf ? `<p style="margin:0 0 4px;color:#64748b;text-decoration:line-through;">${formatXpf(bonPlan.original_price_xpf)}</p>` : ''}
      ${bonPlan.promo_price_xpf ? `<p style="margin:0 0 18px;font-size:22px;font-weight:700;color:#0f172a;">${formatXpf(bonPlan.promo_price_xpf)}</p>` : ''}
      <a href="${link}" style="display:inline-block;background:#0a7ea4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">${safe(bonPlan.cta_label || 'En profiter')}</a>
      <p style="margin:22px 0 0;font-size:12px;color:#94a3b8;">Vous recevez cet email car vous suivez une categorie ou une enseigne sur Troca.</p>
    </div>
  </div>
</body>
</html>`;
}

async function upsertBusinessFromBonPlan(db, bonPlan) {
  const q = getQueryRunner(db);
  const name = normalizeBusinessName(bonPlan.business_name);
  if (!name) return null;
  const slug = slugifyBusinessName(name);

  const result = await q(
    `INSERT INTO businesses
       (owner_user_id, name, slug, logo_url, contact_email, category, badge, bon_plan_count)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', 1)
     ON CONFLICT (slug)
     DO UPDATE SET
       owner_user_id = COALESCE(EXCLUDED.owner_user_id, businesses.owner_user_id),
       logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url),
       contact_email = COALESCE(EXCLUDED.contact_email, businesses.contact_email),
       category = COALESCE(EXCLUDED.category, businesses.category),
       bon_plan_count = businesses.bon_plan_count + 1,
       badge = CASE WHEN businesses.badge = 'verified' THEN 'verified' ELSE 'active' END,
       updated_at = NOW()
     RETURNING *`,
    [
      bonPlan.user_id ?? null,
      name,
      slug,
      bonPlan.business_logo_url ?? null,
      bonPlan.contact_email ?? null,
      bonPlan.category ?? null,
    ]
  );

  const business = result.rows[0] || null;
  if (!business) return null;

  await q(
    `UPDATE bon_plans
     SET business_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [bonPlan.id, business.id]
  );

  return business;
}

async function updateBusinessReviewStats(db, businessId) {
  const q = getQueryRunner(db);
  await q(
    `UPDATE businesses SET
       review_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM business_reviews WHERE business_id = $1), 0),
       review_count = COALESCE((SELECT COUNT(*) FROM business_reviews WHERE business_id = $1), 0),
       updated_at = NOW()
     WHERE id = $1`,
    [businessId]
  );
}

async function recordBonPlanView(id) {
  const redis = await getRedisClient();
  if (!redis) return false;
  await redis.incr(`bon_plan:views:${id}`).catch(() => {});
  return true;
}

async function flushBonPlanViews(db = defaultQuery) {
  const q = getQueryRunner(db);
  const redis = await getRedisClient();
  if (!redis) return { flushed: 0 };

  const keys = await redis.keys('bon_plan:views:*').catch(() => []);
  let flushed = 0;

  for (const key of keys) {
    const id = key.split(':')[2];
    if (!id) continue;
    const count = Number(await redis.getDel(key).catch(() => 0)) || 0;
    if (!count) continue;
    await q(
      'UPDATE bon_plans SET view_count = view_count + $1, updated_at = NOW() WHERE id = $2',
      [count, id]
    ).catch(() => {});
    flushed += count;
  }

  return { flushed };
}

async function matchBonPlanNotificationRecipients(db, bonPlan) {
  const q = getQueryRunner(db);
  const category = String(bonPlan.category || '').trim().toLowerCase();
  const business = String(bonPlan.business_name || '').trim().toLowerCase();

  const { rows } = await q(
    `SELECT p.user_id, u.email, u.prenom, p.notify_all, p.notify_categories, p.notify_businesses, p.via_push, p.via_email
     FROM bon_plan_notification_prefs p
     JOIN users u ON u.id = p.user_id
     WHERE u.deleted_at IS NULL
       AND (
         p.notify_all = TRUE
         OR EXISTS (
           SELECT 1
           FROM unnest(COALESCE(p.notify_categories, '{}')) AS x
           WHERE lower(x) = $1
         )
         OR EXISTS (
           SELECT 1
           FROM unnest(COALESCE(p.notify_businesses, '{}')) AS x
           WHERE lower(x) = $2
         )
       )`,
    [category, business]
  );

  return rows;
}

async function notifyBonPlanUsers(db, bonPlan, business) {
  const recipients = await matchBonPlanNotificationRecipients(db, bonPlan);
  if (!recipients.length) return;

  const baseUrl = process.env.BASE_URL || 'https://troca.nc';
  const payload = {
    title: `🏷️ Bon Plan — ${business?.name || bonPlan.business_name}`,
    body: bonPlan.title,
    data: { type: 'bon_plan', id: bonPlan.id },
  };

  const pushRecipients = recipients.filter((user) => user.via_push).map((user) => user.user_id);
  if (pushRecipients.length) {
    await sendPushToUsers(pushRecipients, payload).catch(() => {});
  }

  for (const recipient of recipients) {
    await createNotification(recipient.user_id, {
      type: 'bon_plan',
      title: `🏷️ Nouveau bon plan — ${business?.name || bonPlan.business_name}`,
      body: bonPlan.title,
      href: `/bons-plans/${bonPlan.id}`,
    }).catch(() => {});

    if (recipient.via_email && recipient.email) {
      await sendMail({
        to: recipient.email,
        subject: `🏷️ Nouveau bon plan — ${business?.name || bonPlan.business_name}`,
        html: buildBonPlanEmailHtml({ bonPlan, business, baseUrl }),
      }).catch(() => {});
    }
  }
}

async function activateBonPlanFromPayment(db, payment, paymentMeta, providerRef, provider, resource = {}) {
  const q = getQueryRunner(db);
  const bonPlanId = Number(paymentMeta.bon_plan_id ?? paymentMeta.id ?? paymentMeta.bonplan_id ?? 0);
  if (!bonPlanId) return null;

  const { rows } = await q(
    `UPDATE bon_plans
     SET status = 'active',
         paid_at = NOW(),
         payment_provider = $2,
         payment_intent_id = $3,
         amount_xpf = COALESCE(amount_xpf, $4),
         amount_eur = COALESCE(amount_eur, $5),
         published_from = COALESCE(published_from, NOW()),
         published_until = COALESCE(published_until, NOW() + make_interval(days => duration_days)),
         updated_at = NOW()
     WHERE id = $1
       AND status IN ('draft', 'active')
     RETURNING *`,
    [
      bonPlanId,
      provider,
      providerRef,
      Number(paymentMeta.amount_xpf ?? payment?.amount_xpf ?? 0) || null,
      paymentMeta.amount_eur ?? null,
    ]
  );

  const bonPlan = rows[0] || null;
  if (!bonPlan) return null;

  const business = await upsertBusinessFromBonPlan(db, bonPlan);
  await notifyBonPlanUsers(db, bonPlan, business).catch(() => {});

  await q(
    `UPDATE payments
     SET status = 'succeeded',
         updated_at = NOW(),
         metadata = metadata || $2::jsonb
     WHERE provider_ref = $1`,
    [providerRef, JSON.stringify({ bon_plan_id: bonPlan.id, activated: true, provider, ...resource })]
  ).catch(() => {});

  return { bonPlan, business };
}

async function updateBusinessReviewStatsIfNeeded(db, reviewRow) {
  if (!reviewRow?.business_id) return;
  await updateBusinessReviewStats(db, reviewRow.business_id);
}

module.exports = {
  BON_PLAN_PRICING,
  activateBonPlanFromPayment,
  buildBonPlanEmailHtml,
  flushBonPlanViews,
  formatXpf,
  getBonPlanPricing,
  matchBonPlanNotificationRecipients,
  normalizeBusinessName,
  notifyBonPlanUsers,
  recordBonPlanView,
  slugifyBusinessName,
  updateBusinessReviewStats,
  updateBusinessReviewStatsIfNeeded,
  upsertBusinessFromBonPlan,
};
