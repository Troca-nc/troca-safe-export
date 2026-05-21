// ============================================================
//  Routes — Administration (backend)
//  Toutes les routes nécessitent is_admin = true
//  Tables réelles : annonces, signalements, users, messages
// ============================================================

const express = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate, requireAdmin)

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

// Rétro-compat : ancienne URL /listings redirige vers /annonces
router.get('/listings', (req, res) => res.redirect(307, req.originalUrl.replace('/listings', '/annonces')))

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
        await query(`UPDATE users SET is_pro = TRUE, pro_since = NOW(), updated_at = NOW() WHERE id = $1`, [id])
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
