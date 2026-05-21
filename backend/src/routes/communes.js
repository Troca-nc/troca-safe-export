// ============================================================
//  Routes — Communes de Nouvelle-Calédonie
// ============================================================

const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/communes — Toutes les communes groupées par province
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id AS province_id, p.name AS province_name, p.code AS province_code,
        c.id, c.name, c.latitude, c.longitude
      FROM communes c
      JOIN provinces p ON p.id = c.province_id
      ORDER BY p.id, c.name
    `);

    // Grouper par province
    const grouped = result.rows.reduce((acc, row) => {
      const prov = acc.find(p => p.id === row.province_id);
      const commune = { id: row.id, name: row.name, latitude: row.latitude, longitude: row.longitude };
      if (prov) {
        prov.communes.push(commune);
      } else {
        acc.push({
          id: row.province_id,
          name: row.province_name,
          code: row.province_code,
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
