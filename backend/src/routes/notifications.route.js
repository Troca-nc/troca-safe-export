'use strict';

// ============================================================
//  Kalico — Routes notifications in-app et préférences
//  GET  /api/users/notifications                 — Liste
//  GET  /api/users/notifications/preferences     — Préférences
//  PUT  /api/users/notifications/preferences     — Mise à jour
//  GET  /api/users/notifications/unsubscribe/:token — Désabonnement public
//  POST /api/users/notifications/:id/read        — Marquer une comme lue
//  POST /api/users/notifications/read-all        — Tout marquer lu
// ============================================================

const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const {
  disableNotificationByToken,
  getNotificationPreferences,
  saveNotificationPreferences,
} = require('../services/notificationPreferencesService');

const router = express.Router();

const preferencesSchema = Joi.object({
  email_new_message: Joi.boolean().optional(),
  push_new_message: Joi.boolean().optional(),
  email_search_alert: Joi.boolean().optional(),
  push_search_alert: Joi.boolean().optional(),
  email_boost_activated: Joi.boolean().optional(),
  email_offer_received: Joi.boolean().optional(),
  email_listing_expiring: Joi.boolean().optional(),
  email_listing_expired: Joi.boolean().optional(),
  email_performance_report: Joi.boolean().optional(),
  push_performance_report: Joi.boolean().optional(),
  performance_report_frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'never').optional(),
});

function renderUnsubscribeResult(title, message, status = 'success') {
  const background = status === 'success' ? '#f0fdf4' : '#fff7ed';
  const border = status === 'success' ? '#bbf7d0' : '#fed7aa';
  const accent = status === 'success' ? '#15803d' : '#c2410c';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:32px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid ${border};border-radius:20px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.08)">
    <div style="padding:28px 30px;background:${background};border-bottom:1px solid ${border}">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${accent};">Kalico</p>
      <h1 style="margin:0;font-size:26px;line-height:1.2;">${title}</h1>
    </div>
    <div style="padding:28px 30px;font-size:16px;line-height:1.7;">
      <p style="margin:0 0 16px;">${message}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">
        Vous pouvez ajuster vos préférences depuis votre compte Kalico si vous souhaitez réactiver certaines notifications.
      </p>
      <p style="margin:24px 0 0;">
        <a href="${process.env.BASE_URL || 'https://kalico.nc'}/parametres/notifications"
           style="display:inline-block;background:#0a7ea4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">
          Gérer mes notifications
        </a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Public unsubscribe before auth middleware
router.get('/unsubscribe/:token', async (req, res, next) => {
  try {
    const prefs = await disableNotificationByToken(req.params.token);
    if (!prefs) {
      return res.status(404).send(renderUnsubscribeResult(
        'Lien expiré',
        'Le lien de désabonnement est invalide ou a déjà été utilisé.',
        'warning'
      ));
    }

    const message = prefs.email_new_message === false && prefs.email_performance_report === false
      ? 'Votre désabonnement a bien été pris en compte.'
      : 'Vos préférences ont été mises à jour.';

    return res.status(200).send(renderUnsubscribeResult(
      'Désabonnement confirmé',
      message,
      'success'
    ));
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

// ── GET /api/users/notifications ─────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(`
      SELECT id, type, title, body, href, is_read AS read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, Math.min(Number(limit), 50), Number(offset)]);

    const unread = await query(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    return res.json({
      data:   result.rows,
      unread: Number(unread.rows[0]?.n ?? 0),
    });
  } catch (err) { next(err); }
});

router.get('/preferences', async (req, res, next) => {
  try {
    const prefs = await getNotificationPreferences(req.user.id);
    return res.json({ data: prefs });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', async (req, res, next) => {
  try {
    const { error, value } = preferencesSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const prefs = await saveNotificationPreferences(req.user.id, value);
    return res.json({ data: prefs });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/notifications/:id/read ───────────────────

router.post('/:id/read', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── POST /api/users/notifications/read-all ───────────────────

router.post('/read-all', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
