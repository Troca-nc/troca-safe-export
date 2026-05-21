'use strict';

// ============================================================
//  Troca — Route statistiques vendeur
//  GET /api/stats/seller — Dashboard Pro (vues, favoris, messages)
// ============================================================

const { Router }       = require('express');
const { authenticate } = require('../middleware/auth');
const { query }        = require('../config/database');
const { deletePrefix, getJson, setJson } = require('../services/sharedCache');

const router = Router();
const CACHE_PREFIX = 'cache:stats:';

async function invalidateCache(match) {
  if (!match) {
    await deletePrefix(CACHE_PREFIX);
    return;
  }
  await deletePrefix(`${CACHE_PREFIX}${match}`);
}

async function readCache(key) {
  return getJson(`${CACHE_PREFIX}${key}`);
}

async function writeCache(key, value, ttlMs) {
  return setJson(`${CACHE_PREFIX}${key}`, value, ttlMs);
}

router.get('/home', async (_req, res, next) => {
  try {
    const cacheKey = 'home';
    const cached = await readCache(cacheKey);
    if (cached) return res.json(cached);

    const totals = await query(`
      SELECT
        COUNT(*) AS total_annonces,
        (
          SELECT COUNT(*)
          FROM bon_plans bp
          WHERE bp.status = 'active'
            AND bp.expires_at > NOW()
        ) AS total_bon_plans
        ,(
          SELECT COUNT(*)
          FROM covoiturages c
          WHERE c.status IN ('published', 'full')
            AND c.expires_at > NOW()
        ) AS total_covoiturages
      FROM annonces a
    `);

    const payload = {
      data: {
        total_annonces: Number(totals.rows[0]?.total_annonces ?? 0),
        total_bon_plans: Number(totals.rows[0]?.total_bon_plans ?? 0),
        total_covoiturages: Number(totals.rows[0]?.total_covoiturages ?? 0),
      },
    };

    await writeCache(cacheKey, payload, 60_000);
    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

router.get('/seller', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `seller:${userId}`;
    const cached = await readCache(cacheKey);
    if (cached) return res.json(cached);

    // ── Totaux globaux ────────────────────────────────────────
    const totals = await query(`
      SELECT
        COUNT(*)                             AS total_annonces,
        SUM(nb_vues)                         AS total_vues,
        SUM(nb_favoris)                      AS total_favoris,
        COUNT(*) FILTER (WHERE status = 'active')   AS annonces_actives,
        COUNT(*) FILTER (WHERE is_boosted = TRUE)   AS annonces_boostees
      FROM annonces
      WHERE user_id = $1 AND deleted_at IS NULL
    `, [userId]);

    // ── Top 5 annonces par vues ───────────────────────────────
    const topAnnonces = await query(`
      SELECT id, titre, nb_vues, nb_favoris, prix, status, created_at
      FROM annonces
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY nb_vues DESC
      LIMIT 5
    `, [userId]);

    // ── Messages reçus (7 derniers jours) ─────────────────────
    const messagesStats = await query(`
      SELECT
        COUNT(DISTINCT m.conv_id)   AS total_conversations,
        COUNT(m.id)                 AS total_messages,
        COUNT(m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '7 days') AS messages_7j
      FROM messages m
      JOIN conversations c ON c.id = m.conv_id
      JOIN annonces a ON a.id = c.annonce_id
      WHERE a.user_id = $1 AND m.sender_id != $1
    `, [userId]);

    // ── Vues par jour (30 derniers jours) — approximation ─────
    // Sans historique journalier : on retourne le total actuel
    // et on indique la date de chaque annonce comme proxy
    const vuesByAnnonce = await query(`
      SELECT
        titre,
        nb_vues,
        nb_favoris,
        ROUND(nb_vues::numeric /
          GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)
        , 1) AS vues_par_jour_moy
      FROM annonces
      WHERE user_id = $1 AND deleted_at IS NULL AND status = 'active'
      ORDER BY nb_vues DESC
      LIMIT 10
    `, [userId]);

    // ── Taux de réponse aux messages ──────────────────────────
    const tauxReponse = await query(`
      WITH convs AS (
        SELECT c.id, c.seller_id,
          COUNT(*) FILTER (WHERE m.sender_id = c.seller_id) > 0 AS a_repondu
        FROM conversations c
        LEFT JOIN messages m ON m.conv_id = c.id
        JOIN annonces a ON a.id = c.annonce_id
        WHERE a.user_id = $1
        GROUP BY c.id, c.seller_id
      )
      SELECT
        COUNT(*) AS total_conv,
        COUNT(*) FILTER (WHERE a_repondu = TRUE) AS conv_avec_reponse,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE a_repondu = TRUE) / GREATEST(COUNT(*), 1)
        , 0) AS taux_reponse_pct
      FROM convs
    `, [userId]);

    // ── Avis ──────────────────────────────────────────────────
    const avisStats = await query(`
      SELECT
        COUNT(*)           AS total_avis,
        ROUND(AVG(note), 1) AS note_moyenne,
        COUNT(*) FILTER (WHERE note = 5) AS cinq_etoiles,
        COUNT(*) FILTER (WHERE note = 1) AS une_etoile
      FROM avis
      WHERE cible_id = $1
    `, [userId]);

    const payload = {
      data: {
        totaux:           totals.rows[0],
        top_annonces:     topAnnonces.rows,
        messages:         messagesStats.rows[0],
        vues_par_annonce: vuesByAnnonce.rows,
        taux_reponse:     tauxReponse.rows[0],
        avis:             avisStats.rows[0],
        is_pro:           req.user.is_pro,
      },
    };

    await writeCache(cacheKey, payload, 30_000);
    return res.json(payload);
  } catch (err) { next(err); }
});

router.invalidateCache = invalidateCache;

module.exports = router;
