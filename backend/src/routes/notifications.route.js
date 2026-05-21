'use strict';

// ============================================================
//  Troca — Routes notifications in-app
//  GET  /api/users/notifications          — Liste (20 dernières)
//  POST /api/users/notifications/:id/read — Marquer une comme lue
//  POST /api/users/notifications/read-all — Tout marquer lu
//
//  Les notifications sont générées par les événements du backend :
//  • Nouveau message         → via messages.js
//  • Alerte de recherche     → via scheduler.js
//  • Annonce expirant dans 3j → via scheduler.js (cron daily)
// ============================================================

const { Router }  = require('express');
const { authenticate }  = require('../middleware/auth');
const { query }         = require('../config/database');

const router = Router();
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
