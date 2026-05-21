'use strict';

// ============================================================
//  Troca — Jobs planifiés (node-cron)
//  • Expiration des boosts payés
//  • Envoi des alertes de recherche (daily + weekly)
//  • Matching immediate des nouvelles annonces
// ============================================================

const cron                = require('node-cron');
const { query }           = require('../config/database');
const { sendAlertEmail }  = require('../services/emailService');
const { notifyListingExpiring } = require('../services/notificationService');
const { withLock }        = require('../services/sharedCache');
const { logger }          = require('../utils/logger');
const { recordJob }       = require('../services/observability');

async function runSingletonJob(lockName, ttlMs, task) {
  const started = await withLock(lockName, ttlMs, async () => {
    await task();
    return true;
  });
  if (!started) {
    recordJob('skipped', { lock_name: lockName });
    logger.info('cron_skip_locked', { lock_name: lockName });
  }
}

// ── 1. Expiration des boosts ─────────────────────────────────
// Toutes les heures : désactive les boosts dont boost_expires_at est passé

function startBoostExpiryJob() {
  cron.schedule('0 * * * *', async () => {
    recordJob('started', { job: 'boost-expiry' });
    await runSingletonJob('cron:boost-expiry', 50 * 60 * 1000, async () => {
      try {
        const result = await query(`
          UPDATE annonces
          SET is_boosted = FALSE, boost_type = NULL, boost_expires_at = NULL, updated_at = NOW()
          WHERE is_boosted = TRUE AND boost_expires_at < NOW()
          RETURNING id
        `);
        if (result.rowCount > 0) {
          logger.info('cron_boost_expired', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'boost-expiry', message: err.message });
        logger.error('cron_boost_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'boost-expiry' });
}

// ── 2. Envoi des alertes daily ───────────────────────────────
// Tous les jours à 8h00 heure Nouméa

// ── 2. Email + notif relance annonces expirant dans 3 jours ─────
// Tous les jours à 9h00 heure Nouméa

function startExpiringListingsJob() {
  cron.schedule('0 9 * * *', async () => {
    recordJob('started', { job: 'expiring-listings' });
    await runSingletonJob('cron:expiring-listings', 30 * 60 * 1000, async () => {
      try {
        // Annonces actives qui expirent dans 3 jours exactement (±1h)
        const result = await query(`
          SELECT a.id, a.titre, a.user_id, u.email, u.prenom
          FROM annonces a
          JOIN users u ON u.id = a.user_id
          WHERE a.status = 'active'
            AND a.expires_at BETWEEN NOW() + INTERVAL '2 days 23 hours'
                                 AND NOW() + INTERVAL '3 days 1 hour'
            AND a.deleted_at IS NULL
            AND u.deleted_at IS NULL
        `);

        for (const row of result.rows) {
          // Notification in-app
          await notifyListingExpiring(row.user_id, row.id, row.titre, 3).catch(() => {});

          // Email de relance
          const emailService = require('../services/emailService');
          const baseUrl = process.env.BASE_URL || 'https://troca.nc';
          await emailService.sendMail({
            to:      row.email,
            subject: '[Troca] Votre annonce expire dans 3 jours',
            html: '<p>Bonjour ' + row.prenom + ',</p>'
                + '<p>Votre annonce <strong>' + row.titre + '</strong> expire dans 3 jours.</p>'
                + '<p><a href="' + baseUrl + '/annonces/' + row.id + '/edit" '
                + 'style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;'
                + 'text-decoration:none;font-weight:bold;display:inline-block;">Republier mon annonce</a></p>',
          }).catch(() => {});
        }

        if (result.rowCount > 0) {
          logger.info('cron_expiring_listings_notified', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'expiring-listings', message: err.message });
        logger.error('cron_expiring_listings_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'expiring-listings' });
}

function startDailyAlertsJob() {
  cron.schedule('0 8 * * *', () => runSingletonJob('cron:alerts-daily', 30 * 60 * 1000, () => runAlertJob('daily')), { timezone: 'Pacific/Noumea' });
  recordJob('started', { job: 'alerts-daily' });
  logger.info('cron_job_started', { job: 'alerts-daily' });
}

// ── 3. Envoi des alertes weekly ──────────────────────────────
// Tous les lundis à 8h00 heure Nouméa

function startWeeklyAlertsJob() {
  cron.schedule('0 8 * * 1', () => runSingletonJob('cron:alerts-weekly', 30 * 60 * 1000, () => runAlertJob('weekly')), { timezone: 'Pacific/Noumea' });
  recordJob('started', { job: 'alerts-weekly' });
  logger.info('cron_job_started', { job: 'alerts-weekly' });
}

function startAnalyticsPurgeJob() {
  cron.schedule('30 3 * * *', async () => {
    recordJob('started', { job: 'analytics-purge' });
    await runSingletonJob('cron:analytics-purge', 20 * 60 * 1000, async () => {
      try {
        const result = await query(`
          DELETE FROM analytics_events
          WHERE created_at < NOW() - INTERVAL '90 days'
        `);
        if (result.rowCount > 0) {
          logger.info('cron_analytics_purged', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'analytics-purge', message: err.message });
        logger.error('cron_analytics_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'analytics-purge' });
}

// ── Logique de matching des alertes ──────────────────────────

async function runAlertJob(frequency) {
  logger.info('cron_alerts_start', { frequency });
  let sent = 0;
  let errors = 0;

  try {
    // Récupérer toutes les alertes actives pour cette fréquence
    const alerts = await query(`
      SELECT sa.id, sa.user_id, sa.label, sa.filters, sa.unsubscribe_token,
             sa.last_sent_at, u.email, u.prenom
      FROM search_alerts sa
      JOIN users u ON u.id = sa.user_id
      WHERE sa.status = 'active'
        AND sa.frequency = $1
        AND u.deleted_at IS NULL
    `, [frequency]);

    for (const alert of alerts.rows) {
      try {
        const annonces = await matchAlerteAnnonces(alert);
        if (!annonces.length) continue;

        await sendAlertEmail(alert.email, alert.prenom, alert, annonces);

        // Logger les annonces envoyées pour éviter les doublons
        for (const a of annonces) {
          await query(`
            INSERT INTO alert_sent_log (alert_id, annonce_id)
            VALUES ($1, $2)
            ON CONFLICT (alert_id, annonce_id) DO NOTHING
          `, [alert.id, a.id]).catch(() => {});
        }

        // Mettre à jour last_sent_at et nb_results
        await query(`
          UPDATE search_alerts
          SET last_sent_at = NOW(), nb_results = nb_results + $2, updated_at = NOW()
          WHERE id = $1
        `, [alert.id, annonces.length]);

        sent++;
      } catch (alertErr) {
        recordJob('error', { job: `alerts-${frequency}`, message: alertErr.message });
        logger.error('cron_alerts_alert_error', { alert_id: alert.id, error: alertErr });
        errors++;
      }
    }
  } catch (err) {
    recordJob('error', { job: `alerts-${frequency}`, message: err.message });
    logger.error('cron_alerts_general_error', { frequency, error: err });
  }

  logger.info('cron_alerts_done', { frequency, sent, errors });
}

/**
 * Trouve les annonces correspondant aux filtres d'une alerte
 * et non encore envoyées à cet utilisateur
 */
async function matchAlerteAnnonces(alert) {
  const filters = typeof alert.filters === 'string'
    ? JSON.parse(alert.filters)
    : alert.filters;

  const conditions = [
    `a.status = 'active'`,
    // Exclure les annonces déjà envoyées pour cette alerte
    `a.id NOT IN (
       SELECT annonce_id FROM alert_sent_log WHERE alert_id = $1
     )`,
    // Annonces publiées depuis le dernier envoi (ou dernières 7 jours si première fois)
    `a.created_at > COALESCE($2::timestamptz, NOW() - INTERVAL '7 days')`,
  ];
  const params = [alert.id, alert.last_sent_at || null];
  let   idx    = params.length + 1;

  if (filters.q) {
    conditions.push(`(a.titre ILIKE $${idx} OR a.description ILIKE $${idx})`);
    params.push(`%${filters.q}%`);
    idx++;
  }
  if (filters.categorie_id) {
    conditions.push(`a.categorie_id = $${idx++}`);
    params.push(filters.categorie_id);
  }
  if (filters.commune_id) {
    conditions.push(`a.commune_id = $${idx++}`);
    params.push(filters.commune_id);
  }
  if (filters.prix_min != null) {
    conditions.push(`a.prix_xpf >= $${idx++}`);
    params.push(filters.prix_min);
  }
  if (filters.prix_max != null) {
    conditions.push(`a.prix_xpf <= $${idx++}`);
    params.push(filters.prix_max);
  }

  const result = await query(`
    SELECT a.id, a.titre, a.prix_xpf, c.nom AS commune
    FROM annonces a
    LEFT JOIN communes c ON c.id = a.commune_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.created_at DESC
    LIMIT 20
  `, params);

  return result.rows;
}

/**
 * Matching immédiat : appelé quand une nouvelle annonce est publiée
 * Envoie les emails aux utilisateurs ayant une alerte 'immediate' correspondante
 */
async function matchImmediateAlerts(annonce) {
  try {
    const alerts = await query(`
      SELECT sa.id, sa.user_id, sa.label, sa.filters, sa.unsubscribe_token,
             sa.last_sent_at, u.email, u.prenom
      FROM search_alerts sa
      JOIN users u ON u.id = sa.user_id
      WHERE sa.status = 'active'
        AND sa.frequency = 'immediate'
        AND sa.user_id != $1
        AND u.deleted_at IS NULL
    `, [annonce.user_id]);

    for (const alert of alerts.rows) {
      if (String(alert.user_id) === String(annonce.user_id)) {
        continue;
      }

      const filters = typeof alert.filters === 'string'
        ? JSON.parse(alert.filters)
        : alert.filters;

      // Test simple côté JS pour l'immediate (évite une requête par alerte)
      const matches = (
        (!filters.q             || annonce.titre?.toLowerCase().includes(filters.q.toLowerCase())) &&
        (!filters.categorie_id  || String(annonce.categorie_id) === String(filters.categorie_id)) &&
        (!filters.commune_id    || String(annonce.commune_id)   === String(filters.commune_id))   &&
        (!filters.prix_min      || (annonce.prix_xpf ?? 0) >= filters.prix_min) &&
        (!filters.prix_max      || (annonce.prix_xpf ?? 0) <= filters.prix_max)
      );

      if (!matches) continue;

      await sendAlertEmail(alert.email, alert.prenom, alert, [annonce]).catch(() => {});
      await query(`
        INSERT INTO alert_sent_log (alert_id, annonce_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [alert.id, annonce.id]).catch(() => {});
      await query(
        'UPDATE search_alerts SET nb_results = nb_results + 1, last_sent_at = NOW() WHERE id = $1',
        [alert.id]
      ).catch(() => {});
    }
  } catch (err) {
  logger.error('cron_alerts_immediate_error', { error: err });
  }
}

// ── Point d'entrée ───────────────────────────────────────────

// ── 5. Email post-transaction pour inciter les avis ─────────
// Tous les jours à 10h00 : envoyer un email 48h après le premier message

function startReviewReminderJob() {
  cron.schedule('0 10 * * *', async () => {
    recordJob('started', { job: 'reviews' });
    await runSingletonJob('cron:review-reminder', 30 * 60 * 1000, async () => {
      try {
        // Conversations dont le premier message date d'exactement 48h (±1h)
        // et pour lesquelles aucun avis n'a encore été laissé
        const result = await query(`
          SELECT DISTINCT
            c.id          AS conv_id,
            c.buyer_id,
            c.seller_id,
            a.titre       AS annonce_titre,
            ub.email      AS buyer_email,
            ub.prenom     AS buyer_prenom,
            us.prenom     AS seller_prenom
          FROM conversations c
          JOIN annonces a   ON a.id   = c.annonce_id
          JOIN users ub     ON ub.id  = c.buyer_id
          JOIN users us     ON us.id  = c.seller_id
          WHERE c.created_at BETWEEN NOW() - INTERVAL '49 hours'
                                  AND NOW() - INTERVAL '47 hours'
            AND ub.deleted_at IS NULL
            AND us.deleted_at IS NULL
            -- Pas encore d'avis laissé par l'acheteur pour ce vendeur
            AND NOT EXISTS (
              SELECT 1 FROM avis av
              WHERE av.auteur_id  = c.buyer_id
                AND av.cible_id   = c.seller_id
            )
        `);

        const emailService = require('../services/emailService');
        const baseUrl = process.env.BASE_URL || 'https://troca.nc';

        for (const row of result.rows) {
          await emailService.sendMail({
            to:      row.buyer_email,
            subject: "Retour sur votre transaction - Troca",
            html: '<p>Bonjour ' + row.buyer_prenom + ',</p>'
                + '<p>Vous avez échangé avec <strong>' + row.seller_prenom + '</strong>'
                + ' à propos de "<strong>' + row.annonce_titre + '</strong>".</p>'
                + '<p>Partagez votre expérience en laissant un avis — cela aide la communauté Troca !</p>'
                + '<p><a href="' + baseUrl + '/profil/' + row.seller_id + '?review=1"'
                + ' style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;'
                + 'text-decoration:none;font-weight:bold;display:inline-block;">'
                + 'Laisser un avis</a></p>'
                + '<p style="color:#9ca3af;font-size:12px;">Email automatique Troca.</p>',
          }).catch(() => {});
        }

        if (result.rowCount > 0) {
          logger.info('cron_reviews_sent', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'reviews', message: err.message });
        logger.error('cron_reviews_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'reviews' });
}

function startAllJobs() {
  startBoostExpiryJob();
  startExpiringListingsJob();
  startReviewReminderJob();
  startDailyAlertsJob();
  startWeeklyAlertsJob();
  startAnalyticsPurgeJob();
}

module.exports = { startAllJobs, matchImmediateAlerts };
