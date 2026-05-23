'use strict';

const express = require('express');

const { query } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

function mapBusinessRow(row) {
  return {
    id: row.id,
    owner_user_id: row.owner_user_id ?? null,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url ?? null,
    contact_email: row.contact_email ?? null,
    category: row.category ?? null,
    badge: row.badge ?? 'none',
    verified_at: row.verified_at ?? null,
    verified_by: row.verified_by ?? null,
    bon_plan_count: Number(row.bon_plan_count ?? 0),
    review_avg: Number(row.review_avg ?? 0),
    review_count: Number(row.review_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const offset = (page - 1) * limit;
    const badge = String(req.query.badge || '').trim();
    const q = String(req.query.q || '').trim();
    const params = [];
    const where = ['1=1'];

    if (badge) {
      params.push(badge);
      where.push(`b.badge = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      where.push(`(b.name ILIKE $${params.length} OR b.slug ILIKE $${params.length})`);
    }

    const [countRes, rowsRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM businesses b WHERE ${where.join(' AND ')}`, params),
      query(
        `SELECT b.*
         FROM businesses b
         WHERE ${where.join(' AND ')}
         ORDER BY b.bon_plan_count DESC, b.review_avg DESC, b.name ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    return res.json({
      data: rowsRes.rows.map(mapBusinessRow),
      pagination: {
        total: Number(countRes.rows[0]?.total ?? 0),
        page,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/verify', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE businesses
       SET badge = 'verified',
           verified_at = COALESCE(verified_at, NOW()),
           verified_by = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    return res.json({ data: mapBusinessRow(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/unverify', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE businesses
       SET badge = CASE WHEN bon_plan_count > 0 THEN 'active' ELSE 'none' END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Enseigne introuvable.' });
    }

    return res.json({ data: mapBusinessRow(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.get('/reviews/reported', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         r.*, b.name AS business_name, b.slug AS business_slug,
         u.prenom AS user_prenom, u.nom AS user_nom, u.email AS user_email
       FROM business_reviews r
       JOIN businesses b ON b.id = r.business_id
       JOIN users u ON u.id = r.user_id
       WHERE r.reported = TRUE
       ORDER BY COALESCE(r.report_reviewed_at, r.created_at) DESC
       LIMIT 200`
    );

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/:id/keep', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE business_reviews
       SET reported = FALSE,
           report_reason = NULL,
           report_reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM business_reviews WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
