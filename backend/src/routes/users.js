// ============================================================
//  Routes — Utilisateurs
//  GET  /api/users/:id             — Profil public
//  PUT  /api/users/me              — Modifier mon profil
//  GET  /api/users/me/favoris      — Mes favoris
//  GET  /api/users/:id/reviews     — Avis reçus
//  POST /api/users/:id/reviews     — Laisser un avis
// ============================================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const Joi     = require('joi');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/users/me/favoris — Mes favoris ─────────────────

router.get('/me/favoris', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const result = await query(
      `SELECT a.id, a.titre, a.prix, a.condition, a.created_at,
              cat.name AS category_name, com.name AS commune_name,
              u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
              u.is_pro AS seller_is_pro, u.email_verified AS seller_email_verified,
              u.phone_verified AS seller_phone_verified, u.trust_score AS seller_trust_score,
              u.trust_level AS seller_trust_level,
              f.created_at AS favorited_at,
              (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image
       FROM favoris f
       JOIN annonces a  ON a.id = f.annonce_id AND a.deleted_at IS NULL AND a.status = 'active'
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com   ON com.id = a.commune_id
       LEFT JOIN users u       ON u.id = a.user_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, pageSize, offset]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:id — Profil public ──────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
          u.id, u.prenom, u.nom, u.avatar_url, u.bio, u.is_pro,
          u.nb_annonces, u.note_moyenne, u.nb_avis, u.created_at,
          u.phone_verified, u.email_verified,
          u.commune_id,
          com.name AS commune_name,
          com.id AS commune_id_lookup,
          prov.id AS province_id,
          prov.name AS province_name,
          COALESCE((
            SELECT SUM(a.nb_vues)::int
            FROM annonces a
            WHERE a.user_id = u.id AND a.deleted_at IS NULL
          ), 0) AS total_vues,
          COALESCE((
            SELECT SUM(a.nb_favoris)::int
            FROM annonces a
            WHERE a.user_id = u.id AND a.deleted_at IS NULL
          ), 0) AS total_favoris,
          COALESCE((
            SELECT COUNT(*)
            FROM annonces a
            WHERE a.user_id = u.id AND a.deleted_at IS NULL AND a.status = 'active'
          ), 0) AS active_listings_count,
          COALESCE((
            SELECT COUNT(*)
            FROM annonces a
            WHERE a.user_id = u.id AND a.deleted_at IS NULL AND a.status = 'active'
              AND (
                a.is_featured = TRUE
                OR (
                  a.is_boosted = TRUE
                  AND (a.boost_expires_at IS NULL OR a.boost_expires_at > NOW())
                )
              )
          ), 0) AS annonces_boostees
       FROM users u
       LEFT JOIN communes com ON com.id = u.commune_id
       LEFT JOIN provinces prov ON prov.id = com.province_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/users/me — Modifier mon profil ──────────────────

const updateProfileSchema = Joi.object({
  prenom:     Joi.string().min(1).max(100).optional(),
  nom:        Joi.string().min(1).max(100).optional(),
  bio:        Joi.string().max(500).optional().allow(''),
  commune_id: Joi.number().integer().optional().allow(null),
  telephone:  Joi.string().max(20).optional().allow(''),
  current_password: Joi.string().optional(),
  new_password:     Joi.string().min(8).max(100).optional(),
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { current_password, new_password, ...profileFields } = value;

    // Changement de mot de passe
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Mot de passe actuel requis pour le modifier.' });
      }
      const userRow = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
      const valid   = await bcrypt.compare(current_password, userRow.rows[0].password_hash);
      if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

      profileFields.password_hash = await bcrypt.hash(new_password, 12);
    }

    const fields = [];
    const params = [];
    let p = 1;
    for (const [key, val] of Object.entries(profileFields)) {
      fields.push(`${key} = $${p}`);
      params.push(val);
      p++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier.' });

    params.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${p}
       RETURNING id, email, prenom, nom, bio, commune_id, telephone, avatar_url, is_pro, phone_verified`,
      params
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:id/reviews — Avis reçus ──────────────────

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.note, r.commentaire, r.created_at,
              u.prenom AS auteur_prenom, u.avatar_url AS auteur_avatar
       FROM avis r
       JOIN users u ON u.id = r.auteur_id
       WHERE r.destinataire_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [req.params.id]
    ).catch(() => ({ rows: [] }));

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/:id/reviews — Laisser un avis ────────────

router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const destinataireId = parseInt(req.params.id);
    if (destinataireId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous laisser un avis.' });
    }

    const { note, commentaire } = req.body;
    if (!note || note < 1 || note > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5.' });
    }

    await query(
      `INSERT INTO avis (auteur_id, destinataire_id, note, commentaire)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (auteur_id, destinataire_id) DO UPDATE SET note = $3, commentaire = $4`,
      [req.user.id, destinataireId, note, commentaire || null]
    ).catch(() => {});

    // Recalculer la note moyenne
    await query(
      `UPDATE users SET
         note_moyenne = (SELECT AVG(note) FROM avis WHERE destinataire_id = $1),
         nb_avis      = (SELECT COUNT(*)  FROM avis WHERE destinataire_id = $1)
       WHERE id = $1`,
      [destinataireId]
    ).catch(() => {});

    return res.json({ message: 'Avis enregistré.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
