// ============================================================
//  Routes — Administration (backend)
//  Toutes les routes nécessitent is_admin = true
//  Tables réelles : annonces, signalements, users, messages
// ============================================================

const express = require('express')
const fs = require('fs').promises
const path = require('path')
const { query, withTransaction, checkConnection, pool } = require('../config/database')
const { getRedisClient } = require('../config/redis')
const { requireAdminToken, adminRateLimit } = require('../middleware/adminApiToken')
const { getSnapshot } = require('../services/observability')
const { ensureLaunchPack } = require('./pro.launch-pack')
const { ensureProReferralCode } = require('../services/referralCodeService')
const { refreshTrustScore } = require('../services/trustService')
const { createNotification } = require('../services/notificationService')
const { sendPushToUser } = require('../services/pushService')
const { sendMail } = require('../services/emailService')
const { runCinemaScraper } = require('../services/cinemaScraperService')
const { disconnectUserSockets } = require('../services/websocketServer')
const {
  forceDeleteUser,
  setUserPlan,
  suspendUser,
  unsuspendUser,
} = require('../services/adminUserActionService')

const router = express.Router()
router.use(adminRateLimit, requireAdminToken)

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePeriod(period = '30d') {
  const value = String(period || '30d').trim().toLowerCase()
  if (value.endsWith('d')) {
    const days = toInt(value, 30)
    return Math.min(365, Math.max(1, days))
  }
  if (value.endsWith('m')) {
    return Math.min(365, Math.max(30, toInt(value, 30) * 30))
  }
  return 30
}

function startDateFromDays(days) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (days - 1))
  return date
}

function dateIso(date) {
  return date.toISOString().slice(0, 10)
}

async function readRedisListJson(key, limit = 50) {
  const redis = await getRedisClient()
  if (!redis) return []
  const rows = await redis.lRange(key, 0, Math.max(0, limit - 1)).catch(() => [])
  return rows.map((row) => {
    try {
      return JSON.parse(row)
    } catch {
      return null
    }
  }).filter(Boolean)
}

function getAdminActorId(req) {
  return Number(req?.user?.id || 0)
}

const DOCUMENT_TYPE_LABELS = {
  rc_pro: 'RC Professionnelle',
  assurance_decennale: 'Assurance Décennale',
  certification: 'Certification',
  diplome: 'Diplôme',
  extrait_ridet: 'Extrait RIDET',
  autre: 'Autre',
}

function formatDocumentTypeLabel(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return DOCUMENT_TYPE_LABELS[normalized] || 'Document'
}

function getBaseUrl() {
  return (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function resolvePrivateUpload(fileUrl) {
  try {
    const parsed = new URL(fileUrl, getBaseUrl())
    const marker = '/uploads/'
    const index = parsed.pathname.indexOf(marker)
    if (index < 0) return null
    const root = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')
    const resolved = path.resolve(root, decodeURIComponent(parsed.pathname.slice(index + marker.length)))
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null
    return resolved
  } catch {
    return null
  }
}

async function logAdminAction(req, action, targetType, targetId, metadata = {}) {
  const adminId = Number(req?.user?.id || 0)
  if (!adminId) return
  await query(
    `INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, targetType, String(targetId), JSON.stringify(metadata)]
  ).catch(() => {})
}

router.get('/pro-documents', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         d.id,
         d.pro_id,
         d.document_type,
         d.label,
         d.file_url,
         d.file_name,
         d.file_size,
         d.status,
         d.rejection_reason,
         d.uploaded_at,
         d.validated_at,
         d.validated_by,
         u.prenom,
         u.nom,
         u.email,
         u.pro_company_name,
         u.pro_commune
       FROM pro_documents d
       JOIN users u ON u.id = d.pro_id
       ORDER BY d.uploaded_at DESC, d.id DESC
       LIMIT 200`
    )

    return res.json({
      data: result.rows.map((row) => ({
        id: Number(row.id),
        pro_id: Number(row.pro_id),
        pro_name: row.pro_company_name || [row.prenom, row.nom].filter(Boolean).join(' ').trim() || row.email,
        pro_email: row.email,
        pro_commune: row.pro_commune ?? null,
        document_type: row.document_type,
        document_type_label: formatDocumentTypeLabel(row.document_type),
        label: row.label ?? null,
        download_url: `/api/admin/pro-documents/${Number(row.id)}/download`,
        file_name: row.file_name ?? null,
        file_size: row.file_size == null ? null : Number(row.file_size),
        status: row.status,
        rejection_reason: row.rejection_reason ?? null,
        uploaded_at: row.uploaded_at,
        validated_at: row.validated_at ?? null,
        validated_by: row.validated_by == null ? null : Number(row.validated_by),
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/pro-documents/:id/download', async (req, res, next) => {
  try {
    const documentId = Number(req.params.id)
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ error: 'Document invalide.' })
    }
    const result = await query(
      `SELECT file_url, file_name FROM pro_documents WHERE id = $1 LIMIT 1`,
      [documentId]
    )
    const doc = result.rows[0]
    const filePath = resolvePrivateUpload(doc?.file_url)
    if (!doc || !filePath) return res.status(404).json({ error: 'Document introuvable.' })
    await fs.access(filePath)
    return res.download(filePath, doc.file_name || path.basename(filePath))
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Document introuvable.' })
    return next(err)
  }
})

router.post('/pro-documents/:id/validate', async (req, res, next) => {
  try {
    const documentId = Number(req.params.id)
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ error: 'Document invalide.' })
    }

    const status = String(req.body?.status || '').trim().toLowerCase()
    if (!['validated', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut de validation invalide.' })
    }

    const rejectionReason = String(req.body?.rejection_reason || '').trim()

    const result = await query(
      `SELECT d.id, d.pro_id, d.document_type, d.label, d.file_url, d.file_name, d.status,
              u.email, u.prenom, u.nom, u.pro_company_name
       FROM pro_documents d
       JOIN users u ON u.id = d.pro_id
       WHERE d.id = $1
       LIMIT 1`,
      [documentId]
    )

    const doc = result.rows[0]
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' })
    }

    const updated = await query(
      `UPDATE pro_documents
       SET status = $1,
           rejection_reason = $2,
           validated_at = NOW(),
           validated_by = $3
       WHERE id = $4
       RETURNING id, status, rejection_reason, validated_at, validated_by`,
      [
        status,
        status === 'rejected' ? (rejectionReason || 'Document refusé') : null,
        getAdminActorId(req) || null,
        documentId,
      ]
    )

    const proName = doc.pro_company_name || [doc.prenom, doc.nom].filter(Boolean).join(' ').trim() || doc.email
    const documentLabel = doc.label || formatDocumentTypeLabel(doc.document_type)
    const subject = status === 'validated'
      ? `Votre justificatif ${documentLabel} a été validé`
      : `Votre justificatif ${documentLabel} a été refusé`
    const body = status === 'validated'
      ? `✅ Votre ${documentLabel} a été validé.`
      : `❌ Votre ${documentLabel} a été refusé. Raison : ${rejectionReason || 'Non précisée'}`

    await Promise.all([
      sendMail({
        to: doc.email,
        subject,
        html: `
          <p>Bonjour ${proName},</p>
          <p>${body}</p>
          ${status === 'rejected' ? `<p><strong>Raison :</strong> ${rejectionReason || 'Non précisée'}</p>` : ''}
          <p>Connectez-vous à votre espace Pro pour suivre vos justificatifs.</p>
        `,
      }).catch(() => {}),
      createNotification(doc.pro_id, {
        type: 'system',
        title: status === 'validated' ? 'Justificatif validé' : 'Justificatif refusé',
        body: status === 'validated'
          ? `Votre ${documentLabel} a été validé.`
          : `Votre ${documentLabel} a été refusé.`,
        href: '/pro/dashboard/parametres',
      }),
      sendPushToUser(doc.pro_id, {
        title: status === 'validated' ? 'Justificatif validé' : 'Justificatif refusé',
        body: status === 'validated'
          ? `Votre ${documentLabel} a été validé.`
          : `Votre ${documentLabel} a été refusé.`,
        data: { type: 'pro_document_validation', documentId, status },
      }).catch(() => {}),
      logAdminAction(req, `pro_document_${status}`, 'pro_document', documentId, {
        pro_id: doc.pro_id,
        rejection_reason: status === 'rejected' ? rejectionReason || null : null,
      }),
    ])

    return res.json({
      data: {
        id: Number(updated.rows[0].id),
        status: updated.rows[0].status,
        rejection_reason: updated.rows[0].rejection_reason ?? null,
        validated_at: updated.rows[0].validated_at,
        validated_by: updated.rows[0].validated_by == null ? null : Number(updated.rows[0].validated_by),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/cinema/scrape', async (_req, res, next) => {
  try {
    const report = await runCinemaScraper()
    return res.json({ data: report })
  } catch (err) {
    next(err)
  }
})

function assertSafeSqlIdentifier(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Identifiant SQL invalide pour ${label}`)
  }
  return value
}

function assertSafeSqlCondition(value) {
  if (typeof value !== 'string') {
    throw new Error('Condition SQL invalide')
  }
  const trimmed = value.trim() || 'TRUE'
  if (/[;`]|--|\/\*/.test(trimmed)) {
    throw new Error('Condition SQL invalide')
  }
  return trimmed
}

async function countDaysSeries(tableName, dateColumn, startDate, endDate, extraWhere = 'TRUE') {
  const safeTableName = assertSafeSqlIdentifier(tableName, 'tableName')
  const safeDateColumn = assertSafeSqlIdentifier(dateColumn, 'dateColumn')
  const safeExtraWhere = assertSafeSqlCondition(extraWhere)

  return query(
    `
      WITH days AS (
        SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
      )
      SELECT
        days.day::text AS date,
        COUNT(t.*)::int AS count
      FROM days
      LEFT JOIN ${safeTableName} t
        ON DATE(t.${safeDateColumn}) = days.day AND ${safeExtraWhere}
      GROUP BY days.day
      ORDER BY days.day ASC
    `,
    [dateIso(startDate), dateIso(endDate)]
  )
}

async function getLatestSubscriptionSnapshot(userId) {
  const result = await query(
    `SELECT id, user_id, plan_id, billing_period, provider, payment_provider, status, payment_status,
            current_period_end, current_period_start, cancel_at_period_end, created_at, updated_at
     FROM subscriptions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  ).catch(() => ({ rows: [] }))
  return result.rows
}

async function getCurrentProSubscribers() {
  const result = await query(
    `SELECT u.id, u.prenom, u.nom, u.email, u.created_at AS since,
            COALESCE(SUM(p.amount_xpf), 0)::int AS revenue_generated,
            COUNT(*) FILTER (WHERE p.type = 'subscription')::int AS subscription_count
     FROM users u
     LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'succeeded'
     WHERE u.is_pro = TRUE
     GROUP BY u.id, u.prenom, u.nom, u.email, u.created_at
     ORDER BY revenue_generated DESC, u.created_at DESC
     LIMIT 10`
  ).catch(() => ({ rows: [] }))

  return result.rows.map((row) => ({
    id: row.id,
    name: `${row.prenom || ''} ${row.nom || ''}`.trim() || row.email,
    email: row.email,
    since: row.since,
    revenue_generated: Number(row.revenue_generated || 0),
    plan: 'pro',
  }))
}

async function getErrorLogsFromRedis(limit = 50) {
  const logs = await readRedisListJson('error_logs', limit)
  return logs
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id || entry.request_id || `${entry.timestamp || Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: entry.timestamp || entry.ts || new Date().toISOString(),
      level: entry.level || 'error',
      message: entry.message || 'Erreur',
      route: entry.route || `${entry.method || 'GET'} ${entry.path || '/'}`,
      method: entry.method || 'GET',
      path: entry.path || '/',
      user_id: entry.user_id ?? null,
      user_email: entry.user_email ?? null,
      stack: entry.stack || null,
      request_id: entry.request_id ?? null,
      body: entry.body || null,
    }))
}

router.get('/observability', async (req, res, next) => {
  try {
    const snapshot = await getSnapshot()
    return res.json({ data: snapshot })
  } catch (err) {
    next(err)
  }
})

router.get('/health/full', async (_req, res, next) => {
  try {
    const startedAt = Date.now()
    const snapshot = await getSnapshot()
    const redis = await getRedisClient()

    let redisStatus = {
      status: 'degraded',
      memory_mb: null,
      keys_count: null,
      queue_length: null,
    }

    if (redis) {
      const [dbSize, memoryInfo] = await Promise.all([
        redis.dbSize().catch(() => 0),
        redis.info('memory').catch(() => ''),
      ])
      const usedMemory = Number(memoryInfo.match(/used_memory:(\d+)/)?.[1] || 0)
      redisStatus = {
        status: 'ok',
        memory_mb: Math.round(usedMemory / 1024 / 1024),
        keys_count: Number(dbSize || 0),
        queue_length: Number(await redis.llen('error_logs').catch(() => 0)),
      }
    }

    const errors1h = snapshot.errors.filter((entry) => {
      const ts = new Date(entry.ts || entry.timestamp || Date.now()).getTime()
      return Date.now() - ts <= 60 * 60 * 1000
    }).length

    const errors24h = snapshot.errors.filter((entry) => {
      const ts = new Date(entry.ts || entry.timestamp || Date.now()).getTime()
      return Date.now() - ts <= 24 * 60 * 60 * 1000
    }).length

    const workerLastRun = snapshot.cluster?.nodes?.[0]?.last_job_at || snapshot.cluster?.nodes?.[0]?.updated_at || null

    return res.json({
      data: {
        backend: {
          status: 'ok',
          uptime: process.uptime(),
          memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          response_time_ms: Date.now() - startedAt,
        },
        db: {
          status: 'ok',
          active_connections: pool.totalCount - pool.idleCount,
          pool_size: pool.options?.max ?? null,
          slow_queries_count: 0,
        },
        redis: redisStatus,
        worker: {
          status: snapshot.jobs.errors > 0 ? 'degraded' : 'ok',
          last_run_at: workerLastRun,
          failed_jobs_24h: snapshot.jobs.errors || 0,
        },
        errors_1h: errors1h,
        errors_24h: errors24h,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/health/errors', async (req, res, next) => {
  try {
    const hours = Math.min(168, Math.max(1, toInt(req.query.hours, 24)))
    const limit = Math.min(200, Math.max(1, toInt(req.query.limit, 50)))
    const logs = await getErrorLogsFromRedis(limit)
    const since = Date.now() - hours * 60 * 60 * 1000
    return res.json({
      data: logs.filter((entry) => new Date(entry.ts).getTime() >= since).slice(0, limit),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/health/slow-queries', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)))
    const result = await query(
      `SELECT
         query,
         calls::int,
         total_exec_time::numeric(12,2) AS total_exec_time_ms,
         mean_exec_time::numeric(12,2) AS mean_exec_time_ms,
         rows::int
       FROM pg_stat_statements
       ORDER BY mean_exec_time DESC
       LIMIT $1`,
      [limit]
    ).catch(() => ({ rows: [] }))

    return res.json({ data: result.rows })
  } catch (err) {
    next(err)
  }
})

router.get('/alerts/active', async (_req, res, next) => {
  try {
    const redis = await getRedisClient()
    if (!redis) {
      return res.json({ data: [] })
    }

    const payload = await redis.get('admin:alerts').catch(() => '[]')
    const data = JSON.parse(payload || '[]')
    return res.json({ data })
  } catch (err) {
    next(err)
  }
})

// ── GET /admin/stats ─────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const [annonces, users, messages, signalements, revenus, services] = await Promise.all([
      query(`SELECT
        COUNT(*)                                                 AS total_annonces,
        COUNT(*) FILTER (WHERE status = 'active')              AS active_annonces,
        COUNT(*) FILTER (WHERE status = 'sold')                AS sold_annonces,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS annonces_today
        FROM annonces WHERE deleted_at IS NULL`),
      query(`SELECT
        COUNT(*)                                                 AS total_users,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS new_users_today,
        COUNT(*) FILTER (WHERE is_pro = TRUE)                   AS pro_users
        FROM users WHERE deleted_at IS NULL`),
      query(`SELECT COUNT(*) AS total_messages FROM messages`),
      query(`SELECT COUNT(*) AS pending_signalements FROM signalements WHERE resolved_at IS NULL`),
      query(`SELECT COALESCE(SUM(amount_xpf),0) AS revenus_total,
               COALESCE(SUM(amount_xpf) FILTER (WHERE DATE(created_at) = CURRENT_DATE),0) AS revenus_today
             FROM payments WHERE status = 'succeeded'`).catch(() => ({ rows: [{ revenus_total: 0, revenus_today: 0 }] })),
      query(`
        SELECT
          (SELECT COUNT(*) FROM bon_plans WHERE status = 'active' AND expires_at > NOW()) AS bon_plans_actifs,
          (SELECT COUNT(*) FROM bon_plans WHERE status = 'pending') AS bon_plans_en_attente,
          (SELECT COUNT(*) FROM bon_plans WHERE status = 'rejected') AS bon_plans_refuses,
          (SELECT COUNT(*) FROM bon_plans WHERE expires_at <= NOW()) AS bon_plans_expired,
          (SELECT COALESCE(SUM(view_count), 0) FROM bon_plans) AS bon_plans_vues,
          (SELECT COALESCE(SUM(share_count), 0) FROM bon_plans) AS bon_plans_partages,
          (SELECT COUNT(*) FROM bon_plans WHERE kind IN ('event', 'concert') AND status = 'active' AND expires_at > NOW()) AS events_actifs,
          (SELECT COUNT(*) FROM bon_plans WHERE kind IN ('event', 'concert') AND event_date >= CURRENT_DATE) AS events_a_venir,
          (SELECT COUNT(*) FROM bon_plans WHERE kind IN ('event', 'concert') AND event_date < CURRENT_DATE) AS events_passes,
          (SELECT COUNT(*) FROM bon_plans WHERE kind = 'promo') AS promotions_total,
          (SELECT COUNT(*) FROM bon_plans WHERE kind IN ('event', 'concert')) AS events_total,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'bon_plan_contact_click') AS bon_plans_contacts,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'bon_plan_view') AS bon_plans_event_views,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'event_view') AS events_views,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'event_reservation_click') AS events_reservations,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'event_contact_click') AS events_contacts,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'share_click' AND metadata ->> 'content_type' = 'bon_plan') AS bon_plans_shares_clicks,
          (SELECT COUNT(*) FROM covoiturages WHERE status IN ('published', 'full') AND expires_at > NOW()) AS rides_active,
          (SELECT COUNT(*) FROM covoiturages WHERE status = 'full') AS rides_full,
          (SELECT COUNT(*) FROM covoiturages WHERE status = 'cancelled') AS rides_cancelled,
          (SELECT COUNT(*) FROM covoiturages WHERE status = 'completed') AS rides_completed,
          (SELECT COUNT(*) FROM covoiturages WHERE is_verified_driver = TRUE) AS rides_verified_drivers,
          (SELECT COALESCE(AVG(price_xpf), 0) FROM covoiturages) AS ride_avg_price,
          (SELECT COALESCE(AVG(rating), 0) FROM covoiturage_reviews) AS ride_avg_rating,
          (SELECT COALESCE(SUM(seats_reserved), 0) FROM covoiturages) AS ride_seats_reserved,
          (SELECT COALESCE(SUM(seats_total), 0) FROM covoiturages) AS ride_seats_total,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'ride_view') AS ride_views,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'ride_contact_click') AS ride_contacts,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'ride_book') AS ride_bookings,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'ride_cancel') AS ride_cancellations,
          (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'ride_review_submit') AS ride_reviews
      `).catch(() => ({ rows: [{}] })),
    ])

    res.json({
      data: {
        ...annonces.rows[0],
        ...users.rows[0],
        ...messages.rows[0],
        ...signalements.rows[0],
        ...revenus.rows[0],
        services: services.rows[0],
      },
    })
  } catch (err) { next(err) }
})

router.get('/stats/users', async (req, res, next) => {
  try {
    const days = normalizePeriod(req.query.period)
    const startDate = startDateFromDays(days)
    const endDate = new Date()
    const [summary, chartNew, chartActive] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::int AS new_today,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_this_week,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_this_month,
           COUNT(*) FILTER (WHERE phone_verified = TRUE)::int AS phone_verified_total,
           COUNT(*) FILTER (WHERE nb_annonces > 0)::int AS activation_total,
           COUNT(*) FILTER (WHERE is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()))::int AS pro_subscribers
         FROM users
         WHERE deleted_at IS NULL`
      ),
      query(
        `WITH days AS (
           SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
         )
         SELECT days.day::text AS date,
                COUNT(u.id)::int AS count
         FROM days
         LEFT JOIN users u ON DATE(u.created_at) = days.day AND u.deleted_at IS NULL
         GROUP BY days.day
         ORDER BY days.day ASC`,
        [dateIso(startDate), dateIso(endDate)]
      ),
      query(
        `WITH days AS (
           SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
         ), active_users AS (
           SELECT DISTINCT DATE(created_at) AS day, user_id
           FROM analytics_events
           WHERE user_id IS NOT NULL
             AND created_at >= $1::date
         )
         SELECT days.day::text AS date,
                COUNT(active_users.user_id)::int AS count
         FROM days
         LEFT JOIN active_users ON active_users.day = days.day
         GROUP BY days.day
         ORDER BY days.day ASC`,
        [dateIso(startDate), dateIso(endDate)]
      ),
    ])

    const total = Number(summary.rows[0]?.total ?? 0)
    const phoneVerifiedRate = total ? Number(summary.rows[0]?.phone_verified_total ?? 0) / total : 0
    const activationRate = total ? Number(summary.rows[0]?.activation_total ?? 0) / total : 0
    const proSubscribers = Number(summary.rows[0]?.pro_subscribers ?? 0)

    return res.json({
      data: {
        total,
        new_today: Number(summary.rows[0]?.new_today ?? 0),
        new_this_week: Number(summary.rows[0]?.new_this_week ?? 0),
        new_this_month: Number(summary.rows[0]?.new_this_month ?? 0),
        active_dau: Number(chartActive.rows[chartActive.rows.length - 1]?.count ?? 0),
        active_wau: Number(summary.rows[0]?.new_this_week ?? 0),
        active_mau: Number(summary.rows[0]?.new_this_month ?? 0),
        phone_verified_rate: phoneVerifiedRate,
        activation_rate: activationRate,
        pro_subscribers: proSubscribers,
        pro_churned_this_month: 0,
        chart_new_users: chartNew.rows,
        chart_active_users: chartActive.rows,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/stats/listings', async (req, res, next) => {
  try {
    const days = normalizePeriod(req.query.period)
    const startDate = startDateFromDays(days)
    const endDate = new Date()
    const [summary, byCategory, chartPublished] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE a.status = 'active' AND a.deleted_at IS NULL)::int AS total_active,
           COUNT(*) FILTER (WHERE DATE(a.created_at) = CURRENT_DATE)::int AS published_today,
           COUNT(*) FILTER (WHERE a.created_at >= NOW() - INTERVAL '7 days')::int AS published_this_week,
           COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM annonce_images ai WHERE ai.annonce_id = a.id))::int AS with_photos_count,
           COUNT(*)::int AS total_listings,
           COALESCE(ROUND(AVG((SELECT COUNT(*) FROM annonce_images ai WHERE ai.annonce_id = a.id))::numeric, 2), 0) AS avg_photos_per_listing
         FROM annonces a
         WHERE a.deleted_at IS NULL`
      ),
      query(
        `SELECT
           COALESCE(cat.name, 'Sans catégorie') AS category,
           COUNT(*)::int AS count,
           COALESCE(ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 2), 0) AS pct
         FROM annonces a
         LEFT JOIN categories cat ON cat.id = a.category_id
         WHERE a.deleted_at IS NULL
         GROUP BY COALESCE(cat.name, 'Sans catégorie')
         ORDER BY count DESC`
      ),
      query(
        `WITH days AS (
           SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
         )
         SELECT days.day::text AS date,
                COALESCE(cat.slug, 'unknown') AS category,
                COUNT(a.id)::int AS count
         FROM days
         LEFT JOIN annonces a ON DATE(a.created_at) = days.day AND a.deleted_at IS NULL
         LEFT JOIN categories cat ON cat.id = a.category_id
         GROUP BY days.day, cat.slug
         ORDER BY days.day ASC, count DESC`,
        [dateIso(startDate), dateIso(endDate)]
      ),
    ])

    const rows = summary.rows[0] || {}
    const totalList = Number(rows.total_listings || 0) || 1

    const categoryLookup = Object.fromEntries(byCategory.rows.map((item) => [item.category, item]))
    const categoryCounts = [
      'Troc',
      'Covoiturage',
      'Services',
      'Locations courte durée',
      'Immobilier',
      'Dons',
    ].map((name) => ({
      category: name,
      count: Number(categoryLookup[name]?.count || 0),
      pct: Number(categoryLookup[name]?.pct || 0),
    }))

    return res.json({
      data: {
        total_active: Number(rows.total_active || 0),
        published_today: Number(rows.published_today || 0),
        published_this_week: Number(rows.published_this_week || 0),
        by_category: categoryCounts.length ? categoryCounts : byCategory.rows,
        with_photos_rate: totalList ? Number(rows.with_photos_count || 0) / totalList : 0,
        avg_photos_per_listing: Number(rows.avg_photos_per_listing || 0),
        troc_active: categoryLookup['Troc'] ? Number(categoryLookup['Troc'].count || 0) : 0,
        covoit_active: categoryLookup['Covoiturage'] ? Number(categoryLookup['Covoiturage'].count || 0) : 0,
        services_active: categoryLookup['Services'] ? Number(categoryLookup['Services'].count || 0) : 0,
        locations_active: categoryLookup['Locations courte durée'] ? Number(categoryLookup['Locations courte durée'].count || 0) : 0,
        immobilier_active: categoryLookup['Immobilier'] ? Number(categoryLookup['Immobilier'].count || 0) : 0,
        dons_active: categoryLookup['Dons'] ? Number(categoryLookup['Dons'].count || 0) : 0,
        chart_published: chartPublished.rows,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/stats/revenue', async (req, res, next) => {
  try {
    const days = normalizePeriod(req.query.period)
    const startDate = startDateFromDays(days)
    const endDate = new Date()
    const [currentSubs, previousSubs, chartRevenue, topProUsers] = await Promise.all([
      query(
        `SELECT
           COALESCE(SUM(CASE WHEN billing_period = 'monthly' THEN 4900 ELSE 44900 / 12 END), 0)::int AS mrr_xpf,
           COUNT(*) FILTER (WHERE status = 'active' AND payment_status = 'succeeded')::int AS pro_subscribers_active,
           COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days')::int AS pro_subscribers_new,
           COUNT(*) FILTER (WHERE payment_status = 'failed' AND updated_at >= NOW() - INTERVAL '30 days')::int AS pro_subscribers_churned
         FROM subscriptions
         WHERE payment_status = 'succeeded'
           AND (current_period_end IS NULL OR current_period_end > NOW())`
      ),
      query(
        `SELECT
           COALESCE(SUM(CASE WHEN billing_period = 'monthly' THEN 4900 ELSE 44900 / 12 END), 0)::int AS mrr_xpf
         FROM subscriptions
         WHERE payment_status = 'succeeded'
           AND (current_period_end IS NULL OR current_period_end > NOW() - INTERVAL '30 days')`
      ),
      query(
        `WITH days AS (
           SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
         )
         SELECT
           days.day::text AS date,
           COALESCE(SUM(CASE WHEN p.type = 'subscription' THEN p.amount_xpf ELSE 0 END), 0)::int AS subscriptions,
           COALESCE(SUM(CASE WHEN p.type = 'boost' THEN p.amount_xpf ELSE 0 END), 0)::int AS boosts,
           COALESCE(SUM(CASE WHEN p.type = 'bon_plan' THEN p.amount_xpf ELSE 0 END), 0)::int AS bon_plans,
           COALESCE(SUM(CASE WHEN p.type = 'driver_badge' THEN p.amount_xpf ELSE 0 END), 0)::int AS badges
         FROM days
         LEFT JOIN payments p ON DATE(p.created_at) = days.day AND p.status = 'succeeded'
         GROUP BY days.day
         ORDER BY days.day ASC`,
        [dateIso(startDate), dateIso(endDate)]
      ),
      getCurrentProSubscribers(),
    ])

    const current = currentSubs.rows[0] || {}
    const previous = previousSubs.rows[0] || {}
    const mrr = Number(current.mrr_xpf || 0)
    const previousMrr = Number(previous.mrr_xpf || 0)

    return res.json({
      data: {
        mrr_xpf: mrr,
        mrr_trend: previousMrr ? ((mrr - previousMrr) / previousMrr) * 100 : 0,
        arr_xpf: mrr * 12,
        revenue_this_month: {
          subscriptions_xpf: Number(current.mrr_xpf || 0),
          boosts_xpf: 0,
          bon_plans_xpf: 0,
          driver_badges_xpf: 0,
          total_xpf: Number(current.mrr_xpf || 0),
        },
        revenue_last_month: {
          subscriptions_xpf: Number(previous.mrr_xpf || 0),
          boosts_xpf: 0,
          bon_plans_xpf: 0,
          driver_badges_xpf: 0,
          total_xpf: Number(previous.mrr_xpf || 0),
        },
        pro_subscribers_active: Number(current.pro_subscribers_active || 0),
        pro_subscribers_new: Number(current.pro_subscribers_new || 0),
        pro_subscribers_churned: Number(current.pro_subscribers_churned || 0),
        churn_rate: Number(current.pro_subscribers_active || 0)
          ? Number(current.pro_subscribers_churned || 0) / Number(current.pro_subscribers_active || 0)
          : 0,
        ltv_estimate_xpf: Number(current.pro_subscribers_active || 0)
          ? Math.round(Number(current.mrr_xpf || 0) / Math.max(0.01, Number(current.pro_subscribers_churned || 0) / Number(current.pro_subscribers_active || 0)))
          : 0,
        chart_revenue: chartRevenue.rows,
        top_pro_users: topProUsers,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/stats/engagement', async (req, res, next) => {
  try {
    const days = normalizePeriod(req.query.period)
    const startDate = startDateFromDays(days)
    const endDate = new Date()
    const [messages, troc, covoit, bonPlans, chartMessages, chartTroc] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::int AS messages_today,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS messages_this_week,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS messages_this_month
         FROM messages`
      ),
      query(
        `SELECT
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS troc_proposals_created,
           COUNT(*) FILTER (WHERE status = 'accepted' AND updated_at >= NOW() - INTERVAL '30 days')::int AS troc_proposals_accepted
         FROM troc_proposals`
      ).catch(() => ({ rows: [{ troc_proposals_created: 0, troc_proposals_accepted: 0 }] })),
      query(
        `SELECT
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS covoit_alerts_created,
           COUNT(*) FILTER (WHERE last_notified_at >= NOW() - INTERVAL '30 days')::int AS covoit_alerts_triggered
         FROM covoit_alerts`
      ).catch(() => ({ rows: [{ covoit_alerts_created: 0, covoit_alerts_triggered: 0 }] })),
      query(
        `SELECT
           COALESCE(SUM(COALESCE(click_count, 0)), 0)::int AS bon_plans_clicks_total,
           CASE WHEN COALESCE(SUM(COALESCE(view_count, 0)), 0) = 0
             THEN 0
             ELSE ROUND(100.0 * SUM(COALESCE(click_count, 0)) / SUM(COALESCE(view_count, 0)), 2)
           END AS bon_plans_avg_ctr
         FROM bon_plans`
      ).catch(() => ({ rows: [{ bon_plans_clicks_total: 0, bon_plans_avg_ctr: 0 }] })),
      query(
        `WITH days AS (
           SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
         )
         SELECT days.day::text AS date, COUNT(m.id)::int AS count
         FROM days
         LEFT JOIN messages m ON DATE(m.created_at) = days.day
         GROUP BY days.day
         ORDER BY days.day ASC`,
        [dateIso(startDate), dateIso(endDate)]
      ),
      query(
        `WITH days AS (
           SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
         )
         SELECT
           days.day::text AS date,
           COUNT(p.id)::int AS created,
           COUNT(*) FILTER (WHERE p.status = 'accepted')::int AS accepted
         FROM days
         LEFT JOIN troc_proposals p ON DATE(p.created_at) = days.day
         GROUP BY days.day
         ORDER BY days.day ASC`
        ,
        [dateIso(startDate), dateIso(endDate)]
      ).catch(() => ({ rows: [] })),
    ])

    return res.json({
      data: {
        messages_today: Number(messages.rows[0]?.messages_today ?? 0),
        messages_this_week: Number(messages.rows[0]?.messages_this_week ?? 0),
        messages_this_month: Number(messages.rows[0]?.messages_this_month ?? 0),
        troc_proposals_created: Number(troc.rows[0]?.troc_proposals_created ?? 0),
        troc_proposals_accepted: Number(troc.rows[0]?.troc_proposals_accepted ?? 0),
        troc_acceptance_rate: Number(troc.rows[0]?.troc_proposals_created ?? 0)
          ? Number(troc.rows[0]?.troc_proposals_accepted ?? 0) / Number(troc.rows[0]?.troc_proposals_created ?? 0)
          : 0,
        covoit_alerts_created: Number(covoit.rows[0]?.covoit_alerts_created ?? 0),
        covoit_alerts_triggered: Number(covoit.rows[0]?.covoit_alerts_triggered ?? 0),
        bon_plans_clicks_total: Number(bonPlans.rows[0]?.bon_plans_clicks_total ?? 0),
        bon_plans_avg_ctr: Number(bonPlans.rows[0]?.bon_plans_avg_ctr ?? 0),
        chart_messages: chartMessages.rows,
        chart_troc: chartTroc.rows,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/moderation/queue', async (_req, res, next) => {
  try {
    const [reports, businesses] = await Promise.all([
      query(
        `SELECT
           s.id,
           'listing' AS type,
           s.annonce_id AS listing_id,
           u_reporter.prenom || ' ' || u_reporter.nom AS reporter,
           COALESCE(s.reason, s.raison) AS reason,
           s.created_at,
           json_build_object(
             'id', a.id,
             'title', a.titre,
             'status', a.status,
             'user_email', u_annonce.email,
             'category', cat.name
           ) AS listing_preview
         FROM signalements s
         JOIN users u_reporter ON u_reporter.id = COALESCE(s.reporter_id, s.user_id)
         LEFT JOIN annonces a ON a.id = s.annonce_id
         LEFT JOIN users u_annonce ON u_annonce.id = a.user_id
         LEFT JOIN categories cat ON cat.id = a.category_id
         WHERE s.resolved_at IS NULL
         ORDER BY s.created_at DESC
         LIMIT 200`
      ).catch(() => ({ rows: [] })),
      query(
        `SELECT id, name AS business_name, badge, bon_plan_count
         FROM businesses
         WHERE badge = 'active'
         ORDER BY bon_plan_count DESC, created_at DESC
         LIMIT 100`
      ).catch(() => ({ rows: [] })),
    ])

    return res.json({
      data: {
        reports: reports.rows,
        pending_driver_verifications: [],
        pending_business_verifications: businesses.rows,
        total_pending: Number(reports.rows.length + businesses.rows.length),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/moderation/reports/:id/resolve', async (req, res, next) => {
  try {
    const { action } = req.body || {}
    const resolveAction = action || 'dismiss'
    const result = await query(
      `UPDATE signalements
       SET resolved_at = NOW(),
           action_taken = $2,
           resolved_by = $3
       WHERE id = $1
       RETURNING id`,
      [req.params.id, resolveAction, req.user?.id ?? null]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Signalement introuvable.' })
    }

    await logAdminAction(req, `moderation_${resolveAction}`, 'signalement', req.params.id, { action: resolveAction })
    return res.json({ data: { action: resolveAction } })
  } catch (err) {
    next(err)
  }
})

router.get('/users/:id/full', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const [userRes, listingsRes, paymentsRes, reportsMadeRes, reportsReceivedRes, subscriptionsRes] = await Promise.all([
      query(
        `SELECT
           u.*,
           COALESCE(com.name, '') AS commune_name,
           COALESCE(prov.name, '') AS province_name
         FROM users u
         LEFT JOIN communes com ON com.id = u.commune_id
         LEFT JOIN provinces prov ON prov.id = com.province_id
         WHERE u.id = $1`,
        [userId]
      ),
      query(
        `SELECT a.id, a.titre, a.status, a.prix, a.created_at, a.nb_vues AS view_count,
                cat.name AS category_name, com.name AS commune_name
         FROM annonces a
         LEFT JOIN categories cat ON cat.id = a.category_id
         LEFT JOIN communes com ON com.id = a.commune_id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC
         LIMIT 100`,
        [userId]
      ).catch(() => ({ rows: [] })),
      query(
        `SELECT id, type, provider, amount_xpf, status, provider_ref, created_at, metadata
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId]
      ).catch(() => ({ rows: [] })),
      query(
        `SELECT id, annonce_id, reason, comment, status, created_at, resolved_at
         FROM signalements
         WHERE reporter_id = $1 OR user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId]
      ).catch(() => ({ rows: [] })),
      query(
        `SELECT id, annonce_id, reason, comment, status, created_at, resolved_at
         FROM signalements
         WHERE annonce_id IN (SELECT id FROM annonces WHERE user_id = $1)
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId]
      ).catch(() => ({ rows: [] })),
      getLatestSubscriptionSnapshot(userId),
    ])

    if (!userRes.rows[0]) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' })
    }

    return res.json({
      data: {
        user: userRes.rows[0],
        listings: listingsRes.rows,
        subscriptions: subscriptionsRes,
        payments: paymentsRes.rows,
        reports_made: reportsMadeRes.rows,
        reports_received: reportsReceivedRes.rows,
        troc_proposals: [],
        login_history: [],
      },
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const { reason = 'admin', duration_days = 30 } = req.body || {}
    if (userId === Number(req.user.id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas suspendre votre propre compte administrateur.' })
    }
    const updated = await suspendUser(userId, duration_days)
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    disconnectUserSockets(userId)
    await logAdminAction(req, 'suspend_user', 'user', userId, { reason, duration_days })
    return res.json({ data: { ok: true, id: Number(updated.id), banned_until: updated.banned_until } })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:id/unsuspend', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const updated = await unsuspendUser(userId)
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    await logAdminAction(req, 'unsuspend_user', 'user', userId, {})
    return res.json({ data: { ok: true, id: Number(updated.id) } })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:id/set-plan', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const result = await setUserPlan(userId, req.body?.plan)
    if (!result.user) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    const { plan } = result
    await logAdminAction(req, 'set_plan', 'user', userId, { plan })
    return res.json({ data: { ok: true, plan } })
  } catch (err) {
    next(err)
  }
})

router.delete('/users/:id/force-delete', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    if (userId === Number(req.user.id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' })
    }
    const updated = await forceDeleteUser(userId)
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    disconnectUserSockets(userId)
    await logAdminAction(req, 'force_delete_user', 'user', userId, {})
    return res.json({ data: { ok: true, id: Number(updated.id) } })
  } catch (err) {
    next(err)
  }
})

router.get('/reports/monthly', async (req, res, next) => {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7))
    const [year, monthIndex] = month.split('-').map((part) => toInt(part, 0))
    const monthStart = new Date(Date.UTC(year, Math.max(0, monthIndex - 1), 1))
    const monthEnd = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59))

    const [users, listings, revenue, troc, bonPlans] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE created_at BETWEEN $1 AND $2)::int AS new_users,
           COUNT(*) FILTER (WHERE is_pro = TRUE)::int AS pro_users
         FROM users WHERE deleted_at IS NULL`,
        [monthStart, monthEnd]
      ),
      query(
        `SELECT COUNT(*)::int AS listings_published
         FROM annonces
         WHERE created_at BETWEEN $1 AND $2 AND deleted_at IS NULL`,
        [monthStart, monthEnd]
      ),
      query(
        `SELECT COALESCE(SUM(amount_xpf), 0)::int AS revenue_xpf
         FROM payments
         WHERE status = 'succeeded' AND created_at BETWEEN $1 AND $2`,
        [monthStart, monthEnd]
      ),
      query(
        `SELECT COUNT(*)::int AS proposals, COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted
         FROM troc_proposals
         WHERE created_at BETWEEN $1 AND $2`,
        [monthStart, monthEnd]
      ).catch(() => ({ rows: [{ proposals: 0, accepted: 0 }] })),
      query(
        `SELECT COUNT(*)::int AS total, COALESCE(SUM(click_count), 0)::int AS clicks
         FROM bon_plans
         WHERE created_at BETWEEN $1 AND $2`,
        [monthStart, monthEnd]
      ).catch(() => ({ rows: [{ total: 0, clicks: 0 }] })),
    ])

    return res.json({
      data: {
        month,
        new_users: Number(users.rows[0]?.new_users ?? 0),
        total_users: Number(users.rows[0]?.total ?? 0),
        pro_users: Number(users.rows[0]?.pro_users ?? 0),
        listings_published: Number(listings.rows[0]?.listings_published ?? 0),
        mrr_xpf: Number(revenue.rows[0]?.revenue_xpf ?? 0),
        troc_proposals: Number(troc.rows[0]?.proposals ?? 0),
        troc_accepted: Number(troc.rows[0]?.accepted ?? 0),
        bon_plans: Number(bonPlans.rows[0]?.total ?? 0),
        bon_plan_clicks: Number(bonPlans.rows[0]?.clicks ?? 0),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/reports/monthly/export', async (req, res, next) => {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7))
    const format = String(req.query.format || 'pdf').toLowerCase()
    const data = (await query(`SELECT $1::text AS month`, [month])).rows[0]
    if (format === 'csv') {
      res.setHeader('content-type', 'text/csv; charset=utf-8')
      return res.send(`month,${data.month}\n`)
    }
    return res.json({ data: { month: data.month, exported: true } })
  } catch (err) {
    next(err)
  }
})

// ── GET /admin/annonces ──────────────────────────────────

router.get('/annonces', async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 25 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    const conds  = ['a.deleted_at IS NULL']

    if (q) {
      params.push(`%${q}%`)
      conds.push(`(a.titre ILIKE $${params.length} OR u.email ILIKE $${params.length})`)
    }
    if (status) {
      params.push(status)
      conds.push(`a.status = $${params.length}`)
    }

    const where = 'WHERE ' + conds.join(' AND ')

    const [rows, count] = await Promise.all([
      query(`
        SELECT a.id, a.titre, a.status, a.prix, a.condition,
               a.nb_vues AS view_count, a.created_at, a.boost_expires_at AS boosted_until,
               cat.name AS category_name,
               co.name  AS commune_name,
               u.id AS user_id, u.prenom, u.nom, u.email
        FROM annonces a
        JOIN users u       ON u.id  = a.user_id
        JOIN categories cat ON cat.id = a.category_id
        LEFT JOIN communes co ON co.id = a.commune_id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT $${params.push(Number(limit))} OFFSET $${params.push(offset)}
      `, params),
      query(`SELECT COUNT(*) FROM annonces a JOIN users u ON u.id = a.user_id ${where}`, params.slice(0, -2)),
    ])

    res.json({
      data: rows.rows,
      pagination: { total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) },
    })
  } catch (err) { next(err) }
})

// Rétro-compat : /listings expose la même liste que /annonces
router.get('/listings', async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 25 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    const conds  = ['a.deleted_at IS NULL']

    if (q) {
      params.push(`%${q}%`)
      conds.push(`(a.titre ILIKE $${params.length} OR u.email ILIKE $${params.length})`)
    }
    if (status) {
      params.push(status)
      conds.push(`a.status = $${params.length}`)
    }

    const where = 'WHERE ' + conds.join(' AND ')

    const [rows, count] = await Promise.all([
      query(`
        SELECT a.id, a.titre, a.status, a.prix, a.condition,
               a.nb_vues AS view_count, a.created_at, a.boost_expires_at AS boosted_until,
               cat.name AS category_name,
               co.name  AS commune_name,
               u.id AS user_id, u.prenom, u.nom, u.email
        FROM annonces a
        JOIN users u       ON u.id  = a.user_id
        JOIN categories cat ON cat.id = a.category_id
        LEFT JOIN communes co ON co.id = a.commune_id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT $${params.push(Number(limit))} OFFSET $${params.push(offset)}
      `, params),
      query(`SELECT COUNT(*) FROM annonces a JOIN users u ON u.id = a.user_id ${where}`, params.slice(0, -2)),
    ])

    res.json({
      data: rows.rows,
      pagination: { total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) },
    })
  } catch (err) { next(err) }
})

// ── POST /admin/annonces/bulk — Actions groupées ─────────

router.post('/annonces/bulk', async (req, res, next) => {
  try {
    const { ids, action } = req.body
    if (!ids?.length) return res.status(400).json({ error: 'Aucun ID fourni' })

    const placeholders = ids.map((_,i) => `$${i + 1}`).join(',')

    switch (action) {
      case 'ban':
        await query(`UPDATE annonces SET status = 'banned', updated_at = NOW() WHERE id IN (${placeholders})`, ids)
        break
      case 'approve':
        await query(`UPDATE annonces SET status = 'active', updated_at = NOW() WHERE id IN (${placeholders})`, ids)
        break
      case 'boost':
        await query(`UPDATE annonces SET is_boosted = TRUE, boost_type = 'une', boost_expires_at = NOW() + INTERVAL '7 days', updated_at = NOW() WHERE id IN (${placeholders})`, ids)
        break
      case 'delete':
        await query(`UPDATE annonces SET deleted_at = NOW(), delete_reason = 'admin' WHERE id IN (${placeholders})`, ids)
        break
      default:
        return res.status(400).json({ error: 'Action inconnue' })
    }

    res.json({ message: 'Action effectuée', count: ids.length })
  } catch (err) { next(err) }
})

// ── GET /admin/users ─────────────────────────────────────

router.get('/users', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 25 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    const conds  = []

    if (q) {
      params.push(`%${q}%`)
      conds.push(`(u.prenom ILIKE $${params.length} OR u.nom ILIKE $${params.length} OR u.email ILIKE $${params.length})`)
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''

    const [rows, count] = await Promise.all([
      query(`
        SELECT u.id, u.email, u.prenom, u.nom, u.telephone,
               u.phone_verified, u.is_pro, u.is_admin,
               u.note_moyenne, u.nb_avis, u.nb_annonces,
               u.created_at, u.deleted_at,
               co.name AS commune_name
        FROM users u
        LEFT JOIN communes co ON co.id = u.commune_id
        ${where}
        ORDER BY u.created_at DESC
        LIMIT $${params.push(Number(limit))} OFFSET $${params.push(offset)}
      `, params),
      query(`SELECT COUNT(*) FROM users u ${where}`, params.slice(0, -2)),
    ])

    res.json({
      data: rows.rows,
      pagination: { total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) },
    })
  } catch (err) { next(err) }
})

// ── POST /admin/users/:id/:action ────────────────────────

router.post('/users/:id/:action', async (req, res, next) => {
  try {
    const { id, action } = req.params
    const { duration_days } = req.body   // pour ban temporaire

    switch (action) {
      case 'verify':
        await query(`UPDATE users SET phone_verified = TRUE, updated_at = NOW() WHERE id = $1`, [id])
        break
      case 'ban':
        // Ban temporaire si duration_days fourni, sinon définitif
        if (duration_days) {
          await query(
            `UPDATE users SET banned_until = NOW() + ($1 || ' days')::INTERVAL, updated_at = NOW() WHERE id = $2`,
            [Number(duration_days), id]
          )
        } else {
          await query(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [id])
        }
        disconnectUserSockets(id)
        break
      case 'unban':
        await query(`UPDATE users SET deleted_at = NULL, banned_until = NULL, updated_at = NOW() WHERE id = $1`, [id])
        break
      case 'admin':
        await query(`UPDATE users SET is_admin = TRUE, updated_at = NOW() WHERE id = $1`, [id])
        break
      case 'unadmin':
        await query(`UPDATE users SET is_admin = FALSE, updated_at = NOW() WHERE id = $1`, [id])
        break
      case 'pro':
        await withTransaction(async (client) => {
          await client.query(`UPDATE users SET is_pro = TRUE, pro_since = NOW(), updated_at = NOW() WHERE id = $1`, [id])
          await ensureProReferralCode(client, id)
          await ensureLaunchPack(client, id)
        })
        await refreshTrustScore(id).catch(() => {})
        break
      case 'unpro':
        await query(`UPDATE users SET is_pro = FALSE, updated_at = NOW() WHERE id = $1`, [id])
        break
      default:
        return res.status(400).json({ error: 'Action inconnue' })
    }

    // Logger l'action admin
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'user', $3, $4)`,
      [req.user.id, action, id, JSON.stringify(req.body)]
    ).catch(() => {}) // table optionnelle

    res.json({ message: 'Action effectuée' })
  } catch (err) { next(err) }
})

// ── GET /admin/signalements ───────────────────────────────

router.get('/signalements', async (req, res, next) => {
  try {
    const { resolved = 'false', page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const isResolved = resolved === 'true'

    const [rows, count] = await Promise.all([
      query(`
        SELECT
          s.id, s.reason, s.comment, s.created_at, s.resolved_at,
          s.annonce_id,
          a.titre AS annonce_title,
          co.name AS annonce_commune,
          u_annonce.prenom || ' ' || u_annonce.nom AS annonce_user,
          u_annonce.email                           AS annonce_email,
          u_reporter.prenom || ' ' || u_reporter.nom AS reporter_name,
          u_reporter.email                            AS reporter_email
        FROM signalements s
        JOIN users u_reporter ON u_reporter.id = s.reporter_id
        LEFT JOIN annonces a  ON a.id = s.annonce_id
        LEFT JOIN users u_annonce ON u_annonce.id = a.user_id
        LEFT JOIN communes co     ON co.id = a.commune_id
        WHERE ($1 = (s.resolved_at IS NOT NULL))
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `, [isResolved, Number(limit), offset]),
      query(`SELECT COUNT(*) FROM signalements WHERE ($1 = (resolved_at IS NOT NULL))`, [isResolved]),
    ])

    res.json({
      data: rows.rows,
      pagination: { total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) },
    })
  } catch (err) { next(err) }
})

// Rétro-compat ancienne URL /reports
router.get('/reports', (req, res) => res.redirect(307, req.originalUrl.replace('/reports', '/signalements')))

// ── PUT /admin/signalements/:id/resolve ──────────────────

router.put('/signalements/:id/resolve', async (req, res, next) => {
  try {
    const { action_taken } = req.body   // ex: 'warning', 'banned', 'dismissed'
    await query(
      `UPDATE signalements SET resolved_at = NOW(), action_taken = $1, resolved_by = $2 WHERE id = $3`,
      [action_taken || 'dismissed', req.user.id, req.params.id]
    )
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata)
       VALUES ($1, 'resolve_signalement', 'signalement', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ action_taken })]
    ).catch(() => {})
    res.json({ message: 'Signalement résolu' })
  } catch (err) { next(err) }
})

// ── GET /admin/payments ───────────────────────────────────

router.get('/payments', async (req, res, next) => {
  try {
    const { page = 1, limit = 25 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const [rows, count, totals] = await Promise.all([
      query(`
        SELECT p.id, p.type, p.provider, p.amount_xpf, p.status, p.created_at,
               u.prenom, u.nom, u.email
        FROM payments p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [Number(limit), offset]).catch(() => ({ rows: [] })),
      query(`SELECT COUNT(*) FROM payments`).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT
               SUM(amount_xpf) FILTER (WHERE status='succeeded')               AS total_xpf,
               SUM(amount_xpf) FILTER (WHERE status='succeeded' AND type='boost') AS boost_xpf,
               SUM(amount_xpf) FILTER (WHERE status='succeeded' AND type='subscription') AS sub_xpf
             FROM payments`).catch(() => ({ rows: [{}] })),
    ])

    res.json({
      data: rows.rows,
      totals: totals.rows[0],
      pagination: { total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) },
    })
  } catch (err) { next(err) }
})

module.exports = router
