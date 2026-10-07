'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { createNotification } = require('../services/notificationService');
const { sendSms } = require('../services/fretWorkflowService');
const {
  generateQuoteShareToken,
  hashQuoteShareToken,
  matchesQuoteShareToken,
} = require('../services/quoteShareTokenService');
const {
  QUOTE_UNITS,
  canMarkQuotePaid,
  computeQuoteTotals,
  getAllowedTgcRates,
  normalizeQuoteItems,
} = require('../services/proQuoteService');

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const quoteItemSchema = Joi.object({
  label: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().trim().max(400).allow('', null).optional(),
  unit: Joi.string().valid(...QUOTE_UNITS).default('unit'),
  quantity: Joi.number().precision(3).min(0.001).max(999999).required(),
  unit_price_xpf: Joi.number().integer().min(0).required(),
  tgc_rate: Joi.number().min(0).max(50).optional(),
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
  tgc_rate: Joi.number().min(0).max(50).default(0),
  tax_rate: Joi.number().min(0).max(50).optional(),
  deposit_percent: Joi.number().precision(2).min(0).max(100).default(0),
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
  tgc_rate: Joi.number().min(0).max(50).optional(),
  tax_rate: Joi.number().min(0).max(50).optional(),
  deposit_percent: Joi.number().precision(2).min(0).max(100).optional(),
  validity_days: Joi.number().integer().min(1).max(365).optional(),
});

const quoteTemplateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  subject: Joi.string().trim().min(2).max(160).required(),
  client_note: Joi.string().trim().max(1200).allow('', null).optional(),
  items: Joi.array().items(quoteItemSchema).min(1).required(),
  tgc_rate: Joi.number().min(0).max(50).default(0),
  deposit_percent: Joi.number().precision(2).min(0).max(100).default(0),
  validity_days: Joi.number().integer().min(1).max(365).default(30),
});

const quotePaymentSchema = Joi.object({
  paid_at: Joi.date().iso().max('now').optional(),
  note: Joi.string().trim().max(500).allow('', null).optional(),
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
    lines.push(`   ${item.quantity} ${item.unit || 'unit'} x ${formatMoney(item.unit_price_xpf)} = ${formatMoney(item.subtotal_xpf ?? item.total_xpf)}`);
    lines.push(`   TGC ${Number(item.tgc_rate ?? quote.tgc_rate ?? 0)} % : ${formatMoney(item.tgc_amount_xpf ?? 0)}`);
  });

  lines.push('');
  lines.push(`Sous-total : ${formatMoney(quote.subtotal_xpf)}`);
  const breakdown = Array.isArray(quote.tgc_breakdown) ? quote.tgc_breakdown : [];
  if (breakdown.length > 0) {
    breakdown.forEach((entry) => {
      lines.push(`TGC (${Number(entry.rate)} %) : ${formatMoney(entry.amount_xpf)}`);
    });
  } else {
    const tgcRate = Number(quote.tgc_rate ?? quote.tax_rate ?? 0);
    lines.push(`TGC (${tgcRate} %) : ${formatMoney(quote.tgc_amount_xpf ?? quote.tax_amount_xpf)}`);
  }
  lines.push(`Total : ${formatMoney(quote.total_xpf)}`);
  if (Number(quote.deposit_amount_xpf ?? 0) > 0) {
    lines.push(`Acompte (${Number(quote.deposit_percent ?? 0)} %) : ${formatMoney(quote.deposit_amount_xpf)}`);
    lines.push(`Solde : ${formatMoney(quote.balance_due_xpf)}`);
  }
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
    tgc_rate: Number(row.tgc_rate ?? row.tax_rate ?? 0),
    tax_amount_xpf: Number(row.tax_amount_xpf ?? 0),
    tgc_amount_xpf: Number(row.tgc_amount_xpf ?? row.tax_amount_xpf ?? 0),
    tgc_breakdown: Array.isArray(row.tgc_breakdown) ? row.tgc_breakdown : [],
    total_xpf: Number(row.total_xpf ?? 0),
    deposit_percent: Number(row.deposit_percent ?? 0),
    deposit_amount_xpf: Number(row.deposit_amount_xpf ?? 0),
    balance_due_xpf: Number(row.balance_due_xpf ?? row.total_xpf ?? 0),
    validity_days: Number(row.validity_days ?? 30),
    status: row.status,
    valid_until: row.valid_until ?? null,
    sent_at: row.sent_at ?? null,
    viewed_at: row.viewed_at ?? null,
    accepted_at: row.accepted_at ?? null,
    refused_at: row.refused_at ?? null,
    refused_reason: row.refused_reason ?? null,
    last_reminded_at: row.last_reminded_at ?? null,
    reminder_count: Number(row.reminder_count ?? 0),
    paid_at: row.paid_at ?? null,
    paid_declared_by_user_id: row.paid_declared_by_user_id == null ? null : Number(row.paid_declared_by_user_id),
    payment_note: row.payment_note ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    converted_listing_id: row.converted_listing_id == null ? null : Number(row.converted_listing_id),
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

function parseQuoteTemplateRow(row) {
  return {
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    name: row.name,
    subject: row.subject,
    client_note: row.client_note ?? null,
    items: Array.isArray(row.items) ? row.items : [],
    validity_days: Number(row.validity_days ?? 30),
    deposit_percent: Number(row.deposit_percent ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
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
  const token = String(req.get('x-kalico-capability') || req.body?.token || '').trim();
  if (matchesQuoteShareToken(token, quote.share_token)) return true;
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

async function sendQuoteSentEmails(quote, { reminder = false } = {}) {
  const subject = reminder
    ? `Rappel — ${quote.quote_number} de ${quote.pro.display_name}`
    : `${quote.quote_number} - Devis envoyé par ${quote.pro.display_name}`;
  const link = `${BASE_URL}/devis/${quote.id}#token=${encodeURIComponent(quote.share_token)}`;
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
        <p>${reminder ? 'Rappel : ' : ''}Le professionnel ${escapeHtml(quote.pro.display_name)} vous a envoyé un devis.</p>
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
        <p><strong>TGC :</strong> ${formatMoney(quote.tgc_amount_xpf ?? quote.tax_amount_xpf)}</p>
        <p><strong>Total :</strong> ${formatMoney(quote.total_xpf)}</p>
        ${Number(quote.deposit_amount_xpf || 0) > 0 ? `<p><strong>Acompte :</strong> ${formatMoney(quote.deposit_amount_xpf)} · <strong>Solde :</strong> ${formatMoney(quote.balance_due_xpf)}</p>` : ''}
        <p style="margin-top:24px;"><a href="${link}" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;">Voir mon devis</a></p>
      </div>
    </div>
  </body></html>`;

  await sendMail({
    to: quote.requester_email,
    subject,
    html,
  }).catch(() => {});

  if (quote.requester_phone) {
    await sendSms({
      to: quote.requester_phone,
      body: `Kalico : ${reminder ? 'rappel pour le devis' : 'nouveau devis de'} ${quote.pro.display_name} concernant ${quote.subject}. Consultez-le sur kalico.nc`,
    }).catch(() => {});
  }
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

    const tgcRate = value.tgc_rate ?? value.tax_rate ?? 0;
    const totals = computeQuoteTotals(value.items, {
      defaultTgcRate: tgcRate,
      depositPercent: value.deposit_percent,
    });

    const result = await withTransaction(async (client) => {
      const quoteNumber = await loadNextQuoteNumber(client);
      const shareTokenHash = hashQuoteShareToken(generateQuoteShareToken());
      const inserted = await client.query(
        `INSERT INTO pro_quotes (
           pro_id, requester_user_id, source_quote_request_id,
           quote_number, share_token, requester_name, requester_email, requester_phone,
           commune, subject, client_note, items,
           subtotal_xpf, tax_rate, tax_amount_xpf, tgc_breakdown, total_xpf,
           deposit_percent, deposit_amount_xpf, balance_due_xpf, validity_days, status
         ) VALUES (
           $1,$2,$3,
           $4,$5,$6,$7,$8,
           $9,$10,$11,$12,
           $13,$14,$15,$16,$17,
           $18,$19,$20,$21,'draft'
         )
         RETURNING *`,
        [
          req.user.id,
          value.requester_user_id || null,
          value.source_quote_request_id || null,
          quoteNumber,
          shareTokenHash,
          value.requester_name.trim(),
          value.requester_email.trim(),
          value.requester_phone ? value.requester_phone.trim() : null,
          value.commune.trim(),
          value.subject.trim(),
          value.client_note ? value.client_note.trim() : null,
          JSON.stringify(totals.items),
          totals.subtotal_xpf,
          totals.tgc_rate,
          totals.tax_amount_xpf,
          JSON.stringify(totals.tgc_breakdown),
          totals.total_xpf,
          totals.deposit_percent,
          totals.deposit_amount_xpf,
          totals.balance_due_xpf,
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

router.get('/config', authenticate, (req, res) => {
  if (!requirePro(req, res)) return;
  return res.json({
    data: {
      tgc_rates: getAllowedTgcRates(),
      units: QUOTE_UNITS,
    },
  });
});

router.get('/templates', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const result = await query(
      `SELECT * FROM pro_quote_templates
       WHERE pro_id = $1
       ORDER BY updated_at DESC, id DESC`,
      [req.user.id]
    );
    return res.json({ data: result.rows.map(parseQuoteTemplateRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/templates', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const { error, value } = quoteTemplateSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const totals = computeQuoteTotals(value.items, {
      defaultTgcRate: value.tgc_rate,
      depositPercent: value.deposit_percent,
    });
    const result = await query(
      `INSERT INTO pro_quote_templates (
         pro_id, name, subject, client_note, items, validity_days, deposit_percent
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        req.user.id,
        value.name.trim(),
        value.subject.trim(),
        normalizeMaybeText(value.client_note),
        JSON.stringify(totals.items),
        value.validity_days,
        totals.deposit_percent,
      ]
    );
    return res.status(201).json({ data: parseQuoteTemplateRow(result.rows[0]) });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Un modèle porte déjà ce nom.' });
    }
    next(err);
  }
});

router.put('/templates/:templateId', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const templateId = Number(req.params.templateId);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({ error: 'Modèle invalide.' });
    }
    const { error, value } = quoteTemplateSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const totals = computeQuoteTotals(value.items, {
      defaultTgcRate: value.tgc_rate,
      depositPercent: value.deposit_percent,
    });
    const result = await query(
      `UPDATE pro_quote_templates
       SET name = $1,
           subject = $2,
           client_note = $3,
           items = $4,
           validity_days = $5,
           deposit_percent = $6
       WHERE id = $7 AND pro_id = $8
       RETURNING *`,
      [
        value.name.trim(),
        value.subject.trim(),
        normalizeMaybeText(value.client_note),
        JSON.stringify(totals.items),
        value.validity_days,
        totals.deposit_percent,
        templateId,
        req.user.id,
      ]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Modèle introuvable.' });
    }
    return res.json({ data: parseQuoteTemplateRow(result.rows[0]) });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Un modèle porte déjà ce nom.' });
    }
    next(err);
  }
});

router.delete('/templates/:templateId', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const templateId = Number(req.params.templateId);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({ error: 'Modèle invalide.' });
    }
    const result = await query(
      `DELETE FROM pro_quote_templates WHERE id = $1 AND pro_id = $2 RETURNING id`,
      [templateId, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Modèle introuvable.' });
    }
    return res.status(204).send();
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

    const items = value.items || quote.items;
    const taxRate = value.tgc_rate ?? value.tax_rate ?? Number(quote.tgc_rate ?? quote.tax_rate ?? 0);
    const totals = computeQuoteTotals(items, {
      defaultTgcRate: taxRate,
      depositPercent: value.deposit_percent ?? quote.deposit_percent,
    });

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
           tgc_breakdown = $11,
           total_xpf = $12,
           deposit_percent = $13,
           deposit_amount_xpf = $14,
           balance_due_xpf = $15,
           validity_days = COALESCE($16, validity_days)
       WHERE id = $17
       RETURNING *`,
      [
        value.requester_name?.trim() ?? null,
        value.requester_email?.trim() ?? null,
        value.requester_phone !== undefined ? normalizeMaybeText(value.requester_phone) : null,
        value.commune?.trim() ?? null,
        value.subject?.trim() ?? null,
        value.client_note !== undefined ? normalizeMaybeText(value.client_note) : null,
        JSON.stringify(totals.items),
        totals.subtotal_xpf,
        totals.tgc_rate,
        totals.tax_amount_xpf,
        JSON.stringify(totals.tgc_breakdown),
        totals.total_xpf,
        totals.deposit_percent,
        totals.deposit_amount_xpf,
        totals.balance_due_xpf,
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

    const shareToken = generateQuoteShareToken();
    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'sent',
           sent_at = NOW(),
           valid_until = $1,
           validity_days = $2,
           share_token = $3,
           viewed_at = COALESCE(viewed_at, NULL)
       WHERE id = $4
         AND pro_id = $5
         AND status = ANY($6::text[])
       RETURNING *`,
      [validUntil.toISOString(), validityDays, hashQuoteShareToken(shareToken), quoteId, req.user.id, ['draft', 'refused']]
    );
    if (!updated.rows[0]) {
      return res.status(409).json({ error: 'Le devis a changé d’état. Rechargez-le avant de réessayer.' });
    }

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
    fullQuote.share_token = shareToken;

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

router.post('/:id/remind', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const quoteId = Number(req.params.id);
    if (!Number.isInteger(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (Number(quote.pro_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!['sent', 'viewed'].includes(quote.status)) {
      return res.status(409).json({ error: 'Seul un devis envoyé et en attente peut être relancé.' });
    }

    const shareToken = generateQuoteShareToken();
    const shareTokenHash = hashQuoteShareToken(shareToken);
    const updated = await query(
      `UPDATE pro_quotes
       SET last_reminded_at = NOW(),
           reminder_count = reminder_count + 1,
           share_token = $3
       WHERE id = $1
         AND pro_id = $2
         AND status = ANY($4::text[])
         AND (last_reminded_at IS NULL OR last_reminded_at <= NOW() - INTERVAL '24 hours')
       RETURNING *`,
      [quoteId, req.user.id, shareTokenHash, ['sent', 'viewed']]
    );
    if (!updated.rows[0]) {
      res.setHeader('Retry-After', '86400');
      return res.status(429).json({ error: 'Une relance est possible toutes les 24 heures.' });
    }

    const parsed = parseQuoteRow({ ...quote, ...updated.rows[0] });
    parsed.share_token = shareToken;
    await sendQuoteSentEmails(parsed, { reminder: true });
    return res.json({ data: parseQuoteRow({ ...quote, ...updated.rows[0], share_token: shareTokenHash }) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/mark-paid', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const quoteId = Number(req.params.id);
    if (!Number.isInteger(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Devis invalide.' });
    }
    const { error, value } = quotePaymentSchema.validate(req.body || {}, { stripUnknown: true, convert: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const quote = await loadQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    if (Number(quote.pro_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!canMarkQuotePaid(quote.status)) {
      return res.status(409).json({ error: 'Seul un devis accepté ou converti peut être déclaré payé.' });
    }
    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'paid',
           paid_at = $1,
           payment_note = $2,
           paid_declared_by_user_id = $4
       WHERE id = $3
         AND pro_id = $4
         AND status = ANY($5::text[])
       RETURNING *`,
      [
        value.paid_at ? new Date(value.paid_at).toISOString() : new Date().toISOString(),
        normalizeMaybeText(value.note),
        quoteId,
        req.user.id,
        ['accepted', 'converted'],
      ]
    );
    if (!updated.rows[0]) {
      return res.status(409).json({ error: 'Le devis a changé d’état. Rechargez-le avant de réessayer.' });
    }
    return res.json({
      data: parseQuoteRow({ ...quote, ...updated.rows[0] }),
      payment_source: 'pro_declared',
    });
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
    const token = String(req.body?.token || req.get('x-kalico-capability') || '').trim();
    if (!req.user?.is_admin && req.user?.id !== quote.requester_user_id && !matchesQuoteShareToken(token, quote.share_token)) {
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
       WHERE id = $1 AND status = ANY($2::text[])
       RETURNING *`,
      [quoteId, ['sent', 'viewed']]
    );
    if (!updated.rows[0]) {
      return res.status(409).json({ error: 'Le devis a changé d’état. Rechargez-le avant de réessayer.' });
    }

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

    if (quote.pro_phone) {
      await sendSms({
        to: quote.pro_phone,
        body: `Kalico : votre devis ${quote.quote_number} a été accepté par ${quote.requester_name}.`,
      }).catch(() => {});
    }

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
    const token = String(req.body?.token || req.get('x-kalico-capability') || '').trim();
    if (!req.user?.is_admin && req.user?.id !== quote.requester_user_id && !matchesQuoteShareToken(token, quote.share_token)) {
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
       WHERE id = $2 AND status = ANY($3::text[])
       RETURNING *`,
      [refusedReason, quoteId, ['sent', 'viewed']]
    );
    if (!updated.rows[0]) {
      return res.status(409).json({ error: 'Le devis a changé d’état. Rechargez-le avant de réessayer.' });
    }

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

    if (quote.pro_phone) {
      await sendSms({
        to: quote.pro_phone,
        body: `Kalico : votre devis ${quote.quote_number} a été refusé par ${quote.requester_name}.`,
      }).catch(() => {});
    }

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
    if (quote.status !== 'accepted') {
      return res.status(409).json({ error: 'Seul un devis accepté peut être converti.' });
    }

    const convertedListingId = req.body?.listing_id ? Number(req.body.listing_id) : null;
    const updated = await query(
      `UPDATE pro_quotes
       SET status = 'converted',
           converted_listing_id = $1
       WHERE id = $2 AND pro_id = $3 AND status = 'accepted'
       RETURNING *`,
      [convertedListingId, quoteId, req.user.id]
    );

    if (!updated.rows[0]) {
      return res.status(409).json({ error: 'Le devis a changé d’état. Rechargez-le avant de réessayer.' });
    }

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
