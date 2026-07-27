'use strict';

const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { createNotification } = require('./notificationService');
const { sendPushToUser } = require('./pushService');
const { sendMail } = require('./emailService');
const { sendSms } = require('./fretWorkflowService');
const { slugifyCategoryName } = require('../shared-copy/categoryTaxonomy');

const BASE_URL = (process.env.BASE_URL || 'https://kalico.nc').replace(/\/+$/, '');

const createQuoteRequestSchema = Joi.object({
  mode: Joi.string().valid('open', 'targeted').required(),
  category_slug: Joi.string().trim().min(2).max(120).required(),
  commune: Joi.string().trim().min(2).max(120).required(),
  title: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(2).max(5000).required(),
  budget_min_xpf: Joi.number().integer().min(0).allow(null).optional(),
  budget_max_xpf: Joi.number().integer().min(0).allow(null).optional(),
  desired_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null).optional(),
  contact_email: Joi.string().trim().email().max(255).required(),
  contact_phone: Joi.string().trim().max(30).allow('', null).optional(),
  target_pro_ids: Joi.array().items(Joi.number().integer().positive()).max(5)
    .when('mode', { is: 'targeted', then: Joi.required(), otherwise: Joi.forbidden() }),
});

const offerSchema = Joi.object({
  amount_xpf: Joi.number().integer().positive().required(),
  delay_days: Joi.number().integer().min(1).max(365).required(),
  message: Joi.string().trim().max(500).allow('', null).optional(),
});

function createHttpError(message, status = 400, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

function normalizeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

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

function formatDateLabel(value) {
  if (!value) return 'À préciser';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'À préciser';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function formatDisplayName(row) {
  return row.pro_company_name || [row.prenom, row.nom].filter(Boolean).join(' ').trim() || 'Professionnel Kalico';
}

function formatBudgetLabel(minXpf, maxXpf) {
  const min = Number(minXpf);
  const max = Number(maxXpf);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `${formatMoney(min)} - ${formatMoney(max)}`;
  }
  if (Number.isFinite(min) && min > 0) {
    return `À partir de ${formatMoney(min)}`;
  }
  if (Number.isFinite(max) && max > 0) {
    return `Jusqu’à ${formatMoney(max)}`;
  }
  return 'Non précisé';
}

function buildRequestNotificationBody(request, categoryLabel) {
  return `${request.commune} · ${categoryLabel} · Budget : ${formatBudgetLabel(request.budget_min_xpf, request.budget_max_xpf)} · Délai souhaité : ${formatDateLabel(request.desired_date)}`;
}

function buildRequestEmailHtml({ request, categoryLabel }) {
  const budgetLabel = formatBudgetLabel(request.budget_min_xpf, request.budget_max_xpf);
  const dateLabel = formatDateLabel(request.desired_date);
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-size:22px;font-weight:700">Kalico</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour,</p>
      <p>Une nouvelle demande d’appel d’offres est disponible sur Kalico.</p>
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Détails</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Titre :</strong> ${escapeHtml(request.title)}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Commune :</strong> ${escapeHtml(request.commune)}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Catégorie :</strong> ${escapeHtml(categoryLabel)}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Budget :</strong> ${escapeHtml(budgetLabel)}</p>
        <p style="margin:0;font-size:15px;"><strong>Délai souhaité :</strong> ${escapeHtml(dateLabel)}</p>
      </div>
      <p><a href="${BASE_URL}/pro/dashboard/appels-offres?id=${encodeURIComponent(String(request.id))}" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Voir le dashboard Pro</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildOfferEmailHtml({ request, offer, proLabel }) {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-size:22px;font-weight:700">Kalico</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour,</p>
      <p><strong>${escapeHtml(proLabel)}</strong> vous a envoyé une offre pour votre demande.</p>
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
        <p style="margin:0 0 6px;font-size:15px;"><strong>Titre :</strong> ${escapeHtml(request.title)}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Offre :</strong> ${escapeHtml(formatMoney(offer.amount_xpf))}</p>
        <p style="margin:0;font-size:15px;"><strong>Délai :</strong> ${escapeHtml(String(offer.delay_days))} jours</p>
      </div>
      <p><a href="${BASE_URL}/appels-offres/${encodeURIComponent(String(request.id))}" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Comparer les offres</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildSelectedProEmailHtml({ request, offer, authorContact, proLabel }) {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-size:22px;font-weight:700">Kalico</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour ${escapeHtml(proLabel)},</p>
      <p>Vous avez été sélectionné pour <strong>${escapeHtml(request.title)}</strong> à <strong>${escapeHtml(request.commune)}</strong>.</p>
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
        <p style="margin:0 0 6px;font-size:15px;"><strong>Prix convenu :</strong> ${escapeHtml(formatMoney(offer.amount_xpf))}</p>
        <p style="margin:0 0 6px;font-size:15px;"><strong>Délai :</strong> ${escapeHtml(String(offer.delay_days))} jours</p>
        <p style="margin:0;font-size:15px;"><strong>Contact :</strong> ${escapeHtml(authorContact)}</p>
      </div>
      <p><a href="${BASE_URL}/pro/dashboard/appels-offres" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Ouvrir le dashboard</a></p>
    </div>
  </div>
</body>
</html>`;
}

async function loadCategoryLabel(categorySlug) {
  const result = await query(
    'SELECT name, slug FROM categories WHERE slug = $1 LIMIT 1',
    [categorySlug]
  );
  return result.rows[0] || null;
}

async function loadActiveProsForCategory(categorySlug) {
  const result = await query(
    `SELECT
       u.id,
       u.email,
       u.telephone,
       u.pro_phone,
       u.pro_company_name,
       u.prenom,
       u.nom,
       u.pro_category,
       u.pro_commune,
       u.note_moyenne,
       u.nb_avis,
       u.expo_push_token,
       u.pro_expires_at
     FROM pro_profiles pp
     JOIN users u ON u.id = pp.id
     WHERE u.is_pro = TRUE
       AND u.deleted_at IS NULL
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())`,
    []
  );

  return result.rows.filter((row) => slugifyCategoryName(row.pro_category || '') === categorySlug);
}

async function loadTargetPros(targetIds) {
  if (!targetIds.length) return [];
  const result = await query(
    `SELECT
       u.id,
       u.email,
       u.telephone,
       u.pro_phone,
       u.pro_company_name,
       u.prenom,
       u.nom,
       u.pro_category,
       u.pro_commune,
       u.note_moyenne,
       u.nb_avis,
       u.expo_push_token,
       u.pro_expires_at,
       u.deleted_at,
       u.is_pro
     FROM pro_profiles pp
     JOIN users u ON u.id = pp.id
     WHERE pp.id = ANY($1::int[])
       AND u.is_pro = TRUE
       AND u.deleted_at IS NULL
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())`,
    [targetIds]
  );
  return result.rows;
}

function ensureActivePro(row, proId) {
  if (!row || !row.is_pro || row.deleted_at || (row.pro_expires_at && new Date(row.pro_expires_at).getTime() <= Date.now())) {
    throw createHttpError('Professionnel inactif ou introuvable.', 400);
  }
  if (proId != null && Number(row.id) !== Number(proId)) {
    throw createHttpError('Professionnel invalide.', 403);
  }
}

async function notifyProRequest(pro, request, categoryLabel) {
  const proLabel = formatDisplayName(pro);
  const body = buildRequestNotificationBody(request, categoryLabel);
  const href = `/pro/dashboard/appels-offres?id=${request.id}`;

  await Promise.allSettled([
    sendMail({
      to: pro.email,
      subject: `Nouvel appel d'offres : ${request.title}`,
      html: buildRequestEmailHtml({ request, categoryLabel }),
    }),
    createNotification(pro.id, {
      type: 'quote_request',
      title: `📝 Nouvel appel d'offres : ${request.title}`,
      body,
      href,
    }),
    sendPushToUser(pro.id, {
      title: `📝 Nouvel appel d'offres : ${request.title}`,
      body,
      data: { type: 'quote_request', requestId: request.id },
    }),
  ]);

  const phone = normalizeText(pro.telephone || pro.pro_phone);
  if (phone) {
    await sendSms({
      to: phone,
      body: `Kalico : nouvel appel d'offres "${request.title}" à ${request.commune}. Répondez sur kalico.nc/pro/dashboard`,
    }).catch(() => {});
  }
}

async function notifyRequesterOfferReceived(request, offer, pro) {
  const proLabel = formatDisplayName(pro);
  const body = `${proLabel} propose ${formatMoney(offer.amount_xpf)} · Délai ${offer.delay_days} jours`;
  const href = `/appels-offres/${request.id}`;
  const targetUserId = request.author_id ? Number(request.author_id) : null;

  if (targetUserId) {
    await Promise.allSettled([
      createNotification(targetUserId, {
        type: 'quote_request_offer',
        title: 'Nouvelle offre reçue pour votre demande',
        body,
        href,
      }),
      sendPushToUser(targetUserId, {
        title: 'Nouvelle offre reçue pour votre demande',
        body,
        data: { type: 'quote_request_offer', requestId: request.id, offerId: offer.id },
      }),
    ]);
  }

  await sendMail({
    to: request.contact_email,
    subject: 'Nouvelle offre reçue pour votre demande',
    html: buildOfferEmailHtml({ request, offer, proLabel }),
  }).catch(() => {});

  if (request.contact_phone) {
    await sendSms({
      to: request.contact_phone,
      body,
    }).catch(() => {});
  }
}

async function notifySelectionOutcome(request, selectedOffer, rejectedOffers) {
  const authorContact = [request.contact_email, request.contact_phone].filter(Boolean).join(' · ');
  const proLabel = formatDisplayName(selectedOffer);
  const requestHref = `/appels-offres/${request.id}`;

  await Promise.allSettled([
    createNotification(selectedOffer.pro_user_id, {
      type: 'quote_request_selected',
      title: `✅ Vous avez été sélectionné pour ${request.title}`,
      body: `${request.commune} · ${formatMoney(selectedOffer.amount_xpf)}`,
      href: '/pro/dashboard/appels-offres',
    }),
    sendPushToUser(selectedOffer.pro_user_id, {
      title: `✅ Vous avez été sélectionné pour ${request.title}`,
      body: `${request.commune} · ${formatMoney(selectedOffer.amount_xpf)}`,
      data: { type: 'quote_request_selected', requestId: request.id, offerId: selectedOffer.id },
    }),
    sendMail({
      to: selectedOffer.pro_email,
      subject: `Vous avez été sélectionné pour ${request.title}`,
      html: buildSelectedProEmailHtml({ request, offer: selectedOffer, authorContact, proLabel }),
    }),
  ]);

  const selectedPhone = normalizeText(selectedOffer.pro_telephone || selectedOffer.pro_public_phone);
  if (selectedPhone) {
    await sendSms({
      to: selectedPhone,
      body: `Kalico : vous avez été sélectionné pour ${request.title} à ${request.commune}. Contact : ${authorContact}`,
    }).catch(() => {});
  }

  const rejectedRecipients = Array.isArray(rejectedOffers) ? rejectedOffers : [];
  await Promise.allSettled(
    rejectedRecipients.map((offer) => Promise.allSettled([
      createNotification(offer.pro_user_id, {
        type: 'quote_request_rejected',
        title: `La demande "${request.title}" a été attribuée à un autre prestataire.`,
        body: request.commune,
        href: requestHref,
      }),
      sendMail({
        to: offer.pro_email,
        subject: `La demande ${request.title} a été attribuée à un autre prestataire`,
        html: `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-size:22px;font-weight:700">Kalico</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour ${escapeHtml(formatDisplayName(offer))},</p>
      <p>La demande <strong>${escapeHtml(request.title)}</strong> a été attribuée à un autre prestataire.</p>
      <p><a href="${BASE_URL}/pro/dashboard/appels-offres" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Retour au dashboard</a></p>
    </div>
  </div>
</body>
        </html>`,
      }),
    ]))
  );
}

async function createQuoteRequest(data, userId) {
  const { error, value } = createQuoteRequestSchema.validate(data, {
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    throw createHttpError(error.details[0].message, 400);
  }

  const mode = value.mode;
  const categorySlug = slugifyCategoryName(value.category_slug);
  const categoryRow = await loadCategoryLabel(categorySlug);
  if (!categoryRow) {
    throw createHttpError('Catégorie invalide.', 400);
  }
  const categoryLabel = categoryRow.name || categorySlug;
  const budgetMin = value.budget_min_xpf == null ? null : Number(value.budget_min_xpf);
  const budgetMax = value.budget_max_xpf == null ? null : Number(value.budget_max_xpf);
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    throw createHttpError('Le budget minimum ne peut pas dépasser le budget maximum.', 400);
  }

  const targetIds = mode === 'targeted'
    ? [...new Set((value.target_pro_ids || []).map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry) && entry > 0))]
    : [];

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO quote_requests (
         author_id, mode, category_slug, commune, title, description,
         budget_min_xpf, budget_max_xpf, desired_date, contact_email, contact_phone
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        userId ? Number(userId) : null,
        mode,
        categorySlug,
        normalizeText(value.commune),
        normalizeText(value.title),
        normalizeText(value.description),
        budgetMin,
        budgetMax,
        value.desired_date ? String(value.desired_date) : null,
        normalizeText(value.contact_email),
        normalizeText(value.contact_phone),
      ]
    );

    const request = inserted.rows[0];
    let recipients = [];

    if (mode === 'targeted') {
      recipients = await loadTargetPros(targetIds);
      if (recipients.length !== targetIds.length) {
        throw createHttpError('Un ou plusieurs professionnels ciblés sont introuvables ou inactifs.', 400);
      }

      await client.query(
        `INSERT INTO quote_request_targets (request_id, pro_id, notified_at)
         SELECT $1, x.pro_id, NOW()
         FROM unnest($2::int[]) AS x(pro_id)`,
        [request.id, targetIds]
      );
    } else {
      recipients = await loadActiveProsForCategory(categorySlug);
    }

    return { request, recipients, categoryLabel };
  });

  await Promise.allSettled(
    result.recipients.map((pro) => notifyProRequest(pro, result.request, result.categoryLabel))
  );

  return {
    id: Number(result.request.id),
    mode: result.request.mode,
    category_slug: result.request.category_slug,
    category_name: result.categoryLabel,
    commune: result.request.commune,
    title: result.request.title,
    status: result.request.status,
    created_at: result.request.created_at,
  };
}

async function submitQuoteOffer(requestId, proId, proUserId, data) {
  const { error, value } = offerSchema.validate(data, {
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    throw createHttpError(error.details[0].message, 400);
  }

  const result = await withTransaction(async (client) => {
    const requestResult = await client.query(
      `SELECT
         qr.*,
         c.name AS category_name
       FROM quote_requests qr
       LEFT JOIN categories c ON c.slug = qr.category_slug
       WHERE qr.id = $1
       FOR UPDATE`,
      [requestId]
    );
    const request = requestResult.rows[0];
    if (!request) {
      throw createHttpError('Demande introuvable.', 404);
    }
    if (request.status !== 'open') {
      throw createHttpError('Cette demande n’accepte plus de réponses.', 400);
    }

    const proResult = await client.query(
      `SELECT
         u.id,
         u.email,
         u.telephone,
         u.pro_phone,
         u.pro_company_name,
         u.prenom,
         u.nom,
         u.pro_category,
         u.pro_commune,
         u.note_moyenne,
         u.nb_avis,
         u.expo_push_token,
         u.pro_expires_at,
         u.deleted_at,
         u.is_pro
       FROM pro_profiles pp
       JOIN users u ON u.id = pp.id
       WHERE pp.id = $1
       LIMIT 1`,
      [proId]
    );
    const pro = proResult.rows[0];
    ensureActivePro(pro, proUserId);

    const proCategorySlug = slugifyCategoryName(pro.pro_category || '');
    const isVisible = request.mode === 'open'
      ? proCategorySlug === request.category_slug
      : Boolean(await client.query(
        'SELECT 1 FROM quote_request_targets WHERE request_id = $1 AND pro_id = $2 LIMIT 1',
        [request.id, pro.id]
      ).then((res) => res.rows[0]));
    if (!isVisible) {
      throw createHttpError('Cette demande n’est pas visible pour ce professionnel.', 403);
    }

    const inserted = await client.query(
      `INSERT INTO quote_request_offers (
         request_id, pro_id, pro_user_id, amount_xpf, delay_days, message
       ) VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        request.id,
        pro.id,
        proUserId,
        Number(value.amount_xpf),
        Number(value.delay_days),
        normalizeText(value.message),
      ]
    );

    return {
      request: {
        id: Number(request.id),
        author_id: request.author_id == null ? null : Number(request.author_id),
        title: request.title,
        commune: request.commune,
        contact_email: request.contact_email,
        contact_phone: request.contact_phone,
      },
      offer: inserted.rows[0],
      pro,
      categoryLabel: request.category_name || request.category_slug,
    };
  });

  await notifyRequesterOfferReceived(result.request, result.offer, result.pro);

  return {
    id: Number(result.offer.id),
    request_id: Number(result.offer.request_id),
    pro_id: Number(result.offer.pro_id),
    amount_xpf: Number(result.offer.amount_xpf),
    delay_days: Number(result.offer.delay_days),
    message: result.offer.message ?? null,
    status: result.offer.status,
    created_at: result.offer.created_at,
  };
}

async function selectQuoteOffer(requestId, offerId, authorId, method = 'manual') {
  const result = await withTransaction(async (client) => {
    const requestResult = await client.query(
      `SELECT
         qr.*,
         c.name AS category_name
       FROM quote_requests qr
       LEFT JOIN categories c ON c.slug = qr.category_slug
       WHERE qr.id = $1
       FOR UPDATE`,
      [requestId]
    );
    const request = requestResult.rows[0];
    if (!request) {
      throw createHttpError('Demande introuvable.', 404);
    }
    if (!request.author_id || Number(request.author_id) !== Number(authorId)) {
      throw createHttpError('Accès refusé.', 403);
    }
    if (request.status !== 'open') {
      throw createHttpError('Cette demande ne peut plus être modifiée.', 400);
    }

    const selectedResult = await client.query(
      `SELECT
         o.*,
         u.email AS pro_email,
         u.telephone AS pro_telephone,
         u.pro_phone AS pro_public_phone,
         u.pro_company_name,
         u.prenom,
         u.nom,
         u.note_moyenne,
         u.expo_push_token
       FROM quote_request_offers o
       JOIN users u ON u.id = o.pro_user_id
       WHERE o.id = $1
         AND o.request_id = $2
       LIMIT 1
       FOR UPDATE`,
      [offerId, requestId]
    );
    const selectedOffer = selectedResult.rows[0];
    if (!selectedOffer) {
      throw createHttpError('Offre introuvable.', 404);
    }

    const allOffersResult = await client.query(
      `SELECT
         o.*,
         u.email AS pro_email,
         u.telephone AS pro_telephone,
         u.pro_phone AS pro_public_phone,
         u.pro_company_name,
         u.prenom,
         u.nom,
         u.note_moyenne,
         u.expo_push_token
       FROM quote_request_offers o
       JOIN users u ON u.id = o.pro_user_id
       WHERE o.request_id = $1`,
      [requestId]
    );

    await client.query(
      `UPDATE quote_request_offers
       SET status = 'selected'
       WHERE id = $1`,
      [offerId]
    );

    await client.query(
      `UPDATE quote_request_offers
       SET status = 'rejected'
       WHERE request_id = $1
         AND id <> $2`,
      [requestId, offerId]
    );

    await client.query(
      `UPDATE quote_requests
       SET status = 'closed'
       WHERE id = $1`,
      [requestId]
    );

    await client.query(
      `INSERT INTO quote_request_selections (request_id, offer_id, method)
       VALUES ($1, $2, $3)`,
      [requestId, offerId, normalizeText(method) || 'manual']
    );

    return {
      request: requestResult.rows[0],
      selectedOffer,
      allOffers: allOffersResult.rows,
    };
  });

  const rejectedOffers = result.allOffers.filter((offer) => Number(offer.id) !== Number(result.selectedOffer.id));
  const proLabel = formatDisplayName(result.selectedOffer);

  await notifySelectionOutcome(result.request, result.selectedOffer, rejectedOffers);

  return {
    request_id: Number(result.request.id),
    offer_id: Number(result.selectedOffer.id),
    selected_pro: proLabel,
    status: 'closed',
  };
}

async function getQuoteRequestWithOffers(requestId, userId) {
  const requestResult = await query(
    `SELECT
       qr.*,
       c.name AS category_name,
       u.email AS author_email
     FROM quote_requests qr
     LEFT JOIN categories c ON c.slug = qr.category_slug
     LEFT JOIN users u ON u.id = qr.author_id
     WHERE qr.id = $1
     LIMIT 1`,
    [requestId]
  );

  const request = requestResult.rows[0];
  if (!request) {
    throw createHttpError('Demande introuvable.', 404);
  }
  if (!userId || Number(request.author_id) !== Number(userId)) {
    throw createHttpError('Accès refusé.', 403);
  }

  const offersResult = await query(
    `SELECT
       o.*,
       u.pro_company_name,
       u.prenom,
       u.nom,
       u.note_moyenne
     FROM quote_request_offers o
     JOIN users u ON u.id = o.pro_user_id
     WHERE o.request_id = $1
     ORDER BY o.created_at ASC`,
    [requestId]
  );

  return {
    id: Number(request.id),
    author_id: request.author_id == null ? null : Number(request.author_id),
    mode: request.mode,
    category_slug: request.category_slug,
    category_name: request.category_name || request.category_slug,
    commune: request.commune,
    title: request.title,
    description: request.description,
    budget_min_xpf: request.budget_min_xpf == null ? null : Number(request.budget_min_xpf),
    budget_max_xpf: request.budget_max_xpf == null ? null : Number(request.budget_max_xpf),
    desired_date: request.desired_date || null,
    contact_email: request.contact_email,
    contact_phone: request.contact_phone || null,
    status: request.status,
    created_at: request.created_at,
    updated_at: request.updated_at,
    offers_count: offersResult.rows.length,
    offers: offersResult.rows.map((offer) => ({
      id: Number(offer.id),
      request_id: Number(offer.request_id),
      pro_id: Number(offer.pro_id),
      pro_user_id: Number(offer.pro_user_id),
      pro_name: formatDisplayName(offer),
      pro_rating: Number(offer.note_moyenne ?? 0),
      amount_xpf: Number(offer.amount_xpf),
      delay_days: Number(offer.delay_days),
      message: offer.message || null,
      status: offer.status,
      created_at: offer.created_at,
      updated_at: offer.updated_at,
    })),
  };
}

async function getMyQuoteRequests(authorId) {
  if (!authorId) return [];

  const result = await query(
    `SELECT
       qr.id,
       qr.mode,
       qr.category_slug,
       c.name AS category_name,
       qr.commune,
       qr.title,
       qr.description,
       qr.budget_min_xpf,
       qr.budget_max_xpf,
       qr.desired_date,
       qr.contact_email,
       qr.contact_phone,
       qr.status,
       qr.created_at,
       qr.updated_at,
       COALESCE(offer_counts.offer_count, 0) AS offer_count
     FROM quote_requests qr
     LEFT JOIN categories c ON c.slug = qr.category_slug
     LEFT JOIN (
       SELECT request_id, COUNT(*)::int AS offer_count
       FROM quote_request_offers
       GROUP BY request_id
     ) offer_counts ON offer_counts.request_id = qr.id
     WHERE qr.author_id = $1
     ORDER BY qr.created_at DESC`,
    [authorId]
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    mode: row.mode,
    category_slug: row.category_slug,
    category_name: row.category_name || row.category_slug,
    commune: row.commune,
    title: row.title,
    description: row.description,
    budget_min_xpf: row.budget_min_xpf == null ? null : Number(row.budget_min_xpf),
    budget_max_xpf: row.budget_max_xpf == null ? null : Number(row.budget_max_xpf),
    desired_date: row.desired_date || null,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone || null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    offer_count: Number(row.offer_count || 0),
  }));
}

async function getProQuoteRequests(proUserId) {
  const proResult = await query(
    `SELECT
       u.id,
       u.pro_category,
       u.pro_company_name,
       u.prenom,
       u.nom
     FROM users u
     WHERE u.id = $1
       AND u.is_pro = TRUE
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [proUserId]
  );

  const pro = proResult.rows[0];
  if (!pro) {
    throw createHttpError('Professionnel introuvable.', 404);
  }

  const proCategorySlug = slugifyCategoryName(pro.pro_category || '');

  const result = await query(
    `SELECT
       qr.id,
       qr.mode,
       qr.category_slug,
       c.name AS category_name,
       qr.commune,
       qr.title,
       qr.description,
       qr.budget_min_xpf,
       qr.budget_max_xpf,
       qr.desired_date,
       qr.status,
       qr.created_at,
       COALESCE(offer_counts.offer_count, 0) AS offer_count,
       my_offer.id AS my_offer_id,
       my_offer.amount_xpf AS my_offer_amount_xpf,
       my_offer.delay_days AS my_offer_delay_days,
       my_offer.message AS my_offer_message,
       my_offer.status AS my_offer_status,
       my_offer.created_at AS my_offer_created_at
     FROM quote_requests qr
     LEFT JOIN categories c ON c.slug = qr.category_slug
     LEFT JOIN (
       SELECT request_id, COUNT(*)::int AS offer_count
       FROM quote_request_offers
       GROUP BY request_id
     ) offer_counts ON offer_counts.request_id = qr.id
     LEFT JOIN quote_request_offers my_offer
       ON my_offer.request_id = qr.id
      AND my_offer.pro_user_id = $1
     WHERE qr.status = 'open'
       AND (
         (qr.mode = 'open' AND qr.category_slug = $2)
         OR
         (qr.mode = 'targeted' AND EXISTS (
           SELECT 1
           FROM quote_request_targets t
           WHERE t.request_id = qr.id
             AND t.pro_id = $1
         ))
       )
     ORDER BY qr.created_at DESC`,
    [proUserId, proCategorySlug]
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    mode: row.mode,
    category_slug: row.category_slug,
    category_name: row.category_name || row.category_slug,
    commune: row.commune,
    title: row.title,
    description: row.description,
    budget_min_xpf: row.budget_min_xpf == null ? null : Number(row.budget_min_xpf),
    budget_max_xpf: row.budget_max_xpf == null ? null : Number(row.budget_max_xpf),
    desired_date: row.desired_date || null,
    status: row.status,
    created_at: row.created_at,
    offer_count: Number(row.offer_count || 0),
    my_offer: row.my_offer_id ? {
      id: Number(row.my_offer_id),
      amount_xpf: Number(row.my_offer_amount_xpf),
      delay_days: Number(row.my_offer_delay_days),
      message: row.my_offer_message || null,
      status: row.my_offer_status,
      created_at: row.my_offer_created_at,
    } : null,
  }));
}

async function getProOfferHistory(proUserId) {
  const result = await query(
    `SELECT
       o.id,
       o.request_id,
       o.pro_id,
       o.pro_user_id,
       o.amount_xpf,
       o.delay_days,
       o.message,
       o.status,
       o.created_at,
       o.updated_at,
       qr.title,
       qr.commune,
       qr.category_slug,
       qr.mode,
       qr.status AS request_status,
       c.name AS category_name
     FROM quote_request_offers o
     JOIN quote_requests qr ON qr.id = o.request_id
     LEFT JOIN categories c ON c.slug = qr.category_slug
     WHERE o.pro_user_id = $1
     ORDER BY o.created_at DESC`,
    [proUserId]
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    request_id: Number(row.request_id),
    pro_id: Number(row.pro_id),
    pro_user_id: Number(row.pro_user_id),
    amount_xpf: Number(row.amount_xpf),
    delay_days: Number(row.delay_days),
    message: row.message || null,
    status: row.status,
    status_label: row.status === 'selected' ? 'Sélectionné' : row.status === 'rejected' ? 'Non retenu' : 'En attente',
    title: row.title,
    commune: row.commune,
    category_slug: row.category_slug,
    category_name: row.category_name || row.category_slug,
    mode: row.mode,
    request_status: row.request_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function cancelQuoteRequest(requestId, authorId) {
  const result = await withTransaction(async (client) => {
    const requestResult = await client.query(
      `SELECT * FROM quote_requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    const request = requestResult.rows[0];
    if (!request) {
      throw createHttpError('Demande introuvable.', 404);
    }
    if (!request.author_id || Number(request.author_id) !== Number(authorId)) {
      throw createHttpError('Accès refusé.', 403);
    }
    if (request.status !== 'open') {
      throw createHttpError('Cette demande ne peut plus être annulée.', 400);
    }

    const recipientsResult = await client.query(
      `SELECT DISTINCT o.pro_user_id
       FROM quote_request_offers o
       WHERE o.request_id = $1`,
      [requestId]
    );

    await client.query(
      `UPDATE quote_requests
       SET status = 'cancelled'
       WHERE id = $1`,
      [requestId]
    );

    return {
      request,
      recipientIds: recipientsResult.rows.map((row) => Number(row.pro_user_id)),
    };
  });

  await Promise.allSettled(
    result.recipientIds.map((proId) => createNotification(proId, {
      type: 'quote_request_cancelled',
      title: `La demande "${result.request.title}" a été annulée.`,
      body: result.request.commune,
      href: '/pro/dashboard/appels-offres',
    }))
  );

  return {
    id: Number(result.request.id),
    status: 'cancelled',
  };
}

module.exports = {
  createQuoteRequest,
  submitQuoteOffer,
  selectQuoteOffer,
  getQuoteRequestWithOffers,
  getMyQuoteRequests,
  getProQuoteRequests,
  getProOfferHistory,
  cancelQuoteRequest,
  notifyRequesterOfferReceived,
};
