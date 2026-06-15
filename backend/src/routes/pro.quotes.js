'use strict';

const crypto = require('crypto');
const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { createNotification } = require('../services/notificationService');

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const quoteItemSchema = Joi.object({
  label: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().trim().max(400).allow('', null).optional(),
  quantity: Joi.number().integer().min(1).max(9999).required(),
  unit_price_xpf: Joi.number().integer().min(0).required(),
});

const quoteCreateSchema = Joi.object({
  requester_user_id: Joi.number().integer().positive().allow(null).optional(),
  requester_name: Joi.string().trim().min(2).max(120).required(),
  requester_email: Joi.string().trim().email().max(255).required(),
  requester_phone: Joi.string().trim().max(30).allow('', null).optional(),
  commune: Joi.string().trim().min(2).max(120).required(),
  subject: Joi.string().trim().min(2).max(160).required(),
  client_note: Joi.string().trim().max(1200).allow('', null).optional(),
  items: Joi.array().items(quoteItemSchema).min(1).required(),
  tax_rate: Joi.number().min(0).max(50).default(0),
  validity_days: Joi.number().integer().min(1).max(365).default(30),
  source_quote_request_id: Joi.number().integer().positive().allow(null).optional(),
});

const quoteUpdateSchema = Joi.object({
  requester_name: Joi.string().trim().min(2).max(120).optional(),
  requester_email: Joi.string().trim().email().max(255).optional(),
  requester_phone: Joi.string().trim().max(30).allow('', null).optional(),
  commune: Joi.string().trim().min(2).max(120).optional(),
  subject: Joi.string().trim().min(2).max(160).optional(),
  client_note: Joi.string().trim().max(1200).allow('', null).optional(),
  items: Joi.array().items(quoteItemSchema).min(1).optional(),
  tax_rate: Joi.number().min(0).max(50).optional(),
  validity_days: Joi.number().integer().min(1).max(365).optional(),
});

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

function normalizeMaybeText(value) {
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
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString('fr-FR')} XPF`;
}

function formatDisplayName(row) {
  return row.pro_company_name
    || [row.pro_prenom, row.pro_nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Kalico';
}

function normalizeQuoteItems(items) {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const quantity = Math.max(1, Math.round(Number(item.quantity ?? 1)));
    const unitPrice = Math.max(0, Math.round(Number(item.unit_price_xpf ?? 0)));
    return {
      id: item.id || `item_${index + 1}`,
      label: normalizeMaybeText(item.label) || `Ligne ${index + 1}`,
      description: normalizeMaybeText(item.description),
      quantity,
      unit_price_xpf: unitPrice,
      total_xpf: quantity * unitPrice,
    };
  });
}

function computeQuoteTotals(items, taxRate) {
  const subtotal = normalizeQuoteItems(items).reduce((sum, item) => sum + item.total_xpf, 0);
  const tax = Math.round((subtotal * Number(taxRate || 0)) / 100);
  return {
    subtotal_xpf: subtotal,
    tax_rate: Number(taxRate || 0),
    tax_amount_xpf: tax,
    total_xpf: subtotal + tax,
  };
}

function buildSimplePdfBuffer(lines) {
  const safeLines = Array.isArray(lines) ? lines.slice(0, 40) : [];
  const contentLines = ['BT', '/F1 12 Tf', '72 770 Td'];

  safeLines.forEach((line, index) => {
    const escaped = escapeHtml(line)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    if (index === 0) {
      contentLines.push(`(${escaped}) Tj`);
    } else {
      contentLines.push('T*');
      contentLines.push(`(${escaped}) Tj`);
    }
  });

  contentLines.push('ET');
  const stream = contentLines.join('\n');
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);

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

function buildQuotePdfBuffer(quote) {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const lines = [
    'KALICO NC',
    `DEVIS ${quote.quote_number || quote.id}`,
    `Professionnel : ${quote.pro_name || 'Professionnel Kalico'}`,
    `Client : ${quote.requester_name || 'Client'}`,
    `Email : ${quote.requester_email || 'Non renseigné'}`,
    `Téléphone : ${quote.requester_phone || 'Non renseigné'}`,
    `Commune : ${quote.commune || 'Non renseignée'}`,
    `Objet : ${quote.subject || 'Devis'}`,
    `Statut : ${quote.status || 'draft'}`,
    `Validité : ${quote.valid_until ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(quote.valid_until)) : 'Non précisée'}`,
    '',
    'Lignes :',
  ];

  items.forEach((item, index) => {
    const label = item.label || `Ligne ${index + 1}`;
    const description = item.description ? ` - ${item.description}` : '';
    lines.push(`${index + 1}. ${label}${description}`);
    lines.push(`   ${item.quantity} x ${formatMoney(item.unit_price_xpf)} = ${formatMoney(item.total_xpf)}`);
  });

  lines.push('');
  lines.push(`Sous-total : ${formatMoney(quote.subtotal_xpf)}`);
  lines.push(`TVA (${Number(quote.tax_rate || 0)} %) : ${formatMoney(quote.tax_amount_xpf)}`);
  lines.push(`Total : ${formatMoney(quote.total_xpf)}`);
  lines.push('');
  lines.push('Document généré par Kalico.');

  return buildSimplePdfBuffer(lines);
}

function parseQuoteRow(row) {
  const items = Array.isArray(row.items) ? row.items : [];
  return {
    id: Number(row.id),
    quote_number: row.quote_number,
    pro_id: Number(row.pro_id),
    requester_user_id: row.requester_user_id == null ? null : Number(row.requester_user_id),
    source_quote_request_id: row.source_quote_request_id == null ? null : Number(row.source_quote_request_id),
    requester_name: row.requester_name,
    requester_email: row.requester_email,
    requester_phone: row.requester_phone ?? null,
    commune: row.commune,
    subject: row.subject,
    client_note: row.client_note ?? null,
    items,
    subtotal_xpf: Number(row.subtotal_xpf ?? 0),
    tax_rate: Number(row.tax_rate ?? 0),
    tax_amount_xpf: Number(row.tax_amount_xpf ?? 0),
    total_xpf: Number(row.total_xpf ?? 0),
    validity_days: Number(row.validity_days ?? 30),
    status: row.status,
    valid_until: row.valid_until ?? null,
    sent_at: row.sent_at ?? null,
    viewed_at: row.viewed_at ?? null,
    accepted_at: row.accepted_at ?? null,
    refused_at: row.refused_at ?? null,
    refused_reason: row.refused_reason ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    converted_listing_id: row.converted_listing_id == null ? null : Number(row.converted_listing_id),
    share_token: row.share_token ?? null,
    pro: {
      id: Number(row.pro_id),
      prenom: row.pro_prenom ?? null,
      nom: row.pro_nom ?? null,
      pro_company_name: row.pro_company_name ?? null,
      pro_commune: row.pro_commune ?? null,
      pro_category: row.pro_category ?? null,
      pro_phone: row.pro_phone ?? null,
      pro_website: row.pro_website ?? null,
      display_name: formatDisplayName(row),
    },
  };
}

async function loadQuoteById(quoteId) {
  const result = await query(
    `SELECT
       q.*,
       p.prenom AS pro_prenom,
       p.nom AS pro_nom,
       p.pro_company_name,
       p.pro_commune,
       p.pro_category,
       p.pro_phone,
       p.pro_website
     FROM pro_quotes q
     JOIN users p ON p.id = q.pro_id
     WHERE q.id = $1
     LIMIT 1`,
    [quoteId]
  );
  return result.rows[0] || null;
}

async function assertQuoteAccess(req, quote) {
  if (!quote) return false;
  if (req.user?.is_admin) return true;
  if (req.user?.id && Number(req.user.id) === Number(quote.pro_id)) return true;
  if (req.user?.id && quote.requester_user_id != null && Number(req.user.id) === Number(quote.requester_user_id)) return true;
  const token = String(req.query.token || req.body?.token || '').trim();
  if (token && quote.share_token && token === quote.share_token) return true;
  return false;
}

async function loadNextQuoteNumber(client) {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COALESCE(COUNT(*), 0)::int AS count
     FROM pro_quotes
     WHERE quote_number LIKE $1`,
    [`DEVIS-${year}-%`]
  );
  const next = Number(rows[0]?.count ?? 0) + 1;
  return `DEVIS-${year}-${String(next).padStart(4, '0')}`;
}

async function sendQuoteSentEmails(quote) {
  const subject = `${quote.quote_number} - Devis envoyé par ${quote.pro.display_name}`;
  const link = `${BASE_URL}/devis/${quote.id}?token=${quote.share_token}`;
  const htmlItems = quote.items
    .map((item, index) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${index + 1}. ${escapeHtml(item.label)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${formatMoney(item.unit_price_xpf)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${formatMoney(item.total_xpf)}</td>
      </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
  <html lang="fr"><body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0;">
    <div style="max-width:720px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
      <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-size:22px;font-weight:700">Kalico</div>
      <div style="padding:28px;color:#1f2937;line-height:1.6;">
        <p>Bonjour ${escapeHtml(quote.requester_name)},</p>
        <p>Le professionnel ${escapeHtml(quote.pro.display_name)} vous a envoyé un devis.</p>
        <p><strong>Objet :</strong> ${escapeHtml(quote.subject)}</p>
        <p><strong>Validité :</strong> ${quote.valid_until ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(quote.valid_until)) : 'Non précisée'}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f8fafc;text-align:left;">
              <th style="padding:10px;">Désignation</th>
              <th style="padding:10px;">Qté</th>
              <th style="padding:10px;">PU</th>
              <th style="padding:10px;">Total</th>
            </tr>
          </thead>
          <tbody>${htmlItems}</tbody>
        </table>
        <p><strong>Sous-total :</strong> ${formatMoney(quote.subtotal_xpf)}</p>
        <p><strong>TVA :</strong> ${formatMoney(quote.tax_amount_xpf)}</p>
        <p><strong>Total :</strong> ${formatMoney(quote.total_xpf)}</p>
        <p style="margin-top:24px;"><a href="${link}" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;">Voir mon devis</a></p>
      </div>
    </div>
  </body></html>`;

  await sendMail({
    to: quote.requester_email,
    subject,
    html,
  }).catch(() => {});
}

async function sendQuoteDecisionEmails(quote, decision, reason) {
  const labels = {
    accepted: 'accepté',
    refused: 'refusé',
    converted: 'converti',
  };
  const label = labels[decision] || decision;
  const subject = `Votre devis a été ${label} - ${quote.pro.display_name}`;
  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:0;">
    <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden">
      <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-size:22px;font-weight:700">Kalico</div>
      <div style="padding:28px;color:#1f2937;line-height:1.6;">
        <p>Bonjour ${escapeHtml(quote.requester_name)},</p>
        <p>Votre devis ${escapeHtml(quote.quote_number)} a été <strong>${label}</strong>.</p>
        ${reason ? `<p><strong>Motif :</strong> ${escapeHtml(reason)}</p>` : ''}
      </div>
    </div>
  </body></html>`;
  await sendMail({ to: quote.requester_email, subject, html }).catch(() => {});
}

router.post('/', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const { error, value } = quoteCreateSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const items = normalizeQuoteItems(value.items);
    const totals = computeQuoteTotals(items, value.tax_rate);

    const result = await withTransaction(async (client) => {
      const quoteNumber = await loadNextQuoteNumber(client);
      const shareToken = crypto.randomBytes(24).toString('hex');
      const inserted = await client.query(
        `INSERT INTO pro_quotes (
           pro_id, requester_user_id, source_quote_request_id,
           quote_number, share_token, requester_name, requester_email, requester_phone,
           commune, subject, client_note, items,
           subtotal_xpf, tax_rate, tax_amount_xpf, total_xpf, validity_days, status
         ) VALUES (
           $1,$2,$3,
           $4,$5,$6,$7,$8,
           $9,$10,$11,$12,
           $13,$14,$15,$16,$17,'draft'
         )
         RETURNING *`,
        [
          req.user.id,
          value.requester_user_id || null,
          value.source_quote_request_id || null,
          quoteNumber,
          shareToken,
          value.requester_name.trim(),
          value.requester_email.trim(),
          value.requester_phone ? value.requester_phone.trim() : null,
          value.commune.trim(),
          value.subject.trim(),
          value.client_note ? value.client_note.trim() : null,
          JSON.stringify(items),
          totals.subtotal_xpf,
          totals.tax_rate,
          totals.tax_amount_xpf,
          totals.total_xpf,
          value.validity_days,
        ]
      );
      return inserted.rows[0];
    });

    return res.status(201).json({ data: parseQuoteRow(result) });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const status = String(req.query.status || '').trim().toLowerCase();
    const params = [req.user.id];
    let where = 'WHERE q.pro_id = $1';
    if (status) {
      params.push(status);
      where += ` AND q.status = $${params.length}`;
    }
    const result = await query(
      `SELECT q.*, p.prenom AS pro_prenom, p.nom AS pro_nom, p.pro_company_name, p.pro_commune
       FROM pro_quotes q
       JOIN users p ON p.id = q.pro_id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT 100`,
      params
    );
    return res.json({ data: result.rows.map(parseQuoteRow) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const row = await loadQuoteById(quoteId);
    if (!row) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    const allowed = await assertQuoteAccess(req, row);
    if (!allowed) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (row.status === 'sent' && !row.viewed_at) {
      await query(`UPDATE pro_quotes SET viewed_at = NOW(), status = 'viewed' WHERE id = $1`, [quoteId]);
      row.viewed_at = new Date().toISOString();
      if (row.status === 'sent') row.status = 'viewed';
    }
    return res.json({ data: parseQuoteRow(row) });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (Number(quote.pro_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (quote.status !== 'draft') {
      return res.status(400).json({ error: 'Seuls les brouillons peuvent être modifiés.' });
    }

    const { error, value } = quoteUpdateSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const items = value.items ? normalizeQuoteItems(value.items) : normalizeQuoteItems(quote.items);
    const taxRate = value.tax_rate ?? Number(quote.tax_rate ?? 0);
    const totals = computeQuoteTotals(items, taxRate);

    const updated = await query(
      `UPDATE pro_quotes
       SET requester_name = COALESCE($1, requester_name),
           requester_email = COALESCE($2, requester_email),
           requester_phone = COALESCE($3, requester_phone),
           commune = COALESCE($4, commune),
           subject = COALESCE($5, subject),
           client_note = COALESCE($6, client_note),
           items = $7,
           subtotal_xpf = $8,
           tax_rate = $9,
           tax_amount_xpf = $10,
           total_xpf = $11,
           validity_days = COALESCE($12, validity_days)
       WHERE id = $13
       RETURNING *`,
      [
        value.requester_name?.trim() ?? null,
        value.requester_email?.trim() ?? null,
        value.requester_phone !== undefined ? normalizeMaybeText(value.requester_phone) : null,
        value.commune?.trim() ?? null,
        value.subject?.trim() ?? null,
        value.client_note !== undefined ? normalizeMaybeText(value.client_note) : null,
        JSON.stringify(items),
        totals.subtotal_xpf,
        totals.tax_rate,
        totals.tax_amount_xpf,
        totals.total_xpf,
        value.validity_days ?? null,
        quoteId,
      ]
    );

    return res.json({ data: parseQuoteRow(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/send', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (Number(quote.pro_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (quote.status !== 'draft' && quote.status !== 'refused') {
      return res.status(400).json({ error: 'Ce devis a déjà été envoyé.' });
    }

    const validityDays = Math.max(1, Math.min(365, Number(req.body?.validity_days ?? quote.validity_days ?? 30)));
    const sentAt = new Date();
    const validUntil = new Date(sentAt.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'sent',
           sent_at = NOW(),
           valid_until = $1,
           validity_days = $2,
           viewed_at = COALESCE(viewed_at, NULL)
       WHERE id = $3
       RETURNING *`,
      [validUntil.toISOString(), validityDays, quoteId]
    );

    const fullQuote = parseQuoteRow({
      ...quote,
      ...updated.rows[0],
      items: quote.items,
      pro_prenom: quote.pro_prenom,
      pro_nom: quote.pro_nom,
      pro_company_name: quote.pro_company_name,
      pro_commune: quote.pro_commune,
      pro_category: quote.pro_category,
      pro_phone: quote.pro_phone,
      pro_website: quote.pro_website,
    });

    await sendQuoteSentEmails(fullQuote);
    await Promise.all([
      createNotification(quote.pro_id, {
        type: 'quote_sent',
        title: '📄 Devis envoyé',
        body: `${quote.requester_name} · ${quote.subject}`,
        href: '/pro/dashboard/devis',
      }),
      sendPushToUser(quote.pro_id, {
        title: '📄 Devis envoyé',
        body: `${quote.requester_name} · ${quote.subject}`,
        data: { type: 'quote_sent', quoteId },
      }).catch(() => {}),
    ]);

    return res.json({ data: parseQuoteRow({ ...quote, ...updated.rows[0] }) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/accept', optionalAuth, async (req, res, next) => {
  try {
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (!(await assertQuoteAccess(req, quote))) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const token = String(req.body?.token || req.query.token || '').trim();
    if (!req.user?.is_admin && req.user?.id !== quote.requester_user_id && token !== quote.share_token) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      return res.status(400).json({ error: 'Ce devis ne peut plus être accepté.' });
    }

    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'accepted',
           accepted_at = NOW(),
           viewed_at = COALESCE(viewed_at, NOW())
       WHERE id = $1
       RETURNING *`,
      [quoteId]
    );

    const parsed = parseQuoteRow({ ...quote, ...updated.rows[0] });
    await sendQuoteDecisionEmails(parsed, 'accepted');
    await Promise.all([
      createNotification(quote.pro_id, {
        type: 'quote_accepted',
        title: '✅ Devis accepté',
        body: `${quote.requester_name} · ${quote.subject}`,
        href: '/pro/dashboard/devis',
      }),
      sendPushToUser(quote.pro_id, {
        title: '✅ Devis accepté',
        body: `${quote.requester_name} a accepté votre devis`,
        data: { type: 'quote_accepted', quoteId },
      }).catch(() => {}),
    ]);

    return res.json({ data: parsed });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/refuse', optionalAuth, async (req, res, next) => {
  try {
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (!(await assertQuoteAccess(req, quote))) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const token = String(req.body?.token || req.query.token || '').trim();
    if (!req.user?.is_admin && req.user?.id !== quote.requester_user_id && token !== quote.share_token) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      return res.status(400).json({ error: 'Ce devis ne peut plus être refusé.' });
    }

    const refusedReason = normalizeMaybeText(req.body?.reason);
    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'refused',
           refused_at = NOW(),
           refused_reason = $1,
           viewed_at = COALESCE(viewed_at, NOW())
       WHERE id = $2
       RETURNING *`,
      [refusedReason, quoteId]
    );

    const parsed = parseQuoteRow({ ...quote, ...updated.rows[0] });
    await sendQuoteDecisionEmails(parsed, 'refused', refusedReason || undefined);
    await Promise.all([
      createNotification(quote.pro_id, {
        type: 'quote_refused',
        title: '❌ Devis refusé',
        body: `${quote.requester_name} · ${quote.subject}`,
        href: '/pro/dashboard/devis',
      }),
      sendPushToUser(quote.pro_id, {
        title: '❌ Devis refusé',
        body: `${quote.requester_name} a refusé votre devis`,
        data: { type: 'quote_refused', quoteId },
      }).catch(() => {}),
    ]);

    return res.json({ data: parsed });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/convert', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (Number(quote.pro_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const convertedListingId = req.body?.listing_id ? Number(req.body.listing_id) : null;
    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'converted',
           converted_listing_id = $1
       WHERE id = $2
       RETURNING *`,
      [convertedListingId, quoteId]
    );

    const parsed = parseQuoteRow({ ...quote, ...updated.rows[0] });
    return res.json({ data: parsed });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/pdf', optionalAuth, async (req, res, next) => {
  try {
    const quoteId = Number(req.params.id);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (!(await assertQuoteAccess(req, quote))) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const pdfBuffer = buildQuotePdfBuffer(parseQuoteRow(quote));
    const filename = `${quote.quote_number || `devis-${quote.id}`}.pdf`.replace(/[^\w.-]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
