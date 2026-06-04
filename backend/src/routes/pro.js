'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
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
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('', null).optional(),
});

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
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

router.get('/', async (_req, res, next) => {
  try {
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
       LIMIT 12`
    );

    return res.json({ data: result.rows.map(mapProsRow) });
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
    };

    for (const [key, column] of Object.entries(mapping)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        fields.push(`${column} = $${p}`);
        params.push(normalizeMaybeText(value[key]));
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
