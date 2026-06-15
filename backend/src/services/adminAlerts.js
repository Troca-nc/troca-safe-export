'use strict';

const { query } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { sendMail } = require('./emailService');

const ALERT_KEY = 'admin:alerts';
const CRITICAL_EMAIL_KEY = 'admin:last_critical_email';

function parseRedisInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function getErrorRate(windowMinutes = 15) {
  const redis = await getRedisClient();
  if (!redis) return 0;
  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: 'errors:*', COUNT: 200 })) {
    keys.push(key);
  }
  if (!keys.length) return 0;

  const limitTs = Date.now() - windowMinutes * 60 * 1000;
  let total = 0;
  for (const key of keys) {
    const count = parseRedisInteger(await redis.get(key).catch(() => 0));
    total += count;
  }
  return total / Math.max(1, windowMinutes * 60);
}

async function checkAdminAlerts() {
  const alerts = [];
  const redis = await getRedisClient();

  const errorRate = await getErrorRate(15);
  if (errorRate > 0.05) {
    alerts.push({
      level: 'critical',
      type: 'error_rate',
      title: 'Taux d’erreur API élevé',
      message: `Taux d’erreur API : ${(errorRate * 100).toFixed(1)}% sur 15 min`,
      action_url: '/errors',
    });
  }

  const currentAdminAlerts = redis ? await redis.get(ALERT_KEY).catch(() => null) : null;
  if (currentAdminAlerts) {
    try {
      const parsed = JSON.parse(currentAdminAlerts);
      if (Array.isArray(parsed)) {
        alerts.push(...parsed);
      }
    } catch {}
  }

  const stuckPayments = await query(`
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT id FROM subscriptions WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour'
      UNION ALL
      SELECT id FROM annonce_boosts WHERE starts_at < NOW() - INTERVAL '1 hour' AND expires_at > NOW()
    ) t
  `).catch(() => ({ rows: [{ total: 0 }] }));

  const pendingPayments = Number(stuckPayments.rows[0]?.total || 0);
  if (pendingPayments > 0) {
    alerts.push({
      level: 'warning',
      type: 'stuck_payments',
      title: 'Paiements en attente',
      message: `${pendingPayments} paiement(s) bloqué(s) depuis plus d’1h`,
      action_url: '/payments',
    });
  }

  const urgentReports = await query(`
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT annonce_id
      FROM signalements
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY annonce_id
      HAVING COUNT(*) >= 3
    ) t
  `).catch(() => ({ rows: [{ total: 0 }] }));

  const reportCount = Number(urgentReports.rows[0]?.total || 0);
  if (reportCount > 0) {
    alerts.push({
      level: 'warning',
      type: 'urgent_reports',
      title: 'Signalements urgents',
      message: `${reportCount} annonce(s) signalée(s) 3× ou plus en 1h`,
      action_url: '/moderation',
    });
  }

  if (redis) {
    await redis.setEx(ALERT_KEY, 300, JSON.stringify(alerts)).catch(() => {});

    const criticalAlerts = alerts.filter((alert) => alert.level === 'critical');
    if (criticalAlerts.length > 0) {
      const lastNotified = parseRedisInteger(await redis.get(CRITICAL_EMAIL_KEY).catch(() => 0));
      if (!lastNotified || Date.now() - lastNotified > 30 * 60 * 1000) {
        const targetEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL
        if (targetEmail) {
          await sendMail({
            to: targetEmail,
            subject: `🔴 Alerte critique Kalico — ${criticalAlerts[0].message}`,
            html: `<p>${criticalAlerts.map((alert) => alert.message).join('<br/>')}</p>`,
          }).catch(() => {});
          await redis.setEx(CRITICAL_EMAIL_KEY, 1800, String(Date.now())).catch(() => {});
        }
      }
    }
  }

  return alerts
}

module.exports = {
  checkAdminAlerts,
}
