'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const { PRO_PLANS, BOOST_CATALOG, XPF_PER_EUR } = require('../services/paymentCatalog');

const router = Router();

function xpfToEur(xpf) {
  return Math.round(xpf / XPF_PER_EUR);
}

router.get('/plans', async (_req, res) => {
  const pro = PRO_PLANS.pro || { monthly: { amount_xpf: 4900 }, yearly: { amount_xpf: 44900 } };
  return res.json({
    data: {
      plans: [
        {
          id: 'free',
          name: 'Gratuit',
          price_monthly_xpf: 0,
          price_yearly_xpf: 0,
          target: 'personal',
          features: {
            maxActiveListings: 5,
            maxPhotosPerListing: 6,
            listingDurationDays: 60,
            chat: true,
            phoneVerification: true,
            listingStats: false,
            sellerBadge: false,
            boosts: 'paid',
          },
        },
        {
          id: 'pro',
          name: 'Pro',
          price_monthly_xpf: pro.monthly.amount_xpf,
          price_yearly_xpf: pro.yearly.amount_xpf,
          price_monthly_eur: xpfToEur(pro.monthly.amount_xpf),
          price_yearly_eur: xpfToEur(pro.yearly.amount_xpf),
          savings_months: 2,
          target: 'professional',
          features: {
            maxActiveListings: 'unlimited',
            maxPhotosPerListing: 12,
            listingDurationDays: 'permanent',
            chat: true,
            phoneVerification: true,
            listingStats: true,
            sellerBadge: true,
            boosts: 'discount',
            pinnedPerCategory: 1,
            prioritySupport: true,
          },
        },
      ],
      boosts: BOOST_CATALOG.map((boost) => ({
        type: boost.type,
        duration_days: boost.duration,
        price_xpf: boost.price_xpf,
        price_xpf_pro: Math.max(1, Math.round(boost.price_xpf * 0.8)),
      })),
    },
  });
});

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
