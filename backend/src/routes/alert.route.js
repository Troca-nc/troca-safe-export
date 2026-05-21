'use strict';

// ============================================================
//  Troca — Routes alertes de recherche
//  GET    /api/alerts              — Mes alertes
//  POST   /api/alerts              — Créer une alerte
//  PATCH  /api/alerts/:id          — Modifier (pause/reprendre)
//  DELETE /api/alerts/:id          — Supprimer
//  GET    /api/alerts/unsubscribe/:token — Désabonnement email
// ============================================================

const { Router } = require('express');
const Joi        = require('joi');
const { v4: uuidv4 }      = require('uuid');
const { authenticate }    = require('../middleware/auth');
const { validate }        = require('../middleware/validate');
const { query }           = require('../config/database');

const router = Router();

// ── Désabonnement par email (sans auth) ──────────────────────

router.get('/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  if (!token || token.length > 64) {
    return res.status(400).send('Lien invalide.');
  }

  const result = await query(
    `UPDATE search_alerts SET status = 'deleted', updated_at = NOW()
     WHERE unsubscribe_token = $1 AND status != 'deleted'
     RETURNING label`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (!result.rows[0]) {
    return res.send('Cette alerte est déjà supprimée ou le lien est invalide.');
  }

  return res.send(`
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
    <title>Désabonnement — Troca</title>
    <style>body{font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center;color:#1f2937;}
    h1{color:#2563eb;}a{color:#2563eb;}</style></head><body>
    <h1>✅ Désabonné</h1>
    <p>Vous ne recevrez plus d'emails pour l'alerte <strong>"${result.rows[0].label}"</strong>.</p>
    <p><a href="${process.env.BASE_URL || 'https://troca.nc'}">Retour sur Troca</a></p>
    </body></html>
  `);
});

// ── Routes authentifiées ─────────────────────────────────────

router.use(authenticate);

// ── Schémas ──────────────────────────────────────────────────

const createSchema = {
  body: Joi.object({
    label:     Joi.string().min(1).max(200).required(),
    filters:   Joi.object().default({}),
    frequency: Joi.string().valid('immediate', 'daily', 'weekly').default('daily'),
  }),
};

const patchSchema = {
  body: Joi.object({
    status:    Joi.string().valid('active', 'paused').optional(),
    frequency: Joi.string().valid('immediate', 'daily', 'weekly').optional(),
    label:     Joi.string().min(1).max(200).optional(),
  }).min(1),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

const idParams = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

// ── GET /api/alerts ──────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, label, filters, frequency, status, nb_results, last_sent_at, created_at
       FROM search_alerts
       WHERE user_id = $1 AND status != 'deleted'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// ── POST /api/alerts ─────────────────────────────────────────

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { label, filters, frequency } = req.body;
    const token = uuidv4().replace(/-/g, '');

    const result = await query(
      `INSERT INTO search_alerts (user_id, label, filters, frequency, unsubscribe_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, label, filters, frequency, status, created_at`,
      [req.user.id, label, JSON.stringify(filters), frequency, token]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.message?.includes('Maximum 10 alertes')) {
      return res.status(429).json({ error: 'Vous avez atteint la limite de 10 alertes actives' });
    }
    next(err);
  }
});

// ── PATCH /api/alerts/:id ────────────────────────────────────

router.patch('/:id', validate(patchSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sets  = [];
    const vals  = [];
    let   idx   = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (['status', 'frequency', 'label'].includes(key)) {
        sets.push(`${key} = $${idx++}`);
        vals.push(val);
      }
    }
    sets.push(`updated_at = NOW()`);
    vals.push(id, req.user.id);

    const result = await query(
      `UPDATE search_alerts SET ${sets.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx} AND status != 'deleted'
       RETURNING id, label, status, frequency`,
      vals
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Alerte introuvable' });
    return res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /api/alerts/:id ───────────────────────────────────

router.delete('/:id', validate(idParams), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE search_alerts SET status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != 'deleted'
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Alerte introuvable' });
    return res.json({ message: 'Alerte supprimée' });
  } catch (err) { next(err); }
});

module.exports = router;
