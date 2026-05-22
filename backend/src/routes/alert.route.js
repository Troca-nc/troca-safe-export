'use strict';

// ============================================================
//  Troca — Routes alertes de recherche
//  GET    /api/alerts              — Mes alertes
//  POST   /api/alerts              — Créer une alerte
//  PATCH  /api/alerts/:id          — Modifier (pause/reprendre)
//  DELETE /api/alerts/:id          — Supprimer
//  GET    /api/alerts/unsubscribe/:token — Désabonnement email
// ============================================================

const { Router } = require('express');
const Joi        = require('joi');
const { v4: uuidv4 }      = require('uuid');
const { authenticate }    = require('../middleware/auth');
const { validate }        = require('../middleware/validate');
const { query }           = require('../config/database');
const { buildListingSearchContext } = require('../services/listingsQuery');
const { sendMail } = require('../services/emailService');

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://troca.nc';

function normalizeAlertFilters(filters) {
  if (!filters || typeof filters !== 'object') return {};
  const source = filters;
  const normalized = {
    q: source.q || '',
    category_id: source.category_id || source.categorie_id || '',
    categorie: source.categorie || source.category_name || '',
    commune_id: source.commune_id || '',
    commune: source.commune || source.commune_name || '',
    price_min: source.price_min ?? source.prix_min ?? '',
    price_max: source.price_max ?? source.prix_max ?? '',
    condition: source.condition || '',
    troc: source.troc || '',
    province_id: source.province_id || '',
    lat: source.lat || '',
    lng: source.lng || '',
    radius: source.radius || 20,
  };

  if (normalized.troc === true || normalized.troc === 1) {
    normalized.troc = 'true';
  }

  return normalized;
}

function alertFiltersToListingQuery(filters) {
  return {
    q: filters.q || '',
    category_id: filters.category_id || '',
    commune_id: filters.commune_id || '',
    province_id: filters.province_id || '',
    price_min: filters.price_min || '',
    price_max: filters.price_max || '',
    condition: filters.condition || '',
    troc: filters.troc || '',
    lat: filters.lat || '',
    lng: filters.lng || '',
    radius: filters.radius || 20,
    page: 1,
    limit: 1,
  };
}

function buildAlertSummary(filters) {
  const parts = [];
  if (filters.q) parts.push(filters.q);
  if (filters.categorie) parts.push(filters.categorie);
  else if (filters.category_id) parts.push(`Catégorie ${filters.category_id}`);
  if (filters.commune) parts.push(filters.commune);
  else if (filters.commune_id) parts.push(`Commune ${filters.commune_id}`);
  if (filters.condition) {
    const conditionLabel = {
      new: 'Neuf',
      like_new: 'Comme neuf',
      good: 'Bon état',
      fair: 'Correct',
      for_parts: 'Pour pièces',
    }[filters.condition];
    parts.push(conditionLabel || filters.condition);
  }
  if (filters.troc === 'true') parts.push('Troc');
  if (filters.price_max) parts.push(`< ${Number(filters.price_max).toLocaleString('fr-FR')} XPF`);
  return parts.join(' · ') || 'Toutes les annonces';
}

async function countMatchingListings(filters) {
  const searchContext = buildListingSearchContext(alertFiltersToListingQuery(filters));
  const countRes = await query(
    `SELECT COUNT(*) AS total
     FROM annonces a
     LEFT JOIN categories cat    ON cat.id = a.category_id
     LEFT JOIN categories parent ON parent.id = cat.parent_id
     LEFT JOIN communes com      ON com.id = a.commune_id
     LEFT JOIN provinces prov    ON prov.id = com.province_id
     WHERE ${searchContext.whereClause}`,
    searchContext.params
  );
  return Number.parseInt(countRes.rows[0]?.total ?? '0', 10);
}

async function sendConfirmationEmail({ email, prenom, label, filters, frequency, count }) {
  if (!email) return;

  const frequencyLabel = {
    immediate: 'immédiate',
    daily: 'quotidienne',
    weekly: 'hebdomadaire',
  }[frequency] || frequency;

  const criteria = buildAlertSummary(filters);

  await sendMail({
    to: email,
    subject: '[Troca] Votre alerte de recherche est active',
    html: `
      <p>Bonjour ${prenom || 'bonjour'},</p>
      <p>Votre alerte <strong>${label}</strong> a bien été créée.</p>
      <p><strong>${count.toLocaleString('fr-FR')} annonces</strong> correspondent actuellement à ces critères.</p>
      <p>Fréquence de notification : <strong>${frequencyLabel}</strong></p>
      <p>Critères suivis : <strong>${criteria}</strong></p>
      <p><a href="${BASE_URL}/alertes">Gérer mes alertes</a></p>
      <p style="color:#9ca3af;font-size:12px;">Vous pouvez à tout moment modifier ou désactiver cette alerte depuis votre espace.</p>
    `,
    text: [
      `Bonjour ${prenom || ''}`.trim(),
      `Votre alerte "${label}" a bien été créée.`,
      `${count.toLocaleString('fr-FR')} annonces correspondent actuellement à ces critères.`,
      `Fréquence de notification : ${frequencyLabel}.`,
      `Critères suivis : ${criteria}.`,
      `Gérer mes alertes : ${BASE_URL}/alertes`,
    ].join('\n\n'),
  });
}

// ── Désabonnement par email (sans auth) ──────────────────────

router.get('/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  if (!token || token.length > 64) {
    return res.status(400).send('Lien invalide.');
  }

  const result = await query(
    `UPDATE search_alerts SET status = 'deleted', updated_at = NOW()
     WHERE unsubscribe_token = $1 AND status != 'deleted'
     RETURNING label`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (!result.rows[0]) {
    return res.send('Cette alerte est déjà supprimée ou le lien est invalide.');
  }

  return res.send(`
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
    <title>Désabonnement — Troca</title>
    <style>body{font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center;color:#1f2937;}
    h1{color:#2563eb;}a{color:#2563eb;}</style></head><body>
    <h1>✅ Désabonné</h1>
    <p>Vous ne recevrez plus d'emails pour l'alerte <strong>"${result.rows[0].label}"</strong>.</p>
    <p><a href="${process.env.BASE_URL || 'https://troca.nc'}">Retour sur Troca</a></p>
    </body></html>
  `);
});

// ── Routes authentifiées ─────────────────────────────────────

router.use(authenticate);

// ── Schémas ──────────────────────────────────────────────────

const createSchema = {
  body: Joi.object({
    label:     Joi.string().min(1).max(200).required(),
    filters:   Joi.object().default({}),
    frequency: Joi.string().valid('immediate', 'daily', 'weekly').default('daily'),
  }),
};

const patchSchema = {
  body: Joi.object({
    status:    Joi.string().valid('active', 'paused').optional(),
    frequency: Joi.string().valid('immediate', 'daily', 'weekly').optional(),
    label:     Joi.string().min(1).max(200).optional(),
  }).min(1),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

const idParams = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

// ── GET /api/alerts ──────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, label, filters, frequency, status, nb_results, last_sent_at, created_at
       FROM search_alerts
       WHERE user_id = $1 AND status != 'deleted'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// ── POST /api/alerts ─────────────────────────────────────────

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { label, filters, frequency } = req.body;
    const token = uuidv4().replace(/-/g, '');
    const normalizedFilters = normalizeAlertFilters(filters);
    let nbResults = 0;

    try {
      nbResults = await countMatchingListings(normalizedFilters);
    } catch (countErr) {
      console.error('[alerts] count error:', countErr.message);
    }

    const result = await query(
      `INSERT INTO search_alerts (user_id, label, filters, frequency, unsubscribe_token, nb_results)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, label, filters, frequency, status, nb_results, created_at`,
      [req.user.id, label, JSON.stringify(normalizedFilters), frequency, token, nbResults]
    );

    void sendConfirmationEmail({
      email: req.user.email,
      prenom: req.user.prenom,
      label,
      filters: normalizedFilters,
      frequency,
      count: Number(result.rows[0]?.nb_results ?? nbResults ?? 0),
    }).catch((err) => {
      console.error('[alerts] confirmation email error:', err.message);
    });

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.message?.includes('Maximum 10 alertes')) {
      return res.status(429).json({ error: 'Vous avez atteint la limite de 10 alertes actives' });
    }
    next(err);
  }
});

// ── PATCH /api/alerts/:id ────────────────────────────────────

router.patch('/:id', validate(patchSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sets  = [];
    const vals  = [];
    let   idx   = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (['status', 'frequency', 'label'].includes(key)) {
        sets.push(`${key} = $${idx++}`);
        vals.push(val);
      }
    }
    sets.push(`updated_at = NOW()`);
    vals.push(id, req.user.id);

    const result = await query(
      `UPDATE search_alerts SET ${sets.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx} AND status != 'deleted'
       RETURNING id, label, status, frequency`,
      vals
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Alerte introuvable' });
    return res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /api/alerts/:id ───────────────────────────────────

router.delete('/:id', validate(idParams), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE search_alerts SET status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != 'deleted'
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Alerte introuvable' });
    return res.json({ message: 'Alerte supprimée' });
  } catch (err) { next(err); }
});

module.exports = router;
