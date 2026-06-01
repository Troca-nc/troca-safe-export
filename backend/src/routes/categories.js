// ============================================================
//  Routes — Catégories
// ============================================================

const express = require('express');
const { query } = require('../config/database');
const {
  buildCategoryTree,
  findCategoryNodeBySlug,
} = require('../services/categoryTree');
const router = express.Router();

async function loadCategoryRows() {
  const result = await query(`
    SELECT id, parent_id, name, slug, icon, COALESCE(position, sort_order, 0) AS position
    FROM categories
    ORDER BY COALESCE(position, sort_order, 0), name
  `);
  return result.rows;
}

function respondWithTree(res, rows) {
  const tree = buildCategoryTree(rows);
  return res.json({ data: tree });
}

// GET /api/categories — Toutes les catégories avec enfants imbriqués
router.get('/', async (req, res, next) => {
  try {
    const rows = await loadCategoryRows();
    respondWithTree(res, rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug — Noeud unique avec ses descendants
router.get('/:slug', async (req, res, next) => {
  try {
    const rows = await loadCategoryRows();
    const tree = buildCategoryTree(rows);
    const node = findCategoryNodeBySlug(tree, req.params.slug);

    if (!node) {
      return res.status(404).json({ error: 'Catégorie introuvable.' });
    }

    return res.json({
      data: node,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
