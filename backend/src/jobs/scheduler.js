'use strict';

// ============================================================
//  Kalico — Jobs planifiés (node-cron)
//  • Expiration des boosts payés
//  • Envoi des alertes de recherche (daily + weekly)
//  • Matching immediate des nouvelles annonces
// ============================================================

const cron                = require('node-cron');
const { query }           = require('../config/database');
const {
  sendAlertEmail,
  sendPerformanceReportEmail,
  sendListingExpiringEmail,
  sendListingExpiredEmail,
  sendProBookingReminderEmail,
  sendRideReviewReminderEmail,
} = require('../services/emailService');
const { sendMail }        = require('../services/emailService');
const {
  notifyListingExpiring,
  notifyListingExpired,
  notifySearchAlert,
  notifyPerformanceReport,
} = require('../services/notificationService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser, sendPushToUsers } = require('../services/pushService');
const { getJson, setJson, withLock } = require('../services/sharedCache');
const { drainTrocMatchingQueue, rememberTrocSignal } = require('../services/trocQueueService');
const { detectTrocCycles, listingMatchesNeed } = require('../services/trocService');
const { logger }          = require('../utils/logger');
const { recordJob }       = require('../services/observability');
const { flushBonPlanViews } = require('../services/bonPlansService');
const { checkAdminAlerts } = require('../services/adminAlerts');
const { ensureNotificationPreferences } = require('../services/notificationPreferencesService');
const { sendNewsletterBatch } = require('../services/newsletterService');

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

function formatUserName(firstName, lastName) {
  return `${firstName || ''} ${lastName || ''}`.trim() || 'Un utilisateur';
}

function formatXpf(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} XPF`;
}

function getPerformanceWindowDays(frequency) {
  switch (String(frequency || '').toLowerCase()) {
    case 'daily':
      return 1;
    case 'monthly':
      return 30;
    case 'weekly':
    default:
      return 7;
  }
}

function getPerformancePeriodLabel(frequency, startDate) {
  const labelMap = {
    daily: 'les dernières 24 heures',
    weekly: 'les 7 derniers jours',
    monthly: 'les 30 derniers jours',
  };
  const label = labelMap[String(frequency || '').toLowerCase()] || 'les 7 derniers jours';
  if (!startDate) return label;
  return `${label} (depuis le ${new Date(startDate).toLocaleDateString('fr-FR')})`;
}

function getTrocBaseUrl() {
  return process.env.BASE_URL || 'https://kalico.nc';
}

async function loadOpenTrocListingsByIds(ids = []) {
  const normalized = [...new Set(ids.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];
  if (!normalized.length) return [];

  const result = await query(`
    SELECT
      a.id,
      a.user_id,
      a.titre AS title,
      a.description,
      a.prix,
      a.category_id,
      cat.name AS category_name,
      cat.slug AS category_slug,
      a.troc_wants,
      a.troc_accepts_complement_xpf,
      a.troc_complement_max_xpf,
      a.troc_status,
      u.prenom,
      u.nom,
      u.email,
      u.expo_push_token
    FROM annonces a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE a.id = ANY($1::int[])
      AND a.deleted_at IS NULL
      AND a.status = 'active'
      AND COALESCE(a.is_troc, FALSE) = TRUE
      AND COALESCE(a.troc_status, 'open') = 'open'
  `, [normalized]);

  return result.rows;
}

async function loadAllOpenTrocListings() {
  const result = await query(`
    SELECT
      a.id,
      a.user_id,
      a.titre AS title,
      a.description,
      a.prix,
      a.category_id,
      cat.name AS category_name,
      cat.slug AS category_slug,
      a.troc_wants,
      a.troc_accepts_complement_xpf,
      a.troc_complement_max_xpf,
      a.troc_status,
      u.prenom,
      u.nom,
      u.email,
      u.expo_push_token
    FROM annonces a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE a.deleted_at IS NULL
      AND a.status = 'active'
      AND COALESCE(a.is_troc, FALSE) = TRUE
      AND COALESCE(a.troc_status, 'open') = 'open'
    ORDER BY a.created_at DESC
  `);

  return result.rows;
}

function buildDirectMatchKey(anchorListing, candidateListing) {
  const ids = [Number(anchorListing.id), Number(candidateListing.id)].sort((a, b) => a - b);
  return `troc:direct:${ids.join(':')}`;
}

function buildCycleMatchKey(cycle) {
  const listingIds = (cycle?.listing_ids || []).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  return `troc:cycle:${listingIds.join(':')}`;
}

async function notifyTrocDirectMatch(anchorListing, candidateListing) {
  const baseUrl = getTrocBaseUrl();
  const anchorOwner = {
    id: Number(anchorListing.user_id),
    prenom: anchorListing.prenom,
    nom: anchorListing.nom,
    email: anchorListing.email,
    pushToken: anchorListing.expo_push_token,
  };
  const candidateOwner = {
    id: Number(candidateListing.user_id),
    prenom: candidateListing.prenom,
    nom: candidateListing.nom,
    email: candidateListing.email,
    pushToken: candidateListing.expo_push_token,
  };

  const payloads = [
    {
      recipient: anchorOwner,
      counterpart: candidateListing,
      href: `/troc/${candidateListing.id}`,
    },
    {
      recipient: candidateOwner,
      counterpart: anchorListing,
      href: `/troc/${anchorListing.id}`,
    },
  ];

  for (const payload of payloads) {
    const recipientName = formatUserName(payload.recipient.prenom, payload.recipient.nom);
    const counterpartName = formatUserName(payload.counterpart.prenom, payload.counterpart.nom);
    const title = '🔄 Troc compatible trouvé !';
    const body = `${counterpartName} a une annonce qui correspond à votre troc.`;

    await createNotification(payload.recipient.id, {
      type: 'troc_match',
      title,
      body,
      href: payload.href,
    }).catch(() => {});

    await sendPushToUser(payload.recipient.id, {
      title,
      body,
      data: {
        type: 'troc_match',
        listing_id: payload.counterpart.id,
        counterpart_listing_id: payload.counterpart.id,
      },
    }).catch(() => {});

    if (payload.recipient.email) {
      await sendMail({
        to: payload.recipient.email,
        subject: title,
        html: `<p>Bonjour ${recipientName},</p>
          <p><strong>${counterpartName}</strong> a une annonce compatible avec votre troc.</p>
          <p><a href="${baseUrl}${payload.href}">Voir le match</a></p>`,
      }).catch(() => {});
    }
  }
}

async function notifyTrocCycle(cycle, listingById) {
  const baseUrl = getTrocBaseUrl();
  const participants = (cycle.participant_ids || []).map((participantId) => {
    const listing = (cycle.listing_ids || [])
      .map((listingId) => listingById.get(Number(listingId)))
      .find((item) => item && Number(item.user_id) === Number(participantId));

    const profile = listing || {};
    return {
      participantId: Number(participantId),
      prenom: profile.prenom,
      nom: profile.nom,
      email: profile.email,
      pushToken: profile.expo_push_token,
    };
  });

  for (const participant of participants) {
    const recipientName = formatUserName(participant.prenom, participant.nom);
    const title = '🔄 Troc en chaîne détecté !';
    const body = "Vous, d'autres troceurs et leurs annonces pouvez tous y gagner.";

    await createNotification(participant.participantId, {
      type: 'troc_cycle',
      title,
      body,
      href: `/troc/cycles/${cycle.id}`,
    }).catch(() => {});

    await sendPushToUser(participant.participantId, {
      title,
      body,
      data: {
        type: 'troc_cycle',
        cycle_id: cycle.id,
      },
    }).catch(() => {});

    if (participant.email) {
      await sendMail({
        to: participant.email,
        subject: title,
        html: `<p>Bonjour ${recipientName},</p>
          <p>Un troc en chaîne a été détecté autour de vos annonces.</p>
          <p><a href="${baseUrl}/troc/cycles/${cycle.id}">Voir le cycle</a></p>`,
      }).catch(() => {});
    }
  }
}

async function processTrocMatchingQueue() {
  if (String(process.env.TROC_MATCHING_ENABLED || 'true') === 'false') {
    return { processed: 0, matches: 0, cycles: 0 };
  }

  const queuedIds = await drainTrocMatchingQueue(40);
  if (!queuedIds.length) {
    return { processed: 0, matches: 0, cycles: 0 };
  }

  const anchorIds = [...new Set(queuedIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];
  if (!anchorIds.length) {
    return { processed: 0, matches: 0, cycles: 0 };
  }

  const anchors = await loadOpenTrocListingsByIds(anchorIds);
  if (!anchors.length) {
    return { processed: anchorIds.length, matches: 0, cycles: 0 };
  }

  const openListings = await loadAllOpenTrocListings();
  const listingById = new Map(openListings.map((listing) => [Number(listing.id), listing]));

  let matchCount = 0;
  let cycleCount = 0;

  for (const anchorListing of anchors) {
    const candidates = openListings.filter((candidate) =>
      Number(candidate.id) !== Number(anchorListing.id)
      && Number(candidate.user_id) !== Number(anchorListing.user_id)
      && listingMatchesNeed(anchorListing, candidate)
      && listingMatchesNeed(candidate, anchorListing)
    );

    for (const candidateListing of candidates) {
      const key = buildDirectMatchKey(anchorListing, candidateListing);
      if (!(await rememberTrocSignal(key, 24 * 60 * 60 * 1000))) {
        continue;
      }

      await notifyTrocDirectMatch(anchorListing, candidateListing);
      matchCount++;
    }

    const cycles = detectTrocCycles(anchorListing, openListings, {
      expiryHours: Number(process.env.TROC_CYCLE_EXPIRY_HOURS || 48),
      maxDepth: Number(process.env.TROC_CYCLE_MAX_DEPTH || 3),
    });

    for (const cycle of cycles) {
      const key = buildCycleMatchKey(cycle);
      if (!(await rememberTrocSignal(key, Number(process.env.TROC_CYCLE_EXPIRY_HOURS || 48) * 60 * 60 * 1000))) {
        continue;
      }

      await query(
        `INSERT INTO troc_cycles (
           participant_ids, listing_ids, status, confirmations, detected_at, updated_at, expires_at
         )
         VALUES ($1::int[], $2::int[], 'proposed', '{}'::int[], NOW(), NOW(), NOW() + make_interval(hours => $3))`,
        [
          cycle.participant_ids,
          cycle.listing_ids,
          Number(process.env.TROC_CYCLE_EXPIRY_HOURS || 48),
        ]
      ).catch(() => {});

      await notifyTrocCycle(cycle, listingById);
      cycleCount++;
    }
  }

  return {
    processed: anchorIds.length,
    matches: matchCount,
    cycles: cycleCount,
  };
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

function startListingExpiryJob() {
  cron.schedule('10 * * * *', async () => {
    recordJob('started', { job: 'listing-expiry' });
    await runSingletonJob('cron:listing-expiry', 50 * 60 * 1000, async () => {
      try {
        const result = await query(`
          WITH expired AS (
            UPDATE annonces a
            SET status = 'expired',
                updated_at = NOW()
            WHERE a.status = 'active'
              AND a.expires_at < NOW()
              AND a.deleted_at IS NULL
            RETURNING a.id, a.titre, a.user_id
          )
          SELECT e.id, e.titre, e.user_id, u.email, u.prenom
          FROM expired e
          JOIN users u ON u.id = e.user_id
          WHERE u.deleted_at IS NULL
        `);

        for (const row of result.rows) {
          await notifyListingExpired(row.user_id, row.id, row.titre).catch(() => {});
          await sendListingExpiredEmail(
            row.email,
            row.prenom,
            {
              annonceId: row.id,
              annonceTitle: row.titre,
            },
            row.user_id
          ).catch(() => {});
        }

        if (result.rowCount > 0) {
          logger.info('cron_listing_expired_notified', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'listing-expiry', message: err.message });
        logger.error('cron_listing_expiry_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'listing-expiry' });
}

function startBonPlanMaintenanceJob() {
  const flushIntervalMs = Math.max(15 * 60 * 1000, Number(process.env.BON_PLAN_VIEWS_FLUSH_INTERVAL_MS || 3600000));

  cron.schedule('15 * * * *', async () => {
    recordJob('started', { job: 'bon-plan-expiry' });
    await runSingletonJob('cron:bon-plan-expiry', 45 * 60 * 1000, async () => {
      try {
        const result = await query(`
          UPDATE bon_plans
          SET status = 'expired', updated_at = NOW()
          WHERE status = 'active'
            AND published_until IS NOT NULL
            AND published_until < NOW()
          RETURNING id
        `);
        if (result.rowCount > 0) {
          logger.info('cron_bon_plans_expired', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'bon-plan-expiry', message: err.message });
        logger.error('cron_bon_plans_expiry_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  setInterval(() => {
    runSingletonJob('cron:bon-plan-views', flushIntervalMs - 5_000, async () => {
      try {
        const result = await flushBonPlanViews();
        if (result?.flushed) {
          logger.info('cron_bon_plan_views_flushed', { count: result.flushed });
        }
      } catch (err) {
        recordJob('error', { job: 'bon-plan-views', message: err.message });
        logger.error('cron_bon_plan_views_error', { error: err });
      }
    }).catch(() => {});
  }, flushIntervalMs).unref?.();

  logger.info('cron_job_started', { job: 'bon-plan-expiry' });
  logger.info('cron_job_started', { job: 'bon-plan-views-flush', interval_ms: flushIntervalMs });
}

async function expireTrocProposals() {
  const expired = await query(`
    WITH expired AS (
      UPDATE troc_proposals
      SET status = 'expired',
          updated_at = NOW()
      WHERE status = 'pending'
        AND expires_at < NOW()
      RETURNING id, proposer_id, listing_id
    )
    SELECT e.id, e.proposer_id, e.listing_id, u.email, u.prenom, a.titre
    FROM expired e
    JOIN users u ON u.id = e.proposer_id
    JOIN annonces a ON a.id = e.listing_id
  `);

  for (const row of expired.rows) {
    await createNotification(row.proposer_id, {
      type: 'troc_expired',
      title: '⏰ Proposition expirée',
      body: "Votre proposition de troc n'a pas reçu de reponse.",
      href: `/troc/${row.listing_id}`,
    }).catch(() => {});

    await sendPushToUser(row.proposer_id, {
      title: '⏰ Proposition expirée',
      body: "Votre proposition de troc n'a pas reçu de reponse.",
      data: { type: 'troc_expired', proposal_id: row.id, listing_id: row.listing_id },
    }).catch(() => {});
  }

  return expired.rowCount || expired.rows.length || 0;
}

async function expireTrocCycles() {
  const expired = await query(`
    WITH broken AS (
      UPDATE troc_cycles
      SET status = 'broken',
          updated_at = NOW()
      WHERE status = 'proposed'
        AND expires_at < NOW()
      RETURNING id, participant_ids
    )
    SELECT id, participant_ids
    FROM broken
  `);

  for (const row of expired.rows) {
    await sendPushToUsers(row.participant_ids || [], {
      title: '🔄 Cycle Troc expiré',
      body: "Le troc en chaîne n'a pas ete confirme a temps.",
      data: { type: 'troc_cycle_expired', cycle_id: row.id },
    }).catch(() => {});
  }

  return expired.rowCount || expired.rows.length || 0;
}

function startTrocMaintenanceJob() {
  cron.schedule('*/5 * * * *', async () => {
    recordJob('started', { job: 'troc-maintenance' });
    await runSingletonJob('cron:troc-maintenance', 4 * 60 * 1000, async () => {
      try {
        const expiredProposals = await expireTrocProposals();
        const brokenCycles = await expireTrocCycles();
        if (expiredProposals || brokenCycles) {
          logger.info('cron_troc_maintenance', {
            expired_proposals: expiredProposals,
            broken_cycles: brokenCycles,
          });
        }
      } catch (err) {
        recordJob('error', { job: 'troc-maintenance', message: err.message });
        logger.error('cron_troc_maintenance_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'troc-maintenance' });
}

function startTrocMatchingJob() {
  cron.schedule('*/30 * * * * *', async () => {
    recordJob('started', { job: 'troc-matching' });
    await runSingletonJob('cron:troc-matching', 25 * 1000, async () => {
      try {
        const result = await processTrocMatchingQueue();
        if (result.processed || result.matches || result.cycles) {
          logger.info('cron_troc_matching', result);
        }
      } catch (err) {
        recordJob('error', { job: 'troc-matching', message: err.message });
        logger.error('cron_troc_matching_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'troc-matching' });
}

function startAdminAlertsJob() {
  cron.schedule('*/5 * * * *', async () => {
    recordJob('started', { job: 'admin-alerts' });
    await runSingletonJob('cron:admin-alerts', 4 * 60 * 1000, async () => {
      try {
        const alerts = await checkAdminAlerts();
        if (alerts?.length) {
          logger.info('cron_admin_alerts', { alerts: alerts.length });
        }
      } catch (err) {
        recordJob('error', { job: 'admin-alerts', message: err.message });
        logger.error('cron_admin_alerts_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'admin-alerts' });
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

          await sendListingExpiringEmail(
            row.email,
            row.prenom,
            {
              annonceId: row.id,
              annonceTitle: row.titre,
              daysLeft: 3,
            },
            row.user_id
          ).catch(() => {});
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

function startPerformanceReportsJob() {
  cron.schedule('30 7 * * *', async () => {
    recordJob('started', { job: 'performance-reports' });
    await runSingletonJob('cron:performance-reports', 45 * 60 * 1000, async () => {
      await runPerformanceReportsJob();
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'performance-reports' });
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

        const prefs = await ensureNotificationPreferences(alert.user_id).catch(() => null);

        await sendAlertEmail(alert.email, alert.prenom, alert, annonces);

        await notifySearchAlert(
          alert.user_id,
          alert.label,
          annonces.length,
          alert.filters || {}
        ).catch(() => {});

        if (prefs?.push_search_alert) {
          await sendPushToUser(alert.user_id, {
            title: `🔔 ${annonces.length} nouvelle${annonces.length > 1 ? 's' : ''} annonce${annonces.length > 1 ? 's' : ''} pour "${alert.label}"`,
            body: 'Cliquez pour voir les résultats',
            data: {
              type: 'search_alert',
              alert_id: alert.id,
              label: alert.label,
            },
          }).catch(() => {});
        }

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
  if (filters.category_id || filters.categorie_id) {
    conditions.push(`a.category_id = $${idx++}`);
    params.push(filters.category_id || filters.categorie_id);
  }
  if (filters.commune_id) {
    conditions.push(`a.commune_id = $${idx++}`);
    params.push(filters.commune_id);
  }
  if (filters.price_min != null || filters.prix_min != null) {
    conditions.push(`a.prix_xpf >= $${idx++}`);
    params.push(filters.price_min ?? filters.prix_min);
  }
  if (filters.price_max != null || filters.prix_max != null) {
    conditions.push(`a.prix_xpf <= $${idx++}`);
    params.push(filters.price_max ?? filters.prix_max);
  }
  if (filters.condition) {
    conditions.push(`a.condition = $${idx++}`);
    params.push(filters.condition);
  }
  if (String(filters.troc) === 'true' || String(filters.troc) === '1') {
    conditions.push(`a.contre_quoi IS NOT NULL AND a.contre_quoi <> ''`);
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
        (!(filters.category_id || filters.categorie_id) || String(annonce.category_id) === String(filters.category_id || filters.categorie_id)) &&
        (!filters.commune_id    || String(annonce.commune_id)   === String(filters.commune_id))   &&
        (!filters.price_min && !filters.prix_min || (annonce.prix ?? annonce.prix_xpf ?? 0) >= Number(filters.price_min ?? filters.prix_min)) &&
        (!filters.price_max && !filters.prix_max || (annonce.prix ?? annonce.prix_xpf ?? 0) <= Number(filters.price_max ?? filters.prix_max)) &&
        (!filters.condition     || String(annonce.condition) === String(filters.condition)) &&
        (String(filters.troc) !== 'true' && String(filters.troc) !== '1' || Boolean(annonce.contre_quoi))
      );

      if (!matches) continue;

      const prefs = await ensureNotificationPreferences(alert.user_id).catch(() => null);

      await sendAlertEmail(alert.email, alert.prenom, alert, [annonce]).catch(() => {});
      await notifySearchAlert(
        alert.user_id,
        alert.label,
        1,
        alert.filters || {}
      ).catch(() => {});
      if (prefs?.push_search_alert) {
        await sendPushToUser(alert.user_id, {
          title: `🔔 1 nouvelle annonce pour "${alert.label}"`,
          body: 'Cliquez pour voir le résultat',
          data: {
            type: 'search_alert',
            alert_id: alert.id,
            label: alert.label,
          },
        }).catch(() => {});
      }
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

async function buildPerformanceReportForUser(userRow, prefs) {
  const frequency = prefs.performance_report_frequency || 'weekly';
  const days = getPerformanceWindowDays(frequency);
  const lastSentAt = prefs.last_performance_report_at ? new Date(prefs.last_performance_report_at) : null;
  const periodStart = lastSentAt && !Number.isNaN(lastSentAt.getTime())
    ? lastSentAt
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await query(`
    SELECT
      a.id,
      a.titre AS title,
      a.prix,
      a.nb_vues AS total_views,
      a.nb_favoris AS total_favorites,
      a.is_boosted,
      COALESCE(ev.views, 0) AS views,
      COALESCE(ev.clicks, 0) AS clicks,
      COALESCE(ev.favorites, 0) AS favorites
    FROM annonces a
    LEFT JOIN (
      SELECT
        ae.metadata ->> 'listing_id' AS listing_id,
        COUNT(*) FILTER (WHERE ae.event_name = 'listing_view') AS views,
        COUNT(*) FILTER (WHERE ae.event_name = 'contact_seller_click') AS clicks,
        COUNT(*) FILTER (WHERE ae.event_name = 'favorite_add') AS favorites
      FROM analytics_events ae
      WHERE ae.created_at >= $2
        AND ae.event_name IN ('listing_view', 'contact_seller_click', 'favorite_add')
      GROUP BY ae.metadata ->> 'listing_id'
    ) ev ON ev.listing_id = a.id::text
    WHERE a.user_id = $1
      AND a.status = 'active'
    ORDER BY COALESCE(ev.views, 0) DESC,
             COALESCE(ev.clicks, 0) DESC,
             COALESCE(ev.favorites, 0) DESC,
             a.created_at DESC
  `, [userRow.user_id, periodStart.toISOString()]);

  const rows = result.rows || [];
  if (!rows.length) return null;

  const totals = rows.reduce((acc, item) => ({
    views: acc.views + Number(item.views || 0),
    clicks: acc.clicks + Number(item.clicks || 0),
    favorites: acc.favorites + Number(item.favorites || 0),
  }), { views: 0, clicks: 0, favorites: 0 });

  return {
    user_id: userRow.user_id,
    email: userRow.email,
    prenom: userRow.prenom,
    is_pro: Boolean(userRow.is_pro),
    frequency,
    period_label: getPerformancePeriodLabel(frequency, periodStart),
    period_start: periodStart,
    totals,
    listings: rows,
  };
}

async function runPerformanceReportsJob() {
  logger.info('cron_performance_reports_start');
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const recipients = await query(`
      SELECT
        p.user_id,
        u.email,
        u.prenom,
        u.is_pro,
        p.email_performance_report,
        p.push_performance_report,
        p.performance_report_frequency,
        p.last_performance_report_at
      FROM notification_preferences p
      JOIN users u ON u.id = p.user_id
      WHERE u.deleted_at IS NULL
        AND p.performance_report_frequency <> 'never'
        AND (p.email_performance_report = TRUE OR p.push_performance_report = TRUE)
    `);

    for (const recipient of recipients.rows) {
      try {
        const report = await buildPerformanceReportForUser(recipient, recipient);
        if (!report) {
          skipped++;
          continue;
        }

        if (recipient.email_performance_report) {
          await sendPerformanceReportEmail({
            to: recipient.email,
            prenom: recipient.prenom,
            report,
            recipientUserId: recipient.user_id,
          }).catch(() => {});
        }

        if (recipient.push_performance_report) {
          await sendPushToUser(recipient.user_id, {
            title: '📊 Votre rapport de performance est prêt',
            body: `${report.totals.views.toLocaleString('fr-FR')} vues · ${report.totals.clicks.toLocaleString('fr-FR')} clics`,
            data: {
              type: 'performance_report',
              period: report.frequency,
            },
          }).catch(() => {});
        }

        await notifyPerformanceReport(
          recipient.user_id,
          report.period_label,
          '/parametres/notifications'
        ).catch(() => {});

        await query(
          `UPDATE notification_preferences
           SET last_performance_report_at = NOW(),
               updated_at = NOW()
           WHERE user_id = $1`,
          [recipient.user_id]
        ).catch(() => {});

        sent++;
      } catch (error) {
        errors++;
        recordJob('error', { job: 'performance-reports', message: error.message });
        logger.error('cron_performance_reports_error', { user_id: recipient.user_id, error });
      }
    }
  } catch (error) {
    recordJob('error', { job: 'performance-reports', message: error.message });
    logger.error('cron_performance_reports_general_error', { error });
  }

  logger.info('cron_performance_reports_done', { sent, skipped, errors });
}

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
        const baseUrl = process.env.BASE_URL || 'https://kalico.nc';

        for (const row of result.rows) {
          await emailService.sendMail({
            to:      row.buyer_email,
            subject: "Retour sur votre transaction - Kalico",
            html: '<p>Bonjour ' + row.buyer_prenom + ',</p>'
                + '<p>Vous avez échangé avec <strong>' + row.seller_prenom + '</strong>'
                + ' à propos de "<strong>' + row.annonce_titre + '</strong>".</p>'
                + '<p>Partagez votre expérience en laissant un avis — cela aide la communauté Kalico !</p>'
                + '<p><a href="' + baseUrl + '/profil/' + row.seller_id + '?review=1"'
                + ' style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;'
                + 'text-decoration:none;font-weight:bold;display:inline-block;">'
                + 'Laisser un avis</a></p>'
                + '<p style="color:#9ca3af;font-size:12px;">Email automatique Kalico.</p>',
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

function startRideReviewReminderJob() {
  cron.schedule('20 10 * * *', async () => {
    recordJob('started', { job: 'covoiturage-reviews' });
    await runSingletonJob('cron:covoiturage-review-reminder', 30 * 60 * 1000, async () => {
      try {
        const result = await query(`
          SELECT
            b.id AS booking_id,
            b.ride_id,
            b.passenger_id,
            b.review_reminder_sent_at,
            c.user_id AS driver_id,
            c.departure,
            c.destination,
            c.ride_date,
            c.ride_time,
            d.prenom AS driver_prenom,
            p.prenom AS passenger_prenom,
            p.email AS passenger_email
          FROM ride_bookings b
          JOIN covoiturages c ON c.id = b.ride_id
          JOIN users d ON d.id = c.user_id
          JOIN users p ON p.id = b.passenger_id
          WHERE b.status IN ('auto_confirmed', 'accepted')
            AND b.review_reminder_sent_at IS NULL
            AND p.deleted_at IS NULL
            AND d.deleted_at IS NULL
            AND (c.ride_date + c.ride_time) <= NOW() - INTERVAL '24 hours'
            AND NOT EXISTS (
              SELECT 1
              FROM covoiturage_reviews r
              WHERE r.booking_id = b.id
                AND r.reviewer_id = b.passenger_id
                AND r.target_user_id = c.user_id
            )
          ORDER BY c.ride_date DESC, c.ride_time DESC, b.created_at DESC
          LIMIT 50
        `);

        let sent = 0;
        for (const row of result.rows) {
          const claimed = await query(
            `UPDATE ride_bookings
             SET review_reminder_sent_at = NOW()
             WHERE id = $1 AND review_reminder_sent_at IS NULL
             RETURNING id`,
            [row.booking_id]
          );
          if (!claimed.rows[0]) continue;

          const rideLabel = `${row.departure} → ${row.destination}`;
          const details = {
            departure: row.departure,
            destination: row.destination,
            rideDate: row.ride_date,
            rideTime: row.ride_time,
            driverPrenom: row.driver_prenom,
            passengerPrenom: row.passenger_prenom,
            bookingId: row.booking_id,
            reviewUrl: `${getTrocBaseUrl()}/covoiturage/reservations?review_booking=${encodeURIComponent(String(row.booking_id))}`,
          };

          await createNotification(row.passenger_id, {
            type: 'review',
            title: '✍️ Notez votre conducteur',
            body: `Partagez votre avis sur ${rideLabel} pour aider la communauté.`,
            href: `/covoiturage/reservations?review_booking=${row.booking_id}`,
          }).catch(() => {});

          await sendPushToUser(row.passenger_id, {
            title: '✍️ Notez votre conducteur',
            body: `Partagez votre avis sur ${rideLabel}.`,
            data: { type: 'ride_review_reminder', booking_id: row.booking_id, ride_id: row.ride_id },
          }).catch(() => {});

          await sendRideReviewReminderEmail(
            row.passenger_email,
            row.passenger_prenom || 'Bonjour',
            details,
            row.passenger_id
          ).catch(() => {});

          sent++;
        }

        if (sent > 0) {
          logger.info('cron_covoiturage_reviews_sent', { count: sent });
        }
      } catch (err) {
        recordJob('error', { job: 'covoiturage-reviews', message: err.message });
        logger.error('cron_covoiturage_reviews_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'covoiturage-reviews' });
}

async function runProBookingReminderWindow({
  lockName,
  reminderColumn,
  windowStartHours,
  windowEndHours,
  reminderLabel,
  notificationTitle,
  notificationBody,
  emailIntro,
}) {
  const result = await query(`
    SELECT
      b.id AS booking_id,
      b.pro_id,
      b.requester_user_id,
      b.requester_name,
      b.requester_email,
      b.requester_phone,
      b.commune,
      b.subject,
      b.details,
      b.starts_at,
      b.ends_at,
      b.status,
      b.booking_access_token,
      b.${reminderColumn},
      p.prenom AS pro_prenom,
      p.nom AS pro_nom,
      p.pro_company_name,
      p.pro_commune,
      p.pro_phone,
      p.pro_website,
      p.pro_hours,
      p.email AS pro_email,
      p.expo_push_token AS pro_push_token,
      requester.prenom AS requester_prenom,
      requester.nom AS requester_nom,
      requester.email AS requester_email,
      requester.expo_push_token AS requester_push_token
    FROM pro_bookings b
    JOIN users p ON p.id = b.pro_id
    LEFT JOIN users requester ON requester.id = b.requester_user_id
    WHERE b.status = 'confirmed'
      AND b.${reminderColumn} IS NULL
      AND b.starts_at >= NOW() + ($1 * INTERVAL '1 hour')
      AND b.starts_at < NOW() + ($2 * INTERVAL '1 hour')
      AND p.deleted_at IS NULL
      AND (requester.id IS NULL OR requester.deleted_at IS NULL)
    ORDER BY b.starts_at ASC
    LIMIT 100
  `, [windowStartHours, windowEndHours]);

  let sent = 0;
  for (const row of result.rows) {
    const claimed = await query(
      `UPDATE pro_bookings
       SET ${reminderColumn} = NOW()
       WHERE id = $1
         AND ${reminderColumn} IS NULL
       RETURNING id`,
      [row.booking_id]
    );
    if (!claimed.rows[0]) continue;

    const startsAt = new Date(row.starts_at);
    const when = Number.isNaN(startsAt.getTime())
      ? 'votre rendez-vous'
      : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(startsAt);
    const proName = formatUserName(row.pro_prenom, row.pro_nom) || row.pro_company_name || 'Professionnel';
    const bookingToken = String(row.booking_access_token || '').trim();
    const bookingUrlForRequester = `${getTrocBaseUrl()}/mes-rdv/${row.booking_id}${bookingToken ? `?token=${encodeURIComponent(bookingToken)}` : ''}`;
    const bookingUrlForPro = `${getTrocBaseUrl()}/mes-rdv/${row.booking_id}${bookingToken ? `?token=${encodeURIComponent(bookingToken)}` : ''}`;

    if (row.requester_user_id) {
      const requesterName = formatUserName(row.requester_prenom, row.requester_nom) || row.requester_name || 'Client';
      await createNotification(row.requester_user_id, {
        type: 'appointment_reminder',
        title: notificationTitle,
        body: `${proName} · ${when}`,
        href: '/mes-rdv',
      }).catch(() => {});

      await sendPushToUser(row.requester_user_id, {
        title: notificationTitle,
        body: notificationBody(row, proName, requesterName, when),
        data: {
          type: 'appointment_reminder',
          booking_id: row.booking_id,
          pro_id: row.pro_id,
          reminder: reminderLabel,
        },
      }).catch(() => {});

      if (row.requester_email) {
        await sendProBookingReminderEmail(
          row.requester_email,
          row.requester_prenom || row.requester_name || 'Bonjour',
          {
            reminderLabel,
            intro: emailIntro('client', row, proName, when),
            subject: row.subject,
            proName,
            proCommune: row.pro_commune,
            commune: row.commune,
            locationText: row.pro_commune || 'Lieu à confirmer',
            slotLabel: when,
            bookingId: row.booking_id,
            bookingAccessToken: row.booking_access_token,
            bookingUrl: bookingUrlForRequester,
          },
          row.requester_user_id
        ).catch(() => {});
      }
    }

    await createNotification(row.pro_id, {
      type: 'appointment_reminder',
      title: notificationTitle,
      body: `${row.requester_name || 'Client'} · ${when}`,
      href: '/pro/dashboard/rdv',
    }).catch(() => {});

    await sendPushToUser(row.pro_id, {
      title: notificationTitle,
      body: notificationBody(row, proName, row.requester_name || 'Client', when),
      data: {
        type: 'appointment_reminder',
        booking_id: row.booking_id,
        pro_id: row.pro_id,
        reminder: reminderLabel,
      },
    }).catch(() => {});

    if (row.pro_email) {
      await sendProBookingReminderEmail(
        row.pro_email,
        row.pro_prenom || row.pro_company_name || 'Bonjour',
        {
          reminderLabel,
          intro: emailIntro('pro', row, proName, when),
          subject: row.subject,
          proName,
          proCommune: row.pro_commune,
          commune: row.commune,
          locationText: row.pro_commune || 'Lieu à confirmer',
          slotLabel: when,
          bookingId: row.booking_id,
          bookingAccessToken: row.booking_access_token,
          bookingUrl: bookingUrlForPro,
        },
        row.pro_id
      ).catch(() => {});
    }

    sent++;
  }

  if (sent > 0) {
    logger.info('cron_pro_booking_reminders_sent', {
      reminder: reminderLabel,
      count: sent,
      lock_name: lockName,
    });
  }

  return sent;
}

function startProBookingReminderJob() {
  cron.schedule('*/15 * * * *', async () => {
    recordJob('started', { job: 'pro-booking-reminders' });
    await runSingletonJob('cron:pro-booking-reminders', 10 * 60 * 1000, async () => {
      try {
        const sent24h = await runProBookingReminderWindow({
          lockName: 'pro-booking-reminder-24h',
          reminderColumn: 'reminder_24h_sent_at',
          windowStartHours: 23.75,
          windowEndHours: 24.25,
          reminderLabel: 'J-1',
          notificationTitle: '📅 Rendez-vous demain',
          notificationBody: (row, proName, partnerName, when) => `Rendez-vous avec ${proName} · ${when}`,
          emailIntro: (role, row, proName, when) => role === 'client'
            ? `Votre rendez-vous avec ${proName} approche.`
            : `Votre rendez-vous avec ${row.requester_name || 'un client'} approche.`,
        });

        const sent2h = await runProBookingReminderWindow({
          lockName: 'pro-booking-reminder-2h',
          reminderColumn: 'reminder_2h_sent_at',
          windowStartHours: 1.75,
          windowEndHours: 2.25,
          reminderLabel: 'H-2',
          notificationTitle: '⏰ Rendez-vous dans 2 heures',
          notificationBody: (row, proName, partnerName, when) => `Préparez votre rendez-vous avec ${proName} · ${when}`,
          emailIntro: (role, row, proName, when) => role === 'client'
            ? `Votre rendez-vous avec ${proName} est prévu dans moins de 2 heures.`
            : `Votre rendez-vous avec ${row.requester_name || 'un client'} est prévu dans moins de 2 heures.`,
        });

        if (sent24h || sent2h) {
          logger.info('cron_pro_booking_reminders', { sent_24h: sent24h, sent_2h: sent2h });
        }
      } catch (err) {
        recordJob('error', { job: 'pro-booking-reminders', message: err.message });
        logger.error('cron_pro_booking_reminders_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'pro-booking-reminders' });
}

function startNewsletterJob() {
  cron.schedule('0 18 * * 0', async () => {
    recordJob('started', { job: 'newsletter' });
    await runSingletonJob('cron:newsletter-weekly', 60 * 60 * 1000, async () => {
      try {
        const result = await sendNewsletterBatch();
        logger.info('cron_newsletter_sent', result);
      } catch (err) {
        recordJob('error', { job: 'newsletter', message: err.message });
        logger.error('cron_newsletter_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'newsletter' });
}

function startAllJobs() {
  startBoostExpiryJob();
  startBonPlanMaintenanceJob();
  startAdminAlertsJob();
  startTrocMatchingJob();
  startTrocMaintenanceJob();
  startListingExpiryJob();
  startExpiringListingsJob();
  startReviewReminderJob();
  startRideReviewReminderJob();
  startProBookingReminderJob();
  startNewsletterJob();
  startDailyAlertsJob();
  startWeeklyAlertsJob();
  startPerformanceReportsJob();
  startAnalyticsPurgeJob();
}

module.exports = { startAllJobs, matchImmediateAlerts, expireTrocProposals, expireTrocCycles, processTrocMatchingQueue };
