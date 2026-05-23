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
         payment_provider,
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

    const latest = rows[0] ?? null;
    if (!latest) {
      return res.json({
        data: {
          plan: 'free',
          status: 'expired',
          current_period_end: null,
          days_remaining: 0,
          payment_provider: null,
          payment_status: null,
        },
      });
    }

    const periodEnd = latest.current_period_end ? new Date(latest.current_period_end) : null;
    const now = Date.now();
    const daysRemaining = periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - now) / 86_400_000))
      : 0;

    let computedStatus = 'active';
    if (latest.payment_status === 'failed' || latest.status === 'past_due') {
      computedStatus = 'payment_failed';
    } else if (!periodEnd || periodEnd.getTime() <= now) {
      computedStatus = 'expired';
    } else if (daysRemaining < 7) {
      computedStatus = 'expiring_soon';
    }

    return res.json({
      data: {
        ...latest,
        plan: latest.plan_id || 'free',
        status: computedStatus,
        current_period_end: periodEnd ? periodEnd.toISOString() : null,
        days_remaining: daysRemaining,
        payment_provider: latest.payment_provider ?? latest.provider ?? null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur rÃ©cupÃ©ration statut abonnement' });
  }
});

module.exports = router;
