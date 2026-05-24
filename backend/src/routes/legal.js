'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');

const router = express.Router();

const legalVersions = [
  { id: 'mentions-legales', title: 'Mentions légales', version: '1.0', updated_at: '2026-05-25' },
  { id: 'politique-de-confidentialite', title: 'Politique de confidentialité', version: '1.0', updated_at: '2026-05-25' },
  { id: 'cgu', title: 'CGU', version: '1.0', updated_at: '2026-05-25' },
  { id: 'cgv', title: 'CGV', version: '1.0', updated_at: '2026-05-25' },
  { id: 'politique-cookies', title: 'Politique cookies', version: '1.0', updated_at: '2026-05-25' },
];

async function queryOptional(sql, params) {
  try {
    return await query(sql, params);
  } catch (error) {
    return { rows: [] };
  }
}

function renderAccountDeletedEmail({ name }) {
  const templatePath = path.join(__dirname, '../emails/account_deleted.html');
  const html = fs.readFileSync(templatePath, 'utf8');
  return html
    .replace(/{{\s*name\s*}}/g, name || 'Utilisateur')
    .replace(/{{\s*support_email\s*}}/g, 'privacy@troca.nc')
    .replace(/{{\s*home_url\s*}}/g, process.env.BASE_URL || 'https://troca.nc');
}

router.get('/legal/versions', (_req, res) => {
  res.json({ data: legalVersions });
});

router.get('/users/me/export', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      user,
      listings,
      images,
      favourites,
      messages,
      payments,
      alerts,
      rgpdLogs,
      subscriptions,
      boosts,
      trocProposals,
      covoitAlerts,
      bonPlans,
      businessReviews,
      consent,
    ] = await Promise.all([
      queryOptional(
        `SELECT id, email, prenom, nom, telephone, bio, commune_id, is_admin, is_pro, pro_plan,
                pro_expires_at, nb_annonces, note_moyenne, nb_avis, deleted_at, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, category_id, commune_id, titre, description, prix, condition, status,
                is_boosted, boost_type, boost_expires_at, nb_vues, nb_favoris, slug,
                expires_at, published_at, created_at, updated_at
         FROM annonces WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, annonce_id, url, thumbnail_url, variants, position, created_at
         FROM annonce_images
         WHERE annonce_id IN (SELECT id FROM annonces WHERE user_id = $1)
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, annonce_id, created_at
         FROM favoris
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, conv_id, sender_id, type, content, photo_url, read_at, created_at
         FROM messages
         WHERE sender_id = $1
         ORDER BY created_at DESC
         LIMIT 1000`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, type, provider, provider_ref, amount_xpf, status, metadata, created_at, updated_at
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, label, filters, active, last_sent, created_at
         FROM search_alerts
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, action, ip_address, created_at
         FROM rgpd_logs
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, plan, status, payment_provider, current_period_end, created_at, updated_at
         FROM subscriptions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, listing_id, amount_xpf, payment_provider, status, created_at
         FROM boosts
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, listing_id, proposer_id, offered_listing_ids, offered_description, offered_photos,
                complement_xpf, complement_direction, status, message, conversation_id, created_at, expires_at
         FROM troc_proposals
         WHERE proposer_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max, via_push,
                via_email, active, last_notified_at, created_at
         FROM covoit_alerts
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, business_name, title, description, category, status, amount_xpf, amount_eur,
                paid_at, published_from, published_until, created_at, updated_at
         FROM bon_plans
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, business_id, user_id, rating, comment, reply_text, reported, report_reason, created_at, updated_at
         FROM business_reviews
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      queryOptional(
        `SELECT id, user_id, analytics, marketing, created_at
         FROM rgpd_consentements
         WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user: user.rows[0] || null,
      listings: listings.rows,
      images: images.rows,
      favourites: favourites.rows,
      messages: messages.rows,
      payments: payments.rows,
      alerts: alerts.rows,
      rgpd_logs: rgpdLogs.rows,
      subscriptions: subscriptions.rows,
      boosts: boosts.rows,
      troc_proposals: trocProposals.rows,
      covoit_alerts: covoitAlerts.rows,
      bon_plans: bonPlans.rows,
      business_reviews: businessReviews.rows,
      consent: consent.rows,
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="troca-mes-donnees-${userId}.json"`);
    return res.json(exportData);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/me', authenticate, async (req, res, next) => {
  try {
    const confirmationEmail = String(req.body?.confirmation_email || '').trim().toLowerCase();
    const currentEmail = String(req.user.email || '').trim().toLowerCase();
    if (!confirmationEmail || confirmationEmail !== currentEmail) {
      return res.status(400).json({ error: 'Email de confirmation incorrect' });
    }

    const currentUser = await query(
      'SELECT id, email, prenom FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!currentUser.rows[0]) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const user = currentUser.rows[0];
    const cleanupStatements = [
      'DELETE FROM rgpd_consentements WHERE user_id = $1',
      'DELETE FROM rgpd_logs WHERE user_id = $1',
      'DELETE FROM push_tokens WHERE user_id = $1',
      'DELETE FROM search_alerts WHERE user_id = $1',
      'DELETE FROM covoit_alerts WHERE user_id = $1',
      'DELETE FROM favoris WHERE user_id = $1',
      'DELETE FROM payments WHERE user_id = $1',
      'DELETE FROM subscriptions WHERE user_id = $1',
      'DELETE FROM boosts WHERE user_id = $1',
      'DELETE FROM troc_swipes WHERE user_id = $1',
      'DELETE FROM troc_badges WHERE user_id = $1',
      'DELETE FROM business_reviews WHERE user_id = $1',
      'DELETE FROM bon_plan_notification_prefs WHERE user_id = $1',
      'DELETE FROM bon_plans WHERE user_id = $1',
      'DELETE FROM messages WHERE sender_id = $1',
      'DELETE FROM annonces WHERE user_id = $1',
      'DELETE FROM users WHERE id = $1',
    ];

    for (const statement of cleanupStatements) {
      await queryOptional(statement, [user.id]);
    }

    const html = renderAccountDeletedEmail({
      name: user.prenom || 'Utilisateur',
    });

    await sendMail({
      to: user.email,
      subject: 'Votre compte Troca a été supprimé',
      html,
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Votre compte a été supprimé.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
