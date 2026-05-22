'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

const router = Router();

router.get('/status', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         id,
         plan_id,
         billing_period,
         provider,
         provider_sub_id,
         status,
         payment_status,
         payment_status_updated_at,
         current_period_end,
         updated_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    return res.json({
      data: rows[0] ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération statut abonnement' });
  }
});

module.exports = router;
