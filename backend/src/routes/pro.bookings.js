'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { createNotification } = require('../services/notificationService');

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const bookingSettingsSchema = Joi.object({
  is_enabled: Joi.boolean().default(false),
  title: Joi.string().trim().max(120).allow('', null).optional(),
  subtitle: Joi.string().trim().max(220).allow('', null).optional(),
  location_label: Joi.string().trim().max(120).allow('', null).optional(),
  location_text: Joi.string().trim().max(220).allow('', null).optional(),
  instructions: Joi.string().trim().max(500).allow('', null).optional(),
  slot_duration_minutes: Joi.number().integer().min(15).max(240).default(30),
  advance_notice_hours: Joi.number().integer().min(0).max(168).default(24),
  max_days_ahead: Joi.number().integer().min(1).max(365).default(30),
});

const slotSchema = Joi.object({
  starts_at: Joi.string().isoDate().required(),
  ends_at: Joi.string().isoDate().required(),
  label: Joi.string().trim().max(120).allow('', null).optional(),
});

const bookingSchema = Joi.object({
  slot_id: Joi.number().integer().positive().required(),
  requester_name: Joi.string().trim().min(2).max(120).required(),
  requester_email: Joi.string().trim().email().max(255).required(),
  requester_phone: Joi.string().trim().max(30).allow('', null).optional(),
  commune: Joi.string().trim().max(120).allow('', null).optional(),
  subject: Joi.string().trim().min(2).max(120).required(),
  details: Joi.string().trim().max(1200).allow('', null).optional(),
});

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

function formatDisplayName(row) {
  return row.pro_company_name
    || [row.prenom, row.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Troca';
}

function mapBookingSettings(row) {
  if (!row) {
    return {
      is_enabled: false,
      title: 'Prendre rendez-vous',
      subtitle: 'Réservez un créneau directement avec ce professionnel.',
      location_label: 'Lieu du rendez-vous',
      location_text: null,
      instructions: null,
      slot_duration_minutes: 30,
      advance_notice_hours: 24,
      max_days_ahead: 30,
    };
  }

  return {
    is_enabled: Boolean(row.is_enabled),
    title: row.title || 'Prendre rendez-vous',
    subtitle: row.subtitle || 'Réservez un créneau directement avec ce professionnel.',
    location_label: row.location_label || 'Lieu du rendez-vous',
    location_text: row.location_text ?? null,
    instructions: row.instructions ?? null,
    slot_duration_minutes: Number(row.slot_duration_minutes ?? 30),
    advance_notice_hours: Number(row.advance_notice_hours ?? 24),
    max_days_ahead: Number(row.max_days_ahead ?? 30),
  };
}

function mapBookingSlot(row) {
  return {
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    label: row.label ?? null,
    status: row.status,
    source: row.source,
    created_at: row.created_at,
  };
}

function mapBookingRow(row) {
  return {
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    requester_user_id: row.requester_user_id == null ? null : Number(row.requester_user_id),
    slot_id: row.slot_id == null ? null : Number(row.slot_id),
    requester_name: row.requester_name,
    requester_email: row.requester_email,
    requester_phone: row.requester_phone ?? null,
    commune: row.commune ?? null,
    subject: row.subject,
    details: row.details ?? null,
    starts_at: row.starts_at,
    ends_at: row.ends_at ?? null,
    status: row.status,
    source: row.source,
    confirmed_at: row.confirmed_at ?? null,
    declined_at: row.declined_at ?? null,
    cancelled_at: row.cancelled_at ?? null,
    completed_at: row.completed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    role: row.role || 'client',
    pro: {
      id: Number(row.pro_id),
      prenom: row.pro_prenom ?? null,
      nom: row.pro_nom ?? null,
      pro_company_name: row.pro_company_name ?? null,
      pro_category: row.pro_category ?? null,
      pro_commune: row.pro_commune ?? null,
      pro_phone: row.pro_phone ?? null,
      pro_website: row.pro_website ?? null,
      pro_hours: row.pro_hours ?? null,
      pro_logo_url: row.pro_logo_url ?? null,
      pro_banner_url: row.pro_banner_url ?? null,
      pro_avatar_url: row.pro_avatar_url ?? null,
      display_name: formatDisplayName(row),
    },
    requester: {
      id: row.requester_user_id == null ? null : Number(row.requester_user_id),
      prenom: row.requester_prenom ?? null,
      nom: row.requester_nom ?? null,
      avatar_url: row.requester_avatar_url ?? null,
      email: row.requester_email ?? null,
    },
    slot: row.slot_id == null ? null : {
      id: Number(row.slot_id),
      starts_at: row.slot_starts_at ?? row.starts_at,
      ends_at: row.slot_ends_at ?? row.ends_at,
      label: row.slot_label ?? null,
      status: row.slot_status ?? null,
    },
  };
}

async function loadBookingProfile(proId) {
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
       COALESCE(s.is_enabled, FALSE) AS booking_enabled,
       s.title AS booking_title,
       s.subtitle AS booking_subtitle,
       s.location_label AS booking_location_label,
       s.location_text AS booking_location_text,
       s.instructions AS booking_instructions,
       s.slot_duration_minutes AS booking_slot_duration_minutes,
       s.advance_notice_hours AS booking_advance_notice_hours,
       s.max_days_ahead AS booking_max_days_ahead
     FROM users u
     LEFT JOIN pro_booking_settings s ON s.pro_id = u.id
     WHERE u.id = $1
       AND u.is_pro = TRUE
       AND COALESCE(u.pro_verified, FALSE) = TRUE
       AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW())
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [proId]
  );

  const profile = result.rows[0];
  if (!profile) return null;

  return {
    id: Number(profile.id),
    prenom: profile.prenom ?? null,
    nom: profile.nom ?? null,
    display_name: formatDisplayName(profile),
    pro_company_name: profile.pro_company_name ?? null,
    pro_category: profile.pro_category ?? null,
    pro_logo_url: profile.pro_logo_url ?? null,
    pro_banner_url: profile.pro_banner_url ?? null,
    pro_description: profile.pro_description ?? null,
    pro_commune: profile.pro_commune ?? null,
    pro_website: profile.pro_website ?? null,
    pro_phone: profile.pro_phone ?? null,
    pro_hours: profile.pro_hours ?? null,
    pro_siret: profile.pro_siret ?? null,
    booking_settings: mapBookingSettings({
      is_enabled: profile.booking_enabled,
      title: profile.booking_title,
      subtitle: profile.booking_subtitle,
      location_label: profile.booking_location_label,
      location_text: profile.booking_location_text,
      instructions: profile.booking_instructions,
      slot_duration_minutes: profile.booking_slot_duration_minutes,
      advance_notice_hours: profile.booking_advance_notice_hours,
      max_days_ahead: profile.booking_max_days_ahead,
    }),
  };
}

async function loadUpcomingSlots(proId, limit = 12) {
  const result = await query(
    `SELECT
       id,
       pro_id,
       starts_at,
       ends_at,
       label,
       status,
       source,
       created_at
     FROM pro_booking_slots
     WHERE pro_id = $1
       AND status = 'available'
       AND starts_at >= NOW()
     ORDER BY starts_at ASC
     LIMIT $2`,
    [proId, limit]
  );

  return result.rows.map(mapBookingSlot);
}

async function loadBookingById(bookingId) {
  const result = await query(
    `SELECT
       b.*,
       p.prenom AS pro_prenom,
       p.nom AS pro_nom,
       p.pro_company_name,
       p.pro_category,
       p.pro_commune,
       p.pro_phone,
       p.pro_website,
       p.pro_hours,
       p.pro_logo_url,
       p.pro_banner_url,
       COALESCE(s.status, 'available') AS slot_status,
       s.starts_at AS slot_starts_at,
       s.ends_at AS slot_ends_at,
       s.label AS slot_label,
       r.prenom AS requester_prenom,
       r.nom AS requester_nom,
       r.avatar_url AS requester_avatar_url
     FROM pro_bookings b
     LEFT JOIN users p ON p.id = b.pro_id
     LEFT JOIN pro_booking_slots s ON s.id = b.slot_id
     LEFT JOIN users r ON r.id = b.requester_user_id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId]
  );

  return result.rows[0] || null;
}

async function notifyBookingCreated(bookingRow) {
  const proName = formatDisplayName(bookingRow);
  const startsAt = new Date(bookingRow.starts_at);
  const when = Number.isNaN(startsAt.getTime())
    ? 'votre créneau'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(startsAt);

  await createNotification(bookingRow.pro_id, {
    type: 'appointment_request',
    title: '📅 Nouveau rendez-vous demandé',
    body: `${bookingRow.requester_name} · ${when}`,
    href: '/pro/dashboard/rdv',
  });

  await sendPushToUser(bookingRow.pro_id, {
    title: 'Nouveau rendez-vous demandé',
    body: `${bookingRow.requester_name} a réservé ${when}`,
    data: { type: 'appointment_request', booking_id: bookingRow.id, pro_id: bookingRow.pro_id },
  }).catch(() => {});

  await sendMail({
    to: bookingRow.pro_email,
    subject: `Nouveau rendez-vous demandé - ${proName}`,
    html: `
      <p>Bonjour ${escapeHtml(proName)},</p>
      <p>Une nouvelle demande de rendez-vous vient d’être créée sur Troca.</p>
      <ul>
        <li><strong>Client :</strong> ${escapeHtml(bookingRow.requester_name)}</li>
        <li><strong>Créneau :</strong> ${escapeHtml(when)}</li>
        <li><strong>Objet :</strong> ${escapeHtml(bookingRow.subject)}</li>
        <li><strong>Commune :</strong> ${escapeHtml(bookingRow.commune || bookingRow.pro_commune || 'Non précisée')}</li>
      </ul>
      <p><a href="${BASE_URL}/pro/dashboard/rdv">Voir les rendez-vous</a></p>
    `,
  }).catch(() => {});

  if (bookingRow.requester_user_id) {
    await createNotification(bookingRow.requester_user_id, {
      type: 'appointment_request',
      title: '📅 Rendez-vous demandé',
      body: `${proName} a bien reçu votre demande.`,
      href: '/mes-rdv',
    });

    await sendPushToUser(bookingRow.requester_user_id, {
      title: 'Rendez-vous demandé',
      body: `Votre demande a été envoyée à ${proName}`,
      data: { type: 'appointment_request', booking_id: bookingRow.id, pro_id: bookingRow.pro_id },
    }).catch(() => {});
  }

  await sendMail({
    to: bookingRow.requester_email,
    subject: `Votre demande de rendez-vous a été envoyée - ${proName}`,
    html: `
      <p>Bonjour ${escapeHtml(bookingRow.requester_name)},</p>
      <p>Votre demande de rendez-vous a bien été envoyée à <strong>${escapeHtml(proName)}</strong>.</p>
      <ul>
        <li><strong>Créneau :</strong> ${escapeHtml(when)}</li>
        <li><strong>Objet :</strong> ${escapeHtml(bookingRow.subject)}</li>
      </ul>
      <p>Vous pourrez suivre son statut dans <a href="${BASE_URL}/mes-rdv">Mes rendez-vous</a>.</p>
    `,
  }).catch(() => {});
}

async function notifyBookingDecision(bookingRow, decision) {
  const proName = formatDisplayName(bookingRow);
  const startsAt = new Date(bookingRow.starts_at);
  const when = Number.isNaN(startsAt.getTime())
    ? 'votre créneau'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(startsAt);

  const configs = {
    confirmed: {
      title: '✅ Rendez-vous confirmé',
      body: `${proName} a confirmé votre demande pour ${when}.`,
      href: '/mes-rdv',
      subject: `Rendez-vous confirmé - ${proName}`,
      intro: 'a confirmé votre demande de rendez-vous.',
    },
    declined: {
      title: '❌ Rendez-vous refusé',
      body: `${proName} a refusé votre demande pour ${when}.`,
      href: '/mes-rdv',
      subject: `Rendez-vous refusé - ${proName}`,
      intro: 'a refusé votre demande de rendez-vous.',
    },
    cancelled: {
      title: '⏸️ Rendez-vous annulé',
      body: `${proName} a annulé le rendez-vous prévu pour ${when}.`,
      href: '/mes-rdv',
      subject: `Rendez-vous annulé - ${proName}`,
      intro: 'a annulé le rendez-vous prévu.',
    },
    completed: {
      title: '🎉 Rendez-vous terminé',
      body: `${proName} a marqué le rendez-vous comme terminé.`,
      href: '/mes-rdv',
      subject: `Rendez-vous terminé - ${proName}`,
      intro: 'a marqué le rendez-vous comme terminé.',
    },
  };

  const cfg = configs[decision];
  if (!cfg) return;

  if (bookingRow.requester_user_id) {
    await createNotification(bookingRow.requester_user_id, {
      type: `appointment_${decision}`,
      title: cfg.title,
      body: cfg.body,
      href: cfg.href,
    });

    await sendPushToUser(bookingRow.requester_user_id, {
      title: cfg.title,
      body: cfg.body,
      data: { type: `appointment_${decision}`, booking_id: bookingRow.id, pro_id: bookingRow.pro_id },
    }).catch(() => {});
  }

  await sendMail({
    to: bookingRow.requester_email,
    subject: cfg.subject,
    html: `
      <p>Bonjour ${escapeHtml(bookingRow.requester_name)},</p>
      <p><strong>${escapeHtml(proName)}</strong> ${escapeHtml(cfg.intro)}</p>
      <ul>
        <li><strong>Créneau :</strong> ${escapeHtml(when)}</li>
        <li><strong>Objet :</strong> ${escapeHtml(bookingRow.subject)}</li>
      </ul>
      <p>Consultez vos rendez-vous sur <a href="${BASE_URL}/mes-rdv">Mes rendez-vous</a>.</p>
    `,
  }).catch(() => {});
}

router.get('/bookings/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         b.id,
         b.pro_id,
         b.requester_user_id,
         b.slot_id,
         b.requester_name,
         b.requester_email,
         b.requester_phone,
         b.commune,
         b.subject,
         b.details,
         b.starts_at,
         b.ends_at,
         b.status,
         b.source,
         b.confirmed_at,
         b.declined_at,
         b.cancelled_at,
         b.completed_at,
         b.created_at,
         b.updated_at,
         CASE WHEN b.requester_user_id = $1 THEN 'client' ELSE 'pro' END AS role,
         p.prenom AS pro_prenom,
         p.nom AS pro_nom,
         p.pro_company_name,
         p.pro_category,
         p.pro_commune,
         p.pro_phone,
         p.pro_website,
         p.pro_hours,
         p.pro_logo_url,
         p.pro_banner_url,
         p.avatar_url AS pro_avatar_url,
         requester.prenom AS requester_prenom,
         requester.nom AS requester_nom,
         requester.avatar_url AS requester_avatar_url,
         s.status AS slot_status,
         s.starts_at AS slot_starts_at,
         s.ends_at AS slot_ends_at,
         s.label AS slot_label
       FROM pro_bookings b
       LEFT JOIN users p ON p.id = b.pro_id
       LEFT JOIN users requester ON requester.id = b.requester_user_id
       LEFT JOIN pro_booking_slots s ON s.id = b.slot_id
       WHERE b.requester_user_id = $1
          OR b.pro_id = $1
       ORDER BY b.starts_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows.map(mapBookingRow) });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/bookings', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const [settingsRes, slotsRes, bookingsRes] = await Promise.all([
      query(`SELECT * FROM pro_booking_settings WHERE pro_id = $1 LIMIT 1`, [req.user.id]),
      query(
        `SELECT id, pro_id, starts_at, ends_at, label, status, source, created_at
         FROM pro_booking_slots
         WHERE pro_id = $1
         ORDER BY starts_at DESC
         LIMIT 30`,
        [req.user.id]
      ),
      query(
        `SELECT
           b.id,
           b.pro_id,
           b.requester_user_id,
           b.slot_id,
           b.requester_name,
           b.requester_email,
           b.requester_phone,
           b.commune,
           b.subject,
           b.details,
           b.starts_at,
           b.ends_at,
           b.status,
           b.source,
           b.confirmed_at,
           b.declined_at,
           b.cancelled_at,
           b.completed_at,
           b.created_at,
           b.updated_at,
           CASE WHEN b.requester_user_id = $1 THEN 'client' ELSE 'pro' END AS role,
           p.prenom AS pro_prenom,
           p.nom AS pro_nom,
           p.pro_company_name,
           p.pro_category,
           p.pro_commune,
           p.pro_phone,
           p.pro_website,
           p.pro_hours,
           p.pro_logo_url,
           p.pro_banner_url,
           p.avatar_url AS pro_avatar_url,
           requester.prenom AS requester_prenom,
           requester.nom AS requester_nom,
           requester.avatar_url AS requester_avatar_url,
           s.status AS slot_status,
           s.starts_at AS slot_starts_at,
           s.ends_at AS slot_ends_at,
           s.label AS slot_label
         FROM pro_bookings b
         LEFT JOIN users p ON p.id = b.pro_id
         LEFT JOIN users requester ON requester.id = b.requester_user_id
         LEFT JOIN pro_booking_slots s ON s.id = b.slot_id
         WHERE b.pro_id = $1
         ORDER BY b.starts_at DESC
         LIMIT 50`,
        [req.user.id]
      ),
    ]);

    return res.json({
      data: {
        settings: mapBookingSettings(settingsRes.rows[0]),
        slots: slotsRes.rows.map(mapBookingSlot),
        bookings: bookingsRes.rows.map(mapBookingRow),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/booking-settings', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const result = await query(`SELECT * FROM pro_booking_settings WHERE pro_id = $1 LIMIT 1`, [req.user.id]);
    return res.json({ data: mapBookingSettings(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.put('/dashboard/booking-settings', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const { error, value } = bookingSettingsSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await query(
      `INSERT INTO pro_booking_settings (
         pro_id,
         is_enabled,
         title,
         subtitle,
         location_label,
         location_text,
         instructions,
         slot_duration_minutes,
         advance_notice_hours,
         max_days_ahead
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (pro_id)
       DO UPDATE SET
         is_enabled = EXCLUDED.is_enabled,
         title = EXCLUDED.title,
         subtitle = EXCLUDED.subtitle,
         location_label = EXCLUDED.location_label,
         location_text = EXCLUDED.location_text,
         instructions = EXCLUDED.instructions,
         slot_duration_minutes = EXCLUDED.slot_duration_minutes,
         advance_notice_hours = EXCLUDED.advance_notice_hours,
         max_days_ahead = EXCLUDED.max_days_ahead,
         updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        value.is_enabled,
        normalizeMaybeText(value.title) || 'Prendre rendez-vous',
        normalizeMaybeText(value.subtitle) || 'Réservez un créneau directement avec ce professionnel.',
        normalizeMaybeText(value.location_label) || 'Lieu du rendez-vous',
        normalizeMaybeText(value.location_text),
        normalizeMaybeText(value.instructions),
        Number(value.slot_duration_minutes ?? 30),
        Number(value.advance_notice_hours ?? 24),
        Number(value.max_days_ahead ?? 30),
      ]
    );

    return res.json({ data: mapBookingSettings(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/dashboard/booking-slots', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const { error, value } = slotSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const start = new Date(value.starts_at);
    const end = new Date(value.ends_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: 'Le créneau est invalide.' });
    }

    const profile = await loadBookingProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    const overlap = await query(
      `SELECT id
       FROM pro_booking_slots
       WHERE pro_id = $1
         AND status <> 'cancelled'
         AND NOT (ends_at <= $2 OR starts_at >= $3)
       LIMIT 1`,
      [req.user.id, start.toISOString(), end.toISOString()]
    );
    if (overlap.rows.length) {
      return res.status(409).json({ error: 'Ce créneau chevauche déjà un autre rendez-vous.' });
    }

    const result = await query(
      `INSERT INTO pro_booking_slots (pro_id, starts_at, ends_at, label, status, source)
       VALUES ($1, $2, $3, $4, 'available', 'dashboard')
       RETURNING *`,
      [
        req.user.id,
        start.toISOString(),
        end.toISOString(),
        normalizeMaybeText(value.label),
      ]
    );

    return res.status(201).json({ data: mapBookingSlot(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.delete('/dashboard/booking-slots/:slotId', authenticate, async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const slotId = Number(req.params.slotId);
    if (!Number.isFinite(slotId) || slotId <= 0) {
      return res.status(400).json({ error: 'Créneau invalide.' });
    }

    const result = await query(
      `DELETE FROM pro_booking_slots
       WHERE id = $1
         AND pro_id = $2
         AND status = 'available'
       RETURNING id`,
      [slotId, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Créneau introuvable ou déjà réservé.' });
    }

    return res.json({ data: { id: slotId, deleted: true } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/booking-slots', optionalAuth, async (req, res, next) => {
  try {
    const proId = Number(req.params.id);
    if (!Number.isFinite(proId) || proId <= 0) {
      return res.status(400).json({ error: 'Professionnel invalide.' });
    }

    const profile = await loadBookingProfile(proId);
    if (!profile) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }

    const slots = await loadUpcomingSlots(proId, 12);
    return res.json({
      data: {
        profile,
        settings: profile.booking_settings,
        slots,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/bookings', optionalAuth, async (req, res, next) => {
  try {
    const proId = Number(req.params.id);
    if (!Number.isFinite(proId) || proId <= 0) {
      return res.status(400).json({ error: 'Professionnel invalide.' });
    }

    const { error, value } = bookingSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const profile = await loadBookingProfile(proId);
    if (!profile) {
      return res.status(404).json({ error: 'Professionnel introuvable.' });
    }
    if (!profile.booking_settings.is_enabled) {
      return res.status(403).json({ error: 'La prise de rendez-vous est actuellement désactivée.' });
    }

    const booking = await withTransaction(async (client) => {
      const slotResult = await client.query(
        `SELECT id, pro_id, starts_at, ends_at, label, status
         FROM pro_booking_slots
         WHERE id = $1
           AND pro_id = $2
         LIMIT 1
         FOR UPDATE`,
        [value.slot_id, proId]
      );

      const slot = slotResult.rows[0];
      if (!slot) {
        const error = new Error('Créneau introuvable.');
        error.status = 404;
        throw error;
      }
      if (slot.status !== 'available') {
        const error = new Error('Ce créneau n’est plus disponible.');
        error.status = 409;
        throw error;
      }

      const now = Date.now();
      const slotStart = new Date(slot.starts_at);
      const slotEnd = new Date(slot.ends_at);
      if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
        const error = new Error('Le créneau est invalide.');
        error.status = 400;
        throw error;
      }

      const minDelay = Number(profile.booking_settings.advance_notice_hours || 24) * 60 * 60 * 1000;
      const maxDelay = Number(profile.booking_settings.max_days_ahead || 30) * 24 * 60 * 60 * 1000;
      if (slotStart.getTime() - now < minDelay) {
        const error = new Error('Ce créneau ne respecte plus le délai minimal de réservation.');
        error.status = 400;
        throw error;
      }
      if (slotStart.getTime() - now > maxDelay) {
        const error = new Error('Ce créneau est trop lointain.');
        error.status = 400;
        throw error;
      }

      const insertRes = await client.query(
        `INSERT INTO pro_bookings (
           pro_id,
           requester_user_id,
           slot_id,
           requester_name,
           requester_email,
           requester_phone,
           commune,
           subject,
           details,
           starts_at,
           ends_at,
           status,
           source
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'public')
         RETURNING *`,
        [
          proId,
          req.user?.id ? Number(req.user.id) : null,
          slot.id,
          normalizeMaybeText(value.requester_name),
          normalizeMaybeText(value.requester_email),
          normalizeMaybeText(value.requester_phone),
          normalizeMaybeText(value.commune),
          normalizeMaybeText(value.subject),
          normalizeMaybeText(value.details),
          slot.starts_at,
          slot.ends_at,
        ]
      );

      await client.query(
        `UPDATE pro_booking_slots
         SET status = 'booked',
             updated_at = NOW()
         WHERE id = $1`,
        [slot.id]
      );

      return insertRes.rows[0];
    });

    const enrichedBooking = {
      ...booking,
      pro_email: (await query('SELECT email FROM users WHERE id = $1 LIMIT 1', [proId])).rows[0]?.email || null,
      pro_commune: profile.pro_commune || null,
      pro_company_name: profile.pro_company_name || null,
      pro_prenom: profile.prenom || null,
      pro_nom: profile.nom || null,
    };

    await notifyBookingCreated(enrichedBooking);

    return res.status(201).json({
      data: {
        ...mapBookingRow({
          ...enrichedBooking,
          role: req.user?.id ? 'client' : 'client',
        }),
        settings: profile.booking_settings,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/confirm', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const booking = await loadBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }
    if (Number(booking.pro_id) !== Number(req.user.id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Cette réservation ne peut plus être confirmée.' });
    }

    const updated = await query(
      `UPDATE pro_bookings
       SET status = 'confirmed',
           confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId]
    );

    await notifyBookingDecision(booking, 'confirmed');

    return res.json({ data: mapBookingRow({ ...booking, ...updated.rows[0], role: 'pro' }) });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/decline', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const booking = await loadBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }
    if (Number(booking.pro_id) !== Number(req.user.id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Cette réservation ne peut plus être refusée.' });
    }

    const updated = await withTransaction(async (client) => {
      const bookingUpdate = await client.query(
        `UPDATE pro_bookings
         SET status = 'declined',
             declined_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [bookingId]
      );

      if (booking.slot_id) {
        await client.query(
          `UPDATE pro_booking_slots
           SET status = 'available',
               updated_at = NOW()
           WHERE id = $1`,
          [booking.slot_id]
        );
      }

      return bookingUpdate.rows[0];
    });

    await notifyBookingDecision(booking, 'declined');
    return res.json({ data: mapBookingRow({ ...booking, ...updated, role: 'pro' }) });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/cancel', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const booking = await loadBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }

    const isParticipant = Number(booking.pro_id) === Number(req.user.id) || Number(booking.requester_user_id) === Number(req.user.id);
    if (!isParticipant && !req.user.is_admin) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cette réservation ne peut plus être annulée.' });
    }

    const updated = await withTransaction(async (client) => {
      const bookingUpdate = await client.query(
        `UPDATE pro_bookings
         SET status = 'cancelled',
             cancelled_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [bookingId]
      );

      if (booking.slot_id) {
        await client.query(
          `UPDATE pro_booking_slots
           SET status = 'available',
               updated_at = NOW()
           WHERE id = $1`,
          [booking.slot_id]
        );
      }

      return bookingUpdate.rows[0];
    });

    await notifyBookingDecision(booking, 'cancelled');
    return res.json({ data: mapBookingRow({ ...booking, ...updated, role: booking.requester_user_id === req.user.id ? 'client' : 'pro' }) });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/complete', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const booking = await loadBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }
    if (Number(booking.pro_id) !== Number(req.user.id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const updated = await query(
      `UPDATE pro_bookings
       SET status = 'completed',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId]
    );

    await notifyBookingDecision(booking, 'completed');
    return res.json({ data: mapBookingRow({ ...booking, ...updated.rows[0], role: 'pro' }) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
