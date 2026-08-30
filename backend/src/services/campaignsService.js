'use strict';

const twilio = require('twilio');
const Stripe = require('stripe');
const { query, withTransaction } = require('../config/database');
const { createNotification } = require('./notificationService');
const { sendMail } = require('./emailService');
const { sendPushToUsers } = require('./pushService');
const { sendSms } = require('./fretWorkflowService');
const { isConfiguredValue } = require('../config/env');
const payplug = require('./payplugService');
const { ensureStripe, getOrCreateStripeCustomer } = require('./paymentHelpers');
const { xpfToEurCents, formatXpfEur } = require('./paymentCatalog');
const { enqueueCampaignNotifications } = require('./campaignNotificationOutboxService');
const { sendCampaignPush } = require('./campaignPushDelivery');

const CAMPAIGN_TYPE_LABEL = {
  bon_plan: 'Bon plan sponsorisé',
  banner: 'Bannière catégorie',
  popup: 'Popup homepage',
};

const CAMPAIGN_PRICE_TABLE = {
  bon_plan: {
    one_shot: {
      3: 500,
      7: 990,
      14: 1500,
      30: 2500,
    },
    monthly: {
      essential: 1800,
      standard: 2500,
      unlimited: 4000,
    },
  },
  banner: {
    7: 990,
    15: 1900,
    30: 2900,
    90: 6900,
  },
  popup: {
    3: 1900,
    7: 3500,
    15: 5900,
    30: 9900,
  },
};

const CAMPAIGN_LIMITS = {
  bon_plan: 6,
  banner: 2,
  popup: 1,
};

const DEFAULT_POPUP = {
  type: 'popup',
  title: 'Bienvenue sur Kalico NC',
  description: 'La plateforme locale de Nouvelle-Calédonie — annonces, services, covoiturage et bien plus.',
  image_url: '/brand/kalico1.svg',
  cta_text: 'Découvrir Kalico',
  link_url: '/',
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase();
}

function isDefaultPopup(row) {
  return Boolean(row?.is_default_popup);
}

function buildTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID || '';
  const token = process.env.TWILIO_AUTH_TOKEN || '';
  if (!sid || !token) return null;
  try {
    return twilio(sid.trim(), token.trim(), { timeout: 15000 });
  } catch {
    return null;
  }
}

const twilioClient = buildTwilioClient();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`;
}

function formatDate(value) {
  if (!value) return 'À confirmer';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'À confirmer';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function buildCampaignEmailHtml({ title, description, ctaText, linkUrl, imageUrl, subtitle }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeSubtitle = escapeHtml(subtitle || '');
  const safeCta = escapeHtml(ctaText || 'Découvrir');
  const safeLink = escapeHtml(linkUrl || BASE_URL);
  const safeImage = escapeHtml(imageUrl || `${BASE_URL}/brand/kalico1.svg`);

  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 18px 40px rgba(8,32,50,.08)">
      <div style="background:linear-gradient(135deg,#082032,#0a7ea4);padding:24px;color:#fff">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.85">${safeSubtitle || 'Kalico'}</p>
        <h1 style="margin:0;font-size:24px;line-height:1.2">${safeTitle}</h1>
      </div>
      <div style="padding:24px">
        <img src="${safeImage}" alt="" style="display:block;width:100%;max-height:280px;object-fit:cover;border-radius:16px;background:#f1f5f9" />
        <p style="margin:18px 0 0;font-size:16px;line-height:1.7;color:#334155">${safeDescription}</p>
        <div style="margin-top:24px">
          <a href="${safeLink}" style="display:inline-block;background:#0a7ea4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">${safeCta}</a>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function getQueryRunner(db = query) {
  if (typeof db === 'function') return db;
  if (db && typeof db.query === 'function') return db.query.bind(db);
  return query;
}

async function ensureDefaultPopupCampaign(db = query) {
  const q = getQueryRunner(db);
  const { rows } = await q(
    `SELECT * FROM campaigns
     WHERE type = 'popup'
       AND is_default_popup = TRUE
     LIMIT 1`
  );

  if (rows[0]) {
    const updated = await q(
      `UPDATE campaigns
       SET title = $2,
           description = $3,
           image_url = $4,
           link_url = $5,
           cta_text = $6,
           price_xpf = 0,
           duration_days = 0,
           starts_at = COALESCE(starts_at, NOW()),
           ends_at = NULL,
           status = 'active',
           paused_at = NULL,
           metadata = COALESCE(metadata, '{}'::jsonb) || $7::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        rows[0].id,
        DEFAULT_POPUP.title,
        DEFAULT_POPUP.description,
        DEFAULT_POPUP.image_url,
        DEFAULT_POPUP.link_url,
        DEFAULT_POPUP.cta_text,
        JSON.stringify({ default_popup: true, source: 'startup' }),
      ]
    );
    return serializeCampaign(updated.rows[0] || rows[0]);
  }

  const inserted = await q(
    `INSERT INTO campaigns (
       type, user_id, category_slug, title, description, image_url, link_url, cta_text,
       price_xpf, duration_days, starts_at, ends_at, status, is_default_popup, metadata
     )
     SELECT
       'popup',
       NULL,
       NULL,
       $1,
       $2,
       $3,
       $4,
       $5,
       0,
       0,
       NOW(),
       NULL,
       'active',
       TRUE,
       $6::jsonb
     WHERE NOT EXISTS (
       SELECT 1
       FROM campaigns
       WHERE type = 'popup'
         AND is_default_popup = TRUE
     )
     RETURNING *`,
    [
      DEFAULT_POPUP.title,
      DEFAULT_POPUP.description,
      DEFAULT_POPUP.image_url,
      DEFAULT_POPUP.link_url,
      DEFAULT_POPUP.cta_text,
      JSON.stringify({ default_popup: true, source: 'startup' }),
    ]
  );
  return serializeCampaign(inserted.rows[0] || null);
}

function getPricing(type, { durationDays, pricingMode, planKey }) {
  const campaignType = String(type || '').trim();
  if (campaignType === 'bon_plan') {
    if (pricingMode === 'monthly') {
      const plan = CAMPAIGN_PRICE_TABLE.bon_plan.monthly[planKey] || CAMPAIGN_PRICE_TABLE.bon_plan.monthly.essential;
      return {
        price_xpf: plan,
        duration_days: 30,
        display_label: `Abonnement mensuel ${String(planKey || 'essential')}`,
        pricing_mode: 'monthly',
      };
    }

    const days = [3, 7, 14, 30].includes(Number(durationDays)) ? Number(durationDays) : 7;
    return {
      price_xpf: CAMPAIGN_PRICE_TABLE.bon_plan.one_shot[days],
      duration_days: days,
      display_label: `${days} jours`,
      pricing_mode: 'one_shot',
    };
  }

  if (campaignType === 'banner') {
    const days = [7, 15, 30, 90].includes(Number(durationDays)) ? Number(durationDays) : 7;
    return {
      price_xpf: CAMPAIGN_PRICE_TABLE.banner[days],
      duration_days: days,
      display_label: `${days} jours`,
      pricing_mode: 'one_shot',
    };
  }

  const days = [3, 7, 15, 30].includes(Number(durationDays)) ? Number(durationDays) : 7;
  return {
    price_xpf: CAMPAIGN_PRICE_TABLE.popup[days],
    duration_days: days,
    display_label: `${days} jours`,
    pricing_mode: 'one_shot',
  };
}

function serializeCampaign(row) {
  if (!row) return null;
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    id: Number(row.id),
    type: row.type,
    user_id: row.user_id == null ? null : Number(row.user_id),
    category_slug: row.category_slug ?? null,
    title: row.title ?? '',
    description: row.description ?? '',
    image_url: row.image_url ?? null,
    link_url: row.link_url ?? null,
    cta_text: row.cta_text ?? null,
    price_xpf: row.price_xpf == null ? 0 : Number(row.price_xpf),
    duration_days: row.duration_days == null ? 0 : Number(row.duration_days),
    starts_at: row.starts_at ?? null,
    ends_at: row.ends_at ?? null,
    status: row.status,
    is_default_popup: Boolean(row.is_default_popup),
    paused_at: row.paused_at ?? null,
    metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    revenue_xpf: row.revenue_xpf == null ? 0 : Number(row.revenue_xpf),
    sponsor_name: row.sponsor_name ?? null,
    sponsor_email: row.sponsor_email ?? null,
    sponsor_phone: row.sponsor_phone ?? null,
    pricing_mode: metadata.pricing_mode ?? null,
    pricing_plan: metadata.pricing_plan ?? null,
    weekly_featured_week: metadata.weekly_featured_week ?? null,
    weekly_featured_rank: metadata.weekly_featured_rank == null ? null : Number(metadata.weekly_featured_rank),
    weekly_featured_method: metadata.weekly_featured_method ?? null,
    weekly_featured_selected_at: metadata.weekly_featured_selected_at ?? null,
  };
}

function getCurrentWeekKey(reference = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Noumea',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference);

  const year = Number(parts.find((part) => part.type === 'year')?.value || reference.getUTCFullYear());
  const month = Number(parts.find((part) => part.type === 'month')?.value || (reference.getUTCMonth() + 1));
  const day = Number(parts.find((part) => part.type === 'day')?.value || reference.getUTCDate());
  const localDate = new Date(Date.UTC(year, month - 1, day));
  const dayIndex = (localDate.getUTCDay() + 6) % 7;
  localDate.setUTCDate(localDate.getUTCDate() - dayIndex);
  return localDate.toISOString().slice(0, 10);
}

function isWeeklyEligibleBonPlanCampaign(campaign) {
  return Boolean(campaign)
    && campaign.type === 'bon_plan'
    && String(campaign.status || '').trim() === 'active'
    && String(campaign.metadata?.pricing_mode || '').trim() === 'monthly'
    && String(campaign.metadata?.pricing_plan || '').trim() === 'unlimited';
}

function getWeeklySelectionMetadata(metadata = {}, { weekKey, rank, method }) {
  return {
    ...(metadata || {}),
    weekly_featured_week: weekKey,
    weekly_featured_rank: rank,
    weekly_featured_method: method,
    weekly_featured_selected_at: new Date().toISOString(),
  };
}

function stripWeeklySelectionMetadata(metadata = {}) {
  const next = { ...(metadata || {}) };
  delete next.weekly_featured_week;
  delete next.weekly_featured_rank;
  delete next.weekly_featured_method;
  delete next.weekly_featured_selected_at;
  return next;
}

function buildWeeklyBonPlanReminderHtml({ displayName, weekLabel, linkUrl }) {
  const safe = (value) => String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:24px;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,.08)">
    <div style="background:#0a7ea4;padding:24px;color:#fff">
      <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.16em;font-size:12px;opacity:.9;">Bons plans illimités</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;">Choisissez vos 2 bons plans à mettre en avant cette semaine</h1>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;line-height:1.7;color:#475569;">Bonjour ${safe(displayName)},</p>
      <p style="margin:0 0 16px;line-height:1.7;color:#475569;">La semaine ${safe(weekLabel)} est ouverte. Sélectionnez vos 2 bons plans illimités à mettre en avant sur Kalico.</p>
      <a href="${safe(linkUrl)}" style="display:inline-block;background:#0a7ea4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">Choisir mes bons plans</a>
      <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">Si vous ne faites rien, Kalico sélectionnera automatiquement les 2 bons plans les plus récents mardi à 12h.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildWeeklyBonPlanAutoSelectionHtml({ displayName, weekLabel, linkUrl }) {
  const safe = (value) => String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:24px;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,.08)">
    <div style="background:#0a7ea4;padding:24px;color:#fff">
      <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.16em;font-size:12px;opacity:.9;">Bons plans illimités</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;">Vos bons plans de la semaine ont été sélectionnés</h1>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;line-height:1.7;color:#475569;">Bonjour ${safe(displayName)},</p>
      <p style="margin:0 0 16px;line-height:1.7;color:#475569;">Kalico a sélectionné automatiquement vos 2 bons plans les plus récents pour la semaine ${safe(weekLabel)}.</p>
      <a href="${safe(linkUrl)}" style="display:inline-block;background:#0a7ea4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">Voir ma sélection</a>
      <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">Vous pouvez toujours modifier cette sélection depuis votre dashboard Pro.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendCampaignSms({ to, body }) {
  if (!twilioClient) return { skipped: true };
  const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_PHONE || '';
  const recipient = String(to || '').trim();
  if (!recipient || !from) return { skipped: true };
  await twilioClient.messages.create({ to: recipient, from, body });
  return { sent: true };
}

async function notifyCampaignOwner({ user, campaign, message, subject, href }) {
  const title = subject || `Kalico — ${CAMPAIGN_TYPE_LABEL[campaign.type] || 'Campagne'}`;
  const link = href || `${BASE_URL}/pro/dashboard/publicite`;
  const body = message || `${campaign.title}`;
  const recipientEmail = String(user?.email || '').trim();
  const recipientPhone = String(user?.telephone || user?.phone || '').trim();

  await createNotification(user.id, {
    type: 'campaign',
    title,
    body,
    href: link,
  }).catch(() => {});

  if (recipientEmail) {
    await sendMail({
      to: recipientEmail,
      subject: title,
      html: buildCampaignEmailHtml({
        title,
        subtitle: CAMPAIGN_TYPE_LABEL[campaign.type] || 'Campagne publicitaire',
        description: message || campaign.description || '',
        ctaText: campaign.cta_text || 'Voir la campagne',
        linkUrl: link,
        imageUrl: campaign.image_url || DEFAULT_POPUP.image_url,
      }),
    }).catch(() => {});
  }

  if (recipientPhone) {
    await sendCampaignSms({ to: recipientPhone, body: `${title} — ${message || campaign.title}` }).catch(() => {});
  }

  await sendPushToUsers([user.id], {
    title,
    body,
    data: {
      type: 'campaign',
      campaign_id: campaign.id,
    },
  }).catch(() => {});
}

// Strict adapter used only by the durable payment notification worker.
// Legacy scheduler/admin notification behavior remains unchanged.
async function deliverCampaignNotification(item, campaign, client) {
  const active = campaign.status === 'active';
  const title = active ? 'Campagne activée' : 'Campagne en file d’attente';
  const body = active
    ? `Votre campagne "${campaign.title}" est active du ${formatDate(campaign.starts_at)} au ${formatDate(campaign.ends_at)}.`
    : `Votre campagne "${campaign.title}" est en file d'attente. Début estimé : ${formatDate(campaign.starts_at)}.`;
  const href = '/pro/dashboard/publicite';
  if (item.channel === 'in_app') {
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, href) VALUES ($1, 'campaign', $2, $3, $4)`,
      [item.user_id, title, body, href]
    );
    return { status: 'sent' };
  }
  if (item.channel === 'email') {
    if (!String(campaign.email || '').trim()) return { status: 'skipped' };
    const result = await sendMail({ to: campaign.email, subject: title,
      html: buildCampaignEmailHtml({ title, subtitle: CAMPAIGN_TYPE_LABEL[campaign.type], description: body,
        ctaText: campaign.cta_text || 'Voir la campagne', linkUrl: `${BASE_URL}${href}`,
        imageUrl: campaign.image_url || DEFAULT_POPUP.image_url }) });
    return { status: !result?.simulated && Array.isArray(result?.accepted) && result.accepted.length > 0 ? 'sent' : 'retry' };
  }
  if (item.channel === 'sms') {
    if (!String(campaign.telephone || '').trim()) return { status: 'skipped' };
    const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_PHONE || '';
    if (!twilioClient || !from) return { status: 'retry' };
    const result = await twilioClient.messages.create({ to: campaign.telephone, from, body: `${title} : ${body}` });
    return { status: result?.sid && !['failed', 'undelivered', 'canceled'].includes(result.status) ? 'sent' : 'retry' };
  }
  if (item.channel === 'push') {
    const { rows } = await client.query('SELECT token FROM push_tokens WHERE id = $1 AND user_id = $2', [item.target_id, item.user_id]);
    if (!rows[0]?.token) return { status: 'skipped' };
    return sendCampaignPush(rows[0].token, { title, body, data: { type: 'campaign', campaign_id: campaign.id } });
  }
  throw new Error('Unknown campaign notification channel');
}

function countLimitForType(type) {
  return CAMPAIGN_LIMITS[type] ?? 1;
}

async function getActiveCount(q, campaign) {
  const params = [campaign.type];
  let filter = `type = $1 AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW()) AND is_default_popup = FALSE`;
  if (campaign.type === 'banner') {
    params.push(normalizeSlug(campaign.category_slug));
    filter += ` AND COALESCE(category_slug, '') = $2`;
  }
  const result = await q(`SELECT COUNT(*)::int AS count FROM campaigns WHERE ${filter}`, params);
  return Number(result.rows[0]?.count || 0);
}

async function estimateStartAt(q, campaign) {
  const params = [campaign.type];
  let filter = `type = $1 AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW()) AND is_default_popup = FALSE`;
  if (campaign.type === 'banner') {
    params.push(normalizeSlug(campaign.category_slug));
    filter += ` AND COALESCE(category_slug, '') = $2`;
  }

  const result = await q(
    `SELECT MAX(ends_at) AS next_start
     FROM campaigns
     WHERE ${filter}`,
    params,
  );
  const nextStart = result.rows[0]?.next_start ? new Date(result.rows[0].next_start) : null;
  return nextStart && !Number.isNaN(nextStart.getTime()) ? nextStart.toISOString() : new Date().toISOString();
}

async function setCampaignStatus(q, campaignId, { status, startsAt = null, endsAt = null, pausedAt = null }) {
  const fields = ['status = $2', 'updated_at = NOW()'];
  const params = [campaignId, status];
  if (startsAt !== null) {
    params.push(startsAt);
    fields.push(`starts_at = $${params.length}`);
  }
  if (endsAt !== null) {
    params.push(endsAt);
    fields.push(`ends_at = $${params.length}`);
  }
  if (pausedAt !== null) {
    params.push(pausedAt);
    fields.push(`paused_at = $${params.length}`);
  }
  await q(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = $1`, params);
}

async function createCampaignRecord(db, campaignData) {
  const q = getQueryRunner(db);
  const result = await q(
    `INSERT INTO campaigns (
       type, user_id, category_slug, title, description, image_url, link_url, cta_text,
       price_xpf, duration_days, starts_at, ends_at, status, is_default_popup, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL, 'pending', FALSE, $11::jsonb)
     RETURNING *`,
    [
      campaignData.type,
      campaignData.user_id ?? null,
      campaignData.category_slug ?? null,
      campaignData.title,
      campaignData.description ?? '',
      campaignData.image_url ?? null,
      campaignData.link_url ?? null,
      campaignData.cta_text ?? null,
      campaignData.price_xpf ?? 0,
      campaignData.duration_days ?? 0,
      JSON.stringify(campaignData.metadata ?? {}),
    ]
  );
  return result.rows[0] || null;
}

async function buildPaymentForCampaign({ user, campaign, provider, amountXpf, amountEur, paymentMeta, baseUrl = BASE_URL, stripe }) {
  const metadata = {
    payment_type: 'campaign',
    campaign_id: String(campaign.id),
    campaign_type: campaign.type,
    user_id: String(user.id),
    amount_xpf: String(amountXpf),
    amount_eur: String(amountEur),
    duration_days: String(campaign.duration_days || 0),
    category_slug: campaign.category_slug || '',
    pricing_mode: paymentMeta.pricing_mode || 'one_shot',
    pricing_plan: paymentMeta.pricing_plan || '',
  };

  if (process.env.DEMO_MODE === 'true') {
    return {
      checkout_url: `${baseUrl}/pro/dashboard/publicite?demo=1&campaign_id=${campaign.id}`,
      demo: true,
      success: true,
      provider,
      message: 'Paiement simulé',
    };
  }

  if (provider === 'payplug') {
    if (!payplug.isPayPlugConfigured()) {
      throw Object.assign(new Error('PayPlug non configuré'), { status: 503 });
    }

    const payment = await payplug.createPayment({
      amount_xpf: amountXpf,
      description: `${campaign.title}`,
      email: user.email,
      first_name: user.prenom || 'Client',
      last_name: user.nom || 'Kalico',
      return_url: `${baseUrl}/pro/dashboard/publicite?payment_id={PAYPLUG_PAYMENT_ID}&provider=payplug`,
      cancel_url: `${baseUrl}/pro/dashboard/publicite?cancelled=1`,
      metadata,
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'campaign', 'payplug', $2, $3, 'pending', $4)`,
      [user.id, payment.id, amountXpf, JSON.stringify(metadata)]
    );

    return {
      checkout_url: payment.hosted_payment.payment_url,
      payment_id: payment.id,
      provider,
    };
  }

  if (!stripe) {
    throw Object.assign(new Error('Stripe non configuré'), { status: 503 });
  }

  const customerId = await getOrCreateStripeCustomer(stripe, user.id, user.email);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    success_url: `${baseUrl}/pro/dashboard/publicite?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${baseUrl}/pro/dashboard/publicite?cancelled=1`,
    metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: xpfToEurCents(amountXpf),
          product_data: {
            name: campaign.title,
            description: campaign.description?.slice(0, 200) || '',
          },
        },
      },
    ],
  });

  await query(
    `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
     VALUES ($1, 'campaign', 'stripe', $2, $3, 'pending', $4)`,
    [user.id, session.id, amountXpf, JSON.stringify(metadata)]
  );

  return {
    checkout_url: session.url,
    payment_id: session.id,
    provider,
  };
}

async function createCampaignWithPayment(db, { user, payload, provider = 'stripe', baseUrl = BASE_URL, stripe }) {
  const q = getQueryRunner(db);
  const pricing = getPricing(payload.type, payload);
  const campaign = await createCampaignRecord(q, {
    type: payload.type,
    user_id: user.id,
    category_slug: payload.category_slug || null,
    title: payload.title,
    description: payload.description || '',
    image_url: payload.image_url || null,
    link_url: payload.link_url || null,
    cta_text: payload.cta_text || null,
    price_xpf: pricing.price_xpf,
    duration_days: pricing.duration_days,
    metadata: {
      pricing_mode: pricing.pricing_mode,
      pricing_plan: payload.pricing_plan || null,
      source: 'dashboard',
    },
  });

  if (!campaign) {
    throw Object.assign(new Error('Impossible de créer la campagne'), { status: 500 });
  }

  const payment = await buildPaymentForCampaign({
    user,
    campaign,
    provider,
    amountXpf: pricing.price_xpf,
    amountEur: Math.round(pricing.price_xpf / 119.3317),
    paymentMeta: {
      pricing_mode: pricing.pricing_mode,
      pricing_plan: payload.pricing_plan || null,
    },
    baseUrl,
    stripe,
  });

  return {
    campaign,
    pricing,
    payment,
  };
}

// Shared by every capacity-changing path, before any campaign row lock.
// Payment callbacks already hold their payment lock; these paths never lock payments.
async function lockCampaignCapacity(client) {
  await client.query('SELECT pg_advisory_xact_lock(1262570569, 1)');
}

async function activateCampaignIfSlotAvailable(db, campaign, { fromQueue = false, notifyOwner = true } = {}) {
  if (notifyOwner && db != null && db !== query) {
    throw new Error('Campaign notifications require an owned transaction');
  }
  const notifications = [];
  const result = await withCampaignStateTransaction(db, async client => {
    await lockCampaignCapacity(client);
    const q = getQueryRunner(client);
    const { rows } = await q('SELECT * FROM campaigns WHERE id = $1 LIMIT 1 FOR UPDATE', [campaign.id]);
    const current = rows[0];
    if (!current || isDefaultPopup(current)) throw new Error('Campaign activation target unavailable');
    if (current.status !== (fromQueue ? 'queued' : 'pending')) {
      return { status: current.status, starts_at: current.starts_at, ends_at: current.ends_at, fromQueue, duplicate: true };
    }
    return activateCampaignWithCapacityHeld(q, current, { fromQueue, notifications: notifyOwner ? notifications : null });
  });
  for (const notify of notifications) await notify();
  return result;
}

async function activateCampaignWithCapacityHeld(q, campaign, { fromQueue = false, notifications = null } = {}) {
  const activeCount = await getActiveCount(q, campaign);
  const limit = countLimitForType(campaign.type);
  const slotAvailable = activeCount < limit;
  const now = new Date().toISOString();
  const nextStart = slotAvailable ? now : await estimateStartAt(q, campaign);
  const endsAt = campaign.duration_days > 0
    ? new Date(Date.parse(nextStart) + campaign.duration_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  if (slotAvailable) {
    await setCampaignStatus(q, campaign.id, {
      status: 'active',
      startsAt: now,
      endsAt,
      pausedAt: null,
    });
  } else {
    await setCampaignStatus(q, campaign.id, {
      status: 'queued',
      startsAt: nextStart,
      endsAt: endsAt,
      pausedAt: null,
    });
  }

  const { rows } = await q(
    `SELECT c.*, u.email, u.telephone, u.prenom, u.nom
     FROM campaigns c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = $1
     LIMIT 1`,
    [campaign.id]
  );
  const current = rows[0];
  if (notifications && current?.user_id) {
    notifications.push(async () => {
      const user = {
        id: Number(current.user_id),
        email: current.email,
        telephone: current.telephone,
        prenom: current.prenom,
        nom: current.nom,
      };

      const message = slotAvailable
        ? `Votre campagne "${current.title}" est active du ${formatDate(current.starts_at)} au ${formatDate(current.ends_at)}.`
        : `Votre campagne "${current.title}" est en file d'attente. Début estimé : ${formatDate(nextStart)}.`;

      await notifyCampaignOwner({
        user,
        campaign: current,
        message,
        subject: slotAvailable ? 'Campagne activée' : 'Campagne en file d’attente',
        href: '/pro/dashboard/publicite',
      }).catch(() => {});
    });
  }

  return {
    status: slotAvailable ? 'active' : 'queued',
    starts_at: slotAvailable ? now : nextStart,
    ends_at: endsAt,
    fromQueue,
  };
}

async function getWeeklyBonPlanSelection(db, userId) {
  const q = getQueryRunner(db);
  const weekKey = getCurrentWeekKey();
  const { rows } = await q(
    `SELECT c.*,
            u.email AS sponsor_email,
            u.telephone AS sponsor_phone,
            u.prenom AS sponsor_first_name,
            u.nom AS sponsor_last_name
     FROM campaigns c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.user_id = $1
       AND c.type = 'bon_plan'
       AND c.status = 'active'
       AND COALESCE(c.metadata->>'pricing_mode', '') = 'monthly'
       AND COALESCE(c.metadata->>'pricing_plan', '') = 'unlimited'
     ORDER BY c.starts_at DESC NULLS LAST, c.created_at DESC`,
    [userId]
  );

  const campaigns = rows.map(serializeCampaign);
  const selectedCampaigns = campaigns
    .filter((campaign) => campaign.weekly_featured_week === weekKey)
    .sort((a, b) => Number(a.weekly_featured_rank || 999) - Number(b.weekly_featured_rank || 999))
    .slice(0, 2);

  return {
    week_key: weekKey,
    limit: 2,
    campaigns,
    selected_campaign_ids: selectedCampaigns.map((campaign) => campaign.id),
    selected_campaigns: selectedCampaigns,
  };
}

async function saveWeeklyBonPlanSelection(db, { userId, campaignIds = [], method = 'manual' }) {
  const weekKey = getCurrentWeekKey();
  const normalizedIds = [...new Set((Array.isArray(campaignIds) ? campaignIds : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0))]
    .slice(0, 2);
  return withTransaction(async (client) => {
    const q = getQueryRunner(client);
    const { rows } = await q(
      `SELECT c.id, c.metadata
       FROM campaigns c
       WHERE c.user_id = $1
         AND c.type = 'bon_plan'
         AND c.status = 'active'
         AND COALESCE(c.metadata->>'pricing_mode', '') = 'monthly'
         AND COALESCE(c.metadata->>'pricing_plan', '') = 'unlimited'`,
      [userId]
    );

    const eligible = new Map(rows.map((row) => [Number(row.id), row]));
    for (const id of normalizedIds) {
      if (!eligible.has(id)) {
        throw Object.assign(new Error('Campagne illimitée invalide.'), { status: 400 });
      }
    }

    await q(
      `UPDATE campaigns
       SET metadata = (COALESCE(metadata, '{}'::jsonb) - 'weekly_featured_week' - 'weekly_featured_rank' - 'weekly_featured_method' - 'weekly_featured_selected_at'),
           updated_at = NOW()
       WHERE user_id = $1
         AND type = 'bon_plan'
         AND status = 'active'
         AND COALESCE(metadata->>'pricing_mode', '') = 'monthly'
         AND COALESCE(metadata->>'pricing_plan', '') = 'unlimited'`,
      [userId]
    );

    for (let index = 0; index < normalizedIds.length; index += 1) {
      const campaignId = normalizedIds[index];
      const currentRow = eligible.get(campaignId);
      const nextMetadata = getWeeklySelectionMetadata(currentRow.metadata || {}, {
        weekKey,
        rank: index + 1,
        method,
      });
      await q(
        `UPDATE campaigns
         SET metadata = $2::jsonb,
             updated_at = NOW()
         WHERE id = $1
           AND user_id = $3`,
        [campaignId, JSON.stringify(nextMetadata), userId]
      );
    }

    return getWeeklyBonPlanSelection(client, userId);
  });
}

async function notifyWeeklyBonPlanSelectionReminder(db) {
  const q = getQueryRunner(db);
  const weekKey = getCurrentWeekKey();
  const { rows } = await q(
    `SELECT u.id AS user_id,
            u.email,
            u.telephone,
            COALESCE(u.pro_company_name, NULLIF(TRIM(CONCAT_WS(' ', u.prenom, u.nom)), ''), u.email) AS display_name,
            COUNT(*) FILTER (WHERE c.metadata->>'weekly_featured_week' = $2) AS selected_count
     FROM campaigns c
     JOIN users u ON u.id = c.user_id
     WHERE c.type = 'bon_plan'
       AND c.status = 'active'
       AND COALESCE(c.metadata->>'pricing_mode', '') = 'monthly'
       AND COALESCE(c.metadata->>'pricing_plan', '') = 'unlimited'
     GROUP BY u.id
     HAVING COUNT(*) > 0
        AND COUNT(*) FILTER (WHERE c.metadata->>'weekly_featured_week' = $2) < 2`,
    [weekKey]
  );

  if (!rows.length) return { reminded: 0 };

  const weekLabel = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Pacific/Noumea',
    dateStyle: 'long',
  }).format(new Date());
  const linkUrl = `${process.env.BASE_URL || 'https://kalico.nc'}/pro/dashboard/publicite`;

  for (const row of rows) {
    const userId = Number(row.user_id);
    const displayName = row.display_name || row.email || 'Bonjour';
    const title = 'Choisissez vos 2 bons plans à mettre en avant cette semaine';
    const body = `Bonjour ${displayName}, vos bons plans illimités sont prêts pour la semaine.`;

    await createNotification(userId, {
      type: 'campaign',
      title,
      body,
      href: linkUrl,
    }).catch(() => {});

    if (row.email) {
      await sendMail({
        to: row.email,
        subject: title,
        html: buildWeeklyBonPlanReminderHtml({ displayName, weekLabel, linkUrl }),
      }).catch(() => {});
    }

    if (row.telephone) {
      await sendSms({
        to: row.telephone,
        body: 'Kalico : choisissez vos 2 bons plans illimités à mettre en avant cette semaine sur kalico.nc/pro/dashboard/publicite',
      }).catch(() => {});
    }

    await sendPushToUsers([userId], {
      title,
      body,
      data: {
        type: 'campaign',
        campaign_scope: 'bon_plan_weekly_selection',
      },
    }).catch(() => {});
  }

  return { reminded: rows.length };
}

async function autoSelectWeeklyBonPlans(db) {
  const q = getQueryRunner(db);
  const weekKey = getCurrentWeekKey();
  const { rows } = await q(
    `SELECT c.id,
            c.user_id,
            c.metadata,
            u.email,
            u.telephone,
            COALESCE(u.pro_company_name, NULLIF(TRIM(CONCAT_WS(' ', u.prenom, u.nom)), ''), u.email) AS display_name
     FROM campaigns c
     JOIN users u ON u.id = c.user_id
     WHERE c.type = 'bon_plan'
       AND c.status = 'active'
       AND COALESCE(c.metadata->>'pricing_mode', '') = 'monthly'
       AND COALESCE(c.metadata->>'pricing_plan', '') = 'unlimited'
     ORDER BY c.user_id ASC, c.starts_at DESC NULLS LAST, c.created_at DESC`
  );

  if (!rows.length) return { auto_selected: 0 };

  const byUser = rows.reduce((acc, row) => {
    const key = Number(row.user_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  let autoSelected = 0;
  for (const [userIdStr, userRows] of Object.entries(byUser)) {
    const userId = Number(userIdStr);
    const currentSelection = userRows.filter((row) => row.metadata?.weekly_featured_week === weekKey);
    const selectedIds = currentSelection.map((row) => Number(row.id));
    if (selectedIds.length >= 2) continue;

    const needed = 2 - selectedIds.length;
    const nextIds = userRows
      .map((row) => Number(row.id))
      .filter((id) => !selectedIds.includes(id))
      .slice(0, needed);

    if (!nextIds.length) continue;

    const saved = await saveWeeklyBonPlanSelection(db, {
      userId,
      campaignIds: [...selectedIds, ...nextIds],
      method: 'auto',
    }).catch(() => null);

    if (!saved) continue;
    autoSelected += nextIds.length;

    const displayName = userRows[0]?.display_name || userRows[0]?.email || 'Bonjour';
    const title = 'Vos bons plans hebdomadaires ont été sélectionnés';
    const body = `Bonjour ${displayName}, Kalico a sélectionné automatiquement vos bons plans de la semaine.`;
    const linkUrl = `${process.env.BASE_URL || 'https://kalico.nc'}/pro/dashboard/publicite`;
    const weekLabel = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Pacific/Noumea',
      dateStyle: 'long',
    }).format(new Date());

    await createNotification(userId, {
      type: 'campaign',
      title,
      body,
      href: linkUrl,
    }).catch(() => {});

    if (userRows[0]?.email) {
      await sendMail({
        to: userRows[0].email,
        subject: title,
        html: buildWeeklyBonPlanAutoSelectionHtml({ displayName, weekLabel, linkUrl }),
      }).catch(() => {});
    }

    if (userRows[0]?.telephone) {
      await sendSms({
        to: userRows[0].telephone,
        body: 'Kalico : vos bons plans illimités de la semaine ont été sélectionnés automatiquement.',
      }).catch(() => {});
    }

    await sendPushToUsers([userId], {
      title,
      body,
      data: {
        type: 'campaign',
        campaign_scope: 'bon_plan_weekly_selection',
      },
    }).catch(() => {});
  }

  return { auto_selected: autoSelected };
}

async function activateCampaignFromPayment(db, payment, paymentMeta, providerRef, provider) {
  // Both webhook callers supply a transaction client. Never silently use the pool.
  if (!db || typeof db.query !== 'function') throw new Error('Campaign transaction client required');
  const q = getQueryRunner(db);
  const campaignId = Number(paymentMeta.campaign_id || 0);
  if (!campaignId) return null;

  const { rows: paymentRows } = await q(
    `SELECT id, user_id, type, status, metadata, amount_xpf FROM payments
     WHERE id = $1 AND provider = $2 AND provider_ref = $3 LIMIT 1 FOR UPDATE`,
    [payment?.id, provider, providerRef]
  );
  const storedPayment = paymentRows[0];
  if (!storedPayment || storedPayment.type !== 'campaign'
      || !['pending', 'succeeded'].includes(storedPayment.status)
      || Number(storedPayment.metadata?.campaign_id) !== campaignId
      || Number(storedPayment.user_id) !== Number(payment?.user_id)
      || Number(storedPayment.amount_xpf) !== Number(payment?.amount_xpf)) {
    throw new Error('Campaign payment validation failed');
  }
  await lockCampaignCapacity(db);
  const { rows } = await q(`SELECT * FROM campaigns WHERE id = $1 LIMIT 1 FOR UPDATE`, [campaignId]);
  const campaign = rows[0];
  if (!campaign) return null;
  if (Number(campaign.user_id) !== Number(storedPayment.user_id)) throw new Error('Campaign owner mismatch');

  // Preserve already applied effects, including legacy metadata with stale status.
  // Never resume a paused/expired campaign or extend dates for the same payment.
  if (campaign.metadata?.payment_ref === providerRef && campaign.metadata?.payment_provider === provider
      && storedPayment.status === 'succeeded') {
    return { campaignId, duplicate: true, activation: {
      status: campaign.status, starts_at: campaign.starts_at, ends_at: campaign.ends_at, fromQueue: false,
    } };
  }
  if (campaign.status !== 'pending' || campaign.metadata?.payment_ref) {
    throw new Error('Campaign payment transition not allowed');
  }

  const updatedPayment = await q(
    `UPDATE payments SET status = 'succeeded', updated_at = NOW()
     WHERE id = $1 AND provider = $2 AND provider_ref = $3 AND type = 'campaign'`,
    [storedPayment.id, provider, providerRef]
  );
  if (updatedPayment.rowCount !== 1) throw new Error('Campaign payment update failed');

  const activation = await activateCampaignWithCapacityHeld(q, campaign);

  const updatedCampaign = await q(
    `UPDATE campaigns
     SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [
      campaign.id,
      JSON.stringify({
        payment_provider: provider,
        payment_ref: providerRef,
        payment_status: 'succeeded',
        pricing_mode: storedPayment.metadata.pricing_mode || 'one_shot',
        pricing_plan: storedPayment.metadata.pricing_plan || null,
      }),
    ]
  );
  if (updatedCampaign.rowCount !== 1) throw new Error('Campaign metadata update failed');
  await enqueueCampaignNotifications(db, storedPayment.id, campaign.id, storedPayment.user_id, activation.status);

  return { campaignId, activation };
}

async function listHomeSponsoredCampaigns(db = query, limit = 6) {
  const q = getQueryRunner(db);
  const weekKey = getCurrentWeekKey();
  const result = await q(
    `SELECT c.*, u.email AS sponsor_email, u.telephone AS sponsor_phone, u.prenom AS sponsor_first_name, u.nom AS sponsor_last_name
     FROM campaigns c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.type = 'bon_plan'
       AND c.status = 'active'
       AND c.is_default_popup = FALSE
       AND (c.starts_at IS NULL OR c.starts_at <= NOW())
       AND (c.ends_at IS NULL OR c.ends_at > NOW())
       AND (
         COALESCE(c.metadata->>'pricing_mode', '') <> 'monthly'
         OR COALESCE(c.metadata->>'pricing_plan', '') <> 'unlimited'
         OR COALESCE(c.metadata->>'weekly_featured_week', '') = $2
       )
     ORDER BY
       CASE WHEN COALESCE(c.metadata->>'weekly_featured_week', '') = $2 THEN 0 ELSE 1 END,
       COALESCE(NULLIF(c.metadata->>'weekly_featured_rank', '')::int, 999) ASC,
       c.starts_at DESC NULLS LAST,
       c.created_at DESC
     LIMIT $1`,
    [Math.min(12, Math.max(1, Number(limit) || 6)), weekKey]
  );
  return result.rows.map(serializeCampaign);
}

async function getCategoryBanner(db = query, categorySlug) {
  const q = getQueryRunner(db);
  const slug = normalizeSlug(categorySlug);
  if (!slug) return null;
  const result = await q(
    `SELECT c.*, u.email AS sponsor_email, u.telephone AS sponsor_phone, u.prenom AS sponsor_first_name, u.nom AS sponsor_last_name
     FROM campaigns c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.type = 'banner'
       AND c.category_slug = $1
       AND c.status = 'active'
       AND (c.starts_at IS NULL OR c.starts_at <= NOW())
       AND (c.ends_at IS NULL OR c.ends_at > NOW())
     ORDER BY c.starts_at DESC NULLS LAST, c.created_at DESC
     LIMIT 1`,
    [slug]
  );
  return serializeCampaign(result.rows[0] || null);
}

async function getActivePopup(db = query) {
  const q = getQueryRunner(db);
  const result = await q(
    `SELECT c.*, u.email AS sponsor_email, u.telephone AS sponsor_phone, u.prenom AS sponsor_first_name, u.nom AS sponsor_last_name
     FROM campaigns c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.type = 'popup'
       AND c.status = 'active'
       AND (c.starts_at IS NULL OR c.starts_at <= NOW())
       AND (c.ends_at IS NULL OR c.ends_at > NOW())
     ORDER BY c.is_default_popup ASC, c.starts_at DESC NULLS LAST, c.created_at DESC
     LIMIT 1`,
    []
  );

  const row = result.rows[0];
  if (row) return serializeCampaign(row);

  const fallback = await q(
    `SELECT * FROM campaigns WHERE type = 'popup' AND is_default_popup = TRUE LIMIT 1`
  );
  return serializeCampaign(fallback.rows[0] || null);
}

async function listDashboardCampaigns(db = query, userId) {
  const q = getQueryRunner(db);
  const { rows } = await q(
    `SELECT c.*,
            COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_xpf ELSE 0 END), 0)::int AS revenue_xpf
     FROM campaigns c
     LEFT JOIN payments p
       ON p.type = 'campaign'
      AND COALESCE((p.metadata->>'campaign_id')::int, 0) = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [userId]
  );

  const campaigns = rows.map(serializeCampaign);
  return {
    campaigns,
    by_type: campaigns.reduce((acc, campaign) => {
      acc[campaign.type] = acc[campaign.type] || [];
      acc[campaign.type].push(campaign);
      return acc;
    }, {}),
  };
}

async function listAdminCampaigns(db = query) {
  const q = getQueryRunner(db);
  const { rows } = await q(
    `SELECT c.*,
            u.email AS sponsor_email,
            u.telephone AS sponsor_phone,
            u.prenom AS sponsor_first_name,
            u.nom AS sponsor_last_name,
            COALESCE(u.pro_company_name, NULLIF(TRIM(CONCAT_WS(' ', u.prenom, u.nom)), ''), u.email) AS sponsor_name,
            COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_xpf ELSE 0 END), 0)::int AS revenue_xpf
     FROM campaigns c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN payments p
       ON p.type = 'campaign'
      AND COALESCE((p.metadata->>'campaign_id')::int, 0) = c.id
     GROUP BY c.id, u.id
     ORDER BY c.status = 'queued' DESC, c.type ASC, c.created_at DESC`
  );

  const campaigns = rows.map(serializeCampaign);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const revenueMonthXpf = campaigns.reduce((sum, campaign) => {
    if (!['active', 'expired'].includes(String(campaign.status || '').trim())) return sum;
    if (!campaign.starts_at) return sum;
    const startedAt = new Date(campaign.starts_at);
    if (Number.isNaN(startedAt.getTime())) return sum;
    if (startedAt.getFullYear() !== currentYear || startedAt.getMonth() !== currentMonth) return sum;
    return sum + Number(campaign.price_xpf || 0);
  }, 0);

  return {
    campaigns,
    revenue_month_xpf: revenueMonthXpf,
    active_popup: campaigns.find((campaign) => campaign.type === 'popup' && campaign.status === 'active' && !campaign.is_default_popup) || null,
    default_popup: campaigns.find((campaign) => campaign.type === 'popup' && campaign.is_default_popup) || null,
  };
}

function withCampaignStateTransaction(db, operation) {
  if (db == null || db === query) return withTransaction(operation);
  if (typeof db.query === 'function') return operation(db);
  throw new Error('Campaign state transaction client required');
}

async function pauseCampaign(db, { campaignId, userId, isAdmin = false }) {
  return withCampaignStateTransaction(db, async client => {
    await lockCampaignCapacity(client);
    const q = getQueryRunner(client);
    const { rows } = await q(`SELECT * FROM campaigns WHERE id = $1 LIMIT 1 FOR UPDATE`, [campaignId]);
    const campaign = rows[0];
    if (!campaign) throw Object.assign(new Error('Campagne introuvable'), { status: 404 });
    if (!isAdmin && Number(campaign.user_id || 0) !== Number(userId)) throw Object.assign(new Error('Accès refusé'), { status: 403 });
    if (isDefaultPopup(campaign)) throw Object.assign(new Error('Le popup par défaut ne peut pas être suspendu'), { status: 400 });
    if (campaign.status === 'paused') return true;
    if (!['active', 'queued'].includes(campaign.status)) {
      throw Object.assign(new Error('Cette campagne ne peut pas être mise en pause.'), { status: 409 });
    }

    await q(
      `UPDATE campaigns
       SET status = 'paused',
           paused_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [campaignId]
    );

    return true;
  });
}

async function resumeCampaign(db, { campaignId, userId, isAdmin = false }) {
  return withCampaignStateTransaction(db, async client => {
    await lockCampaignCapacity(client);
    const q = getQueryRunner(client);
    const { rows } = await q(`SELECT * FROM campaigns WHERE id = $1 LIMIT 1 FOR UPDATE`, [campaignId]);
    const campaign = rows[0];
    if (!campaign) throw Object.assign(new Error('Campagne introuvable'), { status: 404 });
    if (!isAdmin && Number(campaign.user_id || 0) !== Number(userId)) throw Object.assign(new Error('Accès refusé'), { status: 403 });
    if (isDefaultPopup(campaign)) throw Object.assign(new Error('Le popup par défaut ne peut pas être modifié'), { status: 400 });
    // Repeated resume must not count itself as a competing campaign or shift dates.
    if (campaign.status === 'active' || campaign.status === 'queued') return true;
    if (campaign.status !== 'paused') {
      throw Object.assign(new Error('Seule une campagne en pause peut être reprise.'), { status: 409 });
    }
    // Demo activation has no payment row. Production/admin calls must have a paid
    // campaign belonging to the same owner, not just an untrusted metadata flag.
    if (process.env.DEMO_MODE !== 'true') {
      const { rows: paid } = await q(
        `SELECT id FROM payments WHERE user_id = $1 AND provider = $2 AND provider_ref = $3
         AND type = 'campaign' AND status = 'succeeded'
         AND metadata->>'campaign_id' = $4 LIMIT 1`,
        [campaign.user_id, campaign.metadata?.payment_provider, campaign.metadata?.payment_ref, String(campaign.id)]
      );
      if (!paid[0]) throw Object.assign(new Error('Paiement de campagne non confirmé.'), { status: 409 });
    }

    const pausedAt = campaign.paused_at ? new Date(campaign.paused_at) : null;
    const shiftMs = pausedAt ? Math.max(0, Date.now() - pausedAt.getTime()) : 0;
    const nextEndsAt = campaign.ends_at ? new Date(new Date(campaign.ends_at).getTime() + shiftMs).toISOString() : null;
    const slotAvailable = await getActiveCount(q, campaign) < countLimitForType(campaign.type);

    await q(
      `UPDATE campaigns
       SET status = $2,
           starts_at = CASE WHEN $2 = 'active' THEN NOW() ELSE starts_at END,
           ends_at = COALESCE($3, ends_at),
           paused_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [campaignId, slotAvailable ? 'active' : 'queued', nextEndsAt]
    );

    return true;
  });
}

async function expireCampaignsAndActivateQueued(db = query) {
  // The scheduler owns commit so legacy notifications cannot hold the capacity lock.
  if (db != null && db !== query) throw new Error('Campaign scheduler requires an owned transaction');
  const notifications = [];
  const result = await withCampaignStateTransaction(db, async client => {
    await lockCampaignCapacity(client);
    const q = getQueryRunner(client);
    const expired = await q(
      `UPDATE campaigns SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND is_default_popup = FALSE
         AND ends_at IS NOT NULL AND ends_at <= NOW() RETURNING id`
    );
    const { rows } = await q(
      `SELECT * FROM campaigns WHERE status = 'queued' AND is_default_popup = FALSE
       AND type IN ('bon_plan', 'banner', 'popup') ORDER BY created_at ASC, id ASC FOR UPDATE`
    );
    let activatedCount = 0;
    for (const campaign of rows) {
      if (await getActiveCount(q, campaign) >= countLimitForType(campaign.type)) continue;
      await activateCampaignWithCapacityHeld(q, campaign, { fromQueue: true, notifications });
      activatedCount++;
    }
    return { expiredCount: expired.rowCount || 0, activatedCount };
  });
  for (const notify of notifications) await notify();
  return result;
}

module.exports = {
  deliverCampaignNotification,
  CAMPAIGN_PRICE_TABLE,
  CAMPAIGN_LIMITS,
  CAMPAIGN_TYPE_LABEL,
  DEFAULT_POPUP,
  autoSelectWeeklyBonPlans,
  getWeeklyBonPlanSelection,
  getPricing,
  ensureDefaultPopupCampaign,
  serializeCampaign,
  createCampaignRecord,
  createCampaignWithPayment,
  buildPaymentForCampaign,
  activateCampaignIfSlotAvailable,
  activateCampaignFromPayment,
  listHomeSponsoredCampaigns,
  getCategoryBanner,
  getActivePopup,
  listDashboardCampaigns,
  listAdminCampaigns,
  notifyWeeklyBonPlanSelectionReminder,
  pauseCampaign,
  resumeCampaign,
  saveWeeklyBonPlanSelection,
  expireCampaignsAndActivateQueued,
};
