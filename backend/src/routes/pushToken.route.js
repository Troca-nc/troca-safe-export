'use strict';

// ============================================================
//  Troca — Route push tokens
//  POST /api/users/push-token   — Enregistrer / mettre à jour
//  DELETE /api/users/push-token — Supprimer (déconnexion)
// ============================================================

const { Router } = require('express');
const Joi        = require('joi');
const { authenticate }  = require('../middleware/auth');
const { validate }      = require('../middleware/validate');
const { query }         = require('../config/database');

const router = Router();
router.use(authenticate);

const schema = {
  body: Joi.object({
    token:    Joi.string().max(500).required(),
    platform: Joi.string().valid('ios', 'android', 'web').default('ios'),
  }),
};

// ── POST /api/users/push-token ───────────────────────────────
router.post('/push-token', validate(schema), async (req, res, next) => {
  try {
    const { token, platform } = req.body;

    await query(`
      INSERT INTO push_tokens (user_id, token, platform, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (token)
      DO UPDATE SET user_id = $1, platform = $3, updated_at = NOW()
    `, [req.user.id, token, platform]);

    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── DELETE /api/users/push-token ─────────────────────────────
router.delete('/push-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (token) {
      await query('DELETE FROM push_tokens WHERE token = $1 AND user_id = $2', [token, req.user.id]);
    } else {
      await query('DELETE FROM push_tokens WHERE user_id = $1', [req.user.id]);
    }
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
