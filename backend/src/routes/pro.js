'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { createNotification } = require('../services/notificationService');
const { mapListingSearchRow } = require('../services/listingsPresentation');
const { getAutoReply, saveAutoReply } = require('../services/autoReplyService');

const router = express.Router();

const applySchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(200).required(),
  category: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().min(10).max(300).required(),
  website: Joi.string().trim().uri().allow('', null).optional(),
  phone: Joi.string().trim().min(6).max(30).allow('', null).optional(),
  hours: Joi.string().trim().max(255).allow('', null).optional(),
  commune: Joi.string().trim().min(2).max(120).required(),
  siret: Joi.string().trim().max(60).allow('', null).optional(),
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('', null).optional(),
});

const quoteTemplateSchema = Joi.object({
  title: Joi.string().trim().max(120).allow('', null).optional(),
  subtitle: Joi.string().trim().max(220).allow('', null).optional(),
  need_type_label: Joi.string().trim().max(120).allow('', null).optional(),
  need_type_placeholder: Joi.string().trim().max(160).allow('', null).optional(),
  commune_label: Joi.string().trim().max(120).allow('', null).optional(),
  commune_placeholder: Joi.string().trim().max(160).allow('', null).optional(),
  requester_phone_label: Joi.string().trim().max(120).allow('', null).optional(),
  requester_phone_placeholder: Joi.string().trim().max(160).allow('', null).optional(),
  budget_label: Joi.string().trim().max(120).allow('', null).optional(),
  budget_placeholder: Joi.string().trim().max(160).allow('', null).optional(),
  desired_date_label: Joi.string().trim().max(120).allow('', null).optional(),
  desired_date_placeholder: Joi.string().trim().max(160).allow('', null).optional(),
  details_label: Joi.string().trim().max(120).allow('', null).optional(),
  details_placeholder: Joi.string().trim().max(220).allow('', null).optional(),
  show_phone: Joi.boolean().optional(),
  show_budget: Joi.boolean().optional(),
  show_date: Joi.boolean().optional(),
  show_details: Joi.boolean().optional(),
  budget_presets: Joi.array().items(Joi.number().integer().min(0)).max(6).optional(),
}).allow(null).optional();

const quoteSchema = Joi.object({
  requester_name: Joi.string().trim().min(2).max(120).required(),
  requester_email: Joi.string().trim().email().max(255).required(),
  requester_phone: Joi.string().trim().max(30).allow('', null).optional(),
  need_type: Joi.string().trim().min(2).max(120).required(),
  commune: Joi.string().trim().min(2).max(120).required(),
  budget_xpf: Joi.number().integer().min(0).allow(null).optional(),
  desired_date: Joi.string().trim().max(40).allow('', null).optional(),
  details: Joi.string().trim().max(1200).allow('', null).optional(),
});

const profileUpdateSchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(200).allow('', null).optional(),
  category: Joi.string().trim().min(2).max(120).allow('', null).optional(),
  description: Joi.string().trim().max(300).allow('', null).optional(),
  website: Joi.string().trim().uri().allow('', null).optional(),
  phone: Joi.string().trim().min(6).max(30).allow('', null).optional(),
  hours: Joi.string().trim().max(255).allow('', null).optional(),
  commune: Joi.string().trim().min(2).max(120).allow('', null).optional(),
  siret: Joi.string().trim().max(60).allow('', null).optional(),
  logo_url: Joi.string().trim().uri().allow('', null).optional(),
  banner_url: Joi.string().trim().uri().allow('', null).optional(),
  quote_template: quoteTemplateSchema,
});

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function normalizeQuoteTemplate(value) {
  let input = value;
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch {
      input = null;
    }
  }

  const source = input && typeof input === 'object' ? input : {};
  const budgetPresets = Array.isArray(source.budget_presets)
    ? source.budget_presets
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry) && entry > 0)
        .map((entry) => Math.round(entry))
        .slice(0, 6)
    : [15000, 30000, 50000];

  return {
    title: normalizeMaybeText(source.title) || 'Demander un devis',
    subtitle: normalizeMaybeText(source.subtitle) || 'Décrivez votre besoin et recevez une réponse plus précise du professionnel.',
    need_type_label: normalizeMaybeText(source.need_type_label) || 'Type de besoin',
    need_type_placeholder: normalizeMaybeText(source.need_type_placeholder) || 'Plomberie, rénovation, logo...',
    commune_label: normalizeMaybeText(source.commune_label) || 'Commune',
    commune_placeholder: normalizeMaybeText(source.commune_placeholder) || 'Nouméa, Dumbéa...',
    requester_phone_label: normalizeMaybeText(source.requester_phone_label) || 'Téléphone',
    requester_phone_placeholder: normalizeMaybeText(source.requester_phone_placeholder) || 'XX XX XX XX',
    budget_label: normalizeMaybeText(source.budget_label) || 'Budget estimé',
    budget_placeholder: normalizeMaybeText(source.budget_placeholder) || '25000',
    desired_date_label: normalizeMaybeText(source.desired_date_label) || 'Date souhaitée',
    desired_date_placeholder: normalizeMaybeText(source.desired_date_placeholder) || '',
    details_label: normalizeMaybeText(source.details_label) || 'Précisions',
    details_placeholder: normalizeMaybeText(source.details_placeholder) || "Expliquez votre besoin, les contraintes, le niveau d'urgence...",
    show_phone: typeof source.show_phone === 'boolean' ? source.show_phone : true,
    show_budget: typeof source.show_budget === 'boolean' ? source.show_budget : true,
    show_date: typeof source.show_date === 'boolean' ? source.show_date : true,
    show_details: typeof source.show_details === 'boolean' ? source.show_details : true,
    budget_presets: budgetPresets.length > 0 ? budgetPresets : [15000, 30000, 50000],
  };
}

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

function formatCompanyName(row) {
  return row.pro_company_name || [row.prenom, row.nom].filter(Boolean).join(' ').trim() || 'Professionnel Troca';
}

async function refreshProStats() {
  await query('REFRESH MATERIALIZED VIEW pro_listing_stats').catch(() => {});
}

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatBudgetXpf(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Budget non précisé';
  return `${amount.toLocaleString('fr-FR')} XPF`;
}

function buildSimplePdfBuffer(lines) {
  const safeLines = Array.isArray(lines) ? lines.slice(0, 30) : [];
  const contentLines = [
    'BT',
    '/F1 12 Tf',
    '72 770 Td',
  ];

  safeLines.forEach((line, index) => {
    const escaped = escapePdfText(line);
    if (index === 0) {
      contentLines.push(`(${escaped}) Tj`);
    } else {
      contentLines.push('T*');
      contentLines.push(`(${escaped}) Tj`);
    }
  });
  contentLines.push('ET');

  const contentStream = contentLines.join('\n');
  const objects = [];

  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(`<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function mapProListingRow(row) {
  const listing = mapListingSearchRow(row);
  return {
    ...listing,
    total_views: Number(row.total_views ?? 0),
    views_7d: Number(row.views_7d ?? 0),
    views_30d: Number(row.views_30d ?? 0),
    total_contacts: Number(row.total_contacts ?? 0),
    contacts_7d: Number(row.contacts_7d ?? 0),
    conversion_rate: Number(row.conversion_rate ?? 0),
    is_boosted: Boolean(row.is_boosted),
    boost_expires_at: row.boost_expires_at ?? null,
  };
}

function mapProsRow(row) {
  return {
    id: Number(row.id),
    prenom: row.prenom ?? null,
    nom: row.nom ?? null,
    pro_company_name: row.pro_company_name ?? null,
    pro_category: row.pro_category ?? null,
    pro_logo_url: row.pro_logo_url ?? null,
    pro_banner_url: row.pro_banner_url ?? null,
    pro_description: row.pro_description ?? null,
    pro_commune: row.pro_commune ?? null,
    pro_website: row.pro_website ?? null,
    pro_phone: row.pro_phone ?? null,
    pro_hours: row.pro_hours ?? null,
    pro_siret: row.pro_siret ?? null,
    pro_quote_template: normalizeQuoteTemplate(row.pro_quote_template),
    avg_rating: Number(row.avg_rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    listing_count: Number(row.listing_count ?? 0),
    latest_review_comment: row.latest_review_comment ?? null,
    latest_review_rating: row.latest_review_rating == null ? null : Number(row.latest_review_rating),
    latest_review_prenom: row.latest_review_prenom ?? null,
    latest_review_created_at: row.latest_review_created_at ?? null,
    display_name: formatCompanyName(row),
    is_pro: true,
    pro_verified: true,
  };
}

async function loadProProfile(proId) {
  const profileRes = await query(
    `SELECT
       u.id,
       u.prenom,
       u.nom,
       u.pro_company_name,
       u.pro_category,
       u.pro_logo_url,
       u.pro_banner_url,
       u.pro_description,
       u.pro_commune,
       u.pro_website,
       u.pro_phone,
       u.pro_hours,
       u.pro_siret,
       u.pro_quote_template,
       COALESCE(ROUND((
         SELECT AVG(r.rating)::numeric
         FROM verified_reviews r
         WHERE r.pro_id = u.id
           AND r.status = 'published'
       ), 1), 0) AS avg_rating,
       COALESCE((
         SELECT COUNT(*)::int
         FROM verified_reviews r
         WHERE r.pro_id = u.id
           AND r.status = 'published'
       ), 0) AS review_count,
       COALESCE((
         SELECT COUNT(*)::int
         FROM annonces a
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
       ), 0) AS listing_count
       ,
       (
         SELECT pr.comment
         FROM verified_reviews pr
         WHERE pr.pro_id = u.id
           AND pr.status = 'published'
         ORDER BY pr.created_at DESC
         LIMIT 1
       ) AS latest_review_comment,
       (
         SELECT pr.rating
         FROM verified_reviews pr
         WHERE pr.pro_id = u.id
           AND pr.status = 'published'
         ORDER BY pr.created_at DESC
         LIMIT 1
       ) AS latest_review_rating,
       (
         SELECT pr.reviewer_prenom
         FROM verified_reviews pr
         WHERE pr.pro_id = u.id
           AND pr.status = 'published'
         ORDER BY pr.created_at DESC
         LIMIT 1
       ) AS latest_review_prenom,
       (
         SELECT pr.created_at
         FROM verified_reviews pr
         WHERE pr.pro_id = u.id
           AND pr.status = 'published'
         ORDER BY pr.created_at DESC
         LIMIT 1
       ) AS latest_review_created_at
     FROM users u
     WHERE u.id = $1
       AND u.is_pro = TRUE
       AND COALESCE(u.pro_verified, FALSE) = TRUE
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
       AND u.deleted_at IS NULL`,
    [proId]
  );

  const profile = profileRes.rows[0];
  if (!profile) return null;

  const [reviewsRes, listingsRes] = await Promise.all([
    query(
     `SELECT
         pr.id,
         pr.pro_id,
         pr.reviewer_id,
         pr.rating,
         pr.title,
         pr.comment,
         pr.verified_purchase,
         pr.created_at,
         pr.reply_content,
         pr.reply_at,
         rev2.prenom AS reply_author_name,
         rev.prenom AS reviewer_prenom,
         rev.nom AS reviewer_nom,
         rev.avatar_url AS reviewer_avatar_url
       FROM verified_reviews pr
       LEFT JOIN users rev ON rev.id = pr.reviewer_id
       LEFT JOIN users rev2 ON rev2.id = pr.reply_by
       WHERE pr.pro_id = $1
         AND pr.status = 'published'
       ORDER BY pr.created_at DESC
       LIMIT 3`,
      [proId]
    ),
    query(
      `SELECT
         a.id,
         a.titre AS titre,
         a.titre AS title,
         a.prix AS prix,
         a.prix AS price,
         a.condition,
         a.is_negotiable AS price_negotiable,
         (a.prix IS NULL) AS is_free,
         a.contre_quoi,
         a.metadata,
         a.created_at AS published_at,
         a.created_at AS created_at_sort,
         a.boost_expires_at AS boost_expires_at,
         a.nb_vues,
         a.boost_expires_at AS boosted_until,
         a.commune_id,
         cat.id AS category_id,
         cat.name AS category_name,
         cat.slug AS category_slug,
         cat.icon AS category_icon,
         com.name AS commune_name,
         u.id AS seller_id,
         u.prenom AS seller_prenom,
         u.nom AS seller_nom,
         u.avatar_url AS seller_avatar,
         CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
         u.pro_verified AS seller_pro_verified,
         u.email_verified AS seller_email_verified,
         u.phone_verified AS seller_phone_verified,
         u.trust_score AS seller_trust_score,
         u.trust_level AS seller_trust_level,
         u.note_moyenne AS seller_note_moyenne,
         u.nb_avis AS seller_nb_avis,
         u.note_moyenne AS user_rating,
         (SELECT thumbnail_url FROM annonce_images
          WHERE annonce_id = a.id AND is_cover = TRUE
          LIMIT 1) AS cover_image_thumbnail,
         (SELECT id FROM annonce_images
          WHERE annonce_id = a.id AND is_cover = TRUE
          LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com ON com.id = a.commune_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
         AND a.status = 'active'
         AND a.deleted_at IS NULL
       ORDER BY a.is_boosted DESC, a.created_at DESC
       LIMIT 12`,
      [proId]
    ),
  ]);

  return {
    ...mapProsRow(profile),
    reviews: reviewsRes.rows.map((row) => ({
      id: Number(row.id),
      pro_id: Number(row.pro_id),
      reviewer_id: Number(row.reviewer_id),
      rating: Number(row.rating),
      comment: row.comment ?? null,
      verified_purchase: Boolean(row.verified_purchase),
      created_at: row.created_at,
      reviewer_prenom: row.reviewer_prenom ?? null,
      reviewer_nom: row.reviewer_nom ?? null,
      reviewer_avatar_url: row.reviewer_avatar_url ?? null,
    })),
    listings: listingsRes.rows.map((row) => ({
      ...mapListingSearchRow(row),
      author: {
        id: Number(row.seller_id),
        prenom: row.seller_prenom ?? null,
        nom: row.seller_nom ?? null,
        avatar_url: row.seller_avatar ?? null,
        is_pro: Boolean(row.is_pro),
        pro_verified: Boolean(row.seller_pro_verified),
      },
    })),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
         u.id,
         u.prenom,
         u.nom,
         u.pro_company_name,
         u.pro_category,
         u.pro_logo_url,
         u.pro_banner_url,
         u.pro_description,
         u.pro_commune,
         u.pro_website,
         u.pro_phone,
         u.pro_hours,
         u.pro_siret,
         u.pro_quote_template,
         COALESCE(ROUND((
           SELECT AVG(r.rating)::numeric
           FROM pro_reviews r
           WHERE r.pro_id = u.id
         ), 1), 0) AS avg_rating,
         COALESCE((
           SELECT COUNT(*)::int
           FROM verified_reviews r
           WHERE r.pro_id = u.id
             AND r.status = 'published'
         ), 0) AS review_count,
         COALESCE((
           SELECT COUNT(*)::int
           FROM annonces a
            WHERE a.user_id = u.id
             AND a.status = 'active'
             AND a.deleted_at IS NULL
         ), 0) AS listing_count
         ,
         (
           SELECT pr.comment
           FROM verified_reviews pr
           WHERE pr.pro_id = u.id
             AND pr.status = 'published'
           ORDER BY pr.created_at DESC
           LIMIT 1
         ) AS latest_review_comment,
         (
           SELECT pr.rating
           FROM verified_reviews pr
           WHERE pr.pro_id = u.id
             AND pr.status = 'published'
           ORDER BY pr.created_at DESC
           LIMIT 1
         ) AS latest_review_rating,
         (
           SELECT pr.reviewer_prenom
           FROM verified_reviews pr
           WHERE pr.pro_id = u.id
             AND pr.status = 'published'
           ORDER BY pr.created_at DESC
           LIMIT 1
         ) AS latest_review_prenom,
         (
           SELECT pr.created_at
           FROM verified_reviews pr
           WHERE pr.pro_id = u.id
             AND pr.status = 'published'
           ORDER BY pr.created_at DESC
           LIMIT 1
         ) AS latest_review_created_at
       FROM users u
       WHERE u.is_pro = TRUE
         AND COALESCE(u.pro_verified, FALSE) = TRUE
         AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
         AND u.deleted_at IS NULL
       ORDER BY avg_rating DESC, listing_count DESC, COALESCE(u.pro_company_name, u.prenom, u.nom) ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({ data: result.rows.map(mapProsRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/quote', async (req, res, next) => {
  try {
    const proId = Number(req.params.id);
    if (!Number.isFinite(proId) || proId <= 0) {
      return res.status(400).json({ error: 'Professionnel invalide.' });
    }

    const { error, value } = quoteSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const proRes = await query(
      `SELECT id, prenom, nom, email, pro_company_name, pro_verified, is_pro, pro_expires_at
       FROM users
       WHERE id = $1
         AND is_pro = TRUE
         AND COALESCE(pro_verified, FALSE) = TRUE
         AND (pro_expires_at IS NULL OR pro_expires_at > NOW())
         AND deleted_at IS NULL
       LIMIT 1`,
      [proId]
    );
    const pro = proRes.rows[0];
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    const requesterUser = req.user ? {
      id: req.user.id,
      prenom: req.user.prenom || null,
      nom: req.user.nom || null,
      email: req.user.email || null,
    } : null;

    const requesterName = requesterUser?.prenom || requesterUser?.nom
      ? [requesterUser.prenom, requesterUser.nom].filter(Boolean).join(' ').trim()
      : value.requester_name.trim();
    const requesterEmail = requesterUser?.email || value.requester_email.trim();
    const requesterPhone = value.requester_phone ? String(value.requester_phone).trim() : null;
    const needType = value.need_type.trim();
    const commune = value.commune.trim();
    const budgetXpf = value.budget_xpf == null ? null : Number(value.budget_xpf);
    const desiredDate = value.desired_date ? String(value.desired_date).trim() : null;
    const details = value.details ? String(value.details).trim() : null;

    const saved = await query(
      `INSERT INTO pro_quote_requests
         (pro_id, requester_user_id, requester_name, requester_email, requester_phone, need_type, commune, budget_xpf, desired_date, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, created_at`,
      [
        proId,
        requesterUser?.id ?? null,
        requesterName,
        requesterEmail,
        requesterPhone,
        needType,
        commune,
        budgetXpf,
        desiredDate,
        details,
      ]
    );

    const proLabel = pro.pro_company_name || [pro.prenom, pro.nom].filter(Boolean).join(' ').trim() || 'Professionnel Troca';
    const budgetLabel = formatBudgetXpf(budgetXpf);
    const subject = `Nouvelle demande de devis pour ${needType}`;
    const dashboardLink = `${process.env.BASE_URL || 'https://troca.nc'}/pro/dashboard`;
    const intro = `${requesterName} vous a envoyé une demande de devis pour ${needType}.`;
    const meta = `
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Détails de la demande</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Besoin :</strong> ${needType}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Commune :</strong> ${commune}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Budget :</strong> ${budgetLabel}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Date souhaitée :</strong> ${desiredDate || 'Non précisée'}</p>
        <p style="margin:0;font-size:15px;"><strong>Contact :</strong> ${requesterName} · ${requesterEmail}${requesterPhone ? ` · ${requesterPhone}` : ''}</p>
      </div>
      ${details ? `<p style="white-space:pre-line;">${details.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
    `;

    await Promise.all([
      sendMail({
        to: pro.email,
        subject,
        html: `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-weight:700;font-size:20px;">Troca</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour ${proLabel},</p>
      <p>${intro}</p>
      ${meta}
      <p>Vous pouvez répondre rapidement pour transformer cette demande en opportunité.</p>
      <p><a href="${dashboardLink}" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Voir mon dashboard</a></p>
    </div>
  </div>
</body></html>`,
      }).catch(() => {}),
      createNotification(proId, {
        type: 'quote_request',
        title: `📩 Nouvelle demande de devis`,
        body: `${requesterName} · ${needType} · ${commune}`,
        href: `/pro/dashboard`,
      }),
      sendPushToUser(proId, {
        title: '📩 Nouvelle demande de devis',
        body: `${requesterName} · ${needType} · ${commune}`,
        data: { type: 'quote_request', proId },
      }),
    ]);

    return res.status(201).json({
      data: {
        id: Number(saved.rows[0].id),
        created_at: saved.rows[0].created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { error, value } = profileUpdateSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const fields = [];
    const params = [];
    let p = 1;
    const mapping = {
      company_name: 'pro_company_name',
      category: 'pro_category',
      description: 'pro_description',
      website: 'pro_website',
      phone: 'pro_phone',
      hours: 'pro_hours',
      commune: 'pro_commune',
      siret: 'pro_siret',
      logo_url: 'pro_logo_url',
      banner_url: 'pro_banner_url',
      quote_template: 'pro_quote_template',
    };

    for (const [key, column] of Object.entries(mapping)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        fields.push(`${column} = $${p}`);
        params.push(key === 'quote_template' ? JSON.stringify(normalizeQuoteTemplate(value[key])) : normalizeMaybeText(value[key]));
        p += 1;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier.' });
    }

    fields.push(`is_pro = TRUE`);
    fields.push(`updated_at = NOW()`);

    params.push(req.user.id);
    await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${p} RETURNING id`,
      params
    );

    const updated = await query(
      `SELECT
         u.id,
         u.prenom,
         u.nom,
         u.pro_company_name,
         u.pro_category,
         u.pro_logo_url,
         u.pro_banner_url,
         u.pro_description,
         u.pro_commune,
         u.pro_website,
         u.pro_phone,
         u.pro_hours,
         u.pro_siret,
         u.pro_quote_template,
         COALESCE(ROUND((SELECT AVG(r.rating)::numeric FROM pro_reviews r WHERE r.pro_id = u.id), 1), 0) AS avg_rating,
         COALESCE((SELECT COUNT(*)::int FROM pro_reviews r WHERE r.pro_id = u.id), 0) AS review_count,
         COALESCE((SELECT COUNT(*)::int FROM annonces a WHERE a.user_id = u.id AND a.status = 'active' AND a.deleted_at IS NULL), 0) AS listing_count
       FROM users u
       WHERE u.id = $1
       LIMIT 1`,
      [req.user.id]
    );

    return res.json({ data: mapProsRow(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    await refreshProStats();

    const [summaryRes, topRes, contactsRes, boostsRes, spendRes, viewsRes, contactsTimelineRes, unreadSummaryRes, unreadThreadsRes] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'active')::int AS active,
           COUNT(*) FILTER (WHERE status IN ('inactive', 'sold'))::int AS expired,
           COUNT(*) FILTER (
             WHERE EXISTS(
               SELECT 1 FROM listing_boosts b
               WHERE b.listing_id = a.id
                 AND b.status = 'active'
                 AND b.expires_at > NOW()
             )
           )::int AS boosted,
           COALESCE(SUM(pls.total_views), 0)::int AS views_total,
           COALESCE(SUM(pls.views_7d), 0)::int AS views_7d,
           COALESCE(SUM(pls.views_30d), 0)::int AS views_30d,
           COALESCE(SUM(pls.total_contacts), 0)::int AS contacts_total,
           COALESCE(SUM(pls.contacts_7d), 0)::int AS contacts_7d,
           COALESCE(ROUND(AVG(COALESCE(pls.conversion_rate, 0))::numeric, 1), 0) AS avg_conversion_rate
         FROM annonces a
         LEFT JOIN pro_listing_stats pls ON pls.listing_id = a.id
         WHERE a.user_id = $1 AND a.deleted_at IS NULL`,
        [req.user.id]
      ),
      query(
        `SELECT
           COUNT(m.id)::int AS unread_messages_total,
           COUNT(DISTINCT c.buyer_id)::int AS unread_clients_total,
           COUNT(DISTINCT c.id)::int AS unread_conversations_total
         FROM messages m
         JOIN conversations c ON c.id = m.conv_id
         JOIN annonces a ON a.id = c.annonce_id
         WHERE a.user_id = $1
           AND m.sender_id != $1
           AND m.read_at IS NULL`,
        [req.user.id]
      ),
      query(
        `SELECT
           c.id AS conversation_id,
           c.buyer_id,
           buyer.prenom AS buyer_prenom,
           buyer.nom AS buyer_nom,
           buyer.avatar_url AS buyer_avatar_url,
           a.id AS listing_id,
           a.titre AS listing_title,
           COUNT(m.id)::int AS unread_count,
           MAX(m.created_at) AS last_unread_at,
           (
             SELECT m2.content
             FROM messages m2
             WHERE m2.conv_id = c.id
               AND m2.sender_id != $1
               AND m2.read_at IS NULL
             ORDER BY m2.created_at DESC, m2.id DESC
             LIMIT 1
           ) AS last_unread_message
         FROM conversations c
         JOIN annonces a ON a.id = c.annonce_id
         JOIN users buyer ON buyer.id = c.buyer_id
         JOIN messages m ON m.conv_id = c.id
         WHERE a.user_id = $1
           AND m.sender_id != $1
           AND m.read_at IS NULL
         GROUP BY c.id, c.buyer_id, buyer.prenom, buyer.nom, buyer.avatar_url, a.id, a.titre
         ORDER BY MAX(m.created_at) DESC
         LIMIT 5`,
        [req.user.id]
      ),
      query(
        `SELECT
           a.id,
           a.titre AS titre,
           a.titre AS title,
           a.prix AS prix,
           a.prix AS price,
           a.condition,
           a.is_negotiable AS price_negotiable,
           (a.prix IS NULL) AS is_free,
           a.contre_quoi,
           a.metadata,
           a.created_at AS published_at,
           a.created_at AS created_at_sort,
           a.boost_expires_at AS boost_expires_at,
           a.boost_expires_at AS boosted_until,
           a.nb_vues,
           a.commune_id,
           cat.id AS category_id,
           cat.name AS category_name,
           cat.slug AS category_slug,
           cat.icon AS category_icon,
           com.name AS commune_name,
           u.id AS seller_id,
           u.prenom AS seller_prenom,
           u.nom AS seller_nom,
           u.avatar_url AS seller_avatar,
           TRUE AS is_pro,
           u.pro_verified AS seller_pro_verified,
           u.email_verified AS seller_email_verified,
           u.phone_verified AS seller_phone_verified,
           u.trust_score AS seller_trust_score,
           u.trust_level AS seller_trust_level,
           u.note_moyenne AS seller_note_moyenne,
           u.nb_avis AS seller_nb_avis,
           u.note_moyenne AS user_rating,
           pls.total_views,
           pls.views_7d,
           pls.views_30d,
           pls.total_contacts,
           pls.contacts_7d,
           pls.conversion_rate,
           pls.is_boosted,
           pls.boost_expires_at,
           (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_thumbnail,
           (SELECT id FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_id
         FROM annonces a
         LEFT JOIN categories cat ON cat.id = a.category_id
         LEFT JOIN communes com ON com.id = a.commune_id
         LEFT JOIN users u ON u.id = a.user_id
         LEFT JOIN pro_listing_stats pls ON pls.listing_id = a.id
         WHERE a.user_id = $1 AND a.deleted_at IS NULL
         ORDER BY pls.total_views DESC NULLS LAST, a.created_at DESC
         LIMIT 3`,
        [req.user.id]
      ),
      query(
        `SELECT
           lc.id,
           lc.contacted_at,
           lc.contact_type,
           a.id AS listing_id,
           a.titre AS listing_title,
           a.prix AS listing_price,
           cat.name AS category_name
         FROM listing_contacts lc
         JOIN annonces a ON a.id = lc.listing_id
         LEFT JOIN categories cat ON cat.id = a.category_id
         WHERE a.user_id = $1
         ORDER BY lc.contacted_at DESC
         LIMIT 5`,
        [req.user.id]
      ),
      query(
        `SELECT
           lb.id,
           lb.listing_id,
           lb.started_at,
           lb.expires_at,
           lb.duration_days,
           lb.price_xpf,
           lb.status,
           lb.invoice_number,
           a.titre AS listing_title,
           a.prix AS listing_price,
           (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image
         FROM listing_boosts lb
         JOIN annonces a ON a.id = lb.listing_id
         WHERE lb.author_id = $1
         ORDER BY lb.status = 'active' DESC, lb.expires_at DESC
         LIMIT 12`,
        [req.user.id]
      ),
      query(
        `SELECT
           COALESCE(SUM(price_xpf), 0)::int AS spend_total_xpf,
           COALESCE(SUM(price_xpf) FILTER (WHERE started_at >= NOW() - INTERVAL '30 days'), 0)::int AS spend_30d_xpf
         FROM listing_boosts
         WHERE author_id = $1 AND status <> 'cancelled'`,
        [req.user.id]
      ),
      query(
        `SELECT to_char(date_trunc('day', viewed_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS value
         FROM listing_stats ls
         JOIN annonces a ON a.id = ls.listing_id
         WHERE a.user_id = $1
           AND ls.viewed_at >= NOW() - INTERVAL '30 days'
         GROUP BY 1
         ORDER BY 1`,
        [req.user.id]
      ),
      query(
        `SELECT to_char(date_trunc('day', contacted_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS value
         FROM listing_contacts lc
         JOIN annonces a ON a.id = lc.listing_id
         WHERE a.user_id = $1
           AND lc.contacted_at >= NOW() - INTERVAL '30 days'
         GROUP BY 1
         ORDER BY 1`,
        [req.user.id]
      ),
    ]);

    const summary = summaryRes.rows[0] || {};
    const topListings = topRes.rows.map(mapProListingRow);
    const recentContacts = contactsRes.rows.map((row) => ({
      id: Number(row.id),
      contacted_at: row.contacted_at,
      contact_type: row.contact_type ?? null,
      listing_id: Number(row.listing_id),
      listing_title: row.listing_title,
      listing_price: row.listing_price,
      category_name: row.category_name ?? null,
    }));
    const boostsActive = boostsRes.rows.map((row) => ({
      id: Number(row.id),
      listing_id: Number(row.listing_id),
      started_at: row.started_at,
      expires_at: row.expires_at,
      duration_days: Number(row.duration_days ?? 0),
      price_xpf: Number(row.price_xpf ?? 0),
      status: row.status,
      invoice_number: row.invoice_number ?? null,
      listing_title: row.listing_title,
      listing_price: row.listing_price,
      cover_image: row.cover_image ?? null,
    }));
    const unreadSummary = unreadSummaryRes.rows[0] || {};
    const unreadThreads = unreadThreadsRes.rows.map((row) => ({
      conversation_id: Number(row.conversation_id),
      buyer_id: Number(row.buyer_id),
      buyer_prenom: row.buyer_prenom ?? null,
      buyer_nom: row.buyer_nom ?? null,
      buyer_avatar_url: row.buyer_avatar_url ?? null,
      listing_id: Number(row.listing_id),
      listing_title: row.listing_title ?? null,
      unread_count: Number(row.unread_count ?? 0),
      last_unread_at: row.last_unread_at ?? null,
      last_unread_message: row.last_unread_message ?? null,
    }));

    const today = new Date();
    const timeline = [];
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const viewRow = viewsRes.rows.find((row) => row.day === key);
      const contactRow = contactsTimelineRes.rows.find((row) => row.day === key);
      timeline.push({
        day: key,
        label: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date),
        views: Number(viewRow?.value ?? 0),
        contacts: Number(contactRow?.value ?? 0),
      });
    }

    return res.json({
      data: {
        listings: {
          total: Number(summary.total ?? 0),
          active: Number(summary.active ?? 0),
          boosted: Number(summary.boosted ?? 0),
          expired: Number(summary.expired ?? 0),
        },
        stats: {
          views_total: Number(summary.views_total ?? 0),
          views_7d: Number(summary.views_7d ?? 0),
          views_30d: Number(summary.views_30d ?? 0),
          contacts_total: Number(summary.contacts_total ?? 0),
          contacts_7d: Number(summary.contacts_7d ?? 0),
          avg_conversion_rate: Number(summary.avg_conversion_rate ?? 0),
        },
        top_listings: topListings,
        recent_contacts: recentContacts,
        boosts_active: boostsActive.filter((boost) => boost.status === 'active' && new Date(boost.expires_at) > new Date()),
        spend_total_xpf: Number(spendRes.rows[0]?.spend_total_xpf ?? 0),
        spend_30d_xpf: Number(spendRes.rows[0]?.spend_30d_xpf ?? 0),
        timeline_30d: timeline,
        unread_messages_total: Number(unreadSummary.unread_messages_total ?? 0),
        unread_clients_total: Number(unreadSummary.unread_clients_total ?? 0),
        unread_conversations_total: Number(unreadSummary.unread_conversations_total ?? 0),
        unread_threads: unreadThreads,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/listings', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    await refreshProStats();

    const result = await query(
      `SELECT
         a.id,
         a.titre AS titre,
         a.titre AS title,
         a.prix AS prix,
         a.prix AS price,
         a.condition,
         a.is_negotiable AS price_negotiable,
         (a.prix IS NULL) AS is_free,
         a.contre_quoi,
         a.metadata,
         a.created_at AS published_at,
         a.created_at AS created_at_sort,
         a.boost_expires_at AS boost_expires_at,
         a.boost_expires_at AS boosted_until,
         a.nb_vues,
         a.commune_id,
         cat.id AS category_id,
         cat.name AS category_name,
         cat.slug AS category_slug,
         cat.icon AS category_icon,
         com.name AS commune_name,
         u.id AS seller_id,
         u.prenom AS seller_prenom,
         u.nom AS seller_nom,
         u.avatar_url AS seller_avatar,
         TRUE AS is_pro,
         u.pro_verified AS seller_pro_verified,
         u.email_verified AS seller_email_verified,
         u.phone_verified AS seller_phone_verified,
         u.trust_score AS seller_trust_score,
         u.trust_level AS seller_trust_level,
         u.note_moyenne AS seller_note_moyenne,
         u.nb_avis AS seller_nb_avis,
         u.note_moyenne AS user_rating,
         pls.total_views,
         pls.views_7d,
         pls.views_30d,
         pls.total_contacts,
         pls.contacts_7d,
         pls.conversion_rate,
         pls.is_boosted,
         pls.boost_expires_at,
         (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_thumbnail,
         (SELECT id FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com ON com.id = a.commune_id
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN pro_listing_stats pls ON pls.listing_id = a.id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map(mapProListingRow),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/listings/:id/renew', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }

    const result = await query(
      `UPDATE annonces
       SET status = 'active',
           renewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, status, renewed_at`,
      [listingId, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/boosts', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const result = await query(
      `SELECT
         lb.id,
         lb.listing_id,
         lb.author_id,
         lb.started_at,
         lb.expires_at,
         lb.duration_days,
         lb.price_xpf,
         lb.status,
         lb.stripe_payment_id,
         lb.invoice_number,
         lb.created_at,
         a.titre AS listing_title,
         a.prix AS listing_price,
         (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image
       FROM listing_boosts lb
       JOIN annonces a ON a.id = lb.listing_id
       WHERE lb.author_id = $1
       ORDER BY lb.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map((row) => ({
        id: Number(row.id),
        listing_id: Number(row.listing_id),
        author_id: Number(row.author_id),
        started_at: row.started_at,
        expires_at: row.expires_at,
        duration_days: Number(row.duration_days ?? 0),
        price_xpf: Number(row.price_xpf ?? 0),
        status: row.status,
        stripe_payment_id: row.stripe_payment_id ?? null,
        invoice_number: row.invoice_number ?? null,
        created_at: row.created_at,
        listing_title: row.listing_title,
        listing_price: row.listing_price,
        cover_image: row.cover_image ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const result = await query(
      `SELECT id, user_id, invoice_number, amount_xpf, description, status, stripe_payment_id, created_at, paid_at
       FROM invoices
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map((row) => ({
        id: Number(row.id),
        user_id: Number(row.user_id),
        invoice_number: row.invoice_number,
        amount_xpf: Number(row.amount_xpf ?? 0),
        description: row.description ?? null,
        status: row.status,
        stripe_payment_id: row.stripe_payment_id ?? null,
        created_at: row.created_at,
        paid_at: row.paid_at ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id/pdf', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const invoiceId = Number(req.params.id);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return res.status(400).json({ error: 'Facture invalide.' });
    }

    const result = await query(
      `SELECT
         i.id,
         i.invoice_number,
         i.amount_xpf,
         i.description,
         i.status,
         i.created_at,
         i.paid_at,
         u.prenom,
         u.nom,
         u.pro_company_name,
         u.pro_siret
       FROM invoices i
       JOIN users u ON u.id = i.user_id
       WHERE i.id = $1 AND i.user_id = $2
       LIMIT 1`,
      [invoiceId, req.user.id]
    );

    const invoice = result.rows[0];
    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }

    const lines = [
      'TROCA NC',
      `FACTURE N° ${invoice.invoice_number}`,
      `Date: ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(invoice.created_at))}`,
      `Nom pro: ${invoice.pro_company_name || [invoice.prenom, invoice.nom].filter(Boolean).join(' ').trim() || 'Professionnel Troca'}`,
      `RIDET: ${invoice.pro_siret || 'Non renseigné'}`,
      '',
      'Description | Montant XPF',
      `${invoice.description || 'Prestation'} | ${Number(invoice.amount_xpf ?? 0).toLocaleString('fr-FR')} XPF`,
      '',
      `Total TTC: ${Number(invoice.amount_xpf ?? 0).toLocaleString('fr-FR')} XPF`,
      '',
      'Mentions légales Troca NC',
    ];

    const pdfBuffer = buildSimplePdfBuffer(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pro = await loadProProfile(req.params.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    return res.json({ data: pro });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const proId = Number(req.params.id);

    const reviewsRes = await query(
      `SELECT
         pr.id,
         pr.pro_id,
         pr.reviewer_id,
         pr.rating,
         pr.title,
         pr.comment,
         pr.verified_purchase,
         pr.created_at,
         pr.reply_content,
         pr.reply_at,
         rev2.prenom AS reply_author_name,
         rev.prenom AS reviewer_prenom,
         rev.nom AS reviewer_nom,
         rev.avatar_url AS reviewer_avatar_url
      FROM verified_reviews pr
      LEFT JOIN users rev ON rev.id = pr.reviewer_id
      LEFT JOIN users rev2 ON rev2.id = pr.reply_by
      WHERE pr.pro_id = $1
        AND pr.status = 'published'
      ORDER BY pr.created_at DESC
      LIMIT $2 OFFSET $3`,
      [proId, limit, offset]
    );

    const countRes = await query(
      "SELECT COUNT(*)::int AS total FROM verified_reviews WHERE pro_id = $1 AND status = 'published'",
      [proId]
    );

    return res.json({
      data: reviewsRes.rows.map((row) => ({
        id: Number(row.id),
        pro_id: Number(row.pro_id),
        reviewer_id: Number(row.reviewer_id),
        rating: Number(row.rating),
        title: row.title ?? null,
        comment: row.comment ?? null,
        verified_purchase: Boolean(row.verified_purchase),
        created_at: row.created_at,
        reviewer_prenom: row.reviewer_prenom ?? null,
        reviewer_nom: row.reviewer_nom ?? null,
        reviewer_avatar_url: row.reviewer_avatar_url ?? null,
        reply_content: row.reply_content ?? null,
        reply_at: row.reply_at ?? null,
        reply_author_name: row.reply_author_name ?? null,
      })),
      pagination: {
        total: Number(countRes.rows[0]?.total ?? 0),
        page,
        limit,
        pages: Math.max(1, Math.ceil(Number(countRes.rows[0]?.total ?? 0) / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const { error, value } = applySchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updates = {
      is_pro: true,
      pro_verified: false,
      pro_verified_at: null,
      pro_company_name: normalizeMaybeText(value.company_name),
      pro_category: normalizeMaybeText(value.category),
      pro_description: normalizeMaybeText(value.description),
      pro_logo_url: null,
      pro_banner_url: null,
      pro_website: normalizeMaybeText(value.website),
      pro_phone: normalizeMaybeText(value.phone),
      pro_hours: normalizeMaybeText(value.hours),
      pro_commune: normalizeMaybeText(value.commune),
      pro_siret: normalizeMaybeText(value.siret),
    };

    const result = await query(
      `UPDATE users
       SET is_pro = $2,
           pro_verified = $3,
           pro_verified_at = $4,
           pro_company_name = $5,
           pro_category = $6,
           pro_description = $7,
           pro_logo_url = $8,
           pro_banner_url = $9,
           pro_website = $10,
           pro_phone = $11,
           pro_hours = $12,
           pro_commune = $13,
           pro_siret = $14,
           pro_since = COALESCE(pro_since, NOW()),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, prenom, nom, is_pro, pro_verified, pro_company_name, pro_category`,
      [
        req.user.id,
        updates.is_pro,
        updates.pro_verified,
        updates.pro_verified_at,
        updates.pro_company_name,
        updates.pro_category,
        updates.pro_description,
        updates.pro_logo_url,
        updates.pro_banner_url,
        updates.pro_website,
        updates.pro_phone,
        updates.pro_hours,
        updates.pro_commune,
        updates.pro_siret,
      ]
    );

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const payload = result.rows[0];
      await sendMail({
        to: adminEmail,
        subject: 'Nouvelle demande compte pro',
        html: `
          <p>Une nouvelle demande de compte pro a été envoyée sur Troca.</p>
          <ul>
            <li><strong>Utilisateur :</strong> ${payload.prenom} ${payload.nom} (${payload.email})</li>
            <li><strong>Entreprise :</strong> ${updates.pro_company_name || 'Non renseignée'}</li>
            <li><strong>Catégorie :</strong> ${updates.pro_category || 'Non renseignée'}</li>
            <li><strong>Commune :</strong> ${updates.pro_commune || 'Non renseignée'}</li>
            <li><strong>SIRET/RIDET :</strong> ${updates.pro_siret || 'Non renseigné'}</li>
          </ul>
          <p>Connexion requise pour la validation manuelle dans l'espace admin.</p>
        `,
      }).catch(() => {});
    }

    return res.status(201).json({
      data: {
        id: result.rows[0].id,
        is_pro: result.rows[0].is_pro,
        pro_verified: result.rows[0].pro_verified,
        pro_company_name: result.rows[0].pro_company_name,
        pro_category: result.rows[0].pro_category,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const proId = Number(req.params.id);
    if (!Number.isFinite(proId) || proId <= 0) {
      return res.status(400).json({ error: 'Professionnel invalide.' });
    }

    const { error, value } = reviewSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const proRes = await query(
      `SELECT id, prenom, nom
       FROM users
       WHERE id = $1
         AND is_pro = TRUE
         AND COALESCE(pro_verified, FALSE) = TRUE
       LIMIT 1`,
      [proId]
    );

    const pro = proRes.rows[0];
    if (!pro) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    const conversationRes = await query(
      `SELECT 1
       FROM conversations c
       WHERE (c.buyer_id = $1 AND c.seller_id = $2)
          OR (c.buyer_id = $2 AND c.seller_id = $1)
       LIMIT 1`,
      [req.user.id, proId]
    );

    if (!conversationRes.rows.length) {
      return res.status(403).json({ error: 'Vous devez avoir échangé avec ce professionnel avant de laisser un avis.' });
    }

    const created = await withTransaction(async (client) => {
      const reviewRes = await client.query(
        `INSERT INTO verified_reviews (pro_id, reviewer_id, reviewer_prenom, reviewer_avatar_url, rating, comment, verified_purchase, source)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'profile')
         RETURNING *`,
        [
          proId,
          req.user.id,
          req.user.prenom || null,
          req.user.avatar_url || null,
          value.rating,
          normalizeMaybeText(value.comment),
        ]
      );

      const statsRes = await client.query(
        `SELECT
           COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
           COUNT(*)::int AS review_count
         FROM verified_reviews
         WHERE pro_id = $1
           AND status = 'published'`,
        [proId]
      );

      await client.query(
        `UPDATE users
         SET note_moyenne = $2,
             nb_avis = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [proId, Number(statsRes.rows[0]?.avg_rating ?? 0), Number(statsRes.rows[0]?.review_count ?? 0)]
      );

      return reviewRes.rows[0];
    });

    return res.status(201).json({
      data: {
        id: created.id,
        pro_id: created.pro_id,
        reviewer_id: created.reviewer_id,
        rating: created.rating,
        comment: created.comment,
        verified_purchase: created.verified_purchase,
        created_at: created.created_at,
        pro_name: `${pro.prenom} ${pro.nom}`.trim(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/auto-reply', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const config = await getAutoReply(req.user.id);
    return res.json({ data: config });
  } catch (err) {
    next(err);
  }
});

router.put('/auto-reply', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const config = await saveAutoReply(req.user.id, req.body || {});
    return res.json({ data: config });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
