// ============================================================
//  Routes — Catégories
// ============================================================

const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/categories — Toutes les catégories avec sous-catégories
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id, p.name, p.slug, p.icon, p.sort_order,
        json_agg(
          json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon)
          ORDER BY c.sort_order
        ) FILTER (WHERE c.id IS NOT NULL) AS subcategories
      FROM categories p
      LEFT JOIN categories c ON c.parent_id = p.id
      WHERE p.parent_id IS NULL
      GROUP BY p.id
      ORDER BY p.sort_order
    `);

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
