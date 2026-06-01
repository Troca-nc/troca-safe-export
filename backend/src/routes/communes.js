// ============================================================
//  Routes — Communes de Nouvelle-Calédonie
// ============================================================

const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

function provinceCodeFromSlug(slug) {
  if (!slug) return null;
  if (slug.includes('sud')) return 'S';
  if (slug.includes('nord')) return 'N';
  if (slug.includes('iles')) return 'I';
  return null;
}

// GET /api/communes — Toutes les communes groupées par province
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id AS province_id,
        p.name AS province_name,
        p.slug AS province_slug,
        c.id AS commune_id,
        c.name AS commune_name,
        c.slug AS commune_slug,
        c.code_insee
      FROM communes c
      JOIN provinces p ON p.id = c.province_id
      ORDER BY p.id, c.name
    `);

    // Grouper par province
    const grouped = result.rows.reduce((acc, row) => {
      const prov = acc.find(p => p.id === row.province_id);
      const commune = {
        id: row.commune_id,
        name: row.commune_name,
        slug: row.commune_slug,
        code_insee: row.code_insee,
        latitude: null,
        longitude: null,
      };
      if (prov) {
        prov.communes.push(commune);
      } else {
        acc.push({
          id: row.province_id,
          name: row.province_name,
          slug: row.province_slug,
          code: provinceCodeFromSlug(row.province_slug),
          communes: [commune],
        });
      }
      return acc;
    }, []);

    res.json({ data: grouped });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
